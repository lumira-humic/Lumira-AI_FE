<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, BadgeCheck, Bot, FileText, Image as ImageIcon } from "@lucide/vue";

import { usePatientPortalData } from "@/composables/usePatientPortalData";
import Loading from "@/components/common/Loading.vue";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";


const route = useRoute();
const router = useRouter();

const { portalData, isLoading, errorMessage, refetchAll } = usePatientPortalData();

const selectedRecord = computed(() => {
  const rawId = String(route.params.recordId || "");

  return (
    portalData.value.statusRecords.find((record) => String(record.id) === rawId) ||
    portalData.value.statusRecords.find((record) => record.statusKey === "done") ||
    portalData.value.statusRecords[0] ||
    null
  );
});

const confidenceLabel = computed(() => {
  const confidenceValue = Number(selectedRecord.value?.confidence || portalData.value.detailFallback.confidence || 0);
  return `${confidenceValue.toFixed(1)}%`;
});

const aiResultLabel = computed(() => {
  return selectedRecord.value?.aiResultLabel || portalData.value.detailFallback.resultLabel || "-";
});

const doctorNote = computed(() => {
  return selectedRecord.value?.note || portalData.value.detailFallback.note || "No doctor note yet.";
});

const goBack = () => {
  router.push({ name: "patient-dashboard" });
};
</script>

<template>
  <section class="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-[#F2F2F2] p-3 sm:p-5">
    <img
      :src="LumiraLogo"
      alt="Lumira watermark"
      class="pointer-events-none absolute inset-0 m-auto hidden w-[42%] max-w-md opacity-10 sm:block"
    />

    <div v-if="isLoading" class="flex min-h-0 flex-1 items-center justify-center">
      <Loading text="Loading detail report..." />
    </div>

    <div v-else class="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <div class="flex items-center justify-between gap-3">
        <button
          type="button"
          @click="goBack"
          class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to Stats
        </button>

        <button
          type="button"
          @click="refetchAll"
          class="cursor-pointer rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50"
        >
          Refresh
        </button>
      </div>

      <div v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
        {{ errorMessage }}
      </div>

      <template v-if="selectedRecord">
        <div class="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div class="space-y-4 rounded-2xl border border-neutral-300 bg-white/80 p-4 shadow sm:p-6">
            <div>
              <p class="text-xs uppercase tracking-wide text-neutral-500">Patient File</p>
              <p class="text-4xl font-bold text-neutral-800">{{ portalData.patientProfile.name }}</p>
              <p class="mt-1 text-sm text-neutral-500">{{ portalData.patientProfile.patientIdLabel }} • {{ portalData.patientProfile.scanDateLabel }}</p>
            </div>

            <div class="inline-flex items-center gap-2 rounded-xl bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-700">
              <BadgeCheck class="h-4 w-4" />
              VERIFIED BY {{ selectedRecord.doctorName || portalData.patientProfile.verifiedBy }}
            </div>

            <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900">
              <img
                v-if="selectedRecord.imageUrl"
                :src="selectedRecord.imageUrl"
                alt="Patient scan"
                class="h-105 w-full object-cover"
              />
              <div v-else class="flex h-105 items-center justify-center text-neutral-400">
                <div class="text-center">
                  <ImageIcon class="mx-auto h-10 w-10" />
                  <p class="mt-2 text-sm">Scan image is not available yet.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-2xl border border-neutral-300 bg-[#F5F5F5] p-4 shadow">
              <div class="mb-3 flex items-start justify-between gap-3">
                <div class="inline-flex items-center gap-2 rounded-lg bg-sky-100 px-2 py-1 text-sky-600">
                  <Bot class="h-4 w-4" />
                </div>
                <div class="text-right">
                  <p class="text-3xl font-semibold tracking-widest text-neutral-700">CONFIDENCE</p>
                  <p class="text-3xl font-bold text-sky-600">{{ confidenceLabel }}</p>
                </div>
              </div>

              <p class="text-sm font-semibold uppercase tracking-wide text-neutral-500">AI Result</p>
              <p class="text-6xl font-bold text-neutral-800">{{ aiResultLabel }}</p>

              <div class="mt-4 rounded-xl bg-[#1696e5] p-3 text-white">
                <p class="text-sm font-semibold">BI-RADS 2</p>
                <p class="mt-1 text-sm">Characteristic of non-malignant tissue with no suspicious calcification findings.</p>
              </div>
            </div>

            <div class="rounded-2xl border border-neutral-300 bg-[#F5F5F5] p-4 shadow">
              <div class="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <FileText class="h-4 w-4" />
                Doctor's Note
              </div>
              <p class="text-sm leading-relaxed text-neutral-600">{{ doctorNote }}</p>

              <div class="mt-4 flex items-center gap-3">
                <div class="h-9 w-9 rounded-full bg-neutral-300"></div>
                <div>
                  <p class="text-xs font-semibold text-sky-600">{{ selectedRecord.doctorName || portalData.patientProfile.verifiedBy }}</p>
                  <p class="text-[10px] text-neutral-500">Senior Radiologist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="rounded-xl bg-neutral-100 px-4 py-12 text-center text-neutral-500">
        No report selected.
      </div>
    </div>
  </section>
</template>
