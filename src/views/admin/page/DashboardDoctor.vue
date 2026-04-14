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
// ICONS
import DoctorIcon from "@/assets/admin/doctor.png";
import EditIcon from "@/assets/admin/edit.png";
import DeleteIcon from "@/assets/admin/delete.png";


const toast = useToast();

const heads = ["ID", "Name", "Email", "Status", "Actions"];

const doctorList = ref([]);
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
  errorMessage.value = "";
  try {
    const doctors = await dataService.getDoctors();
    doctorList.value = doctors;
  } catch (error) {
    console.error("Error fetching data:", error);
    doctorList.value = [];
    errorMessage.value = "Failed to load data. Please try again.";
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
      String(d.name || "").toLowerCase().includes(lowerQuery) ||
      String(d.email || "").toLowerCase().includes(lowerQuery) ||
      String(d.id || "").toLowerCase().includes(lowerQuery),
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
  <section class="w-full">
    <div>
      <!-- Header -->
      <div class="mb-5 flex flex-col sm:flex-row items-center justify-between lg:justify-end gap-4 sm:gap-6">
        <SearchInput
          v-model="searchQuery"
          :disabled="isLoading || !!errorMessage"
          placeholder="Search by ID or Name"
          wrapperClass="max-w-none"
        />
        <button
          @click="openAddModal"
          class="w-full sm:w-fit cursor-pointer whitespace-nowrap rounded-xl bg-[#0D99FF] px-6 py-2.5 text-lg sm:text-xl font-semibold text-white transition-colors hover:bg-[#058ee3]"
        >
          Add Doctor
        </button>
      </div>
      <!-- Table Header -->
      <div
        class="grid grid-cols-6 px-3 py-2 text-lg font-semibold text-neutral-600"
      >
        <div class="col-span-1"></div>
        <div class="col-span-1">{{ heads[0] }}</div>
        <div class="col-span-1">{{ heads[1] }}</div>
        <div class="col-span-1">{{ heads[2] }}</div>
        <div class="col-span-1">{{ heads[3] }}</div>
        <div class="col-span-1 text-center">{{ heads[4] }}</div>
      </div>
      <!-- Table Data -->
      <div class="max-h-128 space-y-2 overflow-y-auto pr-1">
        <!-- If loading -->
        <div v-if="isLoading" class="flex justify-center py-12">
          <Loading text="Loading doctor data..." />
        </div>
        <!-- If error -->
        <div v-else-if="errorMessage" class="mt-3 rounded-xl bg-red-50 py-8 text-center border-2 border-red-200 text-red-600">
          <p class="mb-4 font-medium">{{ errorMessage }}</p>
          <button
            @click="fetchDoctors"
            class="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Retry
          </button>
        </div>
        <!-- If no data -->
        <div
          v-else-if="filteredDoctors.length === 0"
          class="text-center py-8 text-gray-500"
        >
          No doctors found.
        </div>
        <!-- Else data row -->
        <template v-else>
          <div
            v-for="doctor in paginatedDoctors"
            :key="doctor.id"
            class="grid grid-cols-6 items-center rounded-2xl bg-[#E8E8E8] px-3 py-3"
          >
            <div class="col-span-1 flex items-center justify-center">
              <img :src="DoctorIcon" alt="Doctor" class="h-10 w-10 object-contain" />
            </div>
            <div class="col-span-1 text-2xl font-semibold text-neutral-600">
              D{{ String(doctor.id || "").padStart(3, "0") }}
            </div>
            <div class="col-span-1 overflow-hidden text-2xl font-semibold text-neutral-600">
              <div class="truncate" :title="doctor.name">
                {{ doctor.name }}
              </div>
            </div>
            <div class="col-span-1 overflow-hidden text-xl font-semibold text-neutral-600">
              <div class="truncate" :title="doctor.email">
                {{ doctor.email }}
              </div>
            </div>
            <div class="col-span-1 text-2xl font-semibold text-[#2BC11F]">
              {{ doctor.status || "Active" }}
            </div>
            <div class="col-span-1 flex items-center justify-center">
              <div class="flex gap-2">
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
        </template>
      </div>
      <!-- Pagination -->
      <Pagination
        v-if="!isLoading && !errorMessage"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
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
