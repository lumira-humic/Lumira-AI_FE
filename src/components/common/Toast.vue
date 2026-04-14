<script setup>
import { X } from '@lucide/vue';

import { useToast } from "@/composables/useToast";


const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="fixed top-4 right-4 z-9999 flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow border-l-3"
        :class="{
          'border-green-500': toast.type === 'success',
          'border-red-500': toast.type === 'error',
          'border-blue-500': toast.type === 'info',
          'border-yellow-500': toast.type === 'warning',
        }"
        role="alert"
      >
        <span class="ml-3 text-sm font-normal">{{ toast.message }}</span>
        <button
          type="button"
          class="flex items-center justify-center bg-white text-gray-600 hover:text-gray-900 rounded-lg p-1.5h-8 w-8 cursor-pointer transition-all duration-200"
          @click="removeToast(toast.id)"
          aria-label="Close"
        >
          <span class="sr-only">Close</span>
          <X class="w-5 h-5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
