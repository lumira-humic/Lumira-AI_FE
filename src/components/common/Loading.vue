<template>
  <div class="flex flex-col items-center justify-center p-8">
    <div class="relative w-12 h-12">
      <div class="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
      <div
        class="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
      ></div>
    </div>
    <p v-if="text" class="mt-4 text-gray-500 font-medium animate-pulse">
      {{ text }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: "Loading...",
  },
});
</script>
