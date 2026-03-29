<script setup>
import { ref, onMounted } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

import { dataService } from "@/services/dataService.js";
import { authService } from "@/services/authService";
import { useAppStore } from "@/stores/appStore";
import BaseModal from "@/components/common/BaseModal.vue";
import WaitingIcon from "@/assets/doctor/waiting-for-review.png";
import AttentionIcon from "@/assets/doctor/need-attention.png";
import DoneIcon from "@/assets/doctor/done.png";
import Logo from "@/assets/admin/logo.png";


const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const showLogoutModal = ref(false);
const isSidebarOpen = ref(false);
const stats = ref({ total: 0, pending: 0, completed: 0, attention: 0 });

const menuItems = ref([
  {
    name: "Dashboard",
    path: "/doctor/dashboard",
    type: "svg",
    iconPath: "grid",
    count: 0,
  },
  {
    name: "Waiting For Review",
    path: "/doctor/dashboard?filter=Not Yet",
    type: "img",
    iconPath: WaitingIcon,
    count: 0,
  },
  {
    name: "Done",
    path: "/doctor/dashboard?filter=Done",
    type: "img",
    iconPath: DoneIcon,
    count: 0,
  },
  {
    name: "Need Attention",
    path: "/doctor/dashboard?filter=Attention",
    type: "img",
    iconPath: AttentionIcon,
    count: 0,
  },
]);

onMounted(async () => {
  try {
    const data = await dataService.getDoctorStats();
    stats.value = data;

    // Update menu items with counts
    const pendingItem = menuItems.value.find(
      (i) => i.name === "Waiting For Review"
    );
    if (pendingItem) pendingItem.count = data.pending;

    const completedItem = menuItems.value.find((i) => i.name === "Done");
    if (completedItem) completedItem.count = data.completed;

    const attentionItem = menuItems.value.find(
      (i) => i.name === "Need Attention"
    );
    if (attentionItem) attentionItem.count = data.attention;
  } catch (error) {
    console.error("Layout stats fetch failed:", error);
  }
});

// ACTIVE STATE LOGIC
const isActive = (item) => {
  if (item.path.includes("?")) {
    const itemFilter = item.path.split("=")[1];
    return route.query.filter === itemFilter;
  }
  if (item.path === "/doctor/dashboard") {
    return route.path === "/doctor/dashboard" && !route.query.filter;
  }
  return route.path.startsWith(item.path);
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleLogoutClick = () => {
  showLogoutModal.value = true;
};

const confirmLogout = async () => {
  try {
    await authService.logout();
  } catch (error) {
    console.error("Logout failed:", error);
  }

  appStore.clearSession();
  showLogoutModal.value = false;
  router.push("/");
};
</script>

<template>
  <div class="flex h-screen bg-[#FAFAFA] font-sans text-gray-800">
    <!-- Sidebar -->
    <aside
      class="w-72 flex flex-col bg-[#EDEDED] flex-shrink-0 transition-all duration-300 hidden lg:flex m-4 rounded-3xl h-[calc(100vh-2rem)] shadow-sm relative"
    >
      <!-- 1. Redesigned Header -->
      <div
        class="h-32 bg-[#BCE3FD] rounded-t-3xl flex flex-col justify-center px-8 relative overflow-hidden"
      >
        <div class="flex items-start gap-3 z-10">
          <img :src="Logo" alt="Logo" class="w-8 h-8 object-contain mt-1" />
          <div>
            <h1 class="font-bold text-gray-600 text-lg leading-tight">
              Doctor Dashboard
            </h1>
            <p class="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">
              Breast Cancer Analytics
            </p>
          </div>
        </div>
      </div>
      <!-- 2. Navigation "Cards" -->
      <nav class="flex-1 px-6 py-8 space-y-5 overflow-y-auto">
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.path"
          class="flex items-center justify-between px-4 py-4 rounded-xl font-bold text-sm transition-all duration-200 group relative shadow-sm border bg-white hover:shadow-md"
          :class="
            isActive(item)
              ? 'border-gray-800 ring-1 ring-gray-800'
              : 'border-transparent'
          "
        >
          <div class="flex items-center">
            <span class="w-6 h-6 mr-4 flex items-center justify-center">
              <!-- SVG Icon -->
              <svg
                v-if="item.type === 'svg' && item.iconPath === 'grid'"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                class="w-5 h-5 text-gray-600"
              >
                <path
                  d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"
                />
              </svg>
              <!-- PNG Icon -->
              <img
                v-else
                :src="item.iconPath"
                class="w-full h-full object-contain"
              />
            </span>
            <span
              class="text-gray-600"
              :class="{ 'font-bold text-gray-800': isActive(item) }"
            >
              {{ item.name }}
            </span>
          </div>

          <!-- Badge -->
          <span
            v-if="item.count > 0"
            class="px-2 py-0.5 rounded-full text-xs font-bold"
            :class="{
              'bg-red-100 text-red-600':
                item.name === 'Waiting For Review' ||
                item.name === 'Need Attention',
              'bg-blue-100 text-blue-600': item.name === 'Done',
              'bg-gray-200 text-gray-700': item.name === 'Dashboard',
            }"
          >
            {{ item.count }}
          </span>
        </router-link>
      </nav>
      <!-- 3. Bottom Logout -->
      <div class="px-6 pb-8 pt-4 mb-2">
        <button
          @click="handleLogoutClick"
          class="flex items-center justify-center px-4 py-4 rounded-xl bg-white text-red-600 font-bold text-sm transition-all duration-200 w-full cursor-pointer hover:shadow-md shadow-sm border border-transparent hover:border-red-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-5 h-5 mr-3"
          >
            <path
              fill-rule="evenodd"
              d="M12 2.25a.75.75 0 01.75.75v9a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM6.166 5.106a.75.75 0 010 1.06 8.25 8.25 0 1011.668 0 .75.75 0 111.06-1.06 9.75 9.75 0 11-13.788 0 .75.75 0 011.06 0z"
              clip-rule="evenodd"
            />
          </svg>
          Log Out
        </button>
      </div>
    </aside>
    <!-- Mobile Drawer (Mirrors the Sidebar Design) -->
    <div v-if="isSidebarOpen" class="fixed inset-0 z-50 lg:hidden flex">
      <div
        class="fixed inset-0 bg-black/50 transition-opacity"
        @click="isSidebarOpen = false"
      ></div>
      <div class="relative w-72 flex flex-col bg-[#EDEDED] h-full shadow-xl">
        <div
          class="h-32 bg-[#BCE3FD] flex flex-col justify-center px-8 relative"
        >
          <div class="flex items-start gap-3">
            <img :src="Logo" alt="Logo" class="w-8 h-8 object-contain mt-1" />
            <div>
              <h1 class="font-bold text-gray-600 text-lg leading-tight">
                Doctor Dashboard
              </h1>
              <p
                class="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5"
              >
                Breast Cancer Analytics
              </p>
            </div>
          </div>
        </div>
        <nav class="flex-1 px-6 py-8 space-y-5 overflow-y-auto">
          <router-link
            v-for="item in menuItems"
            :key="item.name"
            :to="item.path"
            @click="isSidebarOpen = false"
            class="flex items-center justify-between px-4 py-4 rounded-xl font-bold text-sm bg-white shadow-sm hover:shadow-md"
            :class="isActive(item) ? 'ring-1 ring-gray-800' : ''"
          >
            <div class="flex items-center">
              <span class="w-6 h-6 mr-4 flex items-center justify-center">
                <svg
                  v-if="item.type === 'svg'"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  class="w-5 h-5 text-gray-600"
                >
                  <path
                    d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"
                  />
                </svg>
                <img
                  v-else
                  :src="item.iconPath"
                  class="w-full h-full object-contain"
                />
              </span>
              <span class="text-gray-600">{{ item.name }}</span>
            </div>

            <!-- Badge Mobile -->
            <span
              v-if="item.count > 0"
              class="px-2 py-0.5 rounded-full text-xs font-bold"
              :class="{
                'bg-red-100 text-red-600':
                  item.name === 'Waiting For Review' ||
                  item.name === 'Need Attention',
                'bg-blue-100 text-blue-600': item.name === 'Done',
                'bg-gray-200 text-gray-700': item.name === 'Dashboard',
              }"
            >
              {{ item.count }}
            </span>
          </router-link>
        </nav>
        <div class="px-6 pb-8 pt-4 mb-2">
          <button
            @click="
              () => {
                handleLogoutClick();
                isSidebarOpen = false;
              }
            "
            class="flex items-center justify-center px-4 py-4 rounded-xl bg-white text-red-600 font-bold text-sm w-full shadow-sm"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden bg-[#FAFAFA]">
      <header
        class="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between"
      >
        <span class="font-bold text-gray-700">Doctor Panel</span>
        <button @click="toggleSidebar" class="text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
      </header>
      <div class="flex-1 overflow-auto p-4 lg:p-12">
        <RouterView />
      </div>
    </main>
    <!-- Logout Modal Confirmation -->
    <BaseModal
      :isOpen="showLogoutModal"
      title="Sign Out"
      @close="showLogoutModal = false"
      maxWidth="max-w-sm"
    >
      <div class="text-gray-600 mb-2">Are you sure you want to sign out?</div>
      <template #footer>
        <button
          @click="showLogoutModal = false"
          class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
        >
          Cancel
        </button>
        <button
          @click="confirmLogout"
          class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold"
        >
          Yes, Sign Out
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
aside nav::-webkit-scrollbar {
  width: 4px;
}

aside nav::-webkit-scrollbar-track {
  background: transparent;
}

aside nav::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
</style>
