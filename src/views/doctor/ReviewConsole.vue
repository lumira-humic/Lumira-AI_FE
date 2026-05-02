<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ChevronLeft } from '@lucide/vue';

import { dataService } from "@/services/dataService.js";
import { getApiErrorMessage } from "@/lib/apiResponse";
import { useToast } from "@/composables/useToast";
import MedicalCanvas from "./components/MedicalCanvas.vue";
import DiagnosisPanel from "./components/DiagnosisPanel.vue";
import ImageInputModal from "../../components/common/ImageInputModal.vue";


const route = useRoute();
const props = defineProps(["id"]);
const toast = useToast();

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
// doctorDiagnosis: tracks selection from DiagnosisPanel
// Default = AI prediction; updated via @update:diagnosis
const doctorDiagnosis = ref("");
const isSaved = ref(false);
const isSubmitting = ref(false);

// diagnosisPanelDisabled: lock DiagnosisPanel when doctor agrees with AI
// If agreed → doctor's diagnosis must equal AI prediction (no change allowed)
const diagnosisPanelDisabled = computed(() => doctorAgreement.value === "agree");

const savedDiagnosis = ref({ agreement: null, note: null, doctorBrushPath: null, ai_diagnosis: null, doctorDiagnosis: null });
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
        if (typeof parsed === "string" && (parsed.startsWith("{") || parsed.startsWith("["))) {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            console.error("JSON Parse Error", e);
          }
        }
        aiPrediction.value = typeof parsed === "object" && parsed.class
          ? parsed.class.charAt(0).toUpperCase() + parsed.class.slice(1)
          : String(data.latestRecord.ai_diagnosis);
      }

      if (data.aiGradCamImage) {
        aiResultImageSrc.value = data.aiGradCamImage;
      } else {
        aiResultImageSrc.value = data.image || "";
      }

      if (isEditMode.value && data.latestRecord) {
        const rec = data.latestRecord;
        doctorAgreement.value = rec.agreement ?? null;
        doctorNote.value = rec.note ?? rec.doctor_notes ?? "";
        if (rec.doctor_diagnosis) {
          const d = String(rec.doctor_diagnosis).trim();
          doctorDiagnosis.value = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
        }
      } else if (data.latestRecord?.ai_diagnosis) {
        doctorDiagnosis.value = aiPrediction.value;
      }
    } catch (e) {
      console.error("Error fetching patient:", e);
    } finally {
      isLoading.value = false;
    }
  }
});


const handleSave = async () => {
  if (isSubmitting.value) return;
  if (!doctorAgreement.value) {
    toast.warning("Please select if you Agree or Disagree with the diagnosis");
    return;
  }
  if (!patientData.value?.latestRecord?.id) {
    toast.error("Medical record not found");
    return;
  }

  isSubmitting.value = true;

  try {
    const heatmapDataURL = medicalCanvasRef.value?.getStageDataURL() ?? null;

    const formData = new FormData();
    formData.append("agreement", doctorAgreement.value);
    formData.append("note", doctorNote.value || "");
    formData.append("doctorDiagnosis", String(doctorDiagnosis.value || aiPrediction.value).toLowerCase());

    if (heatmapDataURL) {
      const res = await fetch(heatmapDataURL);
      const blob = await res.blob();
      formData.append("doctorBrushPath", blob, "heatmap.png");
    }

    const recordId = patientData.value.latestRecord.id;

    const response = isEditMode.value
      ? await dataService.editDoctorReview(recordId, formData)
      : await dataService.saveDoctorReview(recordId, formData);

    savedDiagnosis.value = {
      agreement: response?.agreement ?? null,
      note: response?.note ?? response?.doctor_notes ?? null,
      doctorBrushPath: response?.doctorBrushPath ?? response?.doctor_brush_path ?? null,
      ai_diagnosis: response?.ai_diagnosis ?? null,
      doctorDiagnosis: response?.doctor_diagnosis ?? doctorDiagnosis.value ?? null,
    };

    isSaved.value = true;
    toast.success("Diagnosis submitted successfully.");

    setTimeout(() => {
      document.getElementById("workspace-container")
        ?.scrollTo({ top: 99999, behavior: "smooth" });
    }, 100);

  } catch (e) {
    isSaved.value = false;
    toast.error(getApiErrorMessage(e, "Failed to submit diagnosis."));
  } finally {
    isSubmitting.value = false;
  }
};


const getAiDiagnosisBadgeClass = (diagnosis) => {
  const val = String(diagnosis || "").toLowerCase();
  if (val === "normal") return "bg-emerald-500";
  if (val === "benign") return "bg-yellow-500";
  if (val === "malignant") return "bg-red-500";
  return "bg-neutral-400";
};

const handleImageUpdate = (newSrc) => {
  currentImageSrc.value = newSrc;
  doctorDrawings.value = [];
};

const setBrushType = (type) => {
  brushType.value = type;
  if (type === "white" || type === "erase") {
    brushOpacity.value = 1.0;
  } else {
    brushOpacity.value = 0.65;
  }
};

const getBrushButtonClass = (type) => {
  const base = "px-4 py-2 rounded-lg font-bold text-sm transition-all border-2 flex items-center gap-2";
  const isActive = brushType.value === type;
  if (!isActive) return base + " bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50";
  switch (type) {
    case "normal":    return base + " bg-green-100 border-green-500 text-green-700 shadow-sm";
    case "benign":    return base + " bg-yellow-100 border-yellow-500 text-yellow-700 shadow-sm";
    case "malignant": return base + " bg-red-100 border-red-500 text-red-700 shadow-sm";
    case "nocancer":  return base + " bg-blue-100 border-blue-500 text-blue-700 shadow-sm";
    case "white":     return base + " bg-white border-neutral-400 text-neutral-700 shadow-sm ring-1 ring-neutral-100";
    case "erase":     return base + " bg-neutral-100 border-neutral-500 text-neutral-700 shadow-sm";
    default:          return base + " bg-white border-neutral-200 text-neutral-500";
  }
};
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden relative">
    <div id="workspace-container" class="flex-1 overflow-y-auto">
      <!-- Header -->
      <div class="grid grid-cols-3 text-center mb-8">
        <div class="col-span-1">
          <button @click="$router.back()" class="cursor-pointer bg-white hover:bg-sky-50 text-sky-700 px-4 py-2 rounded-lg font-bold text-sm border border-sky-300 transition-all flex items-center">
            <ChevronLeft class="w-4 h-4 mr-1" />
            Back
          </button>
        </div>
        <h1 class="text-2xl font-medium text-slate-600">
          {{ isEditMode ? "Editing" : "Reviewing" }} Case #{{ patientId }}
        </h1>
        <div class="col-span-1"></div>
      </div>
      <!-- Loader -->
      <div v-if="isLoading" class="flex justify-center p-12">
        <p class="text-neutral-400 font-bold animate-pulse">
          Loading Patient Data...
        </p>
      </div>
      <!-- Main Content -->
      <div v-else class="relative flex flex-col lg:flex-row gap-6 max-w-full mx-auto">
        <div class="flex-1 min-w-0 space-y-6">
          <div class="bg-white rounded-2xl p-4 md:p-6 lg:p-8 relative">
            <!-- Main Data -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[500px] overflow-hidden">
              <!-- AI Result-->
              <div class="col-span-1 w-full h-full flex flex-col items-center min-w-0 max-h-[400px]">
                <div
                  class="w-full h-full rounded-xl bg-white relative">
                  <img :src="aiResultImageSrc" class="w-full h-full object-contain rounded-xl" />
                  <div class="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    AI GradCam
                  </div>
                </div>
                <p class="mt-3 font-bold text-neutral-600 uppercase tracking-widest text-xs">
                  AI Result
                </p>
              </div>
              <!-- RAW data image -->
              <div class="col-span-1 w-full h-full flex flex-col items-center min-w-0">
                <div class="max-w-full overflow-x-auto">
                  <MedicalCanvas 
                    ref="medicalCanvasRef" 
                    :baseImageSrc="currentImageSrc" 
                    :gradCamSrc="currentImageSrc"
                    :brushType="brushType" 
                    :brushSize="brushSize" 
                    :brushOpacity="brushOpacity" 
                    :viewMode="viewMode"
                    @update:drawings="(data) => (doctorDrawings = data)" />
                </div>
              </div>
            </div>
            <!-- Tools -->
            <div class="mt-8 flex flex-col gap-6 px-4 pt-6 border-t border-neutral-400">
              <!-- Visual Mode -->
              <div class="flex items-center gap-4">
                <span class="font-bold text-neutral-600 w-30">Visual Mode:</span>
                <div class="flex bg-white rounded-lg p-2 border border-neutral-200">
                  <button @click="viewMode = 'raw'" class="cursor-pointer px-4 py-1.5 rounded-md text-sm font-bold transition-all"
                    :class="viewMode === 'raw'
                      ? 'bg-[#0099ff] text-white shadow-sm'
                      : 'text-neutral-500 hover:bg-neutral-50'
                      ">
                    Raw Pixels
                  </button>
                  <button @click="viewMode = 'normalized'"
                    class="cursor-pointer px-4 py-1.5 rounded-md text-sm font-bold transition-all" :class="viewMode === 'normalized'
                      ? 'bg-[#0099ff] text-white shadow-sm'
                      : 'text-neutral-500 hover:bg-neutral-50'
                      ">
                    Normalized
                  </button>
                </div>
                <p class="text-xs text-neutral-400 ml-2">
                  *{{
                    viewMode === "raw"
                      ? "Edit raw output blocks"
                      : "View smoothed heatmap"
                  }}
                </p>
              </div>
              <!-- Focus Area -->
              <div class="flex items-center gap-4">
                <span class="font-bold text-neutral-600 w-30">Focus Area:</span>
                <div class="flex flex-wrap gap-2">
                  <button class="cursor-pointer" @click="setBrushType('normal')" :class="getBrushButtonClass('normal')">
                    <div class="w-3 h-3 bg-green-500 rounded-sm"></div>
                    Low
                  </button>
                  <button class="cursor-pointer" @click="setBrushType('benign')" :class="getBrushButtonClass('benign')">
                    <div class="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                    Medium
                  </button>
                  <button class="cursor-pointer" @click="setBrushType('malignant')" :class="getBrushButtonClass('malignant')">
                    <div class="w-3 h-3 bg-red-600 rounded-sm"></div>
                    High
                  </button>
                  <button class="cursor-pointer" @click="setBrushType('nocancer')" :class="getBrushButtonClass('nocancer')">
                    <div class="w-3 h-3 bg-blue-600 rounded-sm"></div>
                    Normal
                  </button>
                  <button class="cursor-pointer" @click="setBrushType('white')" :class="getBrushButtonClass('white')">
                    <div class="w-3 h-3 bg-white border border-neutral-300 rounded-sm"></div>
                    White
                  </button>
                  <div class="w-px h-8 bg-neutral-200 mx-2"></div>
                  <button class="cursor-pointer" @click="setBrushType('erase')" :class="getBrushButtonClass('erase')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clip-rule="evenodd" />
                    </svg>
                    Erase
                  </button>
                </div>
              </div>
              <!-- Brush Area -->
              <div class="flex items-center gap-4">
                <span class="font-bold text-neutral-600 w-30">Brush Size:</span>
                <div
                  class="flex-1 flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-neutral-200 max-w-md">
                  <span class="text-xs font-bold text-neutral-400">Small</span>
                  <input type="range" min="1" max="5" step="1" v-model.number="brushSize"
                    class="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-grab accent-[#0099ff]" />
                  <span class="text-xs font-bold text-neutral-400">Large</span>
                </div>
              </div>
              <!-- Opacity Area -->
              <div class="flex items-center gap-4">
                <span class="font-bold text-neutral-600 w-30">Opacity:</span>
                <div
                  class="flex-1 flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-neutral-200 max-w-md">
                  <span class="text-xs font-bold text-neutral-400">0%</span>
                  <input type="range" min="0.1" max="1" step="0.05" v-model.number="brushOpacity"
                    class="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-grab accent-[#0099ff]" />
                  <span class="text-xs font-bold text-neutral-400">100%</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Doctor Diagnosis & Notes -->
          <div class="bg-white rounded-2xl p-4 flex flex-col gap-6">
            <!-- Input Select Agreement -->
            <div class="flex gap-5">
              <div class="flex flex-col gap-1">
                <h3 class="font-bold text-neutral-700 text-base sm:text-lg">
                  Doctor's Diagnosis
                </h3>
                <span class="text-neutral-500 text-sm sm:text-base">Agree With AI?</span>
              </div>
              <div class="flex justify-center flex-col gap-2 text-sm font-bold text-neutral-500">
                <label class="flex items-center gap-2 cursor-pointer select-none"><input type="radio" value="agree"
                    v-model="doctorAgreement" class="cursor-pointer accent-green-500 w-5 h-5" /><span
                    :class="doctorAgreement === 'agree' ? 'text-green-600' : ''">Agree</span></label>
                <label class="flex items-center gap-2 cursor-pointer select-none"><input type="radio" value="disagree"
                    v-model="doctorAgreement" class="cursor-pointer accent-red-500 w-5 h-5" /><span :class="doctorAgreement === 'disagree' ? 'text-red-600' : ''
                      ">Disagree</span></label>
              </div>
            </div>
            <!-- Textarea notes -->
            <div class="flex-2 flex flex-col gap-3">
              <label class="font-bold text-neutral-700 whitespace-nowrap mt-2">Add Note</label>
              <textarea v-model="doctorNote"
                class="w-full h-40 p-3 rounded-lg border border-neutral-300 focus:ring focus:ring-[#0099ff] outline-none resize-none bg-neutral-100"
                placeholder="Type Here.."></textarea>
            </div>
          </div>
          <!-- Action Submit -->
          <button
            @click="handleSave"
            :disabled="isSubmitting"
            class="cursor-pointer w-full bg-[#0093EE] hover:bg-[#0077cc] disabled:bg-[#8ec8ea] disabled:cursor-not-allowed text-white font-semibold text-base sm:text-lg py-2 sm:py-3 rounded-xl mb-4"
          >
            {{ isSubmitting ? "Submitting..." : "Submit Diagnosis" }}
          </button>
          <!-- Panel Output saving data -->
          <div v-if="isSaved" class="bg-white rounded-2xl p-4 mt-10 animate-fade-in-up">
            <h2 class="text-2xl font-bold text-neutral-700 mb-4">
              Result By Doctor
            </h2>
            <div class="flex flex-col md:flex-row gap-8">
              <!-- Image Result -->
              <div class="w-64 h-64 bg-black rounded-xl overflow-hidden border-4 border-white shadow-sm shrink-0 relative">
                <img
                  v-if="savedDiagnosis.doctorBrushPath || currentImageSrc"
                  :src="savedDiagnosis.doctorBrushPath || currentImageSrc"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                  No image
                </div>
              </div>
              <!-- Additional Info -->
              <div class="flex-1 space-y-4">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-neutral-800">Agree With AI?</span>
                  <span
                    class="font-bold"
                    :class="savedDiagnosis.agreement === 'agree' ? 'text-green-500' : 'text-red-500'"
                  >
                    {{ savedDiagnosis.agreement === 'agree' ? 'Agree' : 'Disagree' }}
                  </span>
                </div>
                <div v-if="savedDiagnosis.doctorDiagnosis">
                  <span class="font-bold text-neutral-800">Doctor's Diagnosis:</span>
                  <p
                    class="text-white text-center text-sm mt-1 py-2 px-4 rounded-xl w-fit font-semibold"
                    :class="getAiDiagnosisBadgeClass(savedDiagnosis.doctorDiagnosis)"
                  >
                    {{ savedDiagnosis.doctorDiagnosis }}
                  </p>
                </div>
                <div>
                  <span class="font-bold text-neutral-800">Note:</span>
                  <p class="text-neutral-500 text-sm mt-1">
                    {{ savedDiagnosis.note ?? '-' }}
                  </p>
                </div>
                <div>
                  <span class="font-bold text-neutral-800">Classification Result By AI</span>
                  <p
                    class="text-white text-center text-sm mt-1 py-2 px-4 rounded-xl w-fit font-semibold"
                    :class="getAiDiagnosisBadgeClass(savedDiagnosis.ai_diagnosis)"
                  >
                    {{ savedDiagnosis.ai_diagnosis ?? '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Right Sidebar Panel -->
        <div class="sticky w-full lg:w-72 shrink-0">
          <DiagnosisPanel
            :patientId="patientId"
            :patientData="patientData"
            :aiPrediction="aiPrediction"
            :initialDiagnosis="doctorDiagnosis || aiPrediction"
            :disabled="diagnosisPanelDisabled"
            @update:diagnosis="(val) => (doctorDiagnosis = val)"
            @update:agreement="(val) => {
              doctorAgreement = val;
              // When doctor switches to 'agree', reset doctorDiagnosis to AI prediction
              if (val === 'agree') doctorDiagnosis = aiPrediction;
            }"
          />
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
    transform: tranneutralY(20px);
  }

  to {
    opacity: 1;
    transform: tranneutralY(0);
  }
}
</style>
