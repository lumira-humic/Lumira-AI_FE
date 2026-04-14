<script setup>
import { ref } from "vue";

import BaseModal from "@/components/common/BaseModal.vue";


defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close", "submit"]);

const form = ref({
  name: "",
  email: "",
  password: "",
  status: "Active",
});

const handleSubmit = () => {
  emit("submit", { ...form.value });
  form.value = { name: "", email: "", password: "", status: "Active" };
};
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
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
          required
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
          Add
        </button>
      </div>
    </div>
    <!-- Hiding default footer since we implemented custom button inside -->
    <template #footer>
      <div class="hidden"></div>
    </template>
  </BaseModal>
</template>
