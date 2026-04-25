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
  totalItems: {
    type: Number,
    required: false,
    default: 0
  },
  itemsPerPage: {
    type: Number,
    required: false,
    default: 10
  }
});

const emit = defineEmits(["page-change", "update:itemsPerPage"]);

const onPageClick = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit("page-change", page);
  }
};

const onItemsPerPageChange = (event) => {
  emit("update:itemsPerPage", parseInt(event.target.value));
  emit("page-change", 1); // Reset to first page when changing items per page
};

const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.currentPage - 1) * props.itemsPerPage + 1;
});

const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage;
  return end > props.totalItems ? props.totalItems : end;
});
</script>

<template>
  <div class="flex justify-start items-center gap-4 mt-6 text-gray-500 text-sm font-medium">
    <!-- Pagination controls -->
    <div class="flex items-center gap-2">
      <button
        @click="onPageClick(1)"
        :disabled="currentPage === 1"
        class="p-1 hover:text-[#0D99FF] disabled:opacity-40 disabled:hover:text-gray-500 transition-colors"
      >
        <span class="font-bold text-base leading-none">|&lt;</span>
      </button>

      <button
        @click="onPageClick(currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-1 py-1 flex items-center hover:text-[#0D99FF] disabled:opacity-40 disabled:hover:text-gray-500 transition-colors"
      >
        <span class="mr-1">&lt;</span> Previous
      </button>

      <div class="flex items-center gap-2 mx-1">
        <input 
          type="number" 
          :value="currentPage"
          @change="(e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) val = 1;
            if (val > totalPages) val = totalPages;
            if (val !== currentPage) onPageClick(val);
            e.target.value = val;
          }"
          class="w-10 text-center border border-gray-300 rounded py-1 focus:outline-none focus:border-[#0D99FF] text-black"
          min="1"
          :max="Math.max(1, totalPages)"
        />
        <span class="text-black">of {{ Math.max(1, totalPages) }}</span>
      </div>

      <button
        @click="onPageClick(currentPage + 1)"
        :disabled="currentPage === totalPages || totalPages === 0"
        class="px-1 py-1 flex items-center hover:text-[#0D99FF] disabled:opacity-40 disabled:hover:text-gray-500 transition-colors"
      >
        Next <span class="ml-1">&gt;</span>
      </button>
      
      <button
        @click="onPageClick(totalPages)"
        :disabled="currentPage === totalPages || totalPages === 0"
        class="p-1 hover:text-[#0D99FF] disabled:opacity-40 disabled:hover:text-gray-500 transition-colors"
      >
        <span class="font-bold text-base leading-none">&gt;|</span>
      </button>
    </div>

    <!-- Items per page dropdown -->
    <div class="flex items-center text-black">
      <select 
        :value="itemsPerPage" 
        @change="onItemsPerPageChange"
        class="border border-[#0D99FF] rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-[#0D99FF] bg-white cursor-pointer"
      >
        <option :value="10">10</option>
        <option :value="15">15</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>
    </div>

    <!-- Items count info -->
    <div class="text-black ml-1">
      {{ startItem }} - {{ endItem }} of {{ totalItems }} items
    </div>
  </div>
</template>
