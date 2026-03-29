import httpClient from "@/lib/httpClient";


const normalizeAuthPayload = (payload) => {
  const user = payload.user || payload.profile || payload.userDetails || null;
  const role = payload.role || user?.role || "";
  const accessToken =
    payload.accessToken || payload.token || payload.session?.access_token || "";

  return {
    user,
    session: accessToken ? { access_token: accessToken } : null,
    role,
    userDetails: user,
  };
};

export const authService = {
  async login(email, password) {
    const { data } = await httpClient.post("/auth/login", { email, password });
    return normalizeAuthPayload(data || {});
  },

  async logout() {
    try {
      await httpClient.post("/auth/logout");
    } catch (error) {
      // Ignore logout API errors to avoid blocking local cleanup.
    }

    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
  },

  async getSession() {
    const { data } = await httpClient.get("/auth/session");
    return data?.session || null;
  },

  async getUser() {
    const { data } = await httpClient.get("/auth/me");
    return data?.user || data || null;
  },
};
