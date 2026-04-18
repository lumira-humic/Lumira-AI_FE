<script setup>
import { watch, ref } from "vue";

import BaseModal from "@/components/common/BaseModal.vue";


const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close"]);

const showContent = ref(false);

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      showContent.value = true;
      // Auto close after 2 seconds
      setTimeout(() => {
        emit("close");
      }, 2000);
    } else {
      showContent.value = false;
    }
  }
);
</script>

<template>
  <BaseModal
    :isOpen="isOpen"
    @close="$emit('close')"
    :showCloseButton="false"
    :centerTitle="false"
    :closeOnBackdrop="false"
  >
    <div v-if="showContent" class="flex flex-col items-center justify-center py-12 px-4">
      <!-- Success Icon -->
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <svg
          class="w-8 h-8 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      </div>
      <!-- Success Message -->
      <h2 class="text-xl font-bold text-gray-800 mb-2">Changes Saved Successfully</h2>
      <p class="text-sm text-gray-600 text-center">
        Your changes have been saved and will be applied shortly.
      </p>
    </div>

    <!-- Hiding default footer -->
    <template #footer>
      <div class="hidden"></div>
    </template>
  </BaseModal>
</template>
