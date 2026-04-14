import { computed, ref } from "vue";
import { defineStore } from "pinia";


const SESSION_KEY = "lumira.session.v2";
const LEGACY_SESSION_KEY = "lumira.session";

export const useAppStore = defineStore("app", () => {
    const accessToken = ref("");
    const refreshToken = ref("");
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
    const hasRefreshToken = computed(() => Boolean(refreshToken.value));
    const currentRole = computed(() => profile.value?.role || "");

    const hydrateSession = () => {
        const raw = localStorage.getItem(SESSION_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            accessToken.value = parsed.accessToken || "";
            refreshToken.value = parsed.refreshToken || "";
            profile.value = parsed.profile || null;
        } catch (error) {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(LEGACY_SESSION_KEY);
        }
    };

    const persistSession = () => {
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
                accessToken: accessToken.value,
                refreshToken: refreshToken.value,
                profile: profile.value,
            }),
        );

        // Keep compatibility while some pages may still expect legacy key.
        localStorage.setItem(
            LEGACY_SESSION_KEY,
            JSON.stringify({
                accessToken: accessToken.value,
                profile: profile.value,
            }),
        );
    };

    const resolveRole = (incomingProfileRole, fallbackRole = "") => {
        if (incomingProfileRole) {
            return incomingProfileRole;
        }

        const persistedRole = profile.value?.role || localStorage.getItem("userRole") || "";
        return persistedRole || fallbackRole || "";
    };

    const setSession = ({ token, accessToken: nextAccessToken, refreshToken: nextRefreshToken, role, user, profile: nextProfile }) => {
        accessToken.value = nextAccessToken || token || "";
        refreshToken.value = nextRefreshToken || "";

        const rawProfile = nextProfile || user || null;
        const resolvedRole = resolveRole(rawProfile?.role, role || "");

        profile.value = rawProfile
            ? {
                ...rawProfile,
                role: resolvedRole,
            }
            : resolvedRole
                ? { role: resolvedRole }
                : null;

        // Keep legacy key while old guard/layout code is still being migrated.
        localStorage.setItem("userRole", profile.value?.role || "");
        localStorage.setItem("userName", profile.value?.name || "");

        persistSession();
    };

    const setProfile = (nextProfile) => {
        if (!nextProfile) {
            profile.value = null;
        } else {
            const resolvedRole = resolveRole(nextProfile.role);
            profile.value = {
                ...nextProfile,
                role: resolvedRole,
            };
        }

        localStorage.setItem("userRole", profile.value?.role || "");
        localStorage.setItem("userName", profile.value?.name || "");

        persistSession();
    };

    const updateAccessToken = (nextAccessToken) => {
        accessToken.value = nextAccessToken || "";
        persistSession();
    };

    const clearSession = () => {
        accessToken.value = "";
        refreshToken.value = "";
        profile.value = null;

        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LEGACY_SESSION_KEY);
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
        refreshToken,
        profile,
        roleMap,
        featureToggles,
        isAuthenticated,
        hasRefreshToken,
        currentRole,
        hydrateSession,
        setSession,
        setProfile,
        updateAccessToken,
        clearSession,
        setFeatureToggles,
    };
});
