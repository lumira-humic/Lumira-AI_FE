<script setup>
import { ref, watch } from "vue";
import BaseModal from "@/components/common/BaseModal.vue";

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close", "submit"]);

const form = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const formErrors = ref({});

const resetForm = () => {
  form.value = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
  formErrors.value = {};
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      resetForm();
    }
  }
);

const validateForm = () => {
  const errors = {};

  if (!form.value.currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  if (!form.value.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (form.value.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters.";
  }

  if (!form.value.confirmPassword) {
    errors.confirmPassword = "Confirmation password is required.";
  } else if (form.value.newPassword !== form.value.confirmPassword) {
    errors.confirmPassword = "New password and confirmation password do not match.";
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

watch(() => form.value.currentPassword, () => { delete formErrors.value.currentPassword; });
watch(() => form.value.newPassword, () => { delete formErrors.value.newPassword; });
watch(() => form.value.confirmPassword, () => { delete formErrors.value.confirmPassword; });

const handleSubmit = () => {
  formErrors.value = {};
  if (!validateForm()) {
    return;
  }
  emit("submit", { ...form.value });
  resetForm();
};

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
    title="Change Password"
    @close="$emit('close')"
    :showCloseButton="true"
    :centerTitle="true"
    :closeOnBackdrop="false"
  >
    <div class="space-y-6 px-2">
      <!-- Current Password -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-32 text-sm font-semibold text-gray-600">Current</label>
          <input
            v-model="form.currentPassword"
            type="password"
            :class="inputClass('currentPassword')"
            required
          />
        </div>
        <p v-if="formErrors.currentPassword" class="mt-1 pl-36 text-xs text-red-500">{{ formErrors.currentPassword }}</p>
      </div>

      <!-- New Password -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-32 text-sm font-semibold text-gray-600">New</label>
          <input
            v-model="form.newPassword"
            type="password"
            :class="inputClass('newPassword')"
            required
          />
        </div>
        <p v-if="formErrors.newPassword" class="mt-1 pl-36 text-xs text-red-500">{{ formErrors.newPassword }}</p>
      </div>

      <!-- Confirm Password -->
      <div>
        <div class="flex items-center gap-4">
          <label class="w-32 text-sm font-semibold text-gray-600">Make Sure</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            :class="inputClass('confirmPassword')"
            required
          />
        </div>
        <p v-if="formErrors.confirmPassword" class="mt-1 pl-36 text-xs text-red-500">{{ formErrors.confirmPassword }}</p>
      </div>

      <!-- Action Button -->
      <div class="pt-4">
        <button
          @click="handleSubmit"
          class="w-full py-3 bg-[#0099ff] hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-colors shadow-lg shadow-blue-200"
        >
          Change
        </button>
      </div>
    </div>

    <!-- Hiding default footer -->
    <template #footer>
      <div class="hidden"></div>
    </template>
  </BaseModal>
</template>
