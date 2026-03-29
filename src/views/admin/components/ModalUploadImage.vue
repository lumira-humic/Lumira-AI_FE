<script setup>
import { ref, watch } from "vue";

import BaseModal from "@/components/common/BaseModal.vue";
import { getPublicImageUrl } from "@/services/storageService";


const props = defineProps({
  isOpen: Boolean,
  patient: Object,
});

const emit = defineEmits(["close", "submit"]);

const fileData = ref(null);
const previewUrl = ref(null);

watch(
  () => props.patient,
  (newPatient) => {
    if (newPatient && newPatient.image) {
      previewUrl.value = getPublicImageUrl(newPatient.image);
    } else {
      previewUrl.value = null;
    }
  },
  { immediate: true }
);

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    fileData.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

const handleSubmit = () => {
  if (fileData.value) {
    emit("submit", fileData.value);
    // Cleanup
    previewUrl.value = null;
    fileData.value = null;
    if (fileInput.value) fileInput.value.value = "";
  }
};
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    title="Upload Patient Image"
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <div
        v-if="patient"
        class="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800"
      >
        Uploading image for: <strong>{{ patient.name }}</strong>
      </div>

      <div
        class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          @change="handleFileChange"
        />
        <div v-if="!previewUrl" class="space-y-2">
          <div
            class="mx-auto w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <p class="text-sm text-gray-500">Click to upload or drag and drop</p>
          <p class="text-xs text-gray-400">
            SVG, PNG, JPG or GIF (MAX. 800x400px)
          </p>
        </div>
        <div v-else class="relative">
          <img
            :src="previewUrl"
            class="max-h-48 mx-auto rounded-lg shadow-sm"
          />
          <button
            @click.stop="previewUrl = null"
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="$emit('close')"
        class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
      >
        Cancel
      </button>
      <button
        @click="handleSubmit"
        :disabled="!previewUrl"
        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Upload Image
      </button>
    </template>
  </BaseModal>
</template>
