<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { CalendarIcon } from '@lucide/vue'

import { dataService } from '@/services/dataService.js'
import { getApiErrorMessage } from '@/lib/apiResponse'
import SearchInput from '@/components/common/SearchInput.vue'
import Loading from '@/components/common/Loading.vue'
import Pagination from '@/components/common/Pagination.vue'
import DashboardIcon from '@/assets/admin/dashboard-sidebar.png'


// ─── State ────────────────────────────────────────────────────────────────────
const searchQuery = ref('')
const debouncedSearch = ref('')
const selectedDate = ref('')       // YYYY-MM-DD
const dateInputRef = ref(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)

let searchDebounceTimer

watch(searchQuery, (nextValue) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearch.value = String(nextValue || '').trim()
    currentPage.value = 1
  }, 350)
})

onUnmounted(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
})

// Reset page when date changes
watch(selectedDate, () => { currentPage.value = 1 })

// ─── Query ────────────────────────────────────────────────────────────────────
const logsQuery = useQuery({
  queryKey: computed(() => [
    'admin-activity-logs',
    currentPage.value,
    itemsPerPage.value,
    debouncedSearch.value,
    selectedDate.value,
  ]),
  queryFn: () =>
    dataService.getActivityLogs({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: debouncedSearch.value,
      date: selectedDate.value,
    }),
  placeholderData: (prev) => prev,
  staleTime: 1000 * 20,
  gcTime: 1000 * 60 * 10,
  retry: 1,
})

// ─── Derived state ─────────────────────────────────────────────────────────────
const logs = computed(() =>
  Array.isArray(logsQuery.data.value?.items) ? logsQuery.data.value.items : [],
)
const meta = computed(() => logsQuery.data.value?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 })

const isLoading = computed(() => logsQuery.isPending.value && !logsQuery.data.value)
const isRefreshing = computed(() => logsQuery.isFetching.value && !!logsQuery.data.value)
const errorMessage = computed(() =>
  logsQuery.isError.value
    ? getApiErrorMessage(logsQuery.error.value, 'Failed to load activity logs.')
    : '',
)

// ─── Pagination handlers ───────────────────────────────────────────────────────
const handlePageChange = (page) => { currentPage.value = page }
const handleItemsPerPageChange = (val) => {
  itemsPerPage.value = val
  currentPage.value = 1
}

// ─── Date filter helpers ───────────────────────────────────────────────────────
const displayDate = computed(() => {
  if (!selectedDate.value) return 'Choose Date'
  const d = new Date(selectedDate.value + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
})

const openDatePicker = () => {
  if (dateInputRef.value) {
    try {
      dateInputRef.value.showPicker()
    } catch {
      dateInputRef.value.click()
    }
  }
}

const clearDate = () => {
  selectedDate.value = ''
}

// ─── Message styling ──────────────────────────────────────────────────────────
const getMessageStyle = (message) => {
  const m = String(message || '').toLowerCase()
  if (m.includes('malignant')) return 'text-red-500 font-semibold'
  if (m.includes('benign')) return 'text-[#1397E8] font-semibold'
  if (m.includes('normal')) return 'text-[#2BC11F] font-semibold'
  return 'text-neutral-600 font-semibold'
}
</script>

<template>
  <section class="flex h-full min-h-0 flex-col bg-[#EAEAEA]">

    <!-- Section Header: icon + title + search + date filter -->
    <div class="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4 shrink-0">
      <!-- Left: Icon + Title + Total -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <span class="h-6 w-6 sm:h-11 sm:w-11">
          <img :src="DashboardIcon" alt="Activity User Logs" class="h-6 w-6 object-contain sm:h-11 sm:w-11" />
        </span>
        <h1 class="text-base font-semibold text-neutral-900 sm:text-xl whitespace-nowrap">Activity User Logs</h1>
      </div>

      <!-- Right: Search + Date Filter -->
      <div class="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
        <!-- Search -->
        <div class="flex-1 min-w-0">
          <SearchInput
            v-model="searchQuery"
            :disabled="isLoading || !!errorMessage"
            placeholder="Search..."
            wrapperClass="max-w-none"
            customMainClass="py-2!"
          />
        </div>

        <!-- Date Filter Button (wrapped with hidden input for native picker positioning) -->
        <div class="relative shrink-0">
          <button
            type="button"
            @click="openDatePicker"
            class="flex items-center gap-2 rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 cursor-pointer hover:border-[#0099ff] transition-colors"
            :class="selectedDate ? 'border-[#0099ff] text-[#0099ff]' : 'text-neutral-600'"
          >
            <span class="text-sm font-medium whitespace-nowrap">{{ displayDate }}</span>
            <CalendarIcon class="h-4 w-4 shrink-0" />
          </button>
          <!-- Hidden input positioned over the button so the picker appears near the button -->
          <input
            ref="dateInputRef"
            v-model="selectedDate"
            type="date"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
            tabindex="-1"
          />
        </div>

        <!-- Clear date button -->
        <button
          v-if="selectedDate"
          @click="clearDate"
          class="shrink-0 text-xs text-neutral-500 hover:text-red-500 underline whitespace-nowrap cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Refreshing indicator -->
    <p v-if="isRefreshing" class="-mt-2 mb-2 text-xs text-neutral-400 shrink-0">Refreshing…</p>

    <!-- Table Header -->
    <div class="grid grid-cols-12 pl-3 pr-4 py-2 text-sm sm:text-base xl:text-lg font-semibold text-neutral-900 shrink-0">
      <div class="col-span-1 text-center">No</div>
      <div class="col-span-2 text-center">Role</div>
      <div class="col-span-2 text-center">Time</div>
      <div class="col-span-4 text-center">Message Doctor Review</div>
      <div class="col-span-3 text-center">Date</div>
    </div>

    <!-- Table Body -->
    <div class="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
      <!-- Loading -->
      <div v-if="isLoading" class="py-12">
        <Loading text="Loading activity logs..." />
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="mt-3 rounded-xl bg-red-50 py-8 text-center border-2 border-red-200 text-red-600">
        <p class="mb-4 font-medium">{{ errorMessage }}</p>
        <button
          @click="logsQuery.refetch()"
          class="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
        >
          Retry
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="logs.length === 0" class="rounded-xl bg-[#E8E8E8] py-10 text-center text-neutral-500">
        No activity logs found.
      </div>

      <!-- Data rows -->
      <template v-else>
        <div
          v-for="log in logs"
          :key="`log-${log.no}`"
          class="grid grid-cols-12 items-center text-sm sm:text-base xl:text-lg rounded-xl bg-white px-3 py-4 mt-2"
        >
          <!-- No -->
          <div class="col-span-1 text-center font-semibold text-neutral-500">
            {{ log.no }}
          </div>
          <!-- Role -->
          <div class="col-span-2 text-center font-semibold text-neutral-600">
            {{ log.role }}
          </div>
          <!-- Time -->
          <div class="col-span-2 text-center font-semibold text-neutral-600">
            {{ log.time }}
          </div>
          <!-- Message Doctor Review -->
          <div class="col-span-4 text-center truncate" :class="getMessageStyle(log.message)" :title="log.message">
            {{ log.message || '-' }}
          </div>
          <!-- Date -->
          <div class="col-span-3 text-center text-sm font-medium text-neutral-500 truncate">
            {{ log.date || '-' }}
          </div>
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div class="shrink-0 pt-2">
      <Pagination
        v-if="!isLoading && !errorMessage"
        :current-page="currentPage"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :page-size="itemsPerPage"
        @update:page="handlePageChange"
        @update:limit="handleItemsPerPageChange"
      />
    </div>

  </section>
</template>
