<script setup>
import { ref, watch } from 'vue';

import BaseModal from '@/components/common/BaseModal.vue';


const props = defineProps({
  isOpen: Boolean,
  doctor: Object
});

const emit = defineEmits(['close', 'confirm']);

const isLoading = ref(false);

watch(() => props.isOpen, (val) => {
  if (val) isLoading.value = false;
});

const handleConfirm = () => {
  isLoading.value = true;
  emit('confirm');
};
</script>

<template>
  <BaseModal 
    :isOpen="isOpen" 
    title="" 
    maxWidth="max-w-[450px]" 
    @close="$emit('close')" 
    :showCloseButton="false" 
    :closeOnBackdrop="false" 
    :centerTitle="true"
  >
    <div class="flex flex-col items-center justify-center pt-6 pb-2 px-2">
      <h2 class="text-[26px] font-semibold text-gray-600 mb-10 text-center tracking-normal">
        Are You Sure Want To Delete?
      </h2>
      
      <div class="flex flex-row justify-center gap-5 w-full px-4">
        <button 
          @click="$emit('close')"
          :disabled="isLoading"
          class="flex-1 max-w-40 cursor-pointer py-3 bg-[#0099ff] hover:bg-blue-600 text-white rounded-full text-lg font-medium shadow-sm transition-colors disabled:opacity-60"
        >
          Keep
        </button>
        <button 
          @click="handleConfirm"
          :disabled="isLoading"
          class="flex-1 max-w-40 cursor-pointer py-3 bg-[#e60000] hover:bg-red-700 text-white rounded-full text-lg font-medium shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center"
        >
          <span v-if="isLoading" class="animate-spin mr-2 inline-block align-middle">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </span>
          <span v-else>Delete</span>
        </button>
      </div>
    </div>

    <!-- Hiding default footer -->
    <template #footer>
      <div class="hidden"></div>
    </template>
  </BaseModal>
</template>
