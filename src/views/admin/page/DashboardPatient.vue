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
import InfoCard from "../components/InfoCard.vue";
// ICONS
import PatientIcon from "@/assets/admin/patient.png";
import DoctorIcon from "@/assets/admin/doctor.png";
import ImageIcon from "@/assets/admin/image.png";
import WaitingIcon from "@/assets/admin/waiting.png";
import EditIcon from "@/assets/admin/edit.png";
import DeleteIcon from "@/assets/admin/delete.png";


const patientList = ref([]);
const stats = ref([]);
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
  try {
    const [patients, statsData] = await Promise.all([
      dataService.getPatients(),
      dataService.getDashboardStats(),
    ]);
    patientList.value = patients;
    stats.value = statsData;
  } catch (error) {
    console.error("Error fetching data:", error);
    errorMessage.value = "Failed to load data.";
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
      p.name.toLowerCase().includes(lowerQuery) ||
      p.email.toLowerCase().includes(lowerQuery) ||
      p.id.toString().includes(lowerQuery) ||
      p.phone.includes(lowerQuery),
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
    const createdPatient = await dataService.addPatient(newPatient);

    if (newPatient.rawFile && createdPatient?.id) {
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
    await dataService.updatePatient(selectedPatient.value.id, updatedPatient);

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
  <div>
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="text-gray-500 font-medium text-lg">
        Leading-edge technology for better diagnosis
      </h2>
    </div>
    <!-- Loader and Error -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <Loading text="Loading patients..." />
    </div>
    <div v-else-if="errorMessage" class="text-center py-8 text-red-500">
      {{ errorMessage }}
    </div>
    <!-- Main Content -->
    <div v-if="!isLoading && !errorMessage">
      <!-- Info Cards (Incoming UI) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <InfoCard
          title="Total Patient"
          :value="stats[0]?.value || 0"
          :icon="PatientIcon"
          theme="blue"
        />
        <InfoCard
          title="Total Doctor"
          :value="stats[1]?.value || 0"
          :icon="DoctorIcon"
          theme="dark-blue"
        />
        <InfoCard
          title="Image Uploaded"
          :value="stats[2]?.value || 0"
          :icon="ImageIcon"
          theme="green"
        />
        <InfoCard
          title="Waiting For Review"
          :value="stats[3]?.value || 0"
          :icon="WaitingIcon"
          theme="red"
        />
      </div>
      <div class="w-full flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Patients Management</h1>
        <div class="flex gap-4 items-center">
          <SearchInput v-model="searchQuery" placeholder="Search patient..." />
          <button
            @click="openAddModal"
            class="whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-[12px] font-medium transition-colors"
          >
            Add Patient
          </button>
        </div>
      </div>
      <div
        class="w-full flex p-3 bg-white border rounded-[12px] text-gray-500 font-medium mb-2"
      >
        <div class="flex-[0.5] h-10 flex items-center justify-center">ID</div>
        <div class="flex-1 h-10 flex items-center justify-center">Name</div>
        <div class="flex-1 h-10 flex items-center justify-center">Email</div>
        <div class="flex-1 h-10 flex items-center justify-center">Phone</div>
        <div class="flex-1 h-10 flex items-center justify-center">Review</div>
        <div class="flex-1 h-10 flex items-center justify-center">Image</div>
        <div class="flex-1 h-10 flex items-center justify-center">Actions</div>
      </div>
      <div
        class="w-full flex p-3 my-3 bg-gray-100 items-center rounded-[12px]"
        v-for="patient in paginatedPatients"
        :key="patient.id"
      >
        <div class="flex-[0.5] h-10 flex items-center justify-center">
          <div>{{ patient.id }}</div>
        </div>
        <div
          class="flex-1 h-10 flex items-center justify-center overflow-hidden"
        >
          <div class="truncate max-w-[120px]" :title="patient.name">
            {{ patient.name }}
          </div>
        </div>
        <div
          class="flex-1 h-10 flex items-center justify-center overflow-hidden"
        >
          <div
            class="truncate max-w-[150px] text-sm text-gray-600"
            :title="patient.email"
          >
            {{ patient.email }}
          </div>
        </div>
        <div class="flex-1 h-10 flex items-center justify-center">
          <div>{{ patient.phone }}</div>
        </div>
        <div class="flex-1 h-10 flex items-center justify-center px-2">
          <span
            v-if="patient.review === 'VALIDATED'"
            class="bg-green-100 text-green-600 py-1 px-3 rounded-full text-xs font-bold border border-green-200"
          >
            Validated
          </span>
          <span
            v-else-if="patient.review === 'PENDING'"
            class="bg-yellow-100 text-yellow-600 py-1 px-3 rounded-full text-xs font-bold border border-yellow-200"
          >
            Pending
          </span>
          <span
            v-else-if="patient.review === 'REJECTED'"
            class="bg-red-100 text-red-600 py-1 px-3 rounded-full text-xs font-bold border border-red-200"
          >
            Rejected
          </span>
          <span v-else class="text-gray-400 font-bold"> - </span>
        </div>
        <div class="flex-1 h-10 flex items-center justify-center">
          <button
            @click="openUploadModal(patient)"
            v-if="!patient.image"
            class="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors border border-blue-200"
          >
            + Add Image
          </button>
          <button
            @click="openAIModal(patient)"
            v-else
            class="bg-green-50 text-green-600 hover:bg-green-100 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors border border-green-200"
          >
            See Image
          </button>
        </div>
        <div class="flex-1 h-10 flex items-center justify-center">
          <div class="gap-2 flex">
            <!-- New Icon Buttons (Incoming UI) -->
            <button
              @click="openEditModal(patient)"
              class="p-2 transition-transform hover:scale-110"
            >
              <img :src="EditIcon" alt="Edit" class="w-8 h-8" />
            </button>
            <button
              @click="openDeleteModal(patient)"
              class="p-2 transition-transform hover:scale-110"
            >
              <img :src="DeleteIcon" alt="Delete" class="w-8 h-8" />
            </button>
          </div>
        </div>
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
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>
