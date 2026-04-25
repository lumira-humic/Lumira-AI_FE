<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

import { dataService } from "@/services/dataService.js";
import { useToast } from "@/composables/useToast";
import Loading from "@/components/common/Loading.vue";
import ModalAddPatient from "../components/ModalAddPatient.vue";
import ModalEditPatient from "../components/ModalEditPatient.vue";
import ModalDeletePatient from "../components/ModalDeletePatient.vue";
import ModalAIAnalysis from "../components/ModalAIAnalysis.vue";
import ModalUploadImage from "../components/ModalUploadImage.vue";
import ModalAnalyzing from "../components/ModalAnalyzing.vue";
import Pagination from "@/components/common/Pagination.vue";
import SearchInput from "@/components/common/SearchInput.vue";
// ICONS
import PatientIcon from "@/assets/admin/patient.png";
import EditIcon from "@/assets/admin/edit.png";
import DeleteIcon from "@/assets/admin/delete.png";


const toast = useToast();
const queryClient = useQueryClient();

const searchQuery = ref("");
const debouncedSearch = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);

const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isAIModalOpen = ref(false);
const isUploadModalOpen = ref(false);
const isAnalyzing = ref(false);
const selectedPatient = ref(null);

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

// ─── useQuery – fetch ALL patients once, cache 20s ────────────────────────────
const patientsQuery = useQuery({
  queryKey: ["admin-dashboard-patients"],
  queryFn: () => dataService.getPatients({ limit: 100 }),
  placeholderData: (previousData) => previousData,
  staleTime: 1000 * 20,
  gcTime: 1000 * 60 * 10,
  retry: 1,
});

// ─── Derived state ─────────────────────────────────────────────────────────────
const allPatients = computed(() =>
  Array.isArray(patientsQuery.data.value) ? patientsQuery.data.value : [],
);

const filteredPatients = computed(() => {
  if (!debouncedSearch.value) return allPatients.value;
  const q = debouncedSearch.value.toLowerCase();
  return allPatients.value.filter(
    (p) =>
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.email || "").toLowerCase().includes(q) ||
      String(p.id || "").toLowerCase().includes(q) ||
      String(p.phone || "").toLowerCase().includes(q),
  );
});

const totalItems = computed(() => filteredPatients.value.length);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / Math.max(1, itemsPerPage.value))),
);
const paginatedPatients = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredPatients.value.slice(start, start + itemsPerPage.value);
});

const isLoading = computed(
  () => patientsQuery.isPending.value && !patientsQuery.data.value,
);
const isRefreshing = computed(
  () => patientsQuery.isFetching.value && !!patientsQuery.data.value,
);
const errorMessage = computed(() =>
  patientsQuery.isError.value ? "Failed to load data. Please try again." : "",
);

// ─── Helpers ───────────────────────────────────────────────────────────────────
const invalidatePatients = () => {
  queryClient.invalidateQueries({ queryKey: ["admin-dashboard-patients"] });
};
const refetchPatients = async () => patientsQuery.refetch();

const handlePageChange = (page) => { currentPage.value = page; };
const handleItemsPerPageChange = (val) => {
  itemsPerPage.value = val;
  currentPage.value = 1;
};

// ─── Modal openers ─────────────────────────────────────────────────────────────
const openAddModal = () => { isAddModalOpen.value = true; };
const openEditModal = (patient) => { selectedPatient.value = patient; isEditModalOpen.value = true; };
const openDeleteModal = (patient) => { selectedPatient.value = patient; isDeleteModalOpen.value = true; };
const openAIModal = (patient) => { selectedPatient.value = patient; isAIModalOpen.value = true; };
const openUploadModal = (patient) => { selectedPatient.value = patient; isUploadModalOpen.value = true; };

// ─── Mutation handlers ─────────────────────────────────────────────────────────
const handleAddPatient = async (newPatient) => {
  try {
    if (newPatient.rawFile && newPatient.id) {
      isAddModalOpen.value = false;
      isAnalyzing.value = true;
      await dataService.uploadMedicalRecord(newPatient.id, newPatient.rawFile);
      await refetchPatients();
      const freshPatient = allPatients.value.find((p) => p.id === newPatient.id);
      if (freshPatient) { selectedPatient.value = freshPatient; isAIModalOpen.value = true; }
      toast.success("Patient added & Image Analyzed!");
    } else {
      isAddModalOpen.value = false;
      toast.success("Patient added successfully");
      invalidatePatients();
    }
  } catch (error) {
    console.error("Failed to add patient:", error);
    toast.error("Failed to add patient");
  } finally {
    isAnalyzing.value = false;
  }
};

const handleEditPatient = async (updatedPatient) => {
  try {
    if (updatedPatient.rawFile) {
      isEditModalOpen.value = false;
      isAnalyzing.value = true;
      await dataService.uploadMedicalRecord(selectedPatient.value.id, updatedPatient.rawFile);
      await refetchPatients();
      const freshPatient = allPatients.value.find((p) => p.id === selectedPatient.value.id);
      if (freshPatient) { selectedPatient.value = freshPatient; isAIModalOpen.value = true; }
      toast.success("Patient updated & Image Analyzed!");
    } else {
      isEditModalOpen.value = false;
      selectedPatient.value = null;
      toast.success("Patient updated successfully");
      invalidatePatients();
    }
  } catch (error) {
    console.error("Failed to update patient:", error);
    toast.error("Failed to update patient");
  } finally {
    isAnalyzing.value = false;
  }
};

const handleUploadImage = async (file) => {
  const currentId = selectedPatient.value.id;
  isUploadModalOpen.value = false;
  isAnalyzing.value = true;
  try {
    await dataService.uploadMedicalRecord(currentId, file);
    await refetchPatients();
    const freshPatient = allPatients.value.find((p) => p.id === currentId);
    if (freshPatient) { selectedPatient.value = freshPatient; isAIModalOpen.value = true; }
    else { selectedPatient.value = null; }
    toast.success("Image uploaded & Analysis complete!");
  } catch (error) {
    console.error("Failed to upload image:", error);
    toast.error(`Upload failed: ${error.message || error.error_description || "Unknown error"}`);
    selectedPatient.value = null;
  } finally {
    isAnalyzing.value = false;
  }
};

const handleDeletePatient = async () => {
  try {
    await dataService.deletePatient(selectedPatient.value.id);
    isDeleteModalOpen.value = false;
    selectedPatient.value = null;
    toast.success("Patient deleted successfully");
    invalidatePatients();
  } catch (error) {
    console.error("Failed to delete patient:", error);
    toast.error("Failed to delete patient");
  }
};

const handleReAnalysis = async () => {
  if (!selectedPatient.value) return;
  const currentId = selectedPatient.value.id;
  isAIModalOpen.value = false;
  isAnalyzing.value = true;
  try {
    await dataService.reAnalyzePatient(currentId);
    await refetchPatients();
    const freshPatient = allPatients.value.find((p) => p.id === currentId);
    if (freshPatient) { selectedPatient.value = freshPatient; isAIModalOpen.value = true; }
    toast.success("Re-Analysis Complete!");
  } catch (error) {
    console.error("Re-analysis failed:", error);
    toast.error("Re-analysis failed.");
    selectedPatient.value = null;
  } finally {
    isAnalyzing.value = false;
  }
};
</script>

<template>
  <!-- h-full + flex-col: fill the parent RouterView container, stack vertically -->
  <section class="flex h-full min-h-0 flex-col w-full">

    <!-- Header: search + add button -->
    <div class="mb-4 flex flex-col sm:flex-row items-center justify-between lg:justify-end gap-3 sm:gap-6 shrink-0">
      <SearchInput
        v-model="searchQuery"
        :disabled="isLoading || !!errorMessage"
        placeholder="Search by ID or Name"
        wrapperClass="max-w-none"
      />
      <button
        @click="openAddModal"
        class="w-full sm:w-fit cursor-pointer whitespace-nowrap rounded-xl bg-[#0D99FF] px-6 py-2.5 text-base sm:text-xl font-semibold text-white transition-colors hover:bg-[#058ee3]"
      >
        Add Patient
      </button>
    </div>

    <!-- Refreshing indicator -->
    <p v-if="isRefreshing" class="mb-2 text-xs text-neutral-400 shrink-0">Refreshing…</p>

    <!-- Table Header -->
    <div class="grid grid-cols-7 pl-3 pr-8 py-2 text-base sm:text-lg xl:text-xl font-semibold text-neutral-900 shrink-0">
      <div class="col-span-1"></div>
      <div class="col-span-1">ID</div>
      <div class="col-span-1">Name</div>
      <div class="col-span-1">Phone</div>
      <div class="col-span-1 text-center">Image</div>
      <div class="col-span-1 text-center">Review</div>
      <div class="col-span-1 text-center">Action</div>
    </div>

    <!-- Table Body: flex-1 fills remaining height, overflow-y-auto scrolls -->
    <div class="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
      <!-- Loading -->
      <div v-if="isLoading" class="py-12">
        <Loading text="Loading patients..." />
      </div>
      <!-- Error -->
      <div v-else-if="errorMessage" class="mt-3 rounded-xl bg-red-50 py-8 text-center border-2 border-red-200 text-red-600">
        <p class="mb-4 font-medium">{{ errorMessage }}</p>
        <button
          @click="invalidatePatients"
          class="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
        >
          Retry
        </button>
      </div>
      <!-- Empty -->
      <div v-else-if="filteredPatients.length === 0" class="rounded-xl bg-[#E8E8E8] py-10 text-center text-neutral-500">
        No patients found.
      </div>
      <!-- Data rows -->
      <template v-else>
        <div
          v-for="patient in paginatedPatients"
          :key="patient.id"
          class="grid grid-cols-7 items-center text-sm sm:text-base xl:text-lg rounded-xl bg-white p-4 mt-2"
        >
          <div class="col-span-1 flex items-center sm:gap-4 xl:gap-8 pl-1 gap-2">
            <img :src="PatientIcon" alt="Patient" class="w-6 h-6 sm:h-10 sm:w-10 object-contain shrink-0" />
          </div>
          <div class="col-span-1 font-semibold text-neutral-600 truncate" :title="String(patient.id)">
            {{ patient.id }}
          </div>
          <div class="col-span-1 font-semibold text-neutral-600 overflow-hidden">
            <div class="truncate" :title="patient.name">{{ patient.name }}</div>
          </div>
          <div class="col-span-1 font-semibold text-neutral-600 truncate">{{ patient.phone || "-" }}</div>
          <div class="col-span-1 text-center font-semibold">
            <span v-if="patient.image" class="text-[#2BC11F]">Yes</span>
            <span v-else class="text-red-500">No</span>
          </div>
          <div class="col-span-1 text-center font-semibold">
            <span v-if="patient.review === 'VALIDATED' || patient.review === 'Done'" class="text-[#2BC11F]">Done</span>
            <span v-else-if="patient.review === 'PENDING' || patient.review === 'Not Yet'" class="text-[#0F79B7]">Not Yet</span>
            <span v-else-if="patient.review === 'REJECTED'" class="text-red-500">Rejected</span>
            <span v-else class="text-neutral-400">-</span>
          </div>
          <div class="col-span-1 flex items-center justify-center">
            <div class="flex gap-1 sm:gap-2">
              <button
                @click="openEditModal(patient)"
                class="cursor-pointer group relative p-2 transition-transform hover:scale-110"
              >
                <img :src="EditIcon" alt="Edit" class="w-6 h-6 sm:w-8 sm:h-8" />
                <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-10">
                  Edit
                </span>
              </button>
              <button
                @click="openDeleteModal(patient)"
                class="cursor-pointer group relative p-2 transition-transform hover:scale-110"
              >
                <img :src="DeleteIcon" alt="Delete" class="w-6 h-6 sm:w-8 sm:h-8" />
                <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-10">
                  Delete
                </span>
              </button>
              <button
                v-if="patient.image"
                @click="openAIModal(patient)"
                class="rounded-lg bg-green-50 px-2 sm:px-3 py-2 text-xs font-semibold text-green-600 border border-green-200"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Pagination: pinned to bottom -->
    <div class="shrink-0 pt-2">
      <Pagination
        v-if="!isLoading && !errorMessage"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :items-per-page="itemsPerPage"
        @page-change="handlePageChange"
        @update:itemsPerPage="handleItemsPerPageChange"
      />
    </div>

    <!-- Modals -->
    <ModalAddPatient :isOpen="isAddModalOpen" @close="isAddModalOpen = false" @submit="handleAddPatient" />
    <ModalEditPatient :isOpen="isEditModalOpen" :patient="selectedPatient" @close="isEditModalOpen = false" @submit="handleEditPatient" />
    <ModalDeletePatient :isOpen="isDeleteModalOpen" :patient="selectedPatient" @close="isDeleteModalOpen = false" @confirm="handleDeletePatient" />
    <ModalAIAnalysis :isOpen="isAIModalOpen" :patient="selectedPatient" @close="isAIModalOpen = false" @reanalyze="handleReAnalysis" />
    <ModalUploadImage :isOpen="isUploadModalOpen" :patient="selectedPatient" @close="isUploadModalOpen = false" @submit="handleUploadImage" />
    <ModalAnalyzing :isOpen="isAnalyzing" />
  </section>
</template>
