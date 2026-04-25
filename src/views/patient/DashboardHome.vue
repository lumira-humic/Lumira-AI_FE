<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Ellipsis, Eye, MessageSquareText, Sparkles, CircleCheck  } from "@lucide/vue";

import { usePatientPortalData } from "@/composables/usePatientPortalData";
import { useAppStore } from "@/stores/appStore";
import Loading from "@/components/common/Loading.vue";
import SearchInput from "@/components/common/SearchInput.vue";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";


const router = useRouter();
const appStore = useAppStore();

const { portalData, isLoading, isUsingMock, errorMessage, isRefreshing, refetchAll } = usePatientPortalData();

const statusFilter = ref("pending");
const searchKeyword = ref("");

const statusTabs = [
  { key: "pending", label: "Pending", icon: Ellipsis  },
  { key: "in_review", label: "In Review", icon: Eye },
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
      String(record.scanId || "").toLowerCase().includes(query) ||
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
</script>


<template>
  <section class="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-[#F2F2F2] p-3 sm:p-5">
    <!-- Background Image -->
    <img
      :src="LumiraLogo"
      class="pointer-events-none absolute inset-0 m-auto hidden w-[42%] max-w-md opacity-10 sm:block"
    />
    <!-- If loading -->
    <div v-if="isLoading" class="flex min-h-0 flex-1 items-center justify-center">
      <Loading text="Loading patient dashboard..." />
    </div>
    <!-- Main Data -->
    <div v-else class="relative z-10 flex justify-between min-h-0 flex-1 flex-col overflow-y-auto pr-1">
      <!-- Delete this, if API data form BE's ready -->
      <div class="flex flex-col gap-2">
        <p v-if="isRefreshing" class="text-xs text-neutral-500">Refreshing patient timeline...</p>
        <div
          v-if="isUsingMock"
          class="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700"
        >
          Preview mode: API data is not fully available yet, dummy patient timeline is shown.
        </div>
      </div>
      <div class="flex flex-col gap-4 overflow-y-auto">
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
        <div class="grid gap-3 xl:grid-cols-[280px_1fr] xl:items-center">
          <div class="rounded-2xl bg-[#C2E8FF] px-3 py-2">
            <div class="flex items-center gap-3">
              <div class="h-14 w-14 rounded-full bg-neutral-300"></div>
              <div>
                <p class="text-lg font-semibold text-neutral-700">{{ portalData.patientProfile.name }}</p>
                <p class="text-xs text-neutral-600">{{ portalData.patientProfile.subtitle }}</p>
              </div>
            </div>
          </div>
          <SearchInput
            v-model="searchKeyword"
            placeholder="Search..."
            wrapperClass="max-w-full"
            customMainClass="py-2"
          />
        </div>
        <!-- Status filter -->
        <div class="grid grid-cols-3 gap-2 mt-4">
          <button
            v-for="tab in statusTabs"
            :key="tab.key"
            type="button"
            @click="statusFilter = tab.key"
            class="cursor-pointer rounded-full border px-2 py-2 text-xs font-semibold shadow-sm transition sm:text-sm"
            :class="statusFilter === tab.key ? 'border-sky-600 bg-[#1197E8] text-white' : 'border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-100'"
          >
            {{ tab.label }}
          </button>
        </div>
        <!-- Main Data -->
        <div class="h-75 flex flex-col justify-between rounded-2xl border border-neutral-300 bg-white/70 p-4 sm:p-6 max-h-75 overflow-y-auto">
          <template v-if="activeRecord">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold tracking-wide text-sky-600">Scan ID</p>
                <p class="text-xl font-semibold text-neutral-700">{{ activeRecord.scanId }}</p>
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
                  <p class="text-xl font-semibold text-neutral-800">{{ activeRecord.note }}</p>
                  <p class="text-2xl font-semibold text-neutral-900">{{ activeRecord.title }}</p>
                </div>
              </div>
            </template>
            <template v-else-if="activeRecord.statusKey === 'in_review'">
              <div class="space-y-4 py-2">
                <div class="mx-auto flex max-w-xl items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow">
                  <div class="flex h-20 w-20 items-center justify-center rounded-xl bg-neutral-200 text-neutral-600">
                    <Eye class="h-10 w-10" />
                  </div>
                  <div>
                    <p class="text-sm text-neutral-500">Assigned Doctor</p>
                    <p class="text-4xl font-semibold text-neutral-700">{{ activeRecord.doctorName }}</p>
                  </div>
                </div>
  
                <button
                  type="button"
                  @click="openDoctorChat"
                  class="cursor-pointer w-full rounded-lg border border-sky-300 bg-white px-4 py-3 text-xl font-semibold text-[#118EE4] transition hover:bg-sky-50"
                >
                  <span class="inline-flex items-center gap-2">
                    <MessageSquareText class="h-5 w-5" />
                    Chat with Doctor
                  </span>
                </button>
              </div>
            </template>
            <template v-else>
              <div class="space-y-4 py-2">
                <div class="grid gap-3 md:grid-cols-2">
                  <div class="relative rounded-xl border border-sky-300 bg-white p-4">
                    <p class="text-xs font-semibold uppercase tracking-wide text-sky-600">Verified Date</p>
                    <p class="mt-1 text-3xl font-semibold text-neutral-700">{{ activeRecord.verifiedDateLabel || '-' }}</p>
                    <p class="mt-2 text-xs text-neutral-500">19.59 PM</p>
                    <!-- <p class="mt-2 text-xs text-neutral-500">{{ activeRecord.note }}</p> -->
                    <!-- Detail Reviewed -->
                    <div class="absolute -top-10 -right-10 rounded-br-xl rounded-tr-xl rounded-tl-xl bg-[#1197E8] p-4 text-white shadow">
                      <div class="flex gap-2 items-center">
                        <img src="@/assets/icons/patient/doctor-reviewed-icon.svg" alt="Doctor Icon" class="object-contain w-12 h-12">
                        <p class="mt-1 text-xl font-semibold">{{ activeRecord.doctorName }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Action Buttons -->
                <div class="grid gap-10 sm:grid-cols-2">
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
          <div v-else class="rounded-xl bg-neutral-100 px-4 py-12 text-center text-neutral-500">
            No data found for this status.
          </div>
        </div>
      </div>
      <!-- Banner Medgemma -->
      <div
        v-if="showMedgemmaPromo"
        class="rounded-2xl bg-[#1696e5] px-4 py-10 text-white shadow sm:px-6"
      >
        <div class="grid gap-4 sm:grid-cols-[84px_1fr] sm:items-center">
          <div class="mx-auto h-20 w-20">
            <img :src="LumiraLogo" alt="MedGemma" class="h-full w-full object-contain" />
          </div>
          <div>
            <p class="text-xs font-semibold tracking-wide text-sky-100">{{ portalData.medgemmaPromo.badge }}</p>
            <p class="text-3xl font-semibold">{{ portalData.medgemmaPromo.title }}</p>
            <p class="mt-1 text-sm text-sky-100">{{ portalData.medgemmaPromo.subtitle }}</p>
          </div>
        </div>

        <button
          type="button"
          @click="openConsultAI"
          class="mt-10 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-base font-semibold text-[#0F8FDD] transition hover:bg-sky-100"
        >
          <Sparkles class="h-4 w-4" />
          {{ portalData.medgemmaPromo.cta }}
        </button>
      </div>
    </div>
  </section>
</template>
