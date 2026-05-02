import axios from "axios";

import { pinia } from "./pinia";
import { useAppStore } from "@/stores/appStore";
import { unwrapApiData } from "@/lib/apiResponse";


const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 120000,
});

const refreshClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
});

const AUTH_PATHS_WITHOUT_REFRESH = [
    "/auth/login",
    "/auth/refresh-token",
];

let isRefreshing = false;
let refreshSubscribers = [];

const isAuthPathWithoutRefresh = (url = "") => {
    return AUTH_PATHS_WITHOUT_REFRESH.some((path) => url.includes(path));
};

const notifyUnauthorized = () => {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
};

const flushRefreshSubscribers = (error, token = "") => {
    refreshSubscribers.forEach((subscriber) => {
        if (error) {
            subscriber.reject(error);
            return;
        }

        subscriber.resolve(token);
    });

    refreshSubscribers = [];
};

const requestTokenRefresh = async (refreshToken) => {
    const { data } = await refreshClient.post("/auth/refresh-token", {
        refreshToken,
    });

    return unwrapApiData(data)?.accessToken || "";
};

httpClient.interceptors.request.use((config) => {
    const appStore = useAppStore(pinia);
    const token = appStore.accessToken || "";

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const appStore = useAppStore(pinia);
        const originalRequest = error?.config;
        const status = error?.response?.status;

        if (!originalRequest || status !== 401) {
            return Promise.reject(error);
        }

        if (isAuthPathWithoutRefresh(originalRequest.url)) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            if (appStore.isAuthenticated || appStore.hasRefreshToken) {
                notifyUnauthorized();
            }

            return Promise.reject(error);
        }

        const storedRefreshToken = appStore.refreshToken;
        if (!storedRefreshToken) {
            if (appStore.isAuthenticated) {
                notifyUnauthorized();
            }

            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshSubscribers.push({ resolve, reject });
            })
                .then((nextAccessToken) => {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
                    return httpClient(originalRequest);
                })
                .catch((refreshError) => Promise.reject(refreshError));
        }

        isRefreshing = true;

        try {
            const nextAccessToken = await requestTokenRefresh(storedRefreshToken);

            if (!nextAccessToken) {
                throw new Error("Failed to refresh access token");
            }

            appStore.updateAccessToken(nextAccessToken);
            flushRefreshSubscribers(null, nextAccessToken);

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

            return httpClient(originalRequest);
        } catch (refreshError) {
            flushRefreshSubscribers(refreshError);
            notifyUnauthorized();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

export default httpClient;