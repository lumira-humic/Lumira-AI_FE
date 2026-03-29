<script setup>
import { ref, onMounted, computed } from "vue";

import { dataService } from "@/services/dataService.js";
import { useToast } from "@/composables/useToast";
import Loading from "@/components/common/Loading.vue";
import ModalAddDoctor from "../components/ModalAddDoctor.vue";
import ModalEditDoctor from "../components/ModalEditDoctor.vue";
import ModalDeleteDoctor from "../components/ModalDeleteDoctor.vue";
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


const toast = useToast();

const heads = ["ID", "Name", "Email", "Status", "Actions"];

const doctorList = ref([]);
const stats = ref([]);
const searchQuery = ref("");
const isAddModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedDoctor = ref(null);
const isLoading = ref(true);
const errorMessage = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;


const fetchDoctors = async () => {
  isLoading.value = true;
  try {
    const [doctors, statsData] = await Promise.all([
      dataService.getDoctors(),
      dataService.getDashboardStats(),
    ]);
    doctorList.value = doctors;
    stats.value = statsData;
  } catch (error) {
    console.error("Error fetching data:", error);
    errorMessage.value = "Failed to load data.";
    toast.error("Failed to load data");
  } finally {
    isLoading.value = false;
  }
};

const filteredDoctors = computed(() => {
  if (!searchQuery.value) return doctorList.value;
  const lowerQuery = searchQuery.value.toLowerCase();
  return doctorList.value.filter(
    (d) =>
      d.name.toLowerCase().includes(lowerQuery) ||
      d.email.toLowerCase().includes(lowerQuery) ||
      d.id.toString().includes(lowerQuery),
  );
});

const paginatedDoctors = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredDoctors.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredDoctors.value.length / itemsPerPage);
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
  fetchDoctors();
});

const openAddModal = () => {
  isAddModalOpen.value = true;
};

const openEditModal = (doctor) => {
  selectedDoctor.value = doctor;
  isEditModalOpen.value = true;
};

const openDeleteModal = (doctor) => {
  selectedDoctor.value = doctor;
  isDeleteModalOpen.value = true;
};

const handleAddDoctor = async (newDoctor) => {
  try {
    await dataService.addDoctor(newDoctor);
    await fetchDoctors();
    isAddModalOpen.value = false;
    toast.success("Doctor added successfully");
  } catch (error) {
    console.error("Failed to add doctor:", error);
    toast.error("Failed to add doctor");
  }
};

const handleEditDoctor = async (updatedDoctor) => {
  try {
    await dataService.updateDoctor(selectedDoctor.value.id, updatedDoctor);
    await fetchDoctors();
    isEditModalOpen.value = false;
    selectedDoctor.value = null;
    toast.success("Doctor updated successfully");
  } catch (error) {
    console.error("Failed to update doctor:", error);
    toast.error("Failed to update doctor");
  }
};

const handleDeleteDoctor = async () => {
  try {
    await dataService.deleteDoctor(selectedDoctor.value.id);
    doctorList.value = doctorList.value.filter(
      (d) => d.id !== selectedDoctor.value.id,
    );
    isDeleteModalOpen.value = false;
    selectedDoctor.value = null;
    toast.success("Doctor deleted successfully");
  } catch (error) {
    console.error("Failed to delete doctor:", error);
    toast.error("Failed to delete doctor");
  }
};
</script>

<template>
  <div class="p-6">
    <div class="text-center mb-8">
      <h2 class="text-gray-500 font-medium text-lg">
        Leading-edge technology for better diagnosis
      </h2>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loading text="Loading doctors..." />
    </div>
    <div v-else-if="errorMessage" class="text-center py-8 text-red-500">
      {{ errorMessage }}
    </div>

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

      <div class="w-full flex justify-between items-center">
        <h1 class="text-2xl font-bold">Doctors Management</h1>
        <div class="flex gap-4 items-center">
          <SearchInput v-model="searchQuery" placeholder="Search doctor..." />
          <button
            @click="openAddModal"
            class="whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-[12px] font-medium transition-colors"
          >
            Add Doctor
          </button>
        </div>
      </div>
      <!-- Table Header -->
      <div
        class="w-full flex p-3 bg-white border rounded-[12px] text-gray-500 font-medium mb-2 mt-4"
      >
        <div
          v-for="head in heads"
          :key="head"
          class="flex-1 h-10 flex items-center justify-center"
        >
          {{ head }}
        </div>
      </div>
      <!-- Table Content (Using Paginated Data from Local Logic) -->
      <div
        class="w-full flex p-3 my-3 bg-gray-100 items-center rounded-[12px]"
        v-for="doctor in paginatedDoctors"
        :key="doctor.id"
      >
        <div class="flex-1 h-10 flex items-center justify-center">
          <div>{{ doctor.id }}</div>
        </div>
        <div
          class="flex-1 h-10 flex items-center justify-center overflow-hidden"
        >
          <div class="truncate max-w-[150px]" :title="doctor.name">
            {{ doctor.name }}
          </div>
        </div>
        <div
          class="flex-1 h-10 flex items-center justify-center overflow-hidden"
        >
          <div class="truncate max-w-[200px]" :title="doctor.email">
            {{ doctor.email }}
          </div>
        </div>
        <div
          class="flex-1 h-10 flex items-center text-green-500 justify-center font-semibold"
        >
          <div>{{ doctor.status }}</div>
        </div>
        <div class="flex-1 h-10 flex items-center justify-center">
          <div class="gap-2 flex">
            <!-- New Icon Buttons (Incoming UI) -->
            <button
              @click="openEditModal(doctor)"
              class="p-2 transition-transform hover:scale-110"
            >
              <img :src="EditIcon" alt="Edit" class="w-8 h-8" />
            </button>
            <button
              @click="openDeleteModal(doctor)"
              class="p-2 transition-transform hover:scale-110"
            >
              <img :src="DeleteIcon" alt="Delete" class="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>

      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
    <Toast />

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
  </div>
</template>
