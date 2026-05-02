<script setup>
import { ref, computed, watch } from "vue";


const props = defineProps({
  patientId: String,
  aiPrediction: {
    type: String,
    default: "Malignant",
  },
  patientData: {
    type: Object,
    default: () => ({}),
  },
  /**
   * Pre-select a classification (used in edit mode to restore doctor_diagnosis).
   * Should be Title-cased: "Normal" | "Benign" | "Malignant"
   */
  initialDiagnosis: {
    type: String,
    default: null,
  },
  /**
   * When true, the classification buttons are disabled (locked).
   * Applied when doctor has chosen "Agree" — diagnosis must follow AI prediction.
   */
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:diagnosis", "update:agreement"]);

// Resolve initial selected class
// Priority: initialDiagnosis (edit mode pre-fill) → aiPrediction (AI default)
const resolveInitial = () => {
  if (props.initialDiagnosis) {
    const v = String(props.initialDiagnosis).trim();
    // Normalize to Title-case to match button values
    return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  }
  return props.aiPrediction ?? "Malignant";
};

const selectedClass = ref(resolveInitial());

// Re-sync when edit-mode data arrives asynchronously
watch(
  () => props.initialDiagnosis,
  (next) => {
    if (next) {
      const v = String(next).trim();
      selectedClass.value = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
    }
  },
);

// Also sync when aiPrediction changes (e.g. data loaded after mount)
watch(
  () => props.aiPrediction,
  (next) => {
    if (!props.initialDiagnosis && next) {
      selectedClass.value = next;
    }
  },
);

// Classification selection
/**
 * Handle click on a classification button.
 * When disabled (agreement === 'agree'), buttons are inert.
 *
 * The logic:
 *   - If doctor picks what AI picked → agreement = "agree"
 *   - Otherwise → agreement = "disagree"
 */
const setClass = (newClass) => {
  if (props.disabled) return;
  selectedClass.value = newClass;
  emit("update:diagnosis", newClass);

  const agreement = newClass === props.aiPrediction ? "agree" : "disagree";
  emit("update:agreement", agreement);
};

const getStatusClass = (status) => {
  const isActive = selectedClass.value === status;

  if (props.disabled) {
    if (isActive) {
      switch (status) {
        case "Normal":    return "bg-green-200 text-green-600 ring-2 ring-green-200 cursor-not-allowed";
        case "Benign":    return "bg-yellow-200 text-yellow-600 ring-2 ring-yellow-200 cursor-not-allowed";
        case "Malignant": return "bg-red-200 text-red-600 ring-2 ring-red-200 cursor-not-allowed";
      }
    }
    return "bg-neutral-100 text-neutral-300 border border-neutral-200 cursor-not-allowed";
  }

  if (isActive) {
    switch (status) {
      case "Normal":    return "bg-green-500 text-white shadow-lg scale-105 ring-2 ring-green-200";
      case "Benign":    return "bg-yellow-400 text-white shadow-lg scale-105 ring-2 ring-yellow-200";
      case "Malignant": return "bg-red-600 text-white shadow-lg scale-105 ring-2 ring-red-200";
    }
  }
  // Inactive
  return "bg-white text-neutral-400 hover:bg-neutral-50 border border-neutral-300 hover:scale-105";
};

const lockBadgeText = computed(() =>
  props.disabled ? "Locked (Agreed with AI)" : null,
);
</script>

<template>
  <div class="flex flex-col gap-3 h-full overflow-y-auto pr-2">
    <!-- Patient Info -->
    <div class="bg-white p-5 rounded-xl">
      <div class="mb-4">
        <p class="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Patient ID
        </p>
        <p class="text-lg font-bold text-neutral-700">{{ patientId }}</p>
      </div>
      <div class="mb-4">
        <p class="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Name
        </p>
        <p class="text-lg font-bold text-neutral-700">
          {{ patientData?.name || "Unknown" }}
        </p>
      </div>
      <div>
        <p class="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Phone
        </p>
        <p class="text-lg font-bold text-neutral-700">
          {{ patientData?.phone || "-" }}
        </p>
      </div>
    </div>

    <!-- Classification -->
    <div class="bg-white p-5 rounded-xl">
      <div class="mb-4 flex items-center justify-between gap-2">
        <h3 class="text-center font-bold text-neutral-800">Classification Result</h3>
        <!-- Lock badge shown when disabled (doctor agreed with AI) -->
        <span
          v-if="lockBadgeText"
          class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400 border border-neutral-200"
        >
          {{ lockBadgeText }}
        </span>
      </div>

      <!-- Classification Options -->
      <div class="flex flex-col gap-3 relative">
        <button
          @click="setClass('Normal')"
          :disabled="disabled"
          class="p-3 rounded-lg text-center font-bold text-sm transition-all duration-300 ease-in-out"
          :class="[getStatusClass('Normal'), disabled ? 'cursor-not-allowed' : 'cursor-pointer']"
        >
          Normal
        </button>

        <button
          @click="setClass('Benign')"
          :disabled="disabled"
          class="p-3 rounded-lg text-center font-bold text-sm transition-all duration-300 ease-in-out"
          :class="[getStatusClass('Benign'), disabled ? 'cursor-not-allowed' : 'cursor-pointer']"
        >
          Benign
        </button>

        <button
          @click="setClass('Malignant')"
          :disabled="disabled"
          class="p-3 rounded-lg text-center font-bold text-sm transition-all duration-300 ease-in-out"
          :class="[getStatusClass('Malignant'), disabled ? 'cursor-not-allowed' : 'cursor-pointer']"
        >
          Malignant
        </button>
      </div>

      <!-- Helper text -->
      <p v-if="disabled" class="mt-3 text-[11px] text-neutral-400 text-center">
        Pilih <strong>Disagree</strong> untuk mengubah diagnosis
      </p>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
