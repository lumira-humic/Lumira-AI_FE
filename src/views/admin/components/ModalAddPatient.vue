<script setup>
import { ref } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";
import ModalSavedChanges from "./ModalSavedChanges.vue";
import { dataService } from "@/services/dataService";

defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close", "submit"]);

const form = ref({
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "Wanita",
  image: null,
  rawFile: null,
});

const previewUrl = ref(null);
const isLoading = ref(false);
const showSavedChangesModal = ref(false);
const createdPatientData = ref(null);

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    previewUrl.value = url;
    form.value.image = url;
    form.value.rawFile = file;
  }
};

const handleSubmit = async () => {
  isLoading.value = true;
  try {
    const payload = {
      ...form.value,
      review: "-",
    };
    const result = await dataService.addPatient(payload);
    createdPatientData.value = { ...payload, id: result?.id };
    showSavedChangesModal.value = true;
  } catch (error) {
    console.error("Failed to add patient:", error);
    alert("Failed to add patient!");
  } finally {
    isLoading.value = false;
  }
};

const handleSavedClose = () => {
  showSavedChangesModal.value = false;
  emit("submit", createdPatientData.value);
  form.value = { name: "", email: "", password: "", phone: "", gender: "Wanita", image: null, rawFile: null };
  previewUrl.value = null;
  createdPatientData.value = null;
};
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title=""
    @close="$emit('close')"
    :showCloseButton="true"
    :centerTitle="true"
    :closeOnBackdrop="!showSavedChangesModal && !isLoading"
    maxWidth="max-w-[420px]"
  >
    <div class="px-2 pb-2">
      <!-- Title -->
      <h2 class="text-2xl font-semibold text-gray-600 mb-6 text-center tracking-wide">
        Add Patient
      </h2>
      
      <div class="space-y-5 text-gray-700">
        <!-- Name -->
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600">Name</label>
          <input
            v-model="form.name"
            type="text"
            class="flex-1 px-4 py-2 bg-[#f0f0f0] rounded-full outline-none text-sm"
          />
        </div>
        
        <!-- Email -->
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="flex-1 px-4 py-2 bg-[#f0f0f0] rounded-full outline-none text-sm"
            autocomplete="off"
          />
        </div>
        
        <!-- Password -->
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="flex-1 px-4 py-2 bg-[#f0f0f0] rounded-full outline-none text-sm"
            autocomplete="new-password"
          />
        </div>
        
        <!-- Phone -->
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600">Phone</label>
          <input
            v-model="form.phone"
            type="tel"
            class="flex-1 px-4 py-2 bg-[#f0f0f0] rounded-full outline-none text-sm"
          />
        </div>
        
        <!-- Gender -->
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600">Gender</label>
          <div class="flex bg-[#f0f0f0] rounded-full p-1 border border-transparent">
            <button
              type="button"
              @click="form.gender = 'Pria'"
              class="px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors"
              :class="form.gender === 'Pria' ? 'bg-[#bce6ff] text-black shadow-sm' : 'text-gray-700 hover:bg-gray-200'"
            >
              Pria
            </button>
            <button
              type="button"
              @click="form.gender = 'Wanita'"
              class="px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors"
              :class="form.gender === 'Wanita' ? 'bg-[#fcbcff] text-black shadow-sm' : 'text-gray-700 hover:bg-gray-200'"
            >
              Wanita
            </button>
          </div>
        </div>
        
        <!-- Image / File Input -->
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600">Image</label>
          <div class="flex-1">
            <label class="flex items-center justify-center gap-2 cursor-pointer w-full py-2 bg-[#f0f0f0] hover:bg-[#e8e8e8] rounded-full text-sm font-medium text-gray-500 transition-colors">
              <svg v-if="!form.rawFile" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-[18px] h-[18px]">
                <rect width="16" height="16" x="4" y="4" rx="2" ry="2" />
                <line x1="12" x2="12" y1="8" y2="16" />
                <line x1="8" x2="16" y1="12" y2="12" />
              </svg>
              <span class="truncate max-w-[80%]" :class="form.rawFile ? 'text-gray-700' : ''">
                {{ form.rawFile ? form.rawFile.name : 'Search Image' }}
              </span>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileChange"
              />
            </label>
          </div>
        </div>

        <!-- Action Button -->
        <div class="pt-6">
          <button
            @click="handleSubmit"
            :disabled="isLoading"
            class="w-full py-3 bg-[#0099ff] hover:bg-[#0088e6] text-white rounded-full font-medium text-[17px] transition-colors shadow-sm flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="animate-spin mr-2 inline-block align-middle">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            </span>
            <span v-else>Add</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Hide default footer -->
    <template #footer>
      <div class="hidden"></div>
    </template>
  </BaseModal>

  <!-- Saved Changes Modal -->
  <ModalSavedChanges
    :isOpen="showSavedChangesModal"
    @close="handleSavedClose"
  />
</template>
