import axios from "axios";

import { pinia } from "./pinia";
import { useAppStore } from "@/stores/appStore";


const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
});

httpClient.interceptors.request.use((config) => {
    const appStore = useAppStore(pinia);
    const token = appStore.accessToken || "";

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default httpClient;