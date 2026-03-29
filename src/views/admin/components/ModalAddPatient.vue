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
  phone: "",
  image: null,
  rawFile: null,
});

const previewUrl = ref(null);

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    previewUrl.value = url;
    form.value.image = url;
    form.value.rawFile = file;
  }
};

const handleSubmit = () => {
  emit("submit", {
    ...form.value,
    review: "-",
  });
  form.value = { name: "", email: "", phone: "", image: null };
  previewUrl.value = null;
};
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="Add New Patient"
    @close="$emit('close')"
    :showCloseButton="false"
    :centerTitle="true"
  >
    <div class="space-y-6 px-2">
      <!-- Name -->
      <div class="flex items-center gap-4">
        <label class="w-32 text-sm font-semibold text-gray-600">Name</label>
        <input
          v-model="form.name"
          type="text"
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
          required
        />
      </div>
      <!-- Email -->
      <div class="flex items-center gap-4">
        <label class="w-32 text-sm font-semibold text-gray-600">Email</label>
        <input
          v-model="form.email"
          type="email"
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
          required
        />
      </div>
      <!-- Phone -->
      <div class="flex items-center gap-4">
        <label class="w-32 text-sm font-semibold text-gray-600">Phone</label>
        <input
          v-model="form.phone"
          type="tel"
          class="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg outline-none text-gray-700"
          required
        />
      </div>
      <!-- Cancer Scan Image -->
      <div class="flex items-start gap-4">
        <label class="w-32 pt-2 text-sm font-semibold text-gray-600"
          >Cancer Scan</label
        >
        <div class="flex-1">
          <div class="flex items-start gap-4">
            <!-- Rectangular Preview -->
            <div
              class="relative w-32 h-24 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
            >
              <img
                v-if="previewUrl"
                :src="previewUrl"
                class="w-full h-full object-cover"
              />
              <div v-else class="text-gray-400 flex flex-col items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-8 h-8 opacity-50"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                <span class="text-[10px] mt-1">No Image</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <input
                type="file"
                accept="image/*"
                @change="handleFileChange"
                class="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0099ff]/10 file:text-[#0099ff] hover:file:bg-[#0099ff]/20 cursor-pointer"
              />
              <p class="text-[10px] text-gray-500 mt-2">Upload a scan image.</p>
            </div>
          </div>
        </div>
      </div>
      <!-- Action Button -->
      <div class="pt-4">
        <button
          @click="handleSubmit"
          class="w-full py-3 bg-[#0099ff] hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-colors shadow-lg shadow-blue-200"
        >
          Add Patient
        </button>
      </div>
    </div>

    <template #footer>
      <div class="hidden"></div>
    </template>
  </BaseModal>
</template>
