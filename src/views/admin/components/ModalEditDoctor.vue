<script setup>
import { ref, watch } from "vue";

import BaseModal from "@/components/common/BaseModal.vue";


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

const handleSubmit = () => {
  emit("submit", { ...form.value });
};
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="Edit Doctor"
    @close="$emit('close')"
    :showCloseButton="false"
    :centerTitle="true"
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
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
        />
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
          class="w-full py-3 bg-[#0099ff] hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-colors shadow-lg shadow-blue-200"
        >
          Save Changes
        </button>
      </div>
    </div>

    <!-- Hiding default footer -->
    <template #footer>
      <div class="hidden"></div>
    </template>
  </BaseModal>
</template>
