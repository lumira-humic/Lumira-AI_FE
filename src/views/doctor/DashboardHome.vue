<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { dataService } from "@/services/dataService.js";
import { generateDoctorDummyPatients } from "@/lib/mocks/doctorPatients.mock";
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
const searchQuery = ref("");
const patients = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");

watch(
  () => route.query.filter,
  (newFilter) => {
    currentFilter.value = newFilter || "All";
  },
  { immediate: true },
);

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
  return status === "VALIDATED" || status === "DONE";
};

const isAttentionCase = (patient) => {
  if (!isPendingStatus(patient.review)) {
    return false;
  }

  const aiLabel = resolveAiLabel(patient).toLowerCase();
  return !patient.image || aiLabel.includes("malignant") || aiLabel === "-";
};

const searchedPatients = computed(() => {
  if (!searchQuery.value) {
    return [...patients.value];
  }

  const query = searchQuery.value.toLowerCase();
  return patients.value.filter((patient) => {
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

const summaryCounts = computed(() => {
  return {
    all: patients.value.length,
    waiting: patients.value.filter((patient) => isPendingStatus(patient.review)).length,
    done: patients.value.filter((patient) => isDoneStatus(patient.review)).length,
    attention: patients.value.filter((patient) => isAttentionCase(patient)).length,
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
  return Math.max(1, Math.ceil(filteredPatients.value.length / safeLimit));
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
  const safeLimit = Math.max(1, Number(props.limit || 1));
  const start = (currentPage.value - 1) * safeLimit;
  const end = start + safeLimit;
  return filteredPatients.value.slice(start, end);
});

const paginationMeta = computed(() => {
  const totalItems = filteredPatients.value.length;
  const safeLimit = Math.max(1, Number(props.limit || 1));
  const from = totalItems === 0 ? 0 : (currentPage.value - 1) * safeLimit + 1;
  const to = totalItems === 0 ? 0 : Math.min(currentPage.value * safeLimit, totalItems);

  return {
    page: currentPage.value,
    totalPages: totalPages.value,
    totalItems,
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

const getPatientCode = (patient, index) => {
  if (patient?.code) {
    return String(patient.code).padStart(3, "0");
  }

  const numericValue = Number.parseInt(String(patient?.id || ""), 10);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return String(numericValue).padStart(3, "0");
  }

  return String(index + 1).padStart(3, "0");
};

const openReview = (patientId) => {
  router.push({
    name: "review-console",
    params: { id: patientId },
    query: { mode: "review" },
  });
};

const fetchPatients = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await dataService.getPatients({
      withMeta: true,
      page: 1,
      limit: 200,
    });

    const sourceItems = Array.isArray(response?.items) ? response.items : [];
    const shouldUseDummy = Number(response?.meta?.total || sourceItems.length) <= 1;

    patients.value = shouldUseDummy
      ? generateDoctorDummyPatients(sourceItems[0], 51)
      : sourceItems;
  } catch (error) {
    patients.value = [];
    errorMessage.value = "Failed to load patients. Please try again.";
    console.error("Failed to fetch patients:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await fetchPatients();
});
</script>

<template>
  <section class="flex h-full min-h-0 flex-col rounded-2xl">
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
        <h1 class="text-base font-semibold text-neutral-700 sm:text-xl">{{ sectionConfig.title }}</h1>
        <span class="text-base font-semibold text-neutral-700 sm:text-xl">{{ sectionConfig.count }}</span>
      </div>

      <SearchInput
        v-model="searchQuery"
        :disabled="isLoading || !!errorMessage"
        placeholder="Search By ID or Name"
        wrapperClass="max-w-3xl"
      />
    </div>
    <!-- Table Header -->
    <div class="grid grid-cols-6 px-3 py-2 text-lg font-semibold text-neutral-600">
      <div class="col-span-1"></div>
      <div class="col-span-1">ID</div>
      <div class="col-span-1">Name</div>
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
        @click="fetchPatients"
        class="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
      >
        Retry
      </button>
    </div>
    <div v-else class="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
      <template v-if="paginatedPatients.length > 0">
        <div
          v-for="(patient, index) in paginatedPatients"
          :key="`${patient.id}-${index}`"
          class="grid grid-cols-6 items-center rounded-2xl bg-[#E8E8E8] px-3 py-3"
        >
          <div class="col-span-1 flex items-center justify-center gap-3">
            <img :src="PatientIcon" alt="Patient" class="h-10 w-10 object-contain" />
            <span class="text-2xl font-semibold text-neutral-600">P{{ getPatientCode(patient, index) }}</span>
          </div>
          <div class="col-span-1 text-2xl font-semibold text-neutral-600">{{ patient.name || "-" }}</div>
          <div class="col-span-1 text-center text-2xl font-semibold" :class="getAiAnalysisText(patient).class">
            {{ getAiAnalysisText(patient).text === "-" ? "⚠" : getAiAnalysisText(patient).text }}
          </div>
          <div class="col-span-1 text-center text-2xl font-semibold">
            <span v-if="patient.image" class="text-[#2BC11F]">Yes</span>
            <span v-else class="text-amber-500">⚠</span>
          </div>
          <div class="col-span-1 text-center">
            <span v-if="isDoneStatus(patient.review)" class="text-2xl font-semibold text-[#2BC11F]">Done</span>
            <button
              v-else-if="patient.image"
              @click="openReview(patient.id)"
              class="rounded-2xl bg-[#A9DAF9] px-6 py-2 text-xl font-semibold text-[#2E6D90] hover:bg-[#96d1f3]"
            >
              Let's Review
            </button>
            <span v-else class="text-2xl font-semibold text-amber-500">⚠</span>
          </div>
        </div>
      </template>

      <div v-else class="rounded-xl bg-[#E8E8E8] py-10 text-center text-neutral-500">
        No patients match your filter.
      </div>
    </div>
  </section>
</template>
