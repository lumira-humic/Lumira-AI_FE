<script setup>
import { computed } from "vue";

import BaseModal from "@/components/common/BaseModal.vue";


const props = defineProps({
  isOpen: Boolean,
  patient: Object,
});

const emit = defineEmits(["close", "reanalyze"]);

const aiData = computed(() => {
  if (
    !props.patient ||
    !props.patient.medical_records ||
    props.patient.medical_records.length === 0
  ) {
    return null;
  }

  const records = [...props.patient.medical_records].sort((a, b) => {
    return (b.id || 0) - (a.id || 0);
  });

  const record = records[0];

  if (!record.ai_diagnosis)
    return { diagnosis: "Processing...", confidence: 0, text: "Processing" };

  try {
    let parsed = record.ai_diagnosis;
    if (
      typeof parsed === "string" &&
      (parsed.startsWith("{") || parsed.startsWith("["))
    ) {
      parsed = JSON.parse(parsed);
    }

    if (parsed && typeof parsed === "object" && parsed.class) {
      return {
        diagnosis: parsed.class.charAt(0).toUpperCase() + parsed.class.slice(1),
        confidence:
          parsed.confidence && parsed.confidence <= 1
            ? (parsed.confidence * 100).toFixed(1)
            : parsed.confidence || 0,
        text:
          typeof record.ai_diagnosis === "string"
            ? record.ai_diagnosis
            : JSON.stringify(record.ai_diagnosis),
        timestamp: parsed.timestamp || null,
        analysis_id: parsed.analysis_id || null,
      };
    }
  } catch (e) {
  }

  const match = record.ai_diagnosis.match(
    /^(.*?)\s*[\(\[]?(\d+\.?\d*)%?[\)\]]?$/
  );

  if (match) {
    return {
      diagnosis: match[1].trim(),
      confidence: parseFloat(match[2]),
      text: record.ai_diagnosis,
      timestamp: null,
      analysis_id: null,
    };
  }

  return {
    diagnosis: record.ai_diagnosis,
    confidence: 0,
    text: record.ai_diagnosis,
    timestamp: null,
    analysis_id: null,
  };
});
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="AI Analysis Result"
    maxWidth="max-w-lg"
    @close="$emit('close')"
    :closeOnBackdrop="false"
  >
    <div v-if="patient" class="space-y-4">
      <div
        class="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100"
      >
        <img
          :src="patient.image || 'https://via.placeholder.com/150'"
          class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
          alt="Patient"
        />
        <div>
          <h4 class="font-bold text-gray-800">{{ patient.name }}</h4>
          <p class="text-sm text-gray-500">{{ patient.phone }}</p>
        </div>
      </div>

      <div>
        <h5 class="font-semibold text-gray-700 mb-2">Analysis Findings</h5>
        <div
          class="bg-gray-100 rounded-xl p-4 text-sm text-gray-600 space-y-2"
          v-if="aiData"
        >
          <div class="flex justify-between items-center">
            <span>Diagnosis Prediction:</span>
            <span
              class="font-bold px-2 py-0.5 rounded"
              :class="{
                'text-green-600 bg-green-100':
                  aiData.diagnosis.toLowerCase().includes('benign') ||
                  aiData.diagnosis.toLowerCase().includes('normal'),
                'text-red-600 bg-red-100': aiData.diagnosis
                  .toLowerCase()
                  .includes('malignant'),
                'text-yellow-600 bg-yellow-100':
                  !aiData.diagnosis.toLowerCase().includes('benign') &&
                  !aiData.diagnosis.toLowerCase().includes('malignant') &&
                  !aiData.diagnosis.toLowerCase().includes('normal'),
              }"
              >{{ aiData.diagnosis }}</span
            >
          </div>
          <div
            class="flex justify-between items-center"
            v-if="aiData.confidence > 0"
          >
            <span>Confidence Score:</span>
            <span class="font-bold text-gray-800"
              >{{ aiData.confidence }}%</span
            >
          </div>
          <div
            class="w-full bg-gray-200 rounded-full h-2.5 mt-2"
            v-if="aiData.confidence > 0"
          >
            <div
              class="h-2.5 rounded-full"
              :class="{
                'bg-green-500':
                  aiData.diagnosis.toLowerCase().includes('benign') ||
                  aiData.diagnosis.toLowerCase().includes('normal'),
                'bg-red-500': aiData.diagnosis
                  .toLowerCase()
                  .includes('malignant'),
                'bg-yellow-500':
                  !aiData.diagnosis.toLowerCase().includes('benign') &&
                  !aiData.diagnosis.toLowerCase().includes('malignant') &&
                  !aiData.diagnosis.toLowerCase().includes('normal'),
              }"
              :style="{ width: aiData.confidence + '%' }"
            ></div>
          </div>
          <div
            class="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500"
            v-if="aiData.analysis_id || aiData.timestamp"
          >
            <div v-if="aiData.analysis_id" class="flex justify-between">
              <span>Analysis ID:</span>
              <span class="font-mono"
                >{{ aiData.analysis_id.substring(0, 8) }}...</span
              >
            </div>
            <div v-if="aiData.timestamp" class="flex justify-between mt-1">
              <span>Time:</span>
              <span>{{ new Date(aiData.timestamp).toLocaleString() }}</span>
            </div>
          </div>
          <p class="pt-2 text-xs italic">
            *This is an AI-generated analysis. Please consult with a specialist
            for final diagnosis.
          </p>
        </div>
        <div
          v-else
          class="bg-gray-100 rounded-xl p-4 text-center text-gray-500 italic"
        >
          Analysis data not available.
        </div>
      </div>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p class="text-xs text-yellow-700">
          <strong>Note:</strong> The uploaded Ultrasound shows clear margins with
          no signs of microcalcifications.
        </p>
      </div>
    </div>
    <div v-else class="text-center py-8 text-gray-400">
      No patient selected.
    </div>

    <template #footer>
      <button
        @click="$emit('reanalyze')"
        class="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow"
      >
        Run Re-Analysis
      </button>
      <button
        @click="$emit('close')"
        class="cursor-pointer px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
      >
        Close
      </button>
    </template>
  </BaseModal>
</template>
