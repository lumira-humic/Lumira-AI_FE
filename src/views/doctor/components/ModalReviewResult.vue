<script setup>
import { computed } from "vue";

import BaseModal from "@/components/common/BaseModal.vue";
import { getPublicImageUrl } from "@/services/storageService";


const props = defineProps({
  isOpen: Boolean,
  patient: Object,
});

const emit = defineEmits(["close", "download"]);

const reviewData = computed(() => {
  if (!props.patient?.medical_records?.length) return null;

  const records = [...props.patient.medical_records].sort(
    (a, b) => (b.id || 0) - (a.id || 0),
  );

  const record = records[0];
  if (record.validation_status !== "VALIDATED") return null;

  let aiClass = "-";
  let aiConfidence = 0;
  try {
    let parsed = record.ai_diagnosis;
    if (typeof parsed === "string" && parsed.startsWith("{")) {
      parsed = JSON.parse(parsed);
    }
    if (parsed?.class) {
      aiClass = parsed.class.charAt(0).toUpperCase() + parsed.class.slice(1);
      aiConfidence =
        parsed.confidence && parsed.confidence <= 1
          ? (parsed.confidence * 100).toFixed(1)
          : parsed.confidence || 0;
    }
  } catch (e) {
    aiClass = String(record.ai_diagnosis);
  }

  const brushImageUrl = record.doctor_brush_path
    ? getPublicImageUrl(record.doctor_brush_path, "breast-cancer-images")
    : null;

  const gradCamUrl = record.ai_gradcam_path
    ? getPublicImageUrl(record.ai_gradcam_path, "breast-cancer-images")
    : null;

  const originalUrl = record.original_image_path
    ? getPublicImageUrl(record.original_image_path, "breast-cancer-images")
    : null;

  return {
    agreement: record.is_ai_accurate ? "Agree" : "Disagree",
    isAgree: record.is_ai_accurate,
    doctorDiagnosis: record.doctor_diagnosis || "-",
    doctorNotes: record.doctor_notes || "No notes provided.",
    brushImage: brushImageUrl,
    gradCamImage: gradCamUrl,
    originalImage: originalUrl,
    aiClass,
    aiConfidence,
    validatedAt: record.validated_at
      ? new Date(record.validated_at).toLocaleString()
      : null,
  };
});
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="Review Result"
    maxWidth="max-w-2xl"
    @close="$emit('close')"
  >
    <!-- Main Content -->
    <div v-if="patient && reviewData" class="space-y-5">
      <!-- Patient Info -->
      <div
        class="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100"
      >
        <img
          :src="patient.image || 'https://via.placeholder.com/150'"
          class="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
          alt="Patient"
        />
        <div>
          <h4 class="font-bold text-gray-800">{{ patient.name }}</h4>
          <p class="text-sm text-gray-500">P00{{ patient.id }}</p>
        </div>
        <div
          class="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"
        >
          ✓ Reviewed
        </div>
      </div>
      <!-- AI vs Doctor -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- AI Result -->
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h5
            class="font-bold text-gray-600 text-sm mb-3 uppercase tracking-wide"
          >
            AI Prediction
          </h5>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-500">Diagnosis:</span>
            <span
              class="font-bold px-2 py-0.5 rounded text-sm"
              :class="{
                'text-green-600 bg-green-100':
                  reviewData.aiClass.toLowerCase().includes('benign') ||
                  reviewData.aiClass.toLowerCase().includes('normal'),
                'text-red-600 bg-red-100': reviewData.aiClass
                  .toLowerCase()
                  .includes('malignant'),
              }"
              >{{ reviewData.aiClass }}</span
            >
          </div>
          <div
            class="flex items-center justify-between"
            v-if="reviewData.aiConfidence > 0"
          >
            <span class="text-sm text-gray-500">Confidence:</span>
            <span class="font-bold text-gray-700 text-sm"
              >{{ reviewData.aiConfidence }}%</span
            >
          </div>
        </div>

        <!-- Doctor Result -->
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h5
            class="font-bold text-gray-600 text-sm mb-3 uppercase tracking-wide"
          >
            Doctor's Review
          </h5>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-500">Agreement:</span>
            <span
              class="font-bold px-2 py-0.5 rounded text-sm"
              :class="
                reviewData.isAgree
                  ? 'text-green-600 bg-green-100'
                  : 'text-red-600 bg-red-100'
              "
              >{{ reviewData.agreement }}</span
            >
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Diagnosis:</span>
            <span class="font-bold text-gray-700 text-sm">{{
              reviewData.doctorDiagnosis
            }}</span>
          </div>
        </div>
      </div>
      <!-- Images -->
      <div>
        <h5
          class="font-bold text-gray-600 text-sm mb-3 uppercase tracking-wide"
        >
          Visual Results
        </h5>
        <div class="flex flex-wrap gap-4 justify-center">
          <div
            v-if="reviewData.gradCamImage"
            class="flex flex-col items-center"
          >
            <div
              class="w-40 h-40 rounded-xl overflow-hidden border-2 border-gray-200 bg-black"
            >
              <img
                :src="reviewData.gradCamImage"
                class="w-full h-full object-contain"
              />
            </div>
            <span class="text-xs text-gray-500 mt-2 font-semibold"
              >AI GradCAM</span
            >
          </div>
          <div v-if="reviewData.brushImage" class="flex flex-col items-center">
            <div
              class="w-40 h-40 rounded-xl overflow-hidden border-2 border-gray-200 bg-black"
            >
              <img
                :src="reviewData.brushImage"
                class="w-full h-full object-contain"
              />
            </div>
            <span class="text-xs text-gray-500 mt-2 font-semibold"
              >Doctor's Markup</span
            >
          </div>
          <div
            v-if="
              !reviewData.gradCamImage &&
              !reviewData.brushImage &&
              reviewData.originalImage
            "
            class="flex flex-col items-center"
          >
            <div
              class="w-40 h-40 rounded-xl overflow-hidden border-2 border-gray-200 bg-black"
            >
              <img
                :src="reviewData.originalImage"
                class="w-full h-full object-contain"
              />
            </div>
            <span class="text-xs text-gray-500 mt-2 font-semibold"
              >Original Image</span
            >
          </div>
        </div>
      </div>
      <!-- Doctor Notes -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h5 class="font-bold text-yellow-700 text-sm mb-1">Doctor's Notes</h5>
        <p class="text-sm text-yellow-800">{{ reviewData.doctorNotes }}</p>
      </div>
      <!-- Timestamp -->
      <div v-if="reviewData.validatedAt" class="text-center">
        <span class="text-xs text-gray-400"
          >Reviewed on {{ reviewData.validatedAt }}</span
        >
      </div>
    </div>
    <!-- Fallback if no review data available -->
    <div v-else class="text-center py-8 text-gray-400">
      No review data available.
    </div>

    <template #footer>
      <button
        @click="$emit('download')"
        class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="w-4 h-4"
        >
          <path
            d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z"
          />
          <path
            d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"
          />
        </svg>
        Download Image
      </button>
      <button
        @click="$emit('close')"
        class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
      >
        Close
      </button>
    </template>
  </BaseModal>
</template>
