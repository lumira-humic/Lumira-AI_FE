<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ChevronRight, Sparkles } from "@lucide/vue";

import { useAppStore } from "@/stores/appStore";
import { usePatientPortalData } from "@/composables/usePatientPortalData";
import Loading from "@/components/common/Loading.vue";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";


const router = useRouter();
const appStore = useAppStore();
const { portalData, isLoading } = usePatientPortalData();

const diagnosisRecords = computed(() => portalData.value.diagnosisHistory || []);
const doctorChats = computed(() => portalData.value.doctorChatHistory || []);

const showMedgemmaPromo = computed(() => {
    return appStore.featureToggles.medgemmaEnabled;
});

const toneClass = (tone) => {
    if (tone === "green") {
        return "bg-emerald-100 text-emerald-700";
    }

    return "bg-sky-100 text-sky-700";
};

const openRecordDetail = (recordId) => {
    router.push({
        name: "patient-record-detail",
        params: { recordId },
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
        <img :src="LumiraLogo" alt="Lumira watermark"
            class="pointer-events-none absolute inset-0 m-auto hidden w-[42%] max-w-md opacity-10 sm:block" />

        <div v-if="isLoading" class="flex min-h-0 flex-1 items-center justify-center">
            <Loading text="Loading patient history..." />
        </div>

        <div v-else class="relative z-10 flex min-h-0 flex-1 flex-col justify-between overflow-y-auto pr-1">
            <!-- Main Content -->
            <div class="flex flex-col gap-5">
                <section>
                    <h2 class="text-xl font-bold text-neutral-800">Riwayat Diagnosis</h2>
                    <p class="text-sm uppercase tracking-wide text-neutral-500">Archival records</p>
    
                    <div class="mt-3 flex gap-3 overflow-x-auto pb-2">
                        <article v-for="record in diagnosisRecords" :key="record.id"
                            class="min-w-[320px] rounded-2xl border border-neutral-300 bg-white p-4">
                            <p class="text-xs font-semibold text-neutral-500">{{ record.code }}</p>
                            <p class="mt-1 text-2xl font-semibold text-neutral-800">{{ record.title }}</p>
    
                            <div class="mt-2 flex items-center justify-between text-sm text-neutral-500">
                                <span>Date Performed</span>
                                <span class="font-semibold text-neutral-700">{{ record.performedDateLabel }}</span>
                            </div>
    
                            <div class="mt-2 flex items-center justify-between text-sm">
                                <span class="text-neutral-500">Primary Result</span>
                                <span class="rounded-full px-2 py-1 text-xs font-semibold"
                                    :class="toneClass(record.resultTone)">
                                    {{ record.resultLabel }}
                                </span>
                            </div>
    
                            <div class="mt-4 space-y-2">
                                <button type="button" @click="openRecordDetail(record.recordId)"
                                    class="cursor-pointer w-full rounded-lg bg-[#1696e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1388cf]">
                                    View Full Report
                                </button>
                                <button type="button" @click="openDoctorChat"
                                    class="cursor-pointer w-full rounded-lg border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50">
                                    Chat with Doctor
                                </button>
                            </div>
                        </article>
                    </div>
                </section>
                <section>
                    <h2 class="text-xl font-bold text-neutral-800">Riwayat Chat Dokter</h2>
                    <p class="text-sm uppercase tracking-wide text-neutral-500">Previous consultations</p>
    
                    <div class="mt-3 flex gap-3 overflow-x-auto pb-2">
                        <article v-for="chat in doctorChats" :key="chat.id" @click="openDoctorChat"
                            class="cursor-pointer min-w-[320px] rounded-2xl border border-neutral-300 bg-white p-4 shadow">
                            <div class="flex items-center gap-3">
                                <div class="h-12 w-12 rounded-full bg-sky-100"></div>
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-lg font-semibold text-neutral-800">{{ chat.doctorName }}</p>
                                    <p class="text-xs text-neutral-500">{{ chat.specialty }}</p>
                                    <p class="text-xs text-neutral-500">Related to: {{ chat.relatedCode }}</p>
                                </div>
                                <ChevronRight class="h-5 w-5 text-neutral-500" />
                            </div>
    
                            <p class="mt-2 text-right text-xs text-neutral-500">{{ chat.dateLabel }}</p>
                        </article>
                    </div>
                </section>
            </div>
            <!-- Banner Medgemma -->
            <div v-if="showMedgemmaPromo" class="rounded-2xl bg-[#1696e5] px-4 py-10 text-white shadow sm:px-6">
                <div class="grid gap-4 sm:grid-cols-[84px_1fr] sm:items-center">
                    <div class="mx-auto h-20 w-20">
                        <img :src="LumiraLogo" alt="MedGemma" class="h-full w-full object-contain" />
                    </div>
                    <div>
                        <p class="text-xs font-semibold tracking-wide text-sky-100">{{ portalData.medgemmaPromo.badge }}
                        </p>
                        <p class="text-3xl font-semibold">{{ portalData.medgemmaPromo.title }}</p>
                        <p class="mt-1 text-sm text-sky-100">{{ portalData.medgemmaPromo.subtitle }}</p>
                    </div>
                </div>

                <button type="button" @click="openConsultAI"
                    class="mt-10 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-base font-semibold text-[#0F8FDD] transition hover:bg-sky-100">
                    <Sparkles class="h-4 w-4" />
                    {{ portalData.medgemmaPromo.cta }}
                </button>
            </div>
        </div>
    </section>
</template>
