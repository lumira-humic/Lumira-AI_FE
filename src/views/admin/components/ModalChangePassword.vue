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

const resetForm = () => {
  form.value = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      resetForm();
    }
  }
);

const handleSubmit = () => {
  if (form.value.newPassword !== form.value.confirmPassword) {
    alert("New password and confirmation password do not match!");
    return;
  }
  if (form.value.newPassword.length < 6) {
    alert("Password must be at least 6 characters long!");
    return;
  }
  emit("submit", { ...form.value });
  resetForm();
};
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
      <div class="flex items-center gap-4">
        <label class="w-32 text-sm font-semibold text-gray-600">Current</label>
        <input
          v-model="form.currentPassword"
          type="password"
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
          required
        />
      </div>
      <!-- New Password -->
      <div class="flex items-center gap-4">
        <label class="w-32 text-sm font-semibold text-gray-600">New</label>
        <input
          v-model="form.newPassword"
          type="password"
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
          required
        />
      </div>
      <!-- Confirm Password -->
      <div class="flex items-center gap-4">
        <label class="w-32 text-sm font-semibold text-gray-600">Make Sure</label>
        <input
          v-model="form.confirmPassword"
          type="password"
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
          required
        />
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
