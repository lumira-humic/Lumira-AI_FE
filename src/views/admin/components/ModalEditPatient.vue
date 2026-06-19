<script setup>
import { dataService } from "@/services/dataService";
import { ref, watch } from "vue";

import BaseModal from "@/components/common/BaseModal.vue";
import ModalChangePassword from "./ModalChangePassword.vue";
import ModalSavedChanges from "./ModalSavedChanges.vue";
import { useToast } from "@/composables/useToast";
import { getApiErrorMessage } from "@/lib/apiResponse";

const toast = useToast();


const props = defineProps({
  isOpen: Boolean,
  patient: {
    type: Object,
    default: () => ({ name: "", email: "", phone: "", gender: "Wanita", image: null }),
  },
});

const emit = defineEmits(["close", "submit"]);

const form = ref({
  name: "",
  email: "",
  password: "",
  currentPassword: "",
  phone: "",
  gender: "Wanita",
  image: null,
});

const rawFile = ref(null);
const previewUrl = ref(null);
const showChangePasswordModal = ref(false);
const showSavedChangesModal = ref(false);
const isLoading = ref(false);
const updatedPatientData = ref(null);

const handleChangePasswordSubmit = (data) => {
  showChangePasswordModal.value = false;
  form.value.password = data.newPassword;
  form.value.currentPassword = data.currentPassword;
};

watch(
  () => props.patient,
  (newVal) => {
    if (newVal) {
      form.value = {
        name: newVal.name || "",
        email: newVal.email || "",
        password: "",
        currentPassword: "",
        phone: newVal.phone || "",
        gender: newVal.gender || "Wanita",
        image: newVal.image,
      };
      previewUrl.value = newVal.image;
      rawFile.value = null;
      formErrors.value = {};
    }
  },
  { immediate: true }
);

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    previewUrl.value = url;
    form.value.image = url;
    rawFile.value = file;
  }
};

const formErrors = ref({});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = () => {
  const errors = {};

  if (!form.value.name || !form.value.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!form.value.email || !form.value.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(form.value.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

watch(() => form.value.name, () => { delete formErrors.value.name; });
watch(() => form.value.email, () => { delete formErrors.value.email; });

const handleSubmit = async () => {
  formErrors.value = {};
  if (!validateForm()) {
    return;
  }
  isLoading.value = true;
  try {
    const payload = {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      gender: form.value.gender,
    };
    if (form.value.password) {
      payload.password = form.value.password;
    }
    if (form.value.currentPassword) {
      payload.currentPassword = form.value.currentPassword;
    }
    await dataService.updatePatient(props.patient.id, payload);
    
    updatedPatientData.value = { ...payload, rawFile: rawFile.value };
    showSavedChangesModal.value = true;
  } catch (error) {
    console.error("Failed to update patient:", error);
    const msg = getApiErrorMessage(error, "Failed to update patient!");
    toast.error(msg);
  } finally {
    isLoading.value = false;
  }
};

const handleSavedClose = () => {
  showSavedChangesModal.value = false;
  emit("submit", updatedPatientData.value);
};

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
    title="Edit Patient"
    @close="$emit('close')"
    :showCloseButton="true"
    :centerTitle="true"
    :closeOnBackdrop="false"
    maxWidth="max-w-[420px]"
  >
    <!-- Main Content -->
    <div class="space-y-6 px-2">
      <!-- Name -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600">Name</label>
          <input
            v-model="form.name"
            type="text"
            :class="inputClass('name')"
          />
        </div>
        <p v-if="formErrors.name" class="mt-1 pl-28 text-xs text-red-500">{{ formErrors.name }}</p>
      </div>
      <!-- Email -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600">Email</label>
          <input
            v-model="form.email"
            type="email"
            :class="inputClass('email')"
            autocomplete="off"
          />
        </div>
        <p v-if="formErrors.email" class="mt-1 pl-28 text-xs text-red-500">{{ formErrors.email }}</p>
      </div>
      <!-- Password and Forgot Password -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-4">
          <label class="w-24 text-[15px] font-semibold text-gray-600">Password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="(Unchanged)"
            class="flex-1 px-4 py-2 bg-[#f0f0f0] rounded-full outline-none text-sm cursor-not-allowed"
            autocomplete="new-password"
            readonly
            tabindex="-1"
          />
        </div>
        <div class="flex justify-end pr-2">
          <span class="text-[12.5px] font-medium text-gray-500">
            Forgot Password ? <button type="button" @click="showChangePasswordModal = true" class="cursor-pointer text-red-500 hover:text-red-600 transition-colors font-semibold">Change Password</button>
          </span>
        </div>
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
        <label class="w-24 text-[15px] font-semibold text-gray-600">Image</label>
        <div class="flex-1">
          <label class="flex items-center justify-center gap-2 cursor-pointer w-full py-2 bg-[#f0f0f0] hover:bg-[#e8e8e8] rounded-full text-sm font-medium text-gray-500 transition-colors">
            <svg v-if="!rawFile" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-[18px] h-[18px]">
              <rect width="16" height="16" x="4" y="4" rx="2" ry="2" />
              <line x1="12" x2="12" y1="8" y2="16" />
              <line x1="8" x2="16" y1="12" y2="12" />
            </svg>
            <span class="truncate max-w-[80%]" :class="rawFile ? 'text-gray-700' : ''">
              {{ rawFile ? rawFile.name : 'Search Image' }}
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
          <span v-else>Edit</span>
        </button>
      </div>
    </div>
    <!-- Hide default footer -->
    <template #footer>
      <div class="hidden"></div>
    </template>
  </BaseModal>

  <!-- Change Password Modal -->
  <ModalChangePassword
    :isOpen="showChangePasswordModal"
    @close="showChangePasswordModal = false"
    @submit="handleChangePasswordSubmit"
  />

  <!-- Saved Changes Modal -->
  <ModalSavedChanges
    :isOpen="showSavedChangesModal"
    @close="handleSavedClose"
  />
</template>
