<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

import { dataService } from "@/services/dataService.js";
import Loading from "@/components/common/Loading.vue";
import ModalReviewResult from "./components/ModalReviewResult.vue";
// ICONS
import PatientIcon from "@/assets/admin/patient.png"; // Fallback
import WaitingIcon from "@/assets/doctor/waiting-for-review.png";
import DoneIcon from "@/assets/doctor/done.png";
import AttentionIcon from "@/assets/doctor/need-attention.png";
import ImageStatsIcon from "@/assets/admin/image.png"; // Fallback


const router = useRouter();
const route = useRoute();
const currentFilter = ref("All");
const searchQuery = ref("");
const patients = ref([]);
const isLoading = ref(true);
const showReviewModal = ref(false);
const selectedPatient = ref(null);

watch(
  () => route.query.filter,
  (newFilter) => {
    if (newFilter) {
      currentFilter.value = newFilter;
    } else {
      currentFilter.value = "All";
    }
  },
  { immediate: true },
);

onMounted(async () => {
  try {
    isLoading.value = true;
    patients.value = await dataService.getPatients();
  } catch (error) {
    console.error("Failed to fetch patients:", error);
  } finally {
    isLoading.value = false;
  }
});

// Helper for Attention logic
const isAttentionCase = (p) => {
  const isPending =
    p.review === "PENDING" || p.review === "-" || p.review === "Not Yet";
  if (!isPending) return false;
  if (p.medical_records && p.medical_records.length > 0) {
    const latest = p.medical_records[p.medical_records.length - 1];
    if (latest && latest.ai_diagnosis) {
      const diag = JSON.stringify(latest.ai_diagnosis).toLowerCase();
      // "Malignant" usually implies attention needed if not validated yet?
      // Or maybe attention is needed if AI says Malignant but doctor hasn't reviewed
      return diag.includes("malignant");
    }
  }
  return false;
};

const stats = computed(() => {
  const total = patients.value.length;
  // Stats Calculation from client data
  const pendingCount = patients.value.filter(
    (p) => p.review === "PENDING" || p.review === "-" || p.review === "Not Yet",
  ).length;
  const doneCount = patients.value.filter(
    (p) => p.review === "VALIDATED" || p.review === "Done",
  ).length;
  const attentionCount = patients.value.filter(isAttentionCase).length;
  // Total Images (Patients with images)
  const totalImages = patients.value.filter((p) => p.image).length;

  return [
    {
      label: "Waiting For Review",
      value: pendingCount,
      icon: WaitingIcon,
    },
    {
      label: "Done",
      value: doneCount,
      icon: DoneIcon,
    },
    {
      label: "Total Images",
      value: totalImages,
      icon: ImageStatsIcon,
      isBlue: true,
    },
    {
      label: "Need Attention",
      value: attentionCount,
      icon: AttentionIcon,
    },
  ];
});

const filteredPatients = computed(() => {
  let result = patients.value;

  // 1. Text Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.id.toString().includes(q),
    );
  }

  // 2. Sidebar Filter
  const filter = currentFilter.value;
  if (filter === "All") return result;

  if (filter === "Not Yet") {
    return result.filter(
      (p) =>
        p.review === "PENDING" || p.review === "-" || p.review === "Not Yet",
    );
  }

  if (filter === "Done") {
    return result.filter(
      (p) => p.review === "VALIDATED" || p.review === "Done",
    );
  }

  if (filter === "Attention") {
    return result.filter(isAttentionCase);
  }

  return result;
});

// Presentation Helpers
const getAiAnalysisText = (p) => {
  // Return: Normal, Benign, Malignant
  if (p.medical_records && p.medical_records.length > 0) {
    const latest = p.medical_records[p.medical_records.length - 1];
    if (latest && latest.ai_diagnosis) {
      let d = "";
      try {
        const parsed =
          typeof latest.ai_diagnosis === "string"
            ? JSON.parse(latest.ai_diagnosis)
            : latest.ai_diagnosis;
        d = parsed.class || JSON.stringify(latest.ai_diagnosis);
      } catch (e) {
        d = String(latest.ai_diagnosis);
      }

      d = d.toLowerCase();
      if (d.includes("normal"))
        return { text: "Normal", class: "text-green-500 font-bold" };
      if (d.includes("benign"))
        return { text: "Benign", class: "text-[#0099ff] font-bold" };
      if (d.includes("malignant"))
        return { text: "Malignant", class: "text-red-500 font-bold" };
    }
  }
  return { text: "-", class: "text-gray-400" };
};

const getReviewStatus = (p) => {
  const isDone = p.review === "VALIDATED" || p.review === "Done";
  return isDone ? "Done" : "Pending";
};

const openReview = (patientId, mode = 'review') => {
  router.push({ name: "review-console", params: { id: patientId }, query: { mode } });
};

const viewResult = (patient) => {
  selectedPatient.value = patient;
  showReviewModal.value = true;
};

const downloadResult = async (patient) => {
  // Get the doctor's brush image (post-review annotated image)
  let downloadUrl = null;
  if (patient.medical_records?.length) {
    const records = [...patient.medical_records].sort(
      (a, b) => (b.id || 0) - (a.id || 0),
    );
    const latest = records[0];
    if (latest.doctor_brush_path) {
      const { getPublicImageUrl } = await import("@/services/storageService");
      downloadUrl = getPublicImageUrl(
        latest.doctor_brush_path,
        "breast-cancer-images",
      );
    }
  }

  if (!downloadUrl) {
    downloadUrl = patient.image;
  }

  if (!downloadUrl) {
    alert("No reviewed image available to download.");
    return;
  }

  try {
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Patient_P00${patient.id}_ReviewResult.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download image.");
  }
};
</script>

<template>
  <div class="container mx-auto">
    <!-- Header -->
    <div class="mb-10 text-center">
      <h2 class="text-2xl font-bold text-gray-800 hidden">Doctor Dashboard</h2>
      <p class="text-gray-500 text-lg">Welcome Dr Bachtiar!</p>
    </div>
    <!-- Stats Cards (White Cards with Borders) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <div v-for="stat in stats" :key="stat.label"
        class="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm flex items-center justify-between h-24 relative overflow-hidden group hover:border-slate-300 transition-colors">
        <div class="flex items-center gap-4 z-10">
          <img :src="stat.icon" class="w-10 h-10 object-contain" />
          <span class="text-xs font-bold text-gray-500" :class="{ 'text-[#0099ff]': stat.isBlue }">{{ stat.label
          }}</span>
        </div>
        <div class="z-10 bg-transparent flex items-center">
          <span class="text-3xl font-bold text-gray-500 mr-2" :class="{ 'text-[#0099ff]': stat.isBlue }">{{ stat.value
          }}</span>
        </div>
      </div>
    </div>
    <!-- Dashboard Title + Search -->
    <div class="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
      <h2 class="text-3xl font-medium text-gray-700">Doctor dashboard</h2>

      <div class="relative w-full md:w-96">
        <input v-model="searchQuery" type="text" placeholder="Search"
          class="w-full bg-gray-100 rounded-full py-3 pl-6 pr-12 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200" />
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
          class="w-5 h-5 absolute right-4 top-3.5 text-gray-500">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
    </div>
    <!-- Patient List (Card Rows) -->
    <div class="w-full">
      <!-- Table Head -->
      <div
        class="grid grid-cols-12 gap-4 px-8 py-2 text-gray-500 font-bold text-sm mb-2 uppercase tracking-wide opacity-70 hidden md:grid">
        <div class="col-span-2">ID</div>
        <div class="col-span-2">Name</div>
        <div class="col-span-3 text-center">AI Analysis</div>
        <div class="col-span-2 text-center">Image</div>
        <div class="col-span-3 text-center">Review</div>
      </div>
      <!-- Loader -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <Loading text="Loading..." />
      </div>
      <div v-else class="space-y-4">
        <!-- Row Item -->
        <div v-for="patient in filteredPatients" :key="patient.id"
          class="bg-gray-100/80 rounded-2xl p-4 md:px-8 md:py-5 flex flex-col md:grid md:grid-cols-12 gap-4 items-center shadow-sm">
          <!-- ID/Icon -->
          <div class="col-span-2 flex items-center gap-3 w-full justify-start">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center p-1.5 shrink-0">
              <img :src="PatientIcon" class="w-full h-full object-contain opacity-80" />
            </div>
            <span class="font-bold text-gray-600 truncate">P00{{ patient.id }}</span>
          </div>
          <!-- Name -->
          <div class="col-span-2 w-full text-center md:text-left">
            <span class="font-bold text-gray-700 text-lg line-clamp-1" :title="patient.name">{{ patient.name }}</span>
          </div>
          <!-- AI Analysis -->
          <div class="col-span-3 w-full flex justify-center">
            <span :class="getAiAnalysisText(patient).class">
              {{ getAiAnalysisText(patient).text }}
              <span v-if="getAiAnalysisText(patient).text === 'Malignant'" class="inline-block ml-1">⚠️</span>
            </span>
          </div>
          <!-- Image Status -->
          <div class="col-span-2 w-full flex justify-center">
            <span v-if="patient.image" class="text-green-500 font-bold text-sm">Yes</span>
            <span v-else class="text-gray-400 font-bold text-sm">No</span>
          </div>
          <!-- Review Action -->
          <div class="col-span-3 w-full flex justify-center gap-2">
            <button v-if="getReviewStatus(patient) === 'Pending'" @click="openReview(patient.id)"
              class="bg-white hover:bg-white text-gray-600 hover:text-gray-900 border border-gray-200 px-6 py-2 rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all w-full md:w-auto">
              Let's Review
            </button>
            <template v-else>
              <button @click="viewResult(patient)"
                class="bg-[#0099ff] hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path fill-rule="evenodd"
                    d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clip-rule="evenodd" />
                </svg>
                View
              </button>
              <button @click="openReview(patient.id, 'edit')"
                class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                  <path
                    d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                  <path
                    d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                </svg>
                Edit
              </button>
            </template>
          </div>
        </div>
        <!-- Fallback if no patients after filtering/searching -->
        <div v-if="filteredPatients.length === 0" class="text-center py-12 text-gray-400">
          No patients match your search.
        </div>
      </div>
    </div>

    <ModalReviewResult :isOpen="showReviewModal" :patient="selectedPatient" @close="showReviewModal = false" @download="
      () => {
        downloadResult(selectedPatient);
      }
    " />
  </div>
</template>

<style scoped>
/* No extra styles needed, using Tailwind */
</style>
