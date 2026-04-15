import httpClient from "@/lib/httpClient";
import { unwrapApiData } from "@/lib/apiResponse";


const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const [, encodedPayload] = token.split(".");
    if (!encodedPayload) {
      return null;
    }

    const normalizedBase64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalizedBase64);
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
};


const normalizeAuthPayload = (payload) => {
  const accessToken = payload?.accessToken || "";
  const user = payload?.user || null;
  const jwtPayload = decodeJwtPayload(accessToken);
  const resolvedRole = user?.role || payload?.role || jwtPayload?.role || "patient";

  return {
    accessToken,
    refreshToken: payload?.refreshToken || "",
    user: user
      ? {
          ...user,
          role: user.role || resolvedRole,
        }
      : {
          role: resolvedRole,
        },
    role: resolvedRole,
  };
};

export const authService = {
  async login(email, password) {
    const { data } = await httpClient.post("/auth/login", { email, password });
    return normalizeAuthPayload(unwrapApiData(data));
  },

  async logout() {
    await httpClient.post("/auth/logout");
  },

  async refreshAccessToken(refreshToken) {
    const { data } = await httpClient.post("/auth/refresh-token", {
      refreshToken,
    });

    return unwrapApiData(data)?.accessToken || "";
  },

  async getUser() {
    const { data } = await httpClient.get("/auth/me");
    return unwrapApiData(data) || null;
  },
};
