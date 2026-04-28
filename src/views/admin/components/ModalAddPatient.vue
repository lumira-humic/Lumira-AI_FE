<script setup>
import { ref, computed } from "vue";

import { dataService } from "@/services/dataService";
import { getApiErrorMessage } from "@/lib/apiResponse";
import { useToast } from "@/composables/useToast";
import BaseModal from "@/components/common/BaseModal.vue";
import ModalSavedChanges from "./ModalSavedChanges.vue";


defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close", "submit"]);
const toast = useToast();

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
const formErrors = ref({});

// ─── Validation helpers ────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = () => {
  const errors = {};

  if (!form.value.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!form.value.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(form.value.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!form.value.password) {
    errors.password = "Password is required.";
  } else if (form.value.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

// ─── Phone: digits + leading + only ─────────────────────────────────────────
const handlePhoneInput = (event) => {
  const raw = event.target.value;
  // Allow digits and leading + only
  const cleaned = raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  form.value.phone = cleaned;
  event.target.value = cleaned;
};

// ─── File handler ─────────────────────────────────────────────────────────────
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    previewUrl.value = url;
    form.value.image = url;
    form.value.rawFile = file;
  }
};

// ─── Submit ───────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  formErrors.value = {};

  if (!validateForm()) {
    return;
  }

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
    const message = getApiErrorMessage(error, "Failed to add patient.");
    toast.error(message);
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
  formErrors.value = {};
};

// Input class helper
const inputClass = (field) =>
  `flex-1 px-4 py-2 bg-[#f0f0f0] rounded-full outline-none text-sm transition-colors ${
    formErrors.value[field]
      ? "ring-2 ring-red-400 bg-red-50"
      : "focus:ring-2 focus:ring-[#0099ff]"
  }`;
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="Add Patient"
    @close="$emit('close')"
    :showCloseButton="true"
    :centerTitle="true"
    :closeOnBackdrop="false"
    maxWidth="max-w-[420px]"
  >
    <div class="space-y-5 px-2">
      <!-- Name -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600 shrink-0">Name</label>
          <input
            v-model="form.name"
            type="text"
            :class="inputClass('name')"
            placeholder="Full name"
          />
        </div>
        <p v-if="formErrors.name" class="mt-1 pl-28 text-xs text-red-500">{{ formErrors.name }}</p>
      </div>

      <!-- Email -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600 shrink-0">Email</label>
          <input
            v-model="form.email"
            type="email"
            :class="inputClass('email')"
            placeholder="example@email.com"
            autocomplete="off"
          />
        </div>
        <p v-if="formErrors.email" class="mt-1 pl-28 text-xs text-red-500">{{ formErrors.email }}</p>
      </div>

      <!-- Password -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600 shrink-0">Password</label>
          <input
            v-model="form.password"
            type="password"
            :class="inputClass('password')"
            placeholder="Min. 8 characters"
            autocomplete="new-password"
          />
        </div>
        <p v-if="formErrors.password" class="mt-1 pl-28 text-xs text-red-500">{{ formErrors.password }}</p>
      </div>

      <!-- Phone (numbers + + only) -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600 shrink-0">Phone</label>
          <input
            :value="form.phone"
            @input="handlePhoneInput"
            type="tel"
            inputmode="numeric"
            :class="inputClass('phone')"
            placeholder="+628xxxxxxxxxx"
          />
        </div>
        <p v-if="formErrors.phone" class="mt-1 pl-28 text-xs text-red-500">{{ formErrors.phone }}</p>
      </div>

      <!-- Gender -->
      <div class="flex items-center gap-4">
        <label class="w-24 text-[15px] font-semibold text-gray-600 shrink-0">Gender</label>
        <div class="flex bg-[#f0f0f0] rounded-full p-1 border border-transparent">
          <button
            type="button"
            @click="form.gender = 'Pria'"
            class="cursor-pointer px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors"
            :class="form.gender === 'Pria' ? 'bg-[#bce6ff] text-black shadow-sm' : 'text-gray-700 hover:bg-gray-200'"
          >
            Pria
          </button>
          <button
            type="button"
            @click="form.gender = 'Wanita'"
            class="cursor-pointer px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors"
            :class="form.gender === 'Wanita' ? 'bg-[#fcbcff] text-black shadow-sm' : 'text-gray-700 hover:bg-gray-200'"
          >
            Wanita
          </button>
        </div>
      </div>

      <!-- Image / File Input -->
      <div class="flex items-center gap-4">
        <label class="w-24 text-[15px] font-semibold text-gray-600 shrink-0">Image</label>
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
      <div class="pt-4">
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
