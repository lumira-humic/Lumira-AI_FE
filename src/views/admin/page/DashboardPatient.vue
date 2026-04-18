<script setup>
import { ref, onMounted, computed } from "vue";

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


const patientList = ref([]);
const searchQuery = ref("");
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isAIModalOpen = ref(false);
const isUploadModalOpen = ref(false);
const isAnalyzing = ref(false);
const selectedPatient = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");

const currentPage = ref(1);
const itemsPerPage = 10;

const toast = useToast();

const fetchPatients = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const patients = await dataService.getPatients({ limit: 100 });
    patientList.value = patients.map((p, idx) => ({ ...p, pseudoId: `P${idx + 1}` }));
  } catch (error) {
    console.error("Error fetching data:", error);
    patientList.value = [];
    errorMessage.value = "Failed to load data. Please try again.";
    toast.error("Failed to load data");
  } finally {
    isLoading.value = false;
  }
};

const filteredPatients = computed(() => {
  if (!searchQuery.value) return patientList.value;
  const lowerQuery = searchQuery.value.toLowerCase();
  return patientList.value.filter(
    (p) =>
      String(p.name || "").toLowerCase().includes(lowerQuery) ||
      String(p.email || "").toLowerCase().includes(lowerQuery) ||
      String(p.pseudoId || "").toLowerCase().includes(lowerQuery) ||
      String(p.phone || "").toLowerCase().includes(lowerQuery),
  );
});

const paginatedPatients = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredPatients.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredPatients.value.length / itemsPerPage);
});

// Reset page when search changes
import { watch } from "vue";
watch(searchQuery, () => {
  currentPage.value = 1;
});

const handlePageChange = (page) => {
  currentPage.value = page;
};

onMounted(() => {
  fetchPatients();
});

const openAddModal = () => {
  isAddModalOpen.value = true;
};

const openEditModal = (patient) => {
  selectedPatient.value = patient;
  isEditModalOpen.value = true;
};

const openDeleteModal = (patient) => {
  selectedPatient.value = patient;
  isDeleteModalOpen.value = true;
};

const openAIModal = (patient) => {
  selectedPatient.value = patient;
  isAIModalOpen.value = true;
};

const openUploadModal = (patient) => {
  selectedPatient.value = patient;
  isUploadModalOpen.value = true;
};

const handleAddPatient = async (newPatient) => {
  try {
    if (newPatient.rawFile && newPatient.id) {
      isAddModalOpen.value = false;
      isAnalyzing.value = true;

      await dataService.uploadMedicalRecord(
        createdPatient.id,
        newPatient.rawFile,
      );
      await fetchPatients();

      const freshPatient = patientList.value.find(
        (p) => p.id === createdPatient.id,
      );
      if (freshPatient) {
        selectedPatient.value = freshPatient;
        isAIModalOpen.value = true;
      }

      toast.success("Patient added & Image Analyzed!");
    } else {
      await fetchPatients();
      isAddModalOpen.value = false;
      toast.success("Patient added successfully");
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

      await dataService.uploadMedicalRecord(
        selectedPatient.value.id,
        updatedPatient.rawFile,
      );

      await fetchPatients();

      const freshPatient = patientList.value.find(
        (p) => p.id === selectedPatient.value.id,
      );
      if (freshPatient) {
        selectedPatient.value = freshPatient;
        isAIModalOpen.value = true;
      }

      toast.success("Patient updated & Image Analyzed!");
    } else {
      isEditModalOpen.value = false;
      selectedPatient.value = null;
      await fetchPatients();
      toast.success("Patient updated successfully");
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
    await fetchPatients();

    const freshPatient = patientList.value.find((p) => p.id === currentId);
    if (freshPatient) {
      selectedPatient.value = freshPatient;
      isAIModalOpen.value = true;
    } else {
      selectedPatient.value = null;
    }

    toast.success("Image uploaded & Analysis complete!");
  } catch (error) {
    console.error("Failed to upload image:", error);
    toast.error(
      `Upload failed: ${
        error.message || error.error_description || "Unknown error"
      }`,
    );
    selectedPatient.value = null;
  } finally {
    isAnalyzing.value = false;
  }
};

const handleDeletePatient = async () => {
  try {
    await dataService.deletePatient(selectedPatient.value.id);
    await fetchPatients();
    isDeleteModalOpen.value = false;
    selectedPatient.value = null;
    toast.success("Patient deleted successfully");
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
    await fetchPatients();

    const freshPatient = patientList.value.find((p) => p.id === currentId);
    if (freshPatient) {
      selectedPatient.value = freshPatient;
      isAIModalOpen.value = true;
    }

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
  <section class="w-full">
    <div>
      <!-- Header -->
      <div class="mb-5 flex flex-col sm:flex-row items-center justify-between lg:justify-end gap-3 sm:gap-6">
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
      <!-- Table Header -->
      <div
        class="grid grid-cols-7 px-3 py-2 text-lg font-semibold text-neutral-600"
      >
        <div class="col-span-1"></div>
        <div class="col-span-1">ID</div>
        <div class="col-span-1">Name</div>
        <div class="col-span-1">Phone</div>
        <div class="col-span-1 text-center">Image</div>
        <div class="col-span-1 text-center">Review</div>
        <div class="col-span-1 text-center">Action</div>
      </div>
      <!-- Table Data -->
      <div class="max-h-128 space-y-2 overflow-y-auto pr-1">
        <!-- If loading -->
        <div v-if="isLoading" class="py-12">
          <Loading text="Loading patients..." />
        </div>
        <!-- If error -->
        <div v-else-if="errorMessage" class="mt-3 rounded-xl bg-red-50 py-8 text-center border-2 border-red-200 text-red-600">
          <p class="mb-4 font-medium">{{ errorMessage }}</p>
          <button
            @click="fetchPatients"
            class="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Retry
          </button>
        </div>
        <!-- If no data -->
        <div
          v-else-if="filteredPatients.length === 0"
          class="rounded-xl bg-[#E8E8E8] py-10 text-center text-neutral-500"
        >
          No patients found.
        </div>
        <!-- Else data row -->
        <template v-else>
          <div
            v-for="patient in paginatedPatients"
            :key="patient.id"
            class="grid grid-cols-7 items-center rounded-2xl bg-[#E8E8E8] px-3 py-3"
          >
            <div class="col-span-1 flex items-center justify-center">
              <img :src="PatientIcon" alt="Patient" class="h-10 w-10 object-contain" />
            </div>
            <div class="col-span-1 text-[15px] xl:text-[17px] font-semibold text-neutral-600">
              {{ patient.pseudoId }}
            </div>
            <div class="col-span-1 overflow-hidden text-[15px] xl:text-[17px] font-semibold text-neutral-600">
              <div class="truncate" :title="patient.name">
                {{ patient.name }}
              </div>
            </div>
            <div class="col-span-1 text-[15px] xl:text-[17px] font-semibold text-neutral-600 truncate">{{ patient.phone || "-" }}</div>
            <div class="col-span-1 text-center">
              <span v-if="patient.image" class="text-[15px] xl:text-[17px] font-semibold text-[#2BC11F]">Yes</span>
              <span v-else class="text-[15px] xl:text-[17px] font-semibold text-red-500">No</span>
            </div>
            <div class="col-span-1 text-center">
              <span
                v-if="patient.review === 'VALIDATED' || patient.review === 'Done'"
                class="text-[15px] xl:text-[17px] font-semibold text-[#2BC11F]"
              >
                Done
              </span>
              <span
                v-else-if="patient.review === 'PENDING' || patient.review === 'Not Yet'"
                class="text-[15px] xl:text-[17px] font-semibold text-[#0F79B7]"
              >
                Not Yet
              </span>
              <span
                v-else-if="patient.review === 'REJECTED'"
                class="text-[15px] xl:text-[17px] font-semibold text-red-500"
              >
                Rejected
              </span>
              <span v-else class="text-[15px] xl:text-[17px] font-semibold text-neutral-400">-</span>
            </div>
            <div class="col-span-1 flex items-center justify-center">
              <div class="flex gap-2">
                <button
                  @click="openEditModal(patient)"
                  class="cursor-pointer group relative p-2 transition-transform hover:scale-110"
                >
                  <img :src="EditIcon" alt="Edit" class="w-8 h-8" />
                  <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-10">
                    Edit
                  </span>
                </button>
                <button
                  @click="openDeleteModal(patient)"
                  class="cursor-pointer group relative p-2 transition-transform hover:scale-110"
                >
                  <img :src="DeleteIcon" alt="Delete" class="w-8 h-8" />
                  <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-10">
                    Delete
                  </span>
                </button>
                <button
                  v-if="patient.image"
                  @click="openAIModal(patient)"
                  class="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-600 border border-green-200"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
      <!-- Modal Components -->
      <ModalAddPatient
        :isOpen="isAddModalOpen"
        @close="isAddModalOpen = false"
        @submit="handleAddPatient"
      />
      <ModalEditPatient
        :isOpen="isEditModalOpen"
        :patient="selectedPatient"
        @close="isEditModalOpen = false"
        @submit="handleEditPatient"
      />
      <ModalDeletePatient
        :isOpen="isDeleteModalOpen"
        :patient="selectedPatient"
        @close="isDeleteModalOpen = false"
        @confirm="handleDeletePatient"
      />
      <ModalAIAnalysis
        :isOpen="isAIModalOpen"
        :patient="selectedPatient"
        @close="isAIModalOpen = false"
        @reanalyze="handleReAnalysis"
      />
      <ModalUploadImage
        :isOpen="isUploadModalOpen"
        :patient="selectedPatient"
        @close="isUploadModalOpen = false"
        @submit="handleUploadImage"
      />
      <ModalAnalyzing :isOpen="isAnalyzing" />
      <!-- Pagination -->
      <Pagination
        v-if="!isLoading && !errorMessage"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </section>
</template>
