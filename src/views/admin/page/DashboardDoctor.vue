<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

import { dataService } from "@/services/dataService.js";
import { useToast } from "@/composables/useToast";
import Loading from "@/components/common/Loading.vue";
import ModalAddDoctor from "../components/ModalAddDoctor.vue";
import ModalEditDoctor from "../components/ModalEditDoctor.vue";
import ModalDeleteDoctor from "../components/ModalDeleteDoctor.vue";
import Pagination from "@/components/common/Pagination.vue";
import SearchInput from "@/components/common/SearchInput.vue";
// ICONS
import DoctorIcon from '@/assets/icons/icon-doctor.png';
import EditIcon from "@/assets/icons/admin/icon-edit.png";
import DeleteIcon from "@/assets/icons/admin/icon-delete.png";


const toast = useToast();
const queryClient = useQueryClient();

const heads = ["ID", "Name", "Email", "Status", "Actions"];

const searchQuery = ref("");
const debouncedSearch = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedDoctor = ref(null);

let searchDebounceTimer;

watch(searchQuery, (nextValue) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    debouncedSearch.value = String(nextValue || "").trim();
    currentPage.value = 1;
  }, 350);
});

onUnmounted(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
});

// ─── useQuery – fetch ALL doctors once, cache 20s ─────────────────────────────
const doctorsQuery = useQuery({
  queryKey: ["admin-dashboard-doctors"],
  queryFn: () => dataService.getDoctors(),
  placeholderData: (previousData) => previousData,
  staleTime: 1000 * 20,
  gcTime: 1000 * 60 * 10,
  retry: 1,
});

// ─── Derived state ─────────────────────────────────────────────────────────────
const allDoctors = computed(() =>
  Array.isArray(doctorsQuery.data.value) ? doctorsQuery.data.value : [],
);

const filteredDoctors = computed(() => {
  if (!debouncedSearch.value) return allDoctors.value;
  const q = debouncedSearch.value.toLowerCase();
  return allDoctors.value.filter(
    (d) =>
      String(d.name || "").toLowerCase().includes(q) ||
      String(d.email || "").toLowerCase().includes(q) ||
      String(d.id || "").toLowerCase().includes(q),
  );
});

const totalItems = computed(() => filteredDoctors.value.length);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / Math.max(1, itemsPerPage.value))),
);
const paginatedDoctors = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredDoctors.value.slice(start, start + itemsPerPage.value);
});

const isLoading = computed(
  () => doctorsQuery.isPending.value && !doctorsQuery.data.value,
);
const isRefreshing = computed(
  () => doctorsQuery.isFetching.value && !!doctorsQuery.data.value,
);
const errorMessage = computed(() =>
  doctorsQuery.isError.value ? "Failed to load data. Please try again." : "",
);

// ─── Helpers ───────────────────────────────────────────────────────────────────
const invalidateDoctors = () => {
  queryClient.invalidateQueries({ queryKey: ["admin-dashboard-doctors"] });
};

const handlePageChange = (page) => { currentPage.value = page; };
const handleItemsPerPageChange = (val) => {
  itemsPerPage.value = val;
  currentPage.value = 1;
};

// ─── Modal handlers ────────────────────────────────────────────────────────────
const openAddModal = () => { isAddModalOpen.value = true; };
const openEditModal = (doctor) => { selectedDoctor.value = doctor; isEditModalOpen.value = true; };
const openDeleteModal = (doctor) => { selectedDoctor.value = doctor; isDeleteModalOpen.value = true; };

const handleAddDoctor = async () => {
  try {
    isAddModalOpen.value = false;
    toast.success("Doctor added successfully");
    invalidateDoctors();
  } catch (error) {
    console.error("Failed to finish add doctor sequence:", error);
  }
};

const handleEditDoctor = async (updatedDoctor) => {
  try {
    await dataService.updateDoctor(selectedDoctor.value.id, updatedDoctor);
    isEditModalOpen.value = false;
    selectedDoctor.value = null;
    toast.success("Doctor updated successfully");
    invalidateDoctors();
  } catch (error) {
    console.error("Failed to update doctor:", error);
    toast.error("Failed to update doctor");
  }
};

const handleDeleteDoctor = async () => {
  try {
    await dataService.deleteDoctor(selectedDoctor.value.id);
    isDeleteModalOpen.value = false;
    selectedDoctor.value = null;
    toast.success("Doctor deleted successfully");
    invalidateDoctors();
  } catch (error) {
    console.error("Failed to delete doctor:", error);
    toast.error("Failed to delete doctor");
  }
};
</script>

<template>
  <!-- h-full + flex-col: fill the parent RouterView container, stack vertically -->
  <section class="flex h-full min-h-0 flex-col w-full">

    <!-- Section Header: icon + title + count -->
    <div class="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-8 shrink-0">
      <div class="flex items-center gap-2 sm:gap-3">
        <span class="h-6 w-6 sm:h-11 sm:w-11">
          <img :src="DoctorIcon" alt="Doctor Management" class="h-6 w-6 object-contain sm:h-11 sm:w-11" />
        </span>
        <h1 class="text-base font-semibold text-neutral-900 sm:text-xl">Doctor Management</h1>
        <span class="text-base font-semibold text-neutral-700 sm:text-xl">{{ totalItems }}</span>
      </div>
      <div class="flex flex-1 min-w-0 items-center gap-3 sm:gap-4">
        <div class="flex-1 min-w-0">
          <SearchInput
            v-model="searchQuery"
            :disabled="isLoading || !!errorMessage"
            placeholder="Search by ID or Name"
            wrapperClass="max-w-none"
          />
        </div>
        <button
          @click="openAddModal"
          class="shrink-0 cursor-pointer whitespace-nowrap rounded-xl bg-[#0D99FF] px-5 py-2.5 text-base sm:text-lg font-semibold text-white transition-colors hover:bg-[#058ee3]"
        >
          Add Doctor
        </button>
      </div>
    </div>

    <!-- Refreshing indicator -->
    <p v-if="isRefreshing" class="mb-2 text-xs text-neutral-400 shrink-0">Refreshing…</p>

    <!-- Table Header -->
    <div class="grid grid-cols-6 pl-3 pr-8 py-2 text-base sm:text-lg xl:text-xl font-semibold text-neutral-900 shrink-0">
      <div class="col-span-1"></div>
      <div class="col-span-1">{{ heads[0] }}</div>
      <div class="col-span-1">{{ heads[1] }}</div>
      <div class="col-span-1">{{ heads[2] }}</div>
      <div class="col-span-1">{{ heads[3] }}</div>
      <div class="col-span-1 text-center">{{ heads[4] }}</div>
    </div>

    <!-- Table Body: flex-1 makes it fill remaining height, overflow-y-auto adds scrollbar -->
    <div class="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <Loading text="Loading doctor data..." />
      </div>
      <!-- Error -->
      <div v-else-if="errorMessage" class="mt-3 rounded-xl bg-red-50 py-8 text-center border-2 border-red-200 text-red-600">
        <p class="mb-4 font-medium">{{ errorMessage }}</p>
        <button
          @click="invalidateDoctors"
          class="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
        >
          Retry
        </button>
      </div>
      <!-- Empty -->
      <div v-else-if="filteredDoctors.length === 0" class="rounded-xl bg-[#E8E8E8] py-10 text-center text-neutral-500">
        No doctors found.
      </div>
      <!-- Data rows -->
      <template v-else>
        <div
          v-for="doctor in paginatedDoctors"
          :key="doctor.id"
          class="grid grid-cols-6 items-center text-sm sm:text-base xl:text-lg rounded-xl bg-white p-4 mt-2"
        >
          <div class="col-span-1 flex items-center sm:gap-4 xl:gap-8 pl-1 gap-2">
            <img :src="DoctorIcon" alt="Doctor" class="w-6 h-6 sm:h-10 sm:w-10 object-contain shrink-0" />
          </div>
          <div class="col-span-1 font-semibold text-neutral-600 truncate" :title="String(doctor.id)">
            {{ doctor.id }}
          </div>
          <div class="col-span-1 font-semibold text-neutral-600 overflow-hidden">
            <div class="truncate" :title="doctor.name">{{ doctor.name }}</div>
          </div>
          <div class="col-span-1 font-semibold text-neutral-600 overflow-hidden">
            <div class="truncate" :title="doctor.email">{{ doctor.email }}</div>
          </div>
          <div
            class="col-span-1 font-semibold"
            :class="doctor.status === 'Active' ? 'text-[#2BC11F]' : 'text-[#0099ff]'"
          >
            {{ doctor.status || "Active" }}
          </div>
          <div class="col-span-1 flex items-center justify-center">
            <div class="flex gap-1 sm:gap-2">
              <button
                @click="openEditModal(doctor)"
                class="cursor-pointer group relative p-2 transition-transform hover:scale-110"
              >
                <img :src="EditIcon" alt="Edit" class="w-6 h-6 sm:w-8 sm:h-8" />
                <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-10">
                  Edit
                </span>
              </button>
              <button
                @click="openDeleteModal(doctor)"
                class="cursor-pointer group relative p-2 transition-transform hover:scale-110"
              >
                <img :src="DeleteIcon" alt="Delete" class="w-6 h-6 sm:w-8 sm:h-8" />
                <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-10">
                  Delete
                </span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Pagination: stays at bottom, does not scroll -->
    <div class="shrink-0 pt-2">
      <Pagination
        v-if="!isLoading && !errorMessage"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="itemsPerPage"
        @update:page="handlePageChange"
        @update:limit="handleItemsPerPageChange"
      />
    </div>

    <ModalAddDoctor
      :isOpen="isAddModalOpen"
      @close="isAddModalOpen = false"
      @submit="handleAddDoctor"
    />
    <ModalEditDoctor
      :isOpen="isEditModalOpen"
      :doctor="selectedDoctor"
      @close="isEditModalOpen = false"
      @submit="handleEditDoctor"
    />
    <ModalDeleteDoctor
      :isOpen="isDeleteModalOpen"
      :doctor="selectedDoctor"
      @close="isDeleteModalOpen = false"
      @confirm="handleDeleteDoctor"
    />
  </section>
</template>
