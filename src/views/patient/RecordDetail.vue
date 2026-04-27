<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, BadgeCheck, Bot, FileText, Circle, Image as ImageIcon } from "@lucide/vue";

import { usePatientPortalData } from "@/composables/usePatientPortalData";
import Loading from "@/components/common/Loading.vue";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";


const route = useRoute();

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

// confidence: sudah di-normalize ke angka 0-1 dari ai_confidence (mis. 0.9999..)
// Kalau lebih dari 1 artinya sudah dalam persen, kita clamp ke 100
const confidenceLabel = computed(() => {
  const raw = Number(selectedRecord.value?.confidence || portalData.value.detailFallback.confidence || 0);
  const pct = raw > 1 ? Math.min(raw, 100) : Math.min(raw * 100, 100);
  return `${pct.toFixed(1)}%`;
});

const aiResultLabel = computed(() => {
  return selectedRecord.value?.aiResultLabel || portalData.value.detailFallback.resultLabel || "-";
});

// note dari BE adalah doctor_notes (bukan doctor_note)
// sudah di-normalize ke field "note" di composable
const doctorNote = computed(() => {
  return selectedRecord.value?.note || portalData.value.detailFallback.note || "-";
});
</script>

<template>
  <section class="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#F2F2F2] p-3 sm:p-5">
    <img
      :src="LumiraLogo"
      alt="Lumira watermark"
      class="pointer-events-none absolute inset-0 m-auto hidden w-[42%] max-w-md opacity-10 sm:block"
    />

    <div v-if="isLoading" class="flex min-h-0 flex-1 items-center justify-center">
      <Loading text="Loading detail report..." />
    </div>

    <div v-else class="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <!-- Action Buttons -->
      <div class="flex items-center justify-between gap-3">
        <button
          type="button"
          @click="$router.back()"
          class="flex gap-1 cursor-pointer rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50"
        >
          <ArrowLeft class="h-4 w-4" />
          Back
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
      <!-- Main Content -->
      <template v-if="selectedRecord">
        <div class="grid gap-4 xl:grid-cols-[1fr_420px]">
          <!-- Left Data -->
          <div class="space-y-4 rounded-2xl border border-neutral-300 bg-white/80 p-4 sm:p-6">
            <div>
              <p class="text-xs uppercase tracking-wide mb-1 text-neutral-500">Patient File</p>
              <p class="text-4xl font-bold text-neutral-800">{{ portalData.patientProfile.name }}</p>
              <div class="flex gap-2 items-center mt-2">
                <p class="text-sm text-neutral-800 font-semibold px-3 py-1 rounded-full bg-neutral-200">{{ portalData.patientProfile.patientIdLabel }}</p>
                <Circle class="w-2 h-2 text-neutral-400 bg-neutral-400 rounded-full"/>
                <p class="text-sm text-neutral-600">{{ portalData.patientProfile.scanDateLabel }}</p>
              </div>
            </div>

            <div class="inline-flex items-center gap-2 rounded-lg bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-700 border border-sky-500">
              <BadgeCheck class="h-4 w-4" />
              VERIFIED BY {{ selectedRecord.doctorName || portalData.patientProfile.verifiedBy || "-" }}
            </div>

            <div class="overflow-hidden rounded-2xl border border-neutral-200 mt-4">
              <img
                v-if="selectedRecord.imageUrl"
                :src="selectedRecord.imageUrl"
                alt="Patient scan"
                class="h-105 w-full object-contain rounded-xl"
              />
              <div v-else class="flex h-105 items-center justify-center text-neutral-400">
                <div class="text-center">
                  <ImageIcon class="mx-auto h-10 w-10 object-cover" />
                  <p class="mt-2 text-sm">Scan image is not available yet</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Right Data -->
          <div class="space-y-4">
            <div class="rounded-2xl border-t-4 border-sky-500 rounded-t-2xl bg-white p-4">
              <div class="mb-3 flex items-start justify-between gap-3">
                <div class="inline-flex items-center gap-2 rounded-md bg-sky-100 px-2 py-1 text-sky-600">
                  <Bot class="h-6 w-6" />
                </div>
                <div class="text-right">
                  <p class="text-xl font-bold tracking-widest text-neutral-800">CONFIDENCE</p>
                  <p class="text-3xl font-bold text-sky-600">{{ confidenceLabel }}</p>
                </div>
              </div>

              <p class="text-sm font-semibold uppercase tracking-wide text-neutral-500">AI Result</p>
              <p class="text-4xl font-bold text-neutral-800">{{ aiResultLabel }}</p>

              <!-- <div class="mt-4 rounded-xl bg-[#1696e5] p-3 text-white">
                <p class="text-sm font-semibold">BI-RADS 2</p>
                <p class="mt-1 text-sm">Characteristic of non-malignant tissue with no suspicious calcification findings.</p>
              </div> -->
            </div>
            <div class="rounded-2xl bg-white border-b-4 border-sky-500 p-4">
              <div class="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <FileText class="h-4 w-4" />
                Doctor's Note
              </div>
              <p class="text-sm leading-relaxed text-neutral-600">{{ doctorNote }}</p>

              <div class="mt-4 flex items-center gap-3">
                <div class="h-9 w-9 rounded-full bg-neutral-300"></div>
                <div>
                  <p class="text-xs font-semibold text-sky-600">{{ selectedRecord.doctorName || portalData.patientProfile.verifiedBy || "-" }}</p>
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
