<script setup>
defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Search...",
  },
  wrapperClass: {
    type: String,
    default: "max-w-xs",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:modelValue"]);
</script>

<template>
  <div :class="['relative w-full', wrapperClass]">
    <div
      class="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none"
    >
      <!-- Search Icon SVG -->
      <svg
        class="h-5 w-5 text-neutral-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :disabled="disabled"
      type="text"
      class="text-sm sm:text-base block w-full pl-5 pr-5 py-3 rounded-full leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-2 focus:ring-sky-500 focus:ring-inset transition duration-150 ease-in-out disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500 disabled:focus:ring-0"
      :placeholder="placeholder"
    />
  </div>
</template>
