<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Menu, X } from '@lucide/vue'

import { authService } from '@/services/authService'
import { dataService } from '@/services/dataService'
import { useAppStore } from '@/stores/appStore'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/common/BaseModal.vue'
import Pagination from '@/components/common/Pagination.vue'
import DoctorChatDock from '@/components/doctor/DoctorChatDock.vue'
import DashboardIcon from '@/assets/admin/dashboard-sidebar.png'
import DoneIcon from '@/assets/doctor/done.png'
import WaitingIcon from '@/assets/doctor/waiting-for-review.png'
import AttentionIcon from '@/assets/doctor/need-attention.png'


const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const toast = useToast()

const showLogoutModal = ref(false)
const isSidebarOpen = ref(false)
const isLoggingOut = ref(false)
const sidebarStats = ref({
  total: 0,
  pending: 0,
  completed: 0,
  attention: 0,
})
const paginationState = ref({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  from: 0,
  to: 0,
})

const menuItems = [
  { 
    name: 'Dashboard', 
    path: '/doctor/dashboard', 
    iconPath: DashboardIcon,
  },
  {
    name: 'Waiting For Review',
    path: '/doctor/dashboard?filter=Not Yet',
    iconPath: WaitingIcon,
    countKey: 'pending',
  },
  {
    name: 'Completed',
    path: '/doctor/dashboard?filter=Done',
    iconPath: DoneIcon,
    countKey: 'completed',
  },
  {
    name: 'Need Attention',
    path: '/doctor/dashboard?filter=Attention',
    iconPath: AttentionIcon,
    countKey: 'attention',
  },
]

const showBottomDock = computed(() => route.name === 'doctor-dashboard')

const headerTitle = computed(() => {
  if (route.name === 'review-console') {
    return 'Review Console'
  }

  const filter = route.query.filter || ''
  if (filter === 'Not Yet') {
    return 'Waiting For Review'
  }

  if (filter === 'Done') {
    return 'Completed Inspection'
  }

  if (filter === 'Attention') {
    return 'Need Attention'
  }

  const fallbackName = appStore.profile?.name || '-'
  return `Welcome ${fallbackName}!`
})

const isActive = (item) => {
  if (item.path.includes('?')) {
    const itemFilter = item.path.split('=')[1]
    return route.path === '/doctor/dashboard' && route.query.filter === itemFilter
  }

  return route.path === '/doctor/dashboard' && !route.query.filter
}

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

const getBadgeValue = (countKey) => {
  if (!countKey) {
    return 0
  }

  return Number(sidebarStats.value[countKey] || 0)
}

const refreshSidebarStats = async () => {
  try {
    sidebarStats.value = await dataService.getDoctorStats()
  } catch (error) {
    console.error('Layout stats fetch failed:', error)
  }
}

const handlePaginationMeta = (meta) => {
  paginationState.value = {
    ...paginationState.value,
    ...meta,
  }

  if (paginationState.value.page > paginationState.value.totalPages) {
    paginationState.value.page = paginationState.value.totalPages || 1
  }
}

const handlePageUpdate = (nextPage) => {
  paginationState.value.page = nextPage
}

const handleLimitUpdate = (nextLimit) => {
  paginationState.value.limit = nextLimit
  paginationState.value.page = 1
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

onMounted(() => {
  refreshSidebarStats()
})

watch(
  () => route.fullPath,
  () => {
    if (showBottomDock.value) {
      paginationState.value.page = 1
    }
  },
)
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-[#EAEAEA]">
    <!-- Header -->
    <header class="bg-linear-to-r from-[#97D2F8] to-[#C2E8FF] rounded-b-[50px] px-3 sm:px-5 py-3 sm:py-4">
      <div class="grid grid-cols-3 items-center">
        <div class="flex col-span-3 lg:col-span-1 items-center gap-3 sm:gap-4">
          <div class="h-14 w-14 rounded-full bg-white/95 shrink-0"></div>
          <div>
            <p class="text-base font-semibold text-neutral-700">{{ appStore.profile?.name || '-' }}</p>
            <p class="text-xs text-neutral-600">Breast Cancer Analytics</p>
          </div>
        </div>
        <div class="hidden lg:flex lg:col-span-1 justify-center">
          <p class="text-lg font-semibold text-neutral-600">{{ headerTitle }}</p>
        </div>
      </div>
    </header>
    <!-- Main Content -->
    <div class="flex min-h-0 flex-1 gap-8 p-3 sm:px-5 pt-4 sm:pt-10">
      <!-- Left Sidebar/Content -->
      <aside class="hidden lg:flex w-64 shrink-0 flex-col min-h-0">
        <nav class="space-y-3">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center justify-between rounded-2xl border-2 border-neutral-400 px-4 py-6 transition-colors"
            :class="isActive(item) ? 'font-semibold bg-[#C2E8FF]' : 'bg-white font-medium hover:bg-neutral-50'"
          >
            <div class="text-sm flex items-center gap-3">
              <span class="h-8 w-8 flex items-center justify-center">
                <img :src="item.iconPath" :alt="item.name" class="h-8 w-8 object-contain" />
              </span>
              <span class="font-semibold text-neutral-600">{{ item.name }}</span>
            </div>
            <span
              v-if="getBadgeValue(item.countKey) >= 0 && item.name !== 'Dashboard'"
              class="inline-flex min-w-7 justify-center rounded-full bg-[#0099ff] px-2 py-1 text-sm font-bold text-white"
            >
              {{ getBadgeValue(item.countKey) }}
            </span>
          </router-link>
        </nav>
        <div class="mt-auto pt-4">
          <button
            @click="handleLogoutClick"
            :disabled="isLoggingOut"
            class="cursor-pointer flex w-full items-center gap-3 rounded-2xl border-2 border-neutral-400 bg-white px-5 py-5 text-left text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src="@/assets/icons/logout-icon.png" alt="Logout Icon" class="h-7 w-7" />
            <span class="font-semibold">Log Out</span>
          </button>
        </div>
      </aside>
      <!-- Main Data -->
      <main class="min-w-0 flex min-h-0 flex-1 flex-col">
        <!-- Header -->
        <header class="mb-4 flex items-center justify-between lg:hidden">
          <p class="text-lg font-bold text-neutral-700">Doctor Dashboard</p>
          <button @click="toggleSidebar" class="cursor-pointer rounded-lg border border-neutral-300 bg-white p-2 text-neutral-600">
            <Menu class="h-5 w-5" />
          </button>
        </header>
        <!-- Main Content -->
        <div class="flex min-h-0 flex-1 flex-col">
          <div class="min-h-0 flex-1 overflow-hidden">
            <RouterView v-slot="{ Component }">
              <component
                :is="Component"
                v-bind="showBottomDock ? { page: paginationState.page, limit: paginationState.limit } : {}"
                @pagination-meta="handlePaginationMeta"
              />
            </RouterView>
          </div>
          <!-- Pagination & Chat Dock  -->
          <div
            v-if="showBottomDock"
            class="mt-4 shrink-0 flex flex-col gap-3 lg:flex-row lg:justify-between"
          >
            <Pagination
              :current-page="paginationState.page"
              :total-pages="paginationState.totalPages"
              :total-items="paginationState.totalItems"
              :page-size="paginationState.limit"
              @update:page="handlePageUpdate"
              @update:limit="handleLimitUpdate"
            />
            <DoctorChatDock />
          </div>
        </div>
      </main>
    </div>
    <!-- Right Sidebar/Content If tobe small screen -->
    <div v-if="isSidebarOpen" class="fixed inset-0 z-50 flex lg:hidden">
      <div class="absolute inset-0 bg-black/40" @click="isSidebarOpen = false"></div>
      <div class="relative ml-auto flex h-full w-72 flex-col bg-[#EAEAEA] p-4">
        <button
          @click="isSidebarOpen = false"
          class="cursor-pointer mb-4 ml-auto rounded-lg border border-neutral-300 bg-white p-2 text-neutral-600"
        >
          <X class="h-5 w-5" />
        </button>

        <nav class="space-y-3">
          <router-link
            v-for="item in menuItems"
            :key="`mobile-${item.path}`"
            :to="item.path"
            @click="isSidebarOpen = false"
            class="flex items-center justify-between rounded-2xl border-2 border-neutral-400 px-4 py-4"
            :class="isActive(item) ? 'font-semibold bg-[#C2E8FF]' : 'bg-white font-medium hover:bg-neutral-50'"
          >
            <div class="flex items-center gap-3">
              <span class="h-8 w-8 flex items-center justify-center">
                <img :src="item.iconPath" :alt="item.name" class="h-8 w-8 object-contain" />
              </span>
              <span class="text-neutral-600">{{ item.name }}</span>
            </div>
            <span
              v-if="getBadgeValue(item.countKey) >= 0 && item.name !== 'Dashboard'"
              class="inline-flex min-w-7 justify-center rounded-full bg-[#0099ff] px-2 py-1 text-sm font-bold text-white"
            >
              {{ getBadgeValue(item.countKey) }}
            </span>
          </router-link>
        </nav>

        <div class="mt-auto">
          <button
            @click="() => { handleLogoutClick(); isSidebarOpen = false }"
            :disabled="isLoggingOut"
            class="cursor-pointer flex w-full items-center gap-3 rounded-2xl border-2 border-[#A8A8A8] bg-red-50 px-5 py-5 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src="@/assets/icons/logout-icon.png" alt="Logout Icon" class="h-7 w-7" />
            <span class="font-semibold">Log Out</span>
          </button>
        </div>
      </div>
    </div>
    <!-- Modal confirmation for logout -->
    <BaseModal :isOpen="showLogoutModal" title="Sign Out" @close="closeLogoutModal" maxWidth="max-w-sm" :closeOnBackdrop="false">
      <p class="text-neutral-700">Are you sure you want to sign out?</p>
      <template #footer>
        <button
          @click="closeLogoutModal"
          :disabled="isLoggingOut"
          class="cursor-pointer rounded-lg px-4 py-2 text-neutral-600 transition-colors bg-neutral-100 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
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