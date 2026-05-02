<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Ellipsis, MessageSquareText, Sparkles, CircleCheck  } from "@lucide/vue";

import { usePatientPortalData } from "@/composables/usePatientPortalData";
import { useAppStore } from "@/stores/appStore";
import Loading from "@/components/common/Loading.vue";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";


const router = useRouter();
const appStore = useAppStore();

const { portalData, isLoading, errorMessage, refetchAll } = usePatientPortalData();

const statusFilter = ref("pending");
const searchKeyword = ref("");

const statusTabs = [
  { key: "pending", label: "Pending", icon: Ellipsis  },
  { key: "done", label: "Done", icon: CircleCheck },
];

const filteredRecords = computed(() => {
  const query = String(searchKeyword.value || "").toLowerCase();

  return portalData.value.statusRecords.filter((record) => {
    if (record.statusKey !== statusFilter.value) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      String(record.id || "").toLowerCase().includes(query) ||
      String(record.doctorName || "").toLowerCase().includes(query) ||
      String(record.aiResultLabel || "").toLowerCase().includes(query)
    );
  });
});

const activeRecord = computed(() => {
  return filteredRecords.value[0] || null;
});

const activeStatusIcon = computed(() => {
  if (!activeRecord.value) return null;

  const found = statusTabs.find(
    (tab) => tab.key === activeRecord.value.statusKey
  );

  return found?.icon || null;
});

const showMedgemmaPromo = computed(() => {
  return appStore.featureToggles.medgemmaEnabled;
});

const statusBadgeClass = (statusKey) => {
  if (statusKey === "pending") {
    return "bg-neutral-200 text-neutral-600";
  }

  if (statusKey === "in_review") {
    return "bg-amber-200 text-amber-700";
  }

  return "bg-lime-500 text-white";
};

const openRecordDetail = () => {
  if (!activeRecord.value) {
    return;
  }

  router.push({
    name: "patient-record-detail",
    params: { recordId: activeRecord.value.id },
  });
};

const openDoctorChat = () => {
  router.push({ name: "patient-chat-doctor" });
};

const openConsultAI = () => {
  router.push({ name: "patient-consult-ai" });
};

const formatDateTime = (validatedAt) => {
  if (!validatedAt) return "-";

  return new Date(validatedAt).toLocaleString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  });
}
</script>


<template>
  <section class="relative flex h-full min-h-0 flex-col overflow-hidden p-3 sm:p-5">
    <!-- Background Image -->
    <img
      :src="LumiraLogo"
      class="pointer-events-none absolute inset-0 m-auto hidden w-[42%] max-w-md opacity-10 sm:block"
    />
    <!-- If loading -->
    <div v-if="isLoading" class="flex min-h-0 flex-1 items-center justify-center">
      <Loading text="Loading patient dashboard..." />
    </div>
    <!-- Main Content -->
    <div v-else class="relative z-10 flex justify-between min-h-0 flex-1 flex-col overflow-y-auto">
      <!-- Main Data -->
      <div class="flex flex-col gap-8 overflow-y-auto">
        <!-- If Error -->
        <div v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          <p>{{ errorMessage }}</p>
          <button
            type="button"
            @click="refetchAll"
            class="mt-2 cursor-pointer rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
          >
            Retry
          </button>
        </div>
        <!-- Profile & Search -->
        <!-- <div class="grid gap-3 xl:grid-cols-[280px_1fr] xl:items-center">
          <div class="rounded-2xl bg-[#C2E8FF] px-3 py-2">
            <div class="flex items-center gap-3">
            <div class="h-14 w-14 rounded-full bg-white/95 shrink-0 flex items-center justify-center overflow-hidden p-3">
              <img src="@/assets/icons/icon-patient.png" alt="Patient Icon" class="w-full h-full object-contain">
            </div>  
              <div>
                <p class="text-lg font-semibold text-neutral-700">{{ portalData.patientProfile.name }}</p>
              </div>
            </div>
          </div>
          <SearchInput
            v-model="searchKeyword"
            placeholder="Search..."
            wrapperClass="max-w-full"
            customMainClass="py-2 bg-neutral-100! border border-neutral-300!"
          />
        </div> -->
        <!-- Status filter -->
        <div class="grid grid-cols-2 gap-2 mt-4">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            type="button"
            @click="statusFilter = tab.key"
            class="cursor-pointer rounded-full border px-2 py-2 text-xs font-semibold transition sm:text-sm"
            :class="statusFilter === tab.key ? 'border-sky-600 bg-[#1197E8] text-white' : 'border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-100'"
          >
            {{ tab.label }}
          </button>
        </div>
        <!-- Main Data -->
        <div class="h-79 flex flex-col justify-between rounded-2xl border border-neutral-300 bg-white/70 p-4 sm:p-6 max-h-79 overflow-y-hidden">
          <template v-if="activeRecord">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold tracking-wide text-sky-600">Scan ID</p>
                <p class="text-xl font-semibold text-neutral-700">{{ activeRecord.id }}</p>
              </div>
              <div class="flex justify-center gap-2 items-center">
                <span
                  class="inline-flex min-w-36 items-center justify-center gap-3 rounded-lg px-10 py-2 text-sm font-semibold"
                  :class="statusBadgeClass(activeRecord.statusKey)"
                >
                  <component v-if="activeStatusIcon" :is="activeStatusIcon" class="h-5 w-5" />
                  {{ activeRecord.statusLabel }}
                </span>
              </div>
            </div>
            <template v-if="activeRecord.statusKey === 'pending'">
              <div class="flex flex-col items-center justify-center gap-4 py-8 text-center sm:flex-row sm:text-left">
                <!-- Loader -->
                <div class="relative h-16 w-16 shrink-0">
                  <div class="absolute inset-0 rounded-full border-[6px] border-sky-200"></div>
                  <div class="absolute inset-0 animate-spin rounded-full border-[6px] border-[#1D5BD6] border-t-transparent"></div>
                </div>
                <!-- Information -->
                <div>
                  <p class="text-xl font-semibold text-neutral-800">Mohon tunggu, data anda sedang di proses oleh kami</p>
                  <p class="text-xl font-semibold text-neutral-800">Please wait, we are processing your data</p>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="space-y-4 py-2">
                <div class="grid gap-3 md:grid-cols-2">
                  <div class="relative rounded-xl border border-sky-300 bg-white p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-sky-600">Verified Date</p>
                    <p class="mt-1 text-3xl font-semibold text-neutral-700">{{ activeRecord.verifiedDateLabel || '-' }}</p>
                    <p class="mt-2 text-xs text-neutral-500">{{ formatDateTime(activeRecord.validatedAt) }}</p>
                    <!-- Detail Reviewed -->
                    <div class="absolute -top-10 -right-10 rounded-br-xl rounded-tr-xl rounded-tl-xl bg-[#1197E8] p-4 text-white shadow">
                      <div class="flex gap-2 items-center">
                        <img src="@/assets/icons/icon-doctor.png" alt="Doctor Icon" class="object-contain w-12 h-12 invert brightness-0">
                        <p class="mt-1 text-xl font-semibold">{{ activeRecord.doctorName }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Action Buttons -->
                <div class="grid gap-10 sm:grid-cols-2 mt-8">
                  <button
                    type="button"
                    @click="openRecordDetail"
                    class="cursor-pointer rounded-lg bg-[#1696e5] px-4 py-3 text-2xl font-semibold text-white transition hover:bg-[#1388cf]"
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    @click="openDoctorChat"
                    class="cursor-pointer rounded-lg border border-sky-300 bg-white px-4 py-3 text-2xl font-semibold text-[#118EE4] transition hover:bg-sky-50"
                  >
                    <span class="inline-flex items-center gap-2">
                      <MessageSquareText class="h-5 w-5" />
                      Chat with Doctor
                    </span>
                  </button>
                </div>
              </div>
            </template>
          </template>
          <div v-else class="text-sm sm:text-base flex items-center justify-center rounded-xl bg-neutral-100 h-full text-center text-neutral-600">
            No data found for this status. You can check the others status
          </div>
        </div>
      </div>
      <!-- Banner Medgemma -->
      <div
        v-if="showMedgemmaPromo"
        class="rounded-2xl bg-[#1696e5] p-4 sm:px-4 sm:py-10 text-white shadow sm:px-6"
      >
        <div class="grid gap-4 sm:grid-cols-[84px_1fr] sm:items-center">
          <div class="mx-auto h-12 w-12 sm:h-20 sm:w-20">
            <img :src="LumiraLogo" alt="MedGemma" class="h-full w-full object-contain" />
          </div>
          <div>
            <p class="text-xs font-semibold tracking-wide text-sky-100">{{ portalData.medgemmaPromo.badge }}</p>
            <p class="text-xl sm:text-3xl font-semibold">{{ portalData.medgemmaPromo.title }}</p>
            <p class="mt-1 text-sm text-sky-100">{{ portalData.medgemmaPromo.subtitle }}</p>
          </div>
        </div>

        <button
          type="button"
          @click="openConsultAI"
          class="w-full sm:w-fit mt-10 inline-flex cursor-pointer justify-center items-center gap-2 rounded-full bg-white px-4 py-2 text-base font-semibold text-[#0F8FDD] transition hover:bg-sky-100"
        >
          <Sparkles class="h-4 w-4" />
          {{ portalData.medgemmaPromo.cta }}
        </button>
      </div>
    </div>
  </section>
</template>
