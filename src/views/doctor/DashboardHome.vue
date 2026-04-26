<script setup>
import { computed, onUnmounted, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useRoute, useRouter } from "vue-router";

import { dataService } from "@/services/dataService.js";
import { generateDoctorDummyPatients } from "@/lib/mocks/doctorPatients.mock";
import ModalReviewResult from "./components/ModalReviewResult.vue";
import SearchInput from "@/components/common/SearchInput.vue";
import Loading from "@/components/common/Loading.vue";
import DashboardIcon from "@/assets/admin/dashboard-sidebar.png";
import PatientIcon from "@/assets/admin/patient.png";
import WaitingIcon from "@/assets/doctor/waiting-for-review.png";
import DoneIcon from "@/assets/doctor/done.png";
import AttentionIcon from "@/assets/doctor/need-attention.png";


const props = defineProps({
  page: {
    type: Number,
    default: 1,
  },
  limit: {
    type: Number,
    default: 10,
  },
});

const emit = defineEmits(["pagination-meta"]);

const router = useRouter();
const route = useRoute();

const currentFilter = ref("All");
const showReviewModal = ref(false);
const selectedPatient = ref(null);
const searchQuery = ref("");
const debouncedSearch = ref("");
let searchDebounceTimer;

watch(
  () => route.query.filter,
  (newFilter) => {
    currentFilter.value = newFilter || "All";
  },
  { immediate: true },
);

watch(
  () => searchQuery.value,
  (nextValue) => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = setTimeout(() => {
      debouncedSearch.value = String(nextValue || "").trim();
    }, 350);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
});

const normalizeReviewStatus = (review) => {
  return String(review || "").trim().toUpperCase();
};

const resolveAiLabel = (patient) => {
  if (patient?.aiResult) {
    return String(patient.aiResult);
  }

  const latest = Array.isArray(patient?.medical_records)
    ? patient.medical_records[patient.medical_records.length - 1]
    : null;
  const diagnosis = latest?.ai_diagnosis;

  if (!diagnosis) {
    return "-";
  }

  try {
    const parsed = typeof diagnosis === "string" ? JSON.parse(diagnosis) : diagnosis;
    return String(parsed.class || diagnosis);
  } catch (error) {
    return String(diagnosis);
  }
};

const isPendingStatus = (review) => {
  const status = normalizeReviewStatus(review);
  return status === "PENDING" || status === "NOT YET" || status === "-" || status === "";
};

const isDoneStatus = (review) => {
  const status = normalizeReviewStatus(review);
  return status === "REVIEWED" || status === "DONE" || status === "APPROVED";
};

const isAttentionCase = (patient) => {
  if (!isPendingStatus(patient.review)) {
    return false;
  }

  const aiLabel = resolveAiLabel(patient).toLowerCase();
  return !patient.image || aiLabel.includes("malignant") || aiLabel === "-";
};

const hasStatusFilter = computed(() => {
  return currentFilter.value === "Not Yet" || currentFilter.value === "Done" || currentFilter.value === "Attention";
});

const requestPage = computed(() => {
  if (hasStatusFilter.value) {
    return 1;
  }

  return Math.max(1, Number(props.page || 1));
});

const requestLimit = computed(() => {
  if (hasStatusFilter.value) {
    return 100;
  }

  return Math.max(1, Number(props.limit || 10));
});

const patientsQuery = useQuery({
  queryKey: computed(() => [
    "doctor-dashboard-patients",
    requestPage.value,
    requestLimit.value,
    debouncedSearch.value,
  ]),
  queryFn: () => {
    return dataService.getPatients({
      withMeta: true,
      page: requestPage.value,
      limit: requestLimit.value,
      search: debouncedSearch.value,
    });
  },
  placeholderData: (previousData) => previousData,
  staleTime: 1000 * 20,
  gcTime: 1000 * 60 * 10,
  retry: 1,
});

const serverItems = computed(() => {
  return Array.isArray(patientsQuery.data.value?.items) ? patientsQuery.data.value.items : [];
});

const serverMeta = computed(() => {
  const fallbackTotal = serverItems.value.length;

  return {
    page: Number(patientsQuery.data.value?.meta?.page || requestPage.value),
    limit: Number(patientsQuery.data.value?.meta?.limit || requestLimit.value),
    total: Number(patientsQuery.data.value?.meta?.total || fallbackTotal),
    totalPages: Number(patientsQuery.data.value?.meta?.totalPages || 1),
  };
});

const useDummyMode = computed(() => {
  return Number(serverMeta.value.total || serverItems.value.length) <= 1;
});

const dummyPatients = computed(() => {
  return generateDoctorDummyPatients(serverItems.value[0], 51);
});

const searchedPatients = computed(() => {
  if (!useDummyMode.value) {
    return [...serverItems.value];
  }

  if (!debouncedSearch.value) {
    return [...dummyPatients.value];
  }

  const query = debouncedSearch.value.toLowerCase();
  return dummyPatients.value.filter((patient) => {
    return (
      String(patient.id || "").toLowerCase().includes(query) ||
      String(patient.code || "").toLowerCase().includes(query) ||
      String(patient.name || "").toLowerCase().includes(query)
    );
  });
});

const filteredPatients = computed(() => {
  if (currentFilter.value === "Not Yet") {
    return searchedPatients.value.filter((patient) => isPendingStatus(patient.review));
  }

  if (currentFilter.value === "Done") {
    return searchedPatients.value.filter((patient) => isDoneStatus(patient.review));
  }

  if (currentFilter.value === "Attention") {
    return searchedPatients.value.filter((patient) => isAttentionCase(patient));
  }

  return searchedPatients.value;
});

const useLocalPagination = computed(() => {
  return useDummyMode.value || hasStatusFilter.value;
});

const totalItems = computed(() => {
  if (useLocalPagination.value) {
    return filteredPatients.value.length;
  }

  return Number(serverMeta.value.total || filteredPatients.value.length);
});

const summaryCounts = computed(() => {
  const summarySource = useLocalPagination.value ? searchedPatients.value : serverItems.value;

  return {
    all: useLocalPagination.value ? summarySource.length : totalItems.value,
    waiting: summarySource.filter((patient) => isPendingStatus(patient.review)).length,
    done: summarySource.filter((patient) => isDoneStatus(patient.review)).length,
    attention: summarySource.filter((patient) => isAttentionCase(patient)).length,
  };
});

const sectionConfig = computed(() => {
  if (currentFilter.value === "Not Yet") {
    return {
      title: "Waiting For Review",
      icon: WaitingIcon,
      count: summaryCounts.value.waiting,
    };
  }

  if (currentFilter.value === "Done") {
    return {
      title: "Completed",
      icon: DoneIcon,
      count: summaryCounts.value.done,
    };
  }

  if (currentFilter.value === "Attention") {
    return {
      title: "Need Attention",
      icon: AttentionIcon,
      count: summaryCounts.value.attention,
    };
  }

  return {
    title: "Dashboard",
    icon: DashboardIcon,
    count: summaryCounts.value.all,
  };
});

const totalPages = computed(() => {
  const safeLimit = Math.max(1, Number(props.limit || 1));
  return Math.max(1, Math.ceil(totalItems.value / safeLimit));
});

const currentPage = computed(() => {
  const page = Number(props.page || 1);
  if (page < 1) {
    return 1;
  }

  if (page > totalPages.value) {
    return totalPages.value;
  }

  return page;
});

const paginatedPatients = computed(() => {
  if (!useLocalPagination.value) {
    return filteredPatients.value;
  }

  const safeLimit = Math.max(1, Number(props.limit || 1));
  const start = (currentPage.value - 1) * safeLimit;
  const end = start + safeLimit;
  return filteredPatients.value.slice(start, end);
});

const paginationMeta = computed(() => {
  const safeLimit = Math.max(1, Number(props.limit || 1));
  const from = totalItems.value === 0 ? 0 : (currentPage.value - 1) * safeLimit + 1;
  const to = totalItems.value === 0 ? 0 : Math.min(currentPage.value * safeLimit, totalItems.value);

  return {
    page: currentPage.value,
    totalPages: totalPages.value,
    totalItems: totalItems.value,
    limit: safeLimit,
    from,
    to,
  };
});

watch(
  paginationMeta,
  (meta) => {
    emit("pagination-meta", meta);
  },
  { immediate: true, deep: true },
);

const getAiAnalysisText = (patient) => {
  const value = resolveAiLabel(patient).toLowerCase();

  if (value.includes("normal")) {
    return { text: "Normal", class: "text-[#2BC11F]" };
  }

  if (value.includes("benign")) {
    return { text: "Benign", class: "text-[#1397E8]" };
  }

  if (value.includes("malignant")) {
    return { text: "Malignant", class: "text-red-500" };
  }

  return { text: "-", class: "text-amber-500" };
};

const isLoading = computed(() => {
  return patientsQuery.isPending.value && !patientsQuery.data.value;
});

const isRefreshing = computed(() => {
  return patientsQuery.isFetching.value && !!patientsQuery.data.value;
});

const errorMessage = computed(() => {
  if (!patientsQuery.isError.value) {
    return "";
  }

  return "Failed to load patients. Please try again.";
});

const openReview = (patientId, mode = "review") => {
  router.push({
    name: "review-console",
    params: { id: patientId },
    query: { mode },
  });
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

const retryFetch = () => {
  patientsQuery.refetch();
};

</script>

<template>
  <section class="flex h-full min-h-0 flex-col bg-[#EAEAEA]">
    <!-- Header -->
    <div class="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-8">
      <div class="flex items-center gap-2 sm:gap-3">
        <span class="h-6 w-6 sm:h-11 sm:w-11">
          <img
            :src="sectionConfig.icon"
            :alt="sectionConfig.title"
            class="h-6 w-6 object-contain sm:h-11 sm:w-11"
          />
        </span>
        <h1 class="text-base font-semibold text-neutral-900 sm:text-xl">{{ sectionConfig.title }}</h1>
        <span class="text-base font-semibold text-neutral-700 sm:text-xl">{{ sectionConfig.count }}</span>
      </div>
      <SearchInput
        v-model="searchQuery"
        :disabled="isLoading || !!errorMessage"
        placeholder="Search By ID or Name"
        wrapperClass="max-w-3xl"
        customMainClass="py-2! sm:py-4!"
      />
    </div>
    <p v-if="isRefreshing" class="-mt-3 mb-3 text-xs text-neutral-500">
      <!-- Refreshing patients... -->
    </p>
    <!-- Table Header -->
    <div class="grid grid-cols-5 pl-3 pr-8 py-2 text-base sm:text-lg xl:text-xl font-semibold text-neutral-900">
      <div class="col-span-1 text-center">ID</div>
      <div class="col-span-1 text-center">Name</div>
      <div class="col-span-1 text-center">AI Analysis</div>
      <div class="col-span-1 text-center">Image</div>
      <div class="col-span-1 text-center">Review</div>
    </div>
    <!-- Table Content -->
    <div v-if="isLoading" class="py-12">
      <Loading text="Loading patients..." />
    </div>
    <div v-else-if="errorMessage" class="rounded-xl bg-red-50 py-8 text-center text-red-600">
      <p class="mb-4 font-medium">{{ errorMessage }}</p>
      <button
        @click="retryFetch"
        class="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
      >
        Retry
      </button>
    </div>
    <div v-else class="min-h-0 max-h-[52vh] space-y-2 overflow-y-auto pr-2 sm:max-h-none sm:flex-1">
      <template v-if="paginatedPatients.length > 0">
        <div
          v-for="(patient, index) in paginatedPatients"
          :key="`${patient.id}-${index}`"
          class="grid grid-cols-5 items-center text-sm sm:text-base xl:text-lg rounded-xl bg-white p-4 mt-3"
        >
          <!-- Code -->
          <div class="col-span-1 flex items-center sm:gap-6 xl:gap-12 pl-2 gap-2">
            <img :src="PatientIcon" alt="Patient" class="w-6 h-6 sm:h-10 sm:w-10 object-contain" />
            <span class="font-semibold text-neutral-600">{{ patient.id || "-" }}</span>
          </div>
          <!-- Name -->
          <div class="col-span-1 text-center font-semibold text-neutral-600">{{ patient.name || "-" }}</div>
          <!-- AI Analysis -->
          <div
            class="col-span-1 text-center font-semibold"
            :class="getAiAnalysisText(patient).class"
          >
            <template v-if="getAiAnalysisText(patient).text === '-'">
              <img
                :src="AttentionIcon"
                alt="Warning Icon"
                class="w-4 h-4 sm:h-6 sm:w-6 object-contain mx-auto"
              />
            </template>
            <template v-else>
              {{ getAiAnalysisText(patient).text }}
            </template>
          </div>
          <!-- Image Cancer -->
          <div class="col-span-1 flex justify-center">
            <span v-if="patient.image" class="font-semibold text-[#2BC11F]">Yes</span>
            <img v-else :src="AttentionIcon" alt="Warning Icon" class="w-4 h-4 sm:h-6 sm:w-6 object-contain" />
          </div>
          <!-- Hasil Review -->
          <div class="col-span-1 flex justify-center gap-2 flex-wrap">
            <template v-if="isDoneStatus(patient.review)">
              <button
                @click="viewResult(patient)"
                class="cursor-pointer not-visited:bg-[#0099ff] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path fill-rule="evenodd"
                    d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clip-rule="evenodd" />
                </svg>
                View
              </button>
              <button
                @click="openReview(patient.id, 'edit')"
                class="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                  <path
                    d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                  <path
                    d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                </svg>
                Edit
              </button>
            </template>
            <button
              v-else-if="patient.image"
              @click="openReview(patient.id)"
              class="cursor-pointer rounded-lg bg-[#A9DAF9] px-6 py-2 text-base font-semibold text-[#0c3449] hover:bg-[#96d1f3]"
            >
              Let's Review
            </button>
            <img v-else :src="AttentionIcon" alt="Warning Icon" class="w-4 h-4 sm:h-6 sm:w-6 object-contain" />
          </div>
        </div>
      </template>
      <div v-else class="rounded-xl bg-[#E8E8E8] py-10 text-center text-neutral-500">
        No patients match your filter
      </div>
      <ModalReviewResult :isOpen="showReviewModal" :patient="selectedPatient" @close="showReviewModal = false" @download="
        () => {
          downloadResult(selectedPatient);
        }
      " />
    </div>
  </section>
</template>
