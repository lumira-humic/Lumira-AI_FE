<script setup>
import { computed, ref } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { BarChart3, History, LogOut, Menu, MessageSquareText, Sparkles, X } from "@lucide/vue";

import { authService } from "@/services/authService";
import { useAppStore } from "@/stores/appStore";
import { useToast } from "@/composables/useToast";
import BaseModal from "@/components/common/BaseModal.vue";


const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const toast = useToast();

const showLogoutModal = ref(false);
const isSidebarOpen = ref(false);
const isLoggingOut = ref(false);

const menuItems = [
  {
    name: "Stats",
    routeName: "patient-dashboard",
    icon: BarChart3,
    matchNames: ["patient-dashboard", "patient-record-detail"],
  },
  {
    name: "Chat with Doctor",
    routeName: "patient-chat-doctor",
    icon: MessageSquareText,
    matchNames: ["patient-chat-doctor"],
  },
  {
    name: "Consult AI",
    routeName: "patient-consult-ai",
    icon: Sparkles,
    matchNames: ["patient-consult-ai"],
  },
  {
    name: "History",
    routeName: "patient-history",
    icon: History,
    matchNames: ["patient-history"],
  },
];

const patientName = computed(() => appStore.profile?.name || "Name of Patient");
const patientId = computed(() => appStore.profile?.id || "ID of Patient");
const activeRouteName = computed(() => String(route.name || ""));

const isActive = (item) => {
  return item.matchNames.includes(activeRouteName.value);
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleLogoutClick = () => {
  if (isLoggingOut.value) {
    return;
  }

  showLogoutModal.value = true;
};

const closeLogoutModal = () => {
  if (isLoggingOut.value) {
    return;
  }

  showLogoutModal.value = false;
};

const confirmLogout = async () => {
  if (isLoggingOut.value) {
    return;
  }

  isLoggingOut.value = true;

  try {
    await authService.logout();
  } catch (error) {
    console.error("Logout failed:", error);
  }

  appStore.clearSession();
  toast.success("Logout berhasil");
  showLogoutModal.value = false;
  isSidebarOpen.value = false;
  isLoggingOut.value = false;
  router.push("/");
};

const isChatDoctorPage = computed(() => {
  return route.name === "patient-chat-doctor" || route.name === "patient-record-detail";
});
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-white">
    <!-- Header -->
    <header class="w-full rounded-br-4xl bg-[#D9D9D9]">
      <div
        :class="[
          'bg-linear-to-r from-[#97D2F8] to-[#C2E8FF] px-3 py-3 sm:px-5',
          isChatDoctorPage ? 'rounded-bl-4xl' : 'rounded-b-4xl'
        ]"
      >
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div class="flex items-center gap-3">
            <div class="h-14 w-14 rounded-full bg-white/90"></div>
            <div class="min-w-0">
              <p class="truncate text-base font-semibold text-neutral-700">{{ patientName }}</p>
              <p class="text-xs text-neutral-600">{{ patientId }}</p>
            </div>
          </div>
  
          <p class="text-center text-xl font-semibold text-neutral-700">Welcome {{ patientName }}</p>
  
          <div class="flex justify-end lg:hidden">
            <button
              type="button"
              @click="toggleSidebar"
              class="cursor-pointer rounded-lg border border-neutral-300 bg-white p-2 text-neutral-600"
              aria-label="Open sidebar"
            >
              <Menu class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
    <div class="flex min-h-0 flex-1">
      <!-- Sidebar Left Menu -->
      <aside class="hidden w-64 shrink-0 flex-col sm:rounded-br-4xl bg-[#D9D9D9] py-4 px-5 lg:flex">
        <nav class="space-y-3">
          <router-link
            v-for="item in menuItems"
            :key="item.routeName"
            :to="{ name: item.routeName }"
            class="flex items-center gap-3 rounded-2xl border-2 border-[#A8A8A8] px-4 py-6 text-neutral-700 transition-colors"
            :class="isActive(item) ? 'bg-[#C2E8FF] font-semibold' : 'bg-white font-medium hover:bg-neutral-100'"
          >
            <component :is="item.icon" class="h-7 w-7" />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <div class="mt-auto">
          <button
            type="button"
            @click="handleLogoutClick"
            :disabled="isLoggingOut"
            class="cursor-pointer flex w-full items-center gap-3 rounded-2xl border-2 border-[#A8A8A8] bg-white px-4 py-5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut class="h-6 w-6" />
            <span class="font-bold">Log Out</span>
          </button>
        </div>
      </aside>
      <!-- Main Content -->
      <main class="min-h-0 min-w-0 flex-1 overflow-hidden">
        <RouterView />
      </main>
    </div>
    <!-- Sidebar for mobile -->
    <div v-if="isSidebarOpen" class="fixed inset-0 z-50 flex lg:hidden">
      <div class="absolute inset-0 bg-black/35" @click="isSidebarOpen = false"></div>
      <div class="relative ml-auto flex h-full w-72 flex-col bg-[#F2F2F2] p-4">
        <button
          type="button"
          @click="isSidebarOpen = false"
          class="cursor-pointer mb-4 ml-auto rounded-lg border border-neutral-300 bg-white p-2 text-neutral-600"
          aria-label="Close sidebar"
        >
          <X class="h-5 w-5" />
        </button>

        <nav class="space-y-3">
          <router-link
            v-for="item in menuItems"
            :key="`mobile-${item.routeName}`"
            :to="{ name: item.routeName }"
            @click="isSidebarOpen = false"
            class="flex items-center gap-3 rounded-2xl border-2 border-[#A8A8A8] px-4 py-4 text-neutral-700"
            :class="isActive(item) ? 'bg-[#A9D5F2] font-semibold' : 'bg-white font-medium hover:bg-neutral-100'"
          >
            <component :is="item.icon" class="h-7 w-7" />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <div class="mt-auto">
          <button
            type="button"
            @click="() => { handleLogoutClick(); isSidebarOpen = false }"
            :disabled="isLoggingOut"
            class="cursor-pointer flex w-full items-center gap-3 rounded-2xl border-2 border-[#A8A8A8] bg-white px-4 py-4 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut class="h-6 w-6" />
            <span class="font-bold">Log Out</span>
          </button>
        </div>
      </div>
    </div>
    <!-- Modal Logout -->
    <BaseModal
      :isOpen="showLogoutModal"
      title="Sign Out"
      @close="closeLogoutModal"
      maxWidth="max-w-sm"
      :closeOnBackdrop="false"
    >
      <p class="text-neutral-700">Are you sure you want to sign out?</p>
      <template #footer>
        <button
          type="button"
          @click="closeLogoutModal"
          :disabled="isLoggingOut"
          class="cursor-pointer rounded-lg bg-neutral-100 px-4 py-2 text-neutral-700 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="confirmLogout"
          :disabled="isLoggingOut"
          class="cursor-pointer rounded-lg bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {{ isLoggingOut ? 'Signing out...' : 'Yes, Sign Out' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>
