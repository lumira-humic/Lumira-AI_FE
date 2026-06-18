<script setup>
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import {
    BadgeCheck,
    Bot,
    Circle,
    FileText,
    Image as ImageIcon,
} from "@lucide/vue";

import BaseModal from "@/components/common/BaseModal.vue";
import Loading from "@/components/common/Loading.vue";
import { getApiErrorMessage } from "@/lib/apiResponse";
import { dataService } from "@/services/dataService";
import { getPublicImageUrl } from "@/services/storageService";


const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false,
    },
    patientId: {
        type: String,
        default: "",
    },
    recordId: {
        type: [String, Number],
        default: "",
    },
});

defineEmits(["close"]);

const isEnabled = computed(() => props.isOpen && Boolean(props.patientId));

const detailQuery = useQuery({
    queryKey: computed(() => ["doctor-chat-record", props.patientId]),
    queryFn: () => dataService.getPatientById(props.patientId),
    enabled: isEnabled,
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: 1,
});

const patient = computed(() => detailQuery.data.value || null);
const recordList = computed(() =>
    Array.isArray(patient.value?.medical_records)
        ? patient.value.medical_records
        : [],
);

const selectedRecord = computed(() => {
    if (props.recordId) {
        const match = recordList.value.find(
            (record) => String(record.id) === String(props.recordId),
        );
        if (match) return match;
    }

    if (patient.value?.latestRecord?.id) {
        return patient.value.latestRecord;
    }

    return recordList.value[0] || null;
});

const normalizeDiagnosisPayload = (rawDiagnosis) => {
    if (!rawDiagnosis) return { resultLabel: "-", confidence: 0 };

    const diagnosis = (() => {
        if (typeof rawDiagnosis !== "string") return rawDiagnosis;
        try {
            return JSON.parse(rawDiagnosis);
        } catch {
            return { class: rawDiagnosis };
        }
    })();

    return {
        resultLabel: String(
            diagnosis?.class || diagnosis?.label || diagnosis || "-",
        )
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        confidence: Number(diagnosis?.confidence || diagnosis?.score || 0),
    };
};

const formatLongDate = (rawDate) => {
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const aiDiagnosis = computed(() =>
    normalizeDiagnosisPayload(selectedRecord.value?.ai_diagnosis),
);

const confidenceLabel = computed(() => {
    const raw = Number(
        selectedRecord.value?.ai_confidence ?? aiDiagnosis.value.confidence ?? 0,
    );
    if (!Number.isFinite(raw) || raw <= 0) return "-";

    let pct = raw > 1 ? Math.min(raw, 100) : Math.min(raw * 100, 100);
    pct = Math.floor(pct * 100) / 100;
    if (pct === 100) return "100%";
    return `${pct.toFixed(2).padStart(5, "0")}%`;
});

const aiResultLabel = computed(() => aiDiagnosis.value.resultLabel || "-");

const doctorNote = computed(() => {
    return (
        selectedRecord.value?.doctor_notes || selectedRecord.value?.note || "-"
    );
});

const patientName = computed(() => patient.value?.name || "Patient");
const recordIdLabel = computed(() => selectedRecord.value?.id || "-");

const recordDateLabel = computed(() => {
    const rawDate =
        selectedRecord.value?.validated_at ||
        selectedRecord.value?.uploaded_at ||
        null;
    return rawDate ? formatLongDate(rawDate) : "-";
});

const doctorName = computed(() => selectedRecord.value?.doctor?.name || "-");
const recordStatus = computed(() => {
    const raw = selectedRecord.value?.validation_status;
    return raw ? String(raw).toUpperCase() : "";
});

const imageUrl = computed(() => {
    const raw =
        selectedRecord.value?.original_image_path || patient.value?.image || "";
    return raw ? getPublicImageUrl(raw) : "";
});

const isLoading = computed(
    () => detailQuery.isPending.value && !detailQuery.data.value,
);

const errorMessage = computed(() =>
    detailQuery.isError.value
        ? getApiErrorMessage(
            detailQuery.error.value,
            "Failed to load record detail.",
        )
        : "",
);
</script>

<template>
    <BaseModal :isOpen="isOpen" title="Patient Record" maxWidth="max-w-5xl" centerTitle @close="$emit('close')" :closeOnBackdrop="true">
        <div class="max-h-[75vh] overflow-y-auto pr-1">
            <div v-if="isLoading" class="py-8">
                <Loading text="Loading record..." />
            </div>
            <div v-else-if="errorMessage"
                class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {{ errorMessage }}
            </div>
            <template v-else-if="selectedRecord">
                <div class="grid gap-4 xl:grid-cols-[1fr_360px]">
                    <div class="space-y-4 rounded-2xl border border-neutral-300 bg-white/80 p-4 sm:p-6">
                        <div>
                            <p class="mb-1 text-xs uppercase tracking-wide text-neutral-500">
                                Patient File
                            </p>
                            <p class="text-2xl font-bold text-neutral-800 sm:text-3xl">
                                {{ patientName }}
                            </p>
                            <div class="mt-2 flex flex-wrap items-center gap-2">
                                <p
                                    class="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-800 sm:text-sm">
                                    {{ recordIdLabel }}
                                </p>
                                <Circle class="h-2 w-2 rounded-full bg-neutral-400 text-neutral-400" />
                                <p class="text-xs text-neutral-600 sm:text-sm">
                                    {{ recordDateLabel }}
                                </p>
                                <span v-if="recordStatus"
                                    class="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold uppercase text-sky-700">
                                    {{ recordStatus }}
                                </span>
                            </div>
                        </div>
                        <div
                            class="inline-flex items-center gap-2 rounded-lg border border-sky-500 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 sm:text-sm">
                            <BadgeCheck class="h-4 w-4" />
                            VERIFIED BY {{ doctorName }}
                        </div>
                        <div class="mt-4 overflow-hidden rounded-2xl border border-neutral-200">
                            <img v-if="imageUrl" :src="imageUrl" alt="Patient scan"
                                class="h-80 w-full rounded-xl object-contain sm:h-96" />
                            <div v-else class="flex h-80 items-center justify-center text-neutral-400 sm:h-96">
                                <div class="text-center">
                                    <ImageIcon class="mx-auto h-10 w-10 object-cover" />
                                    <p class="mt-2 text-sm">Scan image is not available yet</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div class="rounded-2xl border border-neutral-300 bg-white p-4">
                            <div class="mb-3 flex items-start justify-between gap-3">
                                <div
                                    class="inline-flex items-center gap-2 rounded-md bg-sky-100 px-2 py-1 text-sky-600">
                                    <Bot class="h-6 w-6" />
                                </div>
                                <div class="text-right">
                                    <p class="text-xl font-bold tracking-widest text-neutral-800">
                                        CONFIDENCE
                                    </p>
                                    <p class="text-3xl font-bold text-sky-600">
                                        {{ confidenceLabel }}
                                    </p>
                                </div>
                            </div>

                            <p class="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                AI Result
                            </p>
                            <p class="text-3xl font-bold text-neutral-800 sm:text-4xl">
                                {{ aiResultLabel }}
                            </p>
                        </div>
                        <div class="rounded-2xl border border-neutral-300 bg-white p-4">
                            <div class="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
                                <FileText class="h-4 w-4" />
                                Doctor's Note
                            </div>
                            <p class="text-sm leading-relaxed text-neutral-600">
                                {{ doctorNote }}
                            </p>
                            <div class="mt-4 flex items-center gap-3">
                                <div
                                    class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 p-2">
                                    <img src="@/assets/icons/icon-doctor.png" alt="Doctor"
                                        class="h-full w-full object-contain" />
                                </div>
                                <div>
                                    <p class="text-xs font-semibold text-sky-600">
                                        {{ doctorName }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <div v-else class="rounded-xl bg-neutral-100 px-4 py-12 text-center text-neutral-500">
                No record detail available.
            </div>
        </div>
    </BaseModal>
</template>
