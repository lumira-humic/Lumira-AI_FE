<script setup>
import { ref } from "vue";

import BaseModal from "@/components/common/BaseModal.vue";
import { dataService } from "@/services/dataService.js";
import { useToast } from "@/composables/useToast";


const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close"]);
const toast = useToast();

const step = ref("form"); // 'form' or 'success'
const isLoading = ref(false);

const form = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const handleSubmit = async () => {
  if (form.value.newPassword !== form.value.confirmPassword) {
    toast.error("New passwords do not match!");
    return;
  }

  if (form.value.newPassword.length < 6) {
    toast.error("Password must be at least 6 characters long");
    return;
  }

  isLoading.value = true;
  try {
    await dataService.changePassword(
      form.value.currentPassword,
      form.value.newPassword
    );

    step.value = "success";
    toast.success("Password changed successfully");
  } catch (error) {
    console.error("Change password failed:", error);
    if (error.message === "incorrect_password") {
      toast.error("Incorrect current password");
    } else if (error.message === "not_authenticated") {
      toast.error("Session expired. Please login again.");
    } else {
      toast.error("Failed to change password. Please try again.");
    }
  } finally {
    isLoading.value = false;
  }
};

const handleClose = () => {
  emit("close");
  setTimeout(() => {
    step.value = "form";
    form.value = { currentPassword: "", newPassword: "", confirmPassword: "" };
    isLoading.value = false;
  }, 300);
};
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    :title="step === 'form' ? 'Change Password' : ''"
    @close="handleClose"
    :showCloseButton="false"
    :centerTitle="true"
  >
    <!-- Form State -->
    <div v-if="step === 'form'" class="space-y-6 px-2">
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
      <!-- Confirm Password (Make Sure) -->
      <div class="flex items-center gap-4">
        <label class="w-32 text-sm font-semibold text-gray-600"
          >Make Sure</label
        >
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
          :disabled="isLoading"
          class="w-full py-3 bg-[#0099ff] hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? "Changing..." : "Change" }}
        </button>
      </div>
    </div>
    <!-- Success State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-10 space-y-4"
    >
      <h2 class="text-xl font-bold text-gray-600 text-center">
        Password Changed
      </h2>
    </div>

    <template #footer>
      <div class="hidden"></div>
    </template>
  </BaseModal>
</template>
