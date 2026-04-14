<script setup>
import { computed, onMounted, ref } from 'vue'

import { dataService } from '@/services/dataService.js'
import SearchInput from '@/components/common/SearchInput.vue'
import Loading from '@/components/common/Loading.vue'
import DoctorIcon from '@/assets/admin/doctor.png'


const isLoading = ref(true)
const searchQuery = ref('')
const doctorActivities = ref([])
const errorMessage = ref('')

const fetchDashboardData = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const doctors = await dataService.getDoctors()
    doctorActivities.value = doctors
  } catch (error) {
    console.error('Failed to fetch dashboard activity:', error)
    doctorActivities.value = []
    errorMessage.value = 'Failed to load activity data. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const filteredActivities = computed(() => {
  if (!searchQuery.value) {
    return doctorActivities.value
  }

  const query = searchQuery.value.toLowerCase()
  return doctorActivities.value.filter((doctor) => {
    return (
      String(doctor.id || '').toLowerCase().includes(query) ||
      String(doctor.name || '').toLowerCase().includes(query) ||
      String(doctor.email || '').toLowerCase().includes(query)
    )
  })
})

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <section class="w-full">
    <!-- Header -->
    <div class="mb-5 flex items-center justify-between lg:justify-end">
      <SearchInput
        v-model="searchQuery"
        :disabled="isLoading || !!errorMessage"
        placeholder="Search by ID or Name"
        wrapperClass="max-w-none"
      />
    </div>
    <!-- Table Header -->
    <div class="grid grid-cols-6 px-3 py-2 text-lg font-semibold text-neutral-600">
      <div class="col-span-1"></div>
      <div class="col-span-1">ID</div>
      <div class="col-span-1">Name</div>
      <div class="col-span-1">Email</div>
      <div class="col-span-1">Status</div>
      <div class="col-span-1 text-center">Action</div>
    </div>
    <!-- Table Data -->
    <div class="max-h-128 space-y-2 overflow-y-auto pr-1">
      <!-- If loading -->
      <div v-if="isLoading" class="py-12">
        <Loading text="Loading activity..." />
      </div>
      <!-- If error -->
      <div v-else-if="errorMessage" class="mt-3 rounded-xl bg-red-50 py-8 text-center border-2 border-red-200 text-red-600">
        <p class="mb-4 font-medium">{{ errorMessage }}</p>
        <button
          @click="fetchDashboardData"
          class="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
        >
          Retry
        </button>
      </div>
      <!-- If no data -->
      <div v-else-if="filteredActivities.length === 0" class="rounded-xl bg-[#E8E8E8] py-10 text-center text-neutral-500">
        No activity found.
      </div>
      <!-- Else data row -->
      <template v-else>
        <div
          v-for="doctor in filteredActivities"
          :key="doctor.id"
          class="grid grid-cols-6 items-center rounded-2xl bg-[#E8E8E8] px-3 py-3"
        >
          <div class="col-span-1 flex items-center justify-center">
            <img :src="DoctorIcon" alt="Doctor" class="h-10 w-10 object-contain" />
          </div>
          <div class="col-span-1 text-2xl font-semibold text-neutral-600">D{{ String(doctor.id || '').padStart(3, '0') }}</div>
          <div class="col-span-1 text-2xl font-semibold text-neutral-600">{{ doctor.name || '-' }}</div>
          <div class="col-span-1 text-xl font-semibold text-neutral-600">{{ doctor.email || '-' }}</div>
          <div class="col-span-1 text-2xl font-semibold text-[#2BC11F]">{{ doctor.status || 'Active' }}</div>
          <div class="col-span-1 text-center">
            <button class="rounded-full bg-[#00B8F5] px-6 py-2 text-xl font-semibold text-neutral-800">view</button>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
