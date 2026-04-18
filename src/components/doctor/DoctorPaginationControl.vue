<script setup>
import { computed, ref, watch } from "vue";
import { ChevronRight, ChevronLeft, ChevronFirst, ChevronLast, ChevronDown } from '@lucide/vue';


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
    required: true,
  },
  pageSize: {
    type: Number,
    required: true,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 15, 25, 50],
  },
});

const emit = defineEmits(["update:page", "update:limit"]);

const pageInput = ref(String(props.currentPage));

watch(
  () => props.currentPage,
  (nextValue) => {
    pageInput.value = String(nextValue);
  },
);

const maxPage = computed(() => Math.max(1, props.totalPages || 1));

const fromItem = computed(() => {
  if (props.totalItems === 0) {
    return 0;
  }

  return (props.currentPage - 1) * props.pageSize + 1;
});

const toItem = computed(() => {
  if (props.totalItems === 0) {
    return 0;
  }

  return Math.min(props.currentPage * props.pageSize, props.totalItems);
});

const isFirstPage = computed(() => props.currentPage <= 1);
const isLastPage = computed(() => props.currentPage >= maxPage.value);

const clampPage = (rawValue) => {
  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsed)) {
    return props.currentPage;
  }

  if (parsed < 1) {
    return 1;
  }

  if (parsed > maxPage.value) {
    return maxPage.value;
  }

  return parsed;
};

const updatePage = (nextPage) => {
  const page = clampPage(nextPage);
  if (page !== props.currentPage) {
    emit("update:page", page);
  }
};

const submitPageInput = () => {
  updatePage(pageInput.value);
  pageInput.value = String(clampPage(pageInput.value));
};

const updateLimit = (event) => {
  const nextLimit = Number.parseInt(event.target.value, 10);
  if (!Number.isFinite(nextLimit)) {
    return;
  }

  emit("update:limit", nextLimit);
};
</script>

<template>
  <div class="flex w-full flex-wrap items-center gap-2 text-sm text-neutral-700 lg:w-auto">
    <button
      type="button"
      :disabled="isFirstPage"
      @click="updatePage(1)"
      class="cursor-pointer text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-400"
      aria-label="First page"
    >
      <ChevronFirst class="h-5 w-5" />
    </button>

    <div class="flex items-center">
        <button
          type="button"
          :disabled="isFirstPage"
          @click="updatePage(currentPage - 1)"
          class="cursor-pointer text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-400"
          aria-label="Previous page"
        >
          <ChevronLeft class="h-5 w-5" />
        </button>
        <button
          type="button"
          :disabled="isFirstPage"
          @click="updatePage(currentPage - 1)"
          class="font-semibold cursor-pointer text-[#009FFF] disabled:cursor-not-allowed disabled:text-neutral-400"
        >
          Previous
        </button>
    </div>

    <input
      v-model="pageInput"
      type="number"
      min="1"
      :max="maxPage"
      @blur="submitPageInput"
      @keyup.enter="submitPageInput"
      id="data-table-input"
      class="font-semibold w-8 ml-2 rounded border border-neutral-300 bg-white px-1 py-0.5 text-center text-sm text-neutral-700 outline-none focus:border-sky-500"
    />

    <span class="mr-2 font-semibold text-neutral-700">of {{ maxPage }}</span>

    <div class="flex items-center">
      <button
        type="button"
        :disabled="isLastPage"
        @click="updatePage(currentPage + 1)"
        class="cursor-pointer font-semibold text-[#009FFF] disabled:cursor-not-allowed disabled:text-neutral-400"
        >
        Next
      </button>
      <button
        type="button"
        :disabled="isLastPage"
        @click="updatePage(currentPage + 1)"
        class="cursor-pointer text-neutral-900 transition disabled:cursor-not-allowed disabled:text-neutral-400"
        aria-label="Next page"
      >
        <ChevronRight class="h-5 w-5" />
      </button>
    </div>

    <button
      type="button"
      :disabled="isLastPage"
      @click="updatePage(maxPage)"
      class="cursor-pointer text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Last page"
    >
      <ChevronLast class="h-5 w-5" />
    </button>

    <div class="relative inline-block ml-6">
      <select
        :value="pageSize"
        @change="updateLimit"
        class="font-semibold cursor-pointer appearance-none rounded border border-neutral-300 bg-white pl-2 pr-7 py-1 text-sm outline-none focus:border-sky-500"
      >
        <option v-for="option in pageSizeOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
      <ChevronDown
        class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-900"
      />
    </div>

    <span class="font-semibold text-neutral-900">{{ fromItem }} - {{ toItem }} of {{ totalItems }} items</span>
  </div>
</template>
