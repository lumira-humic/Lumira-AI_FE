<script setup>
import { ref } from "vue";

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
  status: "Active",
});

const isLoading = ref(false);
const showSavedChangesModal = ref(false);
const formErrors = ref({});

// ─── Validation ────────────────────────────────────────────────────────────────
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

// ─── Submit ───────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  formErrors.value = {};

  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  try {
    await dataService.addDoctor(form.value);
    showSavedChangesModal.value = true;
  } catch (error) {
    console.error("Failed to add doctor:", error);
    const message = getApiErrorMessage(error, "Failed to add doctor.");
    toast.error(message);
  } finally {
    isLoading.value = false;
  }
};

const handleSavedClose = () => {
  showSavedChangesModal.value = false;
  emit("submit");
  form.value = { name: "", email: "", password: "", status: "Active" };
  formErrors.value = {};
};

// Input class helper
const inputClass = (field) =>
  `flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700 transition-colors ${
    formErrors.value[field]
      ? "ring-2 ring-red-400 bg-red-50"
      : "focus:ring-2 focus:ring-[#0099ff]"
  }`;
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="Add New Doctor"
    @close="$emit('close')"
    :showCloseButton="true"
    :centerTitle="true"
    :closeOnBackdrop="false"
  >
    <div class="space-y-5 px-2">
      <!-- Name -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-600 shrink-0">Name</label>
          <input
            v-model="form.name"
            type="text"
            :class="inputClass('name')"
            placeholder="Doctor's full name"
          />
        </div>
        <p v-if="formErrors.name" class="mt-1 pl-28 text-xs text-red-500">{{ formErrors.name }}</p>
      </div>

      <!-- Email -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-600 shrink-0">Email</label>
          <input
            v-model="form.email"
            type="email"
            :class="inputClass('email')"
            placeholder="doctor@example.com"
            autocomplete="off"
          />
        </div>
        <p v-if="formErrors.email" class="mt-1 pl-28 text-xs text-red-500">{{ formErrors.email }}</p>
      </div>

      <!-- Password -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-24 text-sm font-semibold text-gray-600 shrink-0">Password</label>
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

      <!-- Status Custom Toggle -->
      <div class="flex items-center gap-4">
        <label class="w-24 text-sm font-semibold text-gray-600 shrink-0">Status</label>
        <div class="flex-1 bg-gray-100 rounded-full p-1 flex">
          <button
            type="button"
            @click="form.status = 'Active'"
            class="cursor-pointer flex-1 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
            :class="
              form.status === 'Active'
                ? 'bg-white text-green-500 shadow-sm'
                : 'text-gray-400 hover:text-gray-500'
            "
          >
            Active
          </button>
          <button
            type="button"
            @click="form.status = 'Inactive'"
            class="cursor-pointer flex-1 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
            :class="
              form.status === 'Inactive'
                ? 'bg-white text-[#0099ff] shadow-sm'
                : 'text-gray-400 hover:text-gray-500'
            "
          >
            Inactive
          </button>
        </div>
      </div>

      <!-- Action Button -->
      <div class="pt-4">
        <button
          @click="handleSubmit"
          :disabled="isLoading"
          class="w-full py-3 bg-[#0099ff] hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-colors shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center"
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
    <!-- Hiding default footer since we implemented custom button inside -->
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
