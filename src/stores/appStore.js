import { computed, ref } from "vue";
import { defineStore } from "pinia";


const SESSION_KEY = "lumira.session";

export const useAppStore = defineStore("app", () => {
    const accessToken = ref("");
    const profile = ref(null);
    const roleMap = ref({
        admin: "admin",
        doctor: "doctor",
        patient: "patient",
    });
    const featureToggles = ref({
        chatEnabled: false,
        medgemmaEnabled: false,
    });

    const isAuthenticated = computed(() => Boolean(accessToken.value));
    const currentRole = computed(() => profile.value?.role || "");

    const hydrateSession = () => {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            accessToken.value = parsed.accessToken || "";
            profile.value = parsed.profile || null;
        } catch (error) {
            localStorage.removeItem(SESSION_KEY);
        }
    };

    const persistSession = () => {
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
                accessToken: accessToken.value,
                profile: profile.value,
            }),
        );
    };

    const setSession = ({ token, user }) => {
        accessToken.value = token || "";
        profile.value = user || null;

        // Keep legacy key while old guard/layout code is still being migrated.
        localStorage.setItem("userRole", user?.role || "");
        localStorage.setItem("userName", user?.name || "");

        persistSession();
    };

    const clearSession = () => {
        accessToken.value = "";
        profile.value = null;

        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
    };

    const setFeatureToggles = (toggles) => {
        featureToggles.value = {
            ...featureToggles.value,
            ...toggles,
        };
    };

    return {
        accessToken,
        profile,
        roleMap,
        featureToggles,
        isAuthenticated,
        currentRole,
        hydrateSession,
        setSession,
        clearSession,
        setFeatureToggles,
    };
});
