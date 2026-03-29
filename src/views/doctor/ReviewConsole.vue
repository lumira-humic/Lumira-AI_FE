<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

import { dataService } from "@/services/dataService.js";
import MedicalCanvas from "./components/MedicalCanvas.vue";
import DiagnosisPanel from "./components/DiagnosisPanel.vue";
import ImageInputModal from "../../components/common/ImageInputModal.vue";


const route = useRoute();
const props = defineProps(["id"]);

const patientId = props.id;
const isEditMode = computed(() => route.query.mode === "edit");

const isLoading = ref(true);
const viewMode = ref("raw");
const brushType = ref("normal");
const brushSize = ref(1);
const brushOpacity = ref(0.65);

const doctorDrawings = ref([]);
const doctorNote = ref("");
const doctorAgreement = ref(null);
const isSaved = ref(false);

const savedDiagnosis = ref({ agreement: null, note: null, heatmapImage: null });
const showImageModal = ref(false);
const medicalCanvasRef = ref(null);

const currentImageSrc = ref(null);
const aiResultImageSrc = ref(null);
const patientData = ref({});
const aiPrediction = ref("Malignant");

onMounted(async () => {
  if (props.id) {
    try {
      isLoading.value = true;
      const data = await dataService.getPatientById(props.id);

      patientData.value = data;

      if (data.image) currentImageSrc.value = data.image;

      if (data.latestRecord?.ai_diagnosis) {
        let parsed = data.latestRecord.ai_diagnosis;
        if (
          typeof parsed === "string" &&
          (parsed.startsWith("{") || parsed.startsWith("["))
        ) {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            console.error("JSON Parse Error", e);
          }
        }

        if (typeof parsed === "object" && parsed.class) {
          aiPrediction.value =
            parsed.class.charAt(0).toUpperCase() + parsed.class.slice(1);
        } else {
          aiPrediction.value = data.latestRecord.ai_diagnosis;
        }
      }
      if (data.aiGradCamImage) {
        aiResultImageSrc.value = data.aiGradCamImage;
      } else {
        aiResultImageSrc.value = data.image || "";
      }
    } catch (e) {
      console.error("Error fetching patient:", e);
    } finally {
      isLoading.value = false;
    }
  }
});

const handleSave = async () => {
  if (!doctorAgreement.value) {
    alert("Please select if you Agree or Disagree with the diagnosis.");
    return;
  }

  const heatmapDataURL = medicalCanvasRef.value
    ? medicalCanvasRef.value.getStageDataURL()
    : null;

  savedDiagnosis.value = {
    agreement: doctorAgreement.value,
    note: doctorNote.value,
    heatmapImage: heatmapDataURL,
  };

  if (patientData.value?.latestRecord?.id) {
    try {
      await dataService.saveDoctorReview(patientData.value.latestRecord.id, {
        agreement: doctorAgreement.value,
        note: doctorNote.value,
        heatmapImage: heatmapDataURL,
      });
    } catch (e) {
      console.error("Failed to save to DB:", e);
    }
  }

  isSaved.value = true;
  const container = document.getElementById("workspace-container");
  if (container) {
    setTimeout(
      () =>
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" }),
      100
    );
  }
};

const handleImageUpdate = (newSrc) => {
  currentImageSrc.value = newSrc;
  doctorDrawings.value = [];
};
const setBrushType = (type) => {
  brushType.value = type;
  if (type === 'white' || type === 'erase') {
    brushOpacity.value = 1.0;
  } else {
    brushOpacity.value = 0.65;
  }
};
const getBrushButtonClass = (type) => {
  const base =
    "px-4 py-2 rounded-lg font-bold text-sm transition-all border-2 flex items-center gap-2";
  const isActive = brushType.value === type;
  if (!isActive)
    return base + " bg-white border-slate-200 text-slate-500 hover:bg-slate-50";
  switch (type) {
    case "normal":
      return base + " bg-green-100 border-green-500 text-green-700 shadow-sm";
    case "benign":
      return (
        base + " bg-yellow-100 border-yellow-500 text-yellow-700 shadow-sm"
      );
    case "malignant":
      return base + " bg-red-100 border-red-500 text-red-700 shadow-sm";
    case "nocancer":
      return base + " bg-blue-100 border-blue-500 text-blue-700 shadow-sm";
    case "white":
      return base + " bg-white border-slate-400 text-slate-700 shadow-sm ring-1 ring-slate-100";
    case "erase":
      return base + " bg-gray-100 border-gray-500 text-gray-700 shadow-sm";
  }
};
</script>

<template>
  <div class="h-full w-full bg-slate-50 flex flex-col overflow-hidden relative">
    <div id="workspace-container" class="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-medium text-slate-600">
          {{ isEditMode ? "Editing" : "Reviewing" }} Case #{{ patientId }}
        </h1>
      </div>
      <!-- Loader -->
      <div v-if="isLoading" class="flex justify-center p-12">
        <p class="text-slate-400 font-bold animate-pulse">
          Loading Patient Data...
        </p>
      </div>
      <!-- Main Content -->
      <div v-else class="flex flex-col lg:flex-row gap-6 max-w-full mx-auto">
        <div class="flex-1 min-w-0">
          <div class="bg-gray-100 rounded-3xl p-4 md:p-6 lg:p-8 mb-6 shadow-sm border border-slate-200 relative">
            <div class="flex justify-between items-center mb-6">
              <h2 class="font-bold text-slate-700 text-lg">Visual Analysis</h2>
              <button @click="showImageModal = true" class="text-xs font-bold text-[#0099ff] hover:underline">
                Upload New Image
              </button>
            </div>
            <div class="flex flex-row flex-wrap gap-4 justify-center items-start">
              <div class="flex flex-col items-center">
                <div
                  class="rounded-xl overflow-hidden border-4 border-white shadow-lg bg-black w-full max-w-[200px] aspect-square relative">
                  <img :src="aiResultImageSrc" class="w-full h-full object-contain" />
                  <div class="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    AI GradCam
                  </div>
                </div>
                <p class="mt-3 font-bold text-slate-600 uppercase tracking-widest text-xs">
                  AI Result
                </p>
                <!-- Previous Review Result (Only in Edit Mode / if exists) -->
                <div v-if="patientData.doctorBrushImage" class="mt-6 flex flex-col items-center">
                  <div
                    class="rounded-xl overflow-hidden border-4 border-white shadow-lg bg-black w-full max-w-[200px] aspect-square relative group cursor-pointer hover:scale-105 transition-transform"
                    @click="currentImageSrc = patientData.doctorBrushImage">
                    <img :src="patientData.doctorBrushImage" class="w-full h-full object-contain" />
                    <div
                      class="absolute top-2 left-2 bg-blue-600/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm shadow-sm">
                      Previous Review
                    </div>
                  </div>
                  <p class="mt-2 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                    Click to Load
                  </p>
                </div>
              </div>
              <div class="flex flex-col items-center">
                <MedicalCanvas ref="medicalCanvasRef" :baseImageSrc="currentImageSrc" :gradCamSrc="currentImageSrc"
                  :brushType="brushType" :brushSize="brushSize" :brushOpacity="brushOpacity" :viewMode="viewMode"
                  @update:drawings="(data) => (doctorDrawings = data)" />
              </div>
            </div>

            <div class="mt-8 flex flex-col gap-6 px-4 pt-6 border-t border-slate-200">
              <div class="flex items-center gap-4 border-b border-slate-200 pb-6">
                <span class="font-bold text-slate-600 w-24">Vis Mode:</span>
                <div class="flex bg-white rounded-lg p-1 border border-slate-200">
                  <button @click="viewMode = 'raw'" class="px-4 py-1.5 rounded-md text-sm font-bold transition-all"
                    :class="viewMode === 'raw'
                      ? 'bg-[#0099ff] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                      ">
                    Raw Pixels
                  </button>
                  <button @click="viewMode = 'normalized'"
                    class="px-4 py-1.5 rounded-md text-sm font-bold transition-all" :class="viewMode === 'normalized'
                      ? 'bg-[#0099ff] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                      ">
                    Normalized
                  </button>
                </div>
                <p class="text-xs text-slate-400 ml-2">
                  *{{
                    viewMode === "raw"
                      ? "Edit raw output blocks"
                      : "View smoothed heatmap"
                  }}
                </p>
              </div>

              <div class="flex items-center gap-4">
                <span class="font-bold text-slate-600 w-24">Focus Area:</span>
                <div class="flex flex-wrap gap-2">
                  <button @click="setBrushType('normal')" :class="getBrushButtonClass('normal')">
                    <div class="w-3 h-3 bg-green-500 rounded-sm"></div>
                    Low
                  </button>
                  <button @click="setBrushType('benign')" :class="getBrushButtonClass('benign')">
                    <div class="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                    Medium
                  </button>
                  <button @click="setBrushType('malignant')" :class="getBrushButtonClass('malignant')">
                    <div class="w-3 h-3 bg-red-600 rounded-sm"></div>
                    High
                  </button>
                  <button @click="setBrushType('nocancer')" :class="getBrushButtonClass('nocancer')">
                    <div class="w-3 h-3 bg-blue-600 rounded-sm"></div>
                    Normal
                  </button>
                  <button @click="setBrushType('white')" :class="getBrushButtonClass('white')">
                    <div class="w-3 h-3 bg-white border border-slate-300 rounded-sm"></div>
                    White
                  </button>
                  <div class="w-px h-8 bg-slate-200 mx-2"></div>
                  <button @click="setBrushType('erase')" :class="getBrushButtonClass('erase')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clip-rule="evenodd" />
                    </svg>
                    Erase
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <span class="font-bold text-slate-600 w-24">Brush Size:</span>
                <div
                  class="flex-1 flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-200 max-w-md">
                  <span class="text-xs font-bold text-slate-400">Small</span>
                  <input type="range" min="1" max="5" step="1" v-model.number="brushSize"
                    class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0099ff]" />
                  <span class="text-xs font-bold text-slate-400">Large</span>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <span class="font-bold text-slate-600 w-24">Opacity:</span>
                <div
                  class="flex-1 flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-200 max-w-md">
                  <span class="text-xs font-bold text-slate-400">0%</span>
                  <input type="range" min="0.1" max="1" step="0.05" v-model.number="brushOpacity"
                    class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0099ff]" />
                  <span class="text-xs font-bold text-slate-400">100%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="w-full mb-8">
            <button @click="handleSave"
              class="w-full bg-[#0099ff] hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-all active:scale-[0.99]">
              Submit Diagnosis
            </button>
          </div>

          <div class="bg-gray-100 rounded-xl p-6 border border-slate-200 flex flex-col md:flex-row gap-6">
            <div class="flex-1">
              <h3 class="font-bold text-slate-700 mb-4 text-lg">
                Doctor's Diagnosis
              </h3>
              <div class="flex items-center gap-4 text-sm font-bold text-slate-500">
                <span>Agree With AI?</span>
                <label class="flex items-center gap-2 cursor-pointer select-none"><input type="radio" value="agree"
                    v-model="doctorAgreement" class="accent-green-500 w-5 h-5" /><span
                    :class="doctorAgreement === 'agree' ? 'text-green-600' : ''">Agree</span></label>
                <label class="flex items-center gap-2 cursor-pointer select-none"><input type="radio" value="disagree"
                    v-model="doctorAgreement" class="accent-red-500 w-5 h-5" /><span :class="doctorAgreement === 'disagree' ? 'text-red-600' : ''
                      ">Disagree</span></label>
              </div>
            </div>
            <div class="flex-[2] flex gap-4">
              <label class="font-bold text-slate-700 whitespace-nowrap mt-2">Add Note</label>
              <textarea v-model="doctorNote"
                class="w-full h-24 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0099ff] outline-none resize-none bg-white"
                placeholder="Type Here.."></textarea>
            </div>
          </div>

          <div v-if="isSaved" class="mt-10 animate-fade-in-up">
            <h2 class="text-2xl font-bold text-slate-700 mb-6">
              Result By Doctor
            </h2>
            <div class="bg-gray-100 rounded-3xl p-8 border border-slate-200 flex flex-col md:flex-row gap-8">
              <div
                class="w-64 h-64 bg-black rounded-xl overflow-hidden border-4 border-white shadow-sm shrink-0 relative">
                <img :src="savedDiagnosis.heatmapImage || currentImageSrc" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 space-y-4">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-600">Agree With AI?</span>
                  <span class="font-bold" :class="savedDiagnosis.agreement === 'agree'
                    ? 'text-green-500'
                    : 'text-red-500'
                    ">{{
                      savedDiagnosis.agreement === "agree"
                        ? "Agree"
                        : "Disagree"
                    }}</span>
                </div>
                <div>
                  <span class="font-bold text-slate-600">Note:</span>
                  <p class="text-slate-500 text-sm mt-1">
                    {{ savedDiagnosis.note || "No notes." }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="w-full lg:w-72 shrink-0">
          <DiagnosisPanel :patientId="patientId" :patientData="patientData" :aiPrediction="aiPrediction"
            @update:diagnosis="(val) => console.log('Doctor selected:', val)"
            @update:agreement="(val) => (doctorAgreement = val)" />
        </div>
      </div>
      <ImageInputModal :isOpen="showImageModal" @close="showImageModal = false" @confirm="handleImageUpdate" />
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
