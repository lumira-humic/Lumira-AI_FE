<script setup>
import { computed } from "vue";

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["page-change"]);

const pages = computed(() => {
  const p = [];
  for (let i = 1; i <= props.totalPages; i++) {
    p.push(i);
  }
  return p;
});

const onPageClick = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit("page-change", page);
  }
};
</script>

<template>
  <div
    class="flex justify-center items-center gap-2 mt-4"
    v-if="totalPages > 1"
  >
    <button
      @click="onPageClick(currentPage - 1)"
      :disabled="currentPage === 1"
      class="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Previous
    </button>

    <div class="flex gap-1">
      <button
        v-for="page in pages"
        :key="page"
        @click="onPageClick(page)"
        class="px-3 py-1 rounded transition-colors"
        :class="
          page === currentPage
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100 border'
        "
      >
        {{ page }}
      </button>
    </div>

    <button
      @click="onPageClick(currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  </div>
</template>
