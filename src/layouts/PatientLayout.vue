<script setup>
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Menu, X } from '@lucide/vue'

import { authService } from '@/services/authService'
import { useAppStore } from '@/stores/appStore'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/common/BaseModal.vue'
import DashboardIcon from '@/assets/admin/dashboard-sidebar.png'


const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const toast = useToast()

const showLogoutModal = ref(false)
const isSidebarOpen = ref(false)
const isLoggingOut = ref(false)

const menuItems = [
  { name: 'Dashboard', path: '/patient/dashboard', iconPath: DashboardIcon },
]

const patientName = computed(() => appStore.profile?.name || 'Patient')

const isActive = (path) => route.path === path

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const handleLogoutClick = () => {
  if (isLoggingOut.value) {
    return
  }

  showLogoutModal.value = true
}

const closeLogoutModal = () => {
  if (isLoggingOut.value) {
    return
  }

  showLogoutModal.value = false
}

const confirmLogout = async () => {
  if (isLoggingOut.value) {
    return
  }

  isLoggingOut.value = true

  try {
    await authService.logout()
  } catch (error) {
    console.error('Logout failed:', error)
  }

  appStore.clearSession()
  toast.success('Logout berhasil')
  showLogoutModal.value = false
  isSidebarOpen.value = false
  isLoggingOut.value = false
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#F2F2F2]">
    <header class="bg-linear-to-r from-[#97D2F8] to-[#A8D8F6] rounded-b-[50px] px-3 sm:px-5 py-3 sm:py-5">
      <div class="flex items-center justify-center">
        <span class="text-xl font-semibold text-neutral-800">Welcome {{ patientName }}</span>
      </div>
    </header>

    <div class="flex gap-4 p-3 sm:px-5 pt-10">
      <aside class="hidden lg:flex w-64 shrink-0 flex-col">
        <nav class="space-y-3">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center justify-between rounded-2xl border-2 border-[#A8A8A8] px-4 py-4 transition-colors"
            :class="isActive(item.path) ? 'font-semibold bg-[#C2E8FF]' : 'hover:bg-neutral-50'"
          >
            <div class="flex items-center gap-3">
              <span class="h-8 w-8 flex items-center justify-center">
                <img :src="item.iconPath" :alt="item.name" class="h-8 w-8 object-contain" />
              </span>
              <span class="text-neutral-600">{{ item.name }}</span>
            </div>
          </router-link>
        </nav>

        <div class="mt-auto pt-4">
          <button
            @click="handleLogoutClick"
            :disabled="isLoggingOut"
            class="cursor-pointer flex w-full items-center gap-3 rounded-2xl border-2 border-[#A8A8A8] bg-white px-5 py-5 text-left text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
          <img src="@/assets/icons/logout-icon.png" alt="Logout Icon" class="h-7 w-7" />
            <span class="font-bold">Log Out</span>
          </button>
        </div>
      </aside>

      <main class="min-w-0 flex-1 rounded-2xl bg-transparent">
        <header class="mb-4 flex items-center justify-between lg:hidden">
          <p class="text-lg font-bold text-neutral-700">Patient Dashboard</p>
          <button @click="toggleSidebar" class="rounded-lg border border-neutral-300 bg-white p-2 text-neutral-600 cursor-pointer">
            <Menu class="h-5 w-5" />
          </button>
        </header>

        <div class="h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl">
          <RouterView />
        </div>
      </main>
    </div>

    <div v-if="isSidebarOpen" class="fixed inset-0 z-50 flex lg:hidden">
      <div class="absolute inset-0 bg-black/40" @click="isSidebarOpen = false"></div>
      <div class="relative ml-auto flex h-full w-72 flex-col bg-[#F2F2F2] p-4">
        <button
          @click="isSidebarOpen = false"
          class="mb-4 ml-auto rounded-lg border border-neutral-300 bg-white p-2 text-neutral-600 cursor-pointer"
        >
          <X class="h-5 w-5" />
        </button>

        <nav class="space-y-3">
          <router-link
            v-for="item in menuItems"
            :key="`mobile-${item.path}`"
            :to="item.path"
            @click="isSidebarOpen = false"
            class="flex items-center justify-between rounded-2xl border-2 border-[#A8A8A8] px-4 py-4"
            :class="isActive(item.path) ? 'font-semibold bg-[#C2E8FF]' : 'font-medium hover:bg-neutral-50'"
          >
            <div class="flex items-center gap-3">
              <span class="h-8 w-8 flex items-center justify-center">
                <img :src="item.iconPath" :alt="item.name" class="h-8 w-8 object-contain" />
              </span>
              <span class="text-neutral-600">{{ item.name }}</span>
            </div>
          </router-link>
        </nav>

        <div class="mt-auto">
          <button
            @click="() => { handleLogoutClick(); isSidebarOpen = false }"
            :disabled="isLoggingOut"
            class="flex w-full items-center gap-3 rounded-2xl border-2 border-[#A8A8A8] bg-white px-5 py-5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src="@/assets/icons/logout-icon.png" alt="Logout Icon" class="h-7 w-7" />
            <span class="font-bold">Log Out</span>
          </button>
        </div>
      </div>
    </div>

    <BaseModal :isOpen="showLogoutModal" title="Sign Out" @close="closeLogoutModal" maxWidth="max-w-sm">
      <p class="text-neutral-600">Are you sure you want to sign out?</p>
      <template #footer>
        <button
          @click="closeLogoutModal"
          :disabled="isLoggingOut"
          class="cursor-pointer rounded-lg px-4 py-2 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          @click="confirmLogout"
          :disabled="isLoggingOut"
          class="cursor-pointer rounded-lg bg-red-500 px-4 py-2 font-bold text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {{ isLoggingOut ? 'Signing out...' : 'Yes, Sign Out' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>
