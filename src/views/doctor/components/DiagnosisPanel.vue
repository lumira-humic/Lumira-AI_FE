<script setup>
import { ref, watch, computed } from "vue";


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
});

const emit = defineEmits(["update:diagnosis", "update:agreement"]);

// State
const selectedClass = ref(props.aiPrediction); // Defaults to AI's choice

// Dynamic Reference Images (SVG Data URIs)
const referenceImages = {
  Normal: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%2300FF00'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='white'%3ENormal Ref%3C/text%3E%3C/svg%3E",
  Benign: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23FFC107'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='white'%3EBenign Ref%3C/text%3E%3C/svg%3E",
  Malignant: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23FF0000'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='white'%3EMalignant Ref%3C/text%3E%3C/svg%3E"
};

const currentRefImage = computed(() => referenceImages[selectedClass.value]);

// Handle Click on Traffic Light
const setClass = (newClass) => {
  selectedClass.value = newClass;
  emit("update:diagnosis", newClass);

  // Smart Logic: If doctor picks what AI picked -> Agree. Else -> Disagree.
  const agreement = newClass === props.aiPrediction ? "agree" : "disagree";
  emit("update:agreement", agreement);
};

// Styling Helper
const getStatusClass = (status) => {
  const isActive = selectedClass.value === status;

  if (isActive) {
    switch (status) {
      case "Normal":
        return "bg-green-500 text-white shadow-lg scale-105 ring-2 ring-green-200";
      case "Benign":
        return "bg-yellow-400 text-white shadow-lg scale-105 ring-2 ring-yellow-200";
      case "Malignant":
        return "bg-red-600 text-white shadow-lg scale-105 ring-2 ring-red-200";
    }
  }
  // Inactive State (Dimmed)
  return "bg-white text-slate-400 hover:bg-slate-50 border border-slate-100 hover:scale-105";
};
</script>

<template>
  <div class="flex flex-col gap-6 h-full overflow-y-auto pr-2">
    <div class="bg-gray-100 p-5 rounded-xl border border-slate-200 shadow-sm">
      <div class="mb-4">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Patient ID
        </p>
        <p class="text-lg font-bold text-slate-700">{{ patientId }}</p>
      </div>
      <div class="mb-4">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Name
        </p>
        <p class="text-lg font-bold text-slate-700">
          {{ patientData?.name || "Unknown" }}
        </p>
      </div>
      <div>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Phone
        </p>
        <p class="text-lg font-bold text-slate-700">
          {{ patientData?.phone || "-" }}
        </p>
      </div>
    </div>
    <!-- Classification -->
    <div class="bg-gray-100 p-5 rounded-xl border border-slate-200 shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-slate-600">Classification</h3>
        <span class="text-xs font-bold px-2 py-1 rounded bg-slate-200 text-slate-500">
          AI: {{ aiPrediction }}
        </span>
      </div>

      <div class="flex flex-col gap-3 relative">
        <button @click="setClass('Normal')"
          class="p-3 rounded-lg text-center font-bold text-sm transition-all duration-300 ease-in-out"
          :class="getStatusClass('Normal')">
          Normal
        </button>

        <button @click="setClass('Benign')"
          class="p-3 rounded-lg text-center font-bold text-sm transition-all duration-300 ease-in-out"
          :class="getStatusClass('Benign')">
          Benign
        </button>

        <button @click="setClass('Malignant')"
          class="p-3 rounded-lg text-center font-bold text-sm transition-all duration-300 ease-in-out"
          :class="getStatusClass('Malignant')">
          Malignant
        </button>
      </div>

      <div class="mt-6 pt-4 border-t border-slate-200 animate-fade-in">
        <p class="text-xs font-bold text-slate-400 uppercase mb-2">
          Reference: {{ selectedClass }} Example
        </p>
        <div class="w-full h-32 bg-white rounded-lg overflow-hidden border border-slate-200 relative group">
          <img :src="currentRefImage"
            class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span class="bg-black/50 text-white text-xs px-2 py-1 rounded">
              Standard {{ selectedClass }}
            </span>
          </div>
        </div>
      </div>
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
