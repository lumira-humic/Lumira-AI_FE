<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ChevronRight, Sparkles, MessagesSquare } from "@lucide/vue";

import { useAppStore } from "@/stores/appStore";
import { usePatientPortalData } from "@/composables/usePatientPortalData";
import Loading from "@/components/common/Loading.vue";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";


const router = useRouter();
const appStore = useAppStore();
const { portalData, isLoading } = usePatientPortalData();

const diagnosisRecords = computed(() => portalData.value.diagnosisHistory ?? []);
const doctorChats = computed(() => portalData.value.doctorChatHistory ?? []);
const showMedgemmaPromo = computed(() => appStore.featureToggles.medgemmaEnabled);

const toneClass = (tone) => {
  if (tone === "green") return "bg-emerald-100 text-emerald-700";
  return "bg-sky-100 text-sky-700";
};

const openRecordDetail = (recordId) => {
  if (!recordId) return;
  router.push({ name: "patient-record-detail", params: { recordId } });
};

const openDoctorChat = () => {
  router.push({ name: "patient-chat-doctor" });
};

const openConsultAI = () => {
  router.push({ name: "patient-consult-ai" });
};
</script>

<template>
  <section class="relative flex h-full min-h-0 flex-col overflow-hidden p-3 sm:p-5">
    <!-- Background Image -->
    <img
      :src="LumiraLogo"
      alt="Lumira watermark"
      class="pointer-events-none absolute inset-0 m-auto hidden w-[42%] max-w-md opacity-10 sm:block"
    />
    <!-- Loading -->
    <div v-if="isLoading" class="flex min-h-0 flex-1 items-center justify-center">
      <Loading text="Loading patient history..." />
    </div>
    <!-- Main Data -->
    <div v-else class="relative z-10 flex min-h-0 flex-1 flex-col justify-between gap-5 overflow-y-auto pr-1">
      <!-- Main Content -->
      <div class="flex flex-col gap-6">
        <!-- Riwayat Diagnosis -->
        <section>
          <h2 class="text-xl font-bold text-neutral-800">Riwayat Diagnosis</h2>
          <p class="text-sm uppercase tracking-wide text-neutral-500">Archival records</p>
          <!-- Empty state -->
          <div
            v-if="diagnosisRecords.length === 0"
            class="mt-3 rounded-2xl border border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-400"
          >
            Belum ada data diagnosis tersedia.
          </div>
          <div v-else class="mt-3 flex gap-3 overflow-x-auto pb-2">
            <article
              v-for="record in diagnosisRecords"
              :key="record.id"
              class="min-w-[300px] sm:min-w-[340px] flex-shrink-0 rounded-2xl border border-neutral-300 bg-white p-4"
            >
              <!-- Record ID -->
              <p class="truncate text-2xl font-bold text-neutral-800">{{ record.id || '-' }}</p>
              <!-- Date Performed -->
              <div class="mt-3 flex items-center justify-between text-sm text-neutral-500">
                <span>Date Performed</span>
                <span class="font-semibold text-neutral-700">{{ record.performedDateLabel }}</span>
              </div>
              <!-- AI Result -->
              <div class="mt-2 flex items-center justify-between text-sm">
                <span class="text-neutral-500">AI Result</span>
                <span
                  class="rounded-full px-2 py-1 text-xs font-semibold"
                  :class="toneClass(record.resultTone)"
                >
                  {{ record.resultLabel }}
                </span>
              </div>
              <!-- Actions -->
              <div class="mt-5 space-y-2">
                <button
                  type="button"
                  @click="openRecordDetail(record.recordId)"
                  class="cursor-pointer w-full rounded-lg bg-[#1696e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1388cf] transition"
                >
                  View Full Report
                </button>
                <button
                  type="button"
                  @click="openDoctorChat"
                  class="cursor-pointer w-full rounded-lg border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50 transition"
                >
                  Chat with Doctor
                </button>
              </div>
            </article>
          </div>
        </section>
        <!-- Riwayat Chat Dokter -->
        <section>
          <h2 class="text-xl font-bold text-neutral-800">Riwayat Chat Dokter</h2>
          <p class="text-sm uppercase tracking-wide text-neutral-500">Previous consultations</p>
          <!-- Empty state -->
          <div
            v-if="doctorChats.length === 0"
            class="mt-3 rounded-2xl border border-neutral-200 bg-white px-4 py-8 text-center"
          >
            <MessagesSquare class="mx-auto mb-2 h-8 w-8 text-neutral-300" />
            <p class="text-sm text-neutral-400">Belum ada sesi chat dengan dokter.</p>
          </div>

          <div v-else class="mt-3 flex gap-3 overflow-x-auto pb-2">
            <article
              v-for="chat in doctorChats"
              :key="chat.id"
              @click="openDoctorChat"
              class="cursor-pointer min-w-[300px] sm:min-w-[340px] flex-shrink-0 rounded-2xl border border-neutral-300 bg-white p-4 transition hover:border-sky-300"
            >
              <div class="flex items-center gap-3">
                <!-- Avatar -->
                <div class="h-14 w-14 rounded-full bg-white/95 shrink-0 flex items-center justify-center overflow-hidden p-3">
                  <img src="@/assets/icons/icon-doctor.png" alt="Doctor Icon" class="w-full h-full object-contain">
                </div>  
                <div class="min-w-0 flex-1">
                  <p class="truncate text-base font-semibold text-neutral-800">
                    {{ chat.doctorName || '-' }}
                  </p>
                  <!-- Last message preview jika ada -->
                  <p
                    v-if="chat.lastMessagePreview"
                    class="truncate text-xs text-neutral-500 mt-0.5"
                  >
                    {{ chat.lastMessagePreview }}
                  </p>
                  <!-- Activity text (presence) -->
                  <p
                    v-else-if="chat.activityText"
                    class="truncate text-xs text-neutral-400 mt-0.5"
                  >
                    {{ chat.activityText }}
                  </p>
                </div>
                  <ChevronRight class="h-4 w-4 text-neutral-400" />
              </div>

              <!-- Related record ID -->
               <div class="flex justify-between items-center mt-3">
                   <p
                     v-if="chat.relatedRecordId"
                     class="text-xs text-neutral-500"
                   >
                     Related To: <span class="font-semibold text-neutral-700">{{ chat.relatedRecordId }}</span>
                   </p>
                   <span class="font-semibold text-xs text-neutral-700">{{ chat.dateLabel }}</span>
               </div>
            </article>
          </div>
        </section>
      </div>
      <!-- Banner MedGemma -->
      <div
        v-if="showMedgemmaPromo"
        class="mt-2 rounded-2xl bg-[#1696e5] px-4 py-10 text-white sm:px-6"
      >
        <div class="grid gap-4 sm:grid-cols-[84px_1fr] sm:items-center">
          <div class="mx-auto h-20 w-20">
            <img :src="LumiraLogo" alt="MedGemma" class="h-full w-full object-contain" />
          </div>
          <div>
            <p class="text-xs font-semibold tracking-wide text-sky-100">
              {{ portalData.medgemmaPromo.badge }}
            </p>
            <p class="text-2xl font-semibold sm:text-3xl">{{ portalData.medgemmaPromo.title }}</p>
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
