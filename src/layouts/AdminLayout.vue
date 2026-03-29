<script setup>
import { ref } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

import { authService } from '@/services/authService';
import { useAppStore } from '@/stores/appStore';
import BaseModal from '@/components/common/BaseModal.vue';
import ModalChangePassword from '@/views/admin/components/ModalChangePassword.vue';
import DashboardIcon from '@/assets/admin/dashboard-sidebar.png';
import DoctorIcon from '@/assets/admin/doctor-sidebar.png';
import PatientIcon from '@/assets/admin/patient-sidebar.png';
import Logo from '@/assets/admin/logo.png';


const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const showLogoutModal = ref(false)
const showChangePasswordModal = ref(false)
const isSidebarOpen = ref(false)

const menuItems = [
  { name: 'Dashboard', path: '/admin', image: DashboardIcon },
  { name: 'Doctor', path: '/admin/doctors', image: DoctorIcon },
  { name: 'Patient', path: '/admin/patients', image: PatientIcon },
]

const isActive = (path) => {
  if (path === '/admin' && route.path === '/admin') return true
  if (path !== '/admin' && route.path.startsWith(path)) return true
  return false
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const handleLogoutClick = () => {
  showLogoutModal.value = true
}

const confirmLogout = async () => {
  try {
    await authService.logout()
  } catch (error) {
    console.error('Logout failed:', error)
  }

  appStore.clearSession()
  showLogoutModal.value = false
  router.push('/')
}

const handleChangePassword = () => {
  showChangePasswordModal.value = true
}
</script>

<template>
  <div class="flex h-screen bg-[#FAFAFA] font-sans text-gray-800">
    <!-- Sidebar -->
    <aside
      class="w-72 flex flex-col bg-[#EDEDED] flex-shrink-0 transition-all duration-300 hidden lg:flex m-4 rounded-3xl h-[calc(100vh-2rem)] shadow-sm">
      <!-- Brand / Logo Area -->
      <div class="h-32 bg-gradient-to-b from-blue-300/60 to-blue-50/0 rounded-t-3xl flex flex-col justify-center px-6">
        <div class="flex items-center gap-3">
          <!-- Logo Image -->
          <img :src="Logo" alt="Logo" class="w-10 h-10 object-contain" />
          <div>
            <div class="font-bold text-gray-700 text-base leading-tight">Admin Dashboard</div>
            <div class="text-xs text-gray-500">Breast Cancer Analytics</div>
          </div>
        </div>
      </div>
      <!-- Navigation Menu -->
      <nav class="flex-1 px-4 py-8 space-y-4">
        <router-link v-for="item in menuItems" :key="item.name" :to="item.path"
          class="flex items-center justify-center px-4 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 group relative shadow-sm border bg-white"
          :class="isActive(item.path)
            ? 'text-gray-800 border-gray-600 border-2'
            : 'text-gray-600 border-transparent hover:border-gray-300'">
          <!-- Icon Image -->
          <img :src="item.image" :alt="item.name" class="w-5 h-5 mr-3 object-contain" />
          {{ item.name }}
        </router-link>
      </nav>
      <!-- Action Buttons -->
      <div class="px-4 pb-8 pt-4 space-y-3 mb-4">
        <!-- Change Password -->
        <button @click="handleChangePassword"
          class="flex items-center justify-center px-4 py-3.5 rounded-2xl bg-white text-[#0099ff] font-bold transition-all duration-200 w-full cursor-pointer hover:shadow-md shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-3">
            <path fill-rule="evenodd"
              d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
              clip-rule="evenodd" />
          </svg>
          Change Password
        </button>
        <!-- Log Out -->
        <button @click="handleLogoutClick"
          class="flex items-center justify-center px-4 py-3.5 rounded-2xl bg-white text-red-600 font-bold transition-all duration-200 w-full cursor-pointer hover:shadow-md shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-3">
            <path fill-rule="evenodd"
              d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V15a.75.75 0 0 0-1.5 0v3.75a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3V9A.75.75 0 1 0 9 9V5.25a1.5 1.5 0 0 1 1.5-1.5h6ZM5.78 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 0 0 1.06-1.06l-1.72-1.72H15a.75.75 0 0 0 0-1.5H4.06l1.72-1.72a.75.75 0 0 0 0-1.06Z"
              clip-rule="evenodd" />
          </svg>
          Log Out
        </button>
      </div>
    </aside>
    <!-- Mobile/Tablet Sidebar Drawer -->
    <div v-if="isSidebarOpen" class="fixed inset-0 z-50 lg:hidden flex">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 transition-opacity" @click="isSidebarOpen = false"></div>
      <!-- Drawer Content -->
      <div class="relative w-72 flex flex-col bg-[#EDEDED] h-full shadow-xl transition-transform animate-slide-in">
        <!-- Close Button -->
        <button @click="isSidebarOpen = false" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <!-- Brand / Logo Area -->
        <div class="h-32 bg-gradient-to-b from-blue-300/60 to-blue-50/0 flex flex-col justify-center px-6">
          <div class="flex items-center gap-3">
            <img :src="Logo" alt="Logo" class="w-10 h-10 object-contain" />
            <div>
              <div class="font-bold text-gray-700 text-base leading-tight">Admin Dashboard</div>
              <div class="text-xs text-gray-500">Breast Cancer Analytics</div>
            </div>
          </div>
        </div>
        <!-- Navigation Menu -->
        <nav class="flex-1 px-4 py-8 space-y-4 overflow-y-auto">
          <router-link v-for="item in menuItems" :key="item.name" :to="item.path" @click="isSidebarOpen = false"
            class="flex items-center justify-center px-4 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 group relative shadow-sm border bg-white"
            :class="isActive(item.path)
              ? 'text-gray-800 border-gray-600 border-2'
              : 'text-gray-600 border-transparent hover:border-gray-300'">
            <img :src="item.image" :alt="item.name" class="w-5 h-5 mr-3 object-contain" />
            {{ item.name }}
          </router-link>
        </nav>
        <!-- Action Buttons -->
        <div class="px-4 pb-8 pt-4 space-y-3 mb-4">
          <!-- Change Password -->
          <button @click="() => { handleChangePassword(); isSidebarOpen = false; }"
            class="flex items-center justify-center px-4 py-3.5 rounded-2xl bg-white text-[#0099ff] font-bold transition-all duration-200 w-full cursor-pointer hover:shadow-md shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-3">
              <path fill-rule="evenodd"
                d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                clip-rule="evenodd" />
            </svg>
            Change Password
          </button>
          <!-- Log Out -->
          <button @click="() => { handleLogoutClick(); isSidebarOpen = false; }"
            class="flex items-center justify-center px-4 py-3.5 rounded-2xl bg-white text-red-600 font-bold transition-all duration-200 w-full cursor-pointer hover:shadow-md shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mr-3">
              <path fill-rule="evenodd"
                d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V15a.75.75 0 0 0-1.5 0v3.75a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3V9A.75.75 0 1 0 9 9V5.25a1.5 1.5 0 0 1 1.5-1.5h6ZM5.78 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 0 1.06l3 3a.75.75 0 0 0 1.06-1.06l-1.72-1.72H15a.75.75 0 0 0 0-1.5H4.06l1.72-1.72a.75.75 0 0 0 0-1.06Z"
                clip-rule="evenodd" />
            </svg>
            Log Out
          </button>
        </div>
      </div>
    </div>
    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden bg-[#FAFAFA]">
      <header class="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <span class="font-bold">Admin Dashboard</span>
        <button @click="toggleSidebar" class="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </header>

      <div class="flex-1 overflow-auto p-8">
        <RouterView />
      </div>
    </main>
    <!-- Logout Modal Confirmation -->
    <BaseModal :isOpen="showLogoutModal" title="Sign Out" @close="showLogoutModal = false" maxWidth="max-w-sm">
      <div class="text-gray-600 mb-2">
        Are you sure you want to sign out of the Admin panel?
      </div>

      <template #footer>
        <button @click="showLogoutModal = false"
          class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
          Cancel
        </button>
        <button @click="confirmLogout"
          class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold shadow-sm transition-colors">
          Yes, Sign Out
        </button>
      </template>
    </BaseModal>
    <!-- Change Password Modal -->
    <ModalChangePassword :isOpen="showChangePasswordModal" @close="showChangePasswordModal = false" />
  </div>
</template>

<style scoped>
/* Utility to hide on mobile uses standard CSS as fallback */
</style>