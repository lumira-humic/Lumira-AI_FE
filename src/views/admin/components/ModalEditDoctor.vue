<script setup>

import { ref, watch } from "vue";

import { dataService } from "@/services/dataService";
import BaseModal from "@/components/common/BaseModal.vue";
import ModalChangePassword from "./ModalChangePassword.vue";
import ModalSavedChanges from "./ModalSavedChanges.vue";


const props = defineProps({
  isOpen: Boolean,
  doctor: {
    type: Object,
    default: () => ({ name: "", email: "", status: "" }),
  },
});

const emit = defineEmits(["close", "submit"]);

const form = ref({
  name: "",
  email: "",
  password: "",
  status: "Active",
});

const showChangePasswordModal = ref(false);
const showSavedChangesModal = ref(false);

// Watch for changes in the doctor prop to update the form
watch(
  () => props.doctor,
  (newVal) => {
    if (newVal) {
      // Handle both 'username' and 'name' for compatibility, preferring 'name'
      form.value = {
        name: newVal.name || newVal.username || "",
        email: newVal.email || "",
        password: "", // Reset password field
        status: newVal.status || "Active",
      };
    }
  },
  { immediate: true }
);


const isLoading = ref(false);

const handleSubmit = async () => {
  isLoading.value = true;
  try {
    await dataService.updateDoctor(props.doctor.id, {
      name: form.value.name,
      email: form.value.email,
      status: form.value.status,
      password: form.value.password || undefined, // hanya jika diubah
    });
    emit("submit", { ...form.value });
    showSavedChangesModal.value = true;
  } catch (e) {
    alert("Failed to update doctor!");
  } finally {
    isLoading.value = false;
  }
};

const handleChangePasswordSubmit = (data) => {
  showChangePasswordModal.value = false;
  // Set password di form edit doctor
  form.value.password = data.newPassword;
};
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="Edit Doctor"
    @close="$emit('close')"
    :showCloseButton="true"
    :centerTitle="true"
    :closeOnBackdrop="false"
  >
    <div class="space-y-6 px-2">
      <!-- Name -->
      <div class="flex items-center gap-4">
        <label class="w-24 text-sm font-semibold text-gray-600">Name</label>
        <input
          v-model="form.name"
          type="text"
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
          required
        />
      </div>
      <!-- Email -->
      <div class="flex items-center gap-4">
        <label class="w-24 text-sm font-semibold text-gray-600">Email</label>
        <input
          v-model="form.email"
          type="email"
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
          required
        />
      </div>
      <!-- Password -->
      <div class="flex items-center gap-4">
        <label class="w-24 text-sm font-semibold text-gray-600">Password</label>
        <input
          v-model="form.password"
          type="password"
          placeholder="(Unchanged)"
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700 cursor-not-allowed"
          readonly
          tabindex="-1"
        />
      </div>
      <!-- Forgot Password Link -->
      <div class="flex justify-end px-1">
        <button
          @click="showChangePasswordModal = true"
          class="cursor-pointer text-sm text-red-500 hover:text-red-600 font-medium"
        >
          <span class="text-blue-500 hover:text-blue-600">Change Password</span>
        </button>
      </div>
      <!-- Status Custom Toggle -->
      <div class="flex items-center gap-4">
        <label class="w-24 text-sm font-semibold text-gray-600">Status</label>
        <div class="flex-1 bg-gray-100 rounded-full p-1 flex">
          <button
            type="button"
            @click="form.status = 'Active'"
            class="flex-1 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
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
            class="flex-1 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
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
          class="w-full py-3 bg-[#0099ff] hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-colors shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading" class="animate-spin mr-2 inline-block align-middle">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </span>
          <span>Edit</span>
        </button>
      </div>
    </div>

    <!-- Hiding default footer -->
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
    @close="showSavedChangesModal = false"
  />
</template>
