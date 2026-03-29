<script setup>
import { ref } from 'vue';

import MedicalCanvas from './MedicalCanvas.vue'; // Sibling import
import ImageInputModal from '@/components/common/ImageInputModal.vue';


const props = defineProps(['currentImage']);
const emit = defineEmits(['update:image', 'update:drawings']);

// Internal UI State (Parent doesn't need to know these)
const showGradCam = ref(false);
const gradCamOpacity = ref(0.6);
const showImageModal = ref(false);

const handleImageConfirm = (newSrc) => {
    emit('update:image', newSrc);
};
</script>

<template>
    <div class="bg-gray-100 rounded-3xl p-8 mb-6 shadow-sm border border-slate-200 relative">

        <div class="flex justify-between items-center mb-6">
            <h2 class="font-bold text-slate-700 text-lg">Visual Review</h2>
            <button @click="showImageModal = true"
                class="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:border-[#0099ff] hover:text-[#0099ff] transition-all shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Change Image
            </button>
        </div>

        <MedicalCanvas :baseImageSrc="currentImage" :showGradCam="showGradCam" :gradCamOpacity="gradCamOpacity"
            @update:drawings="(data) => emit('update:drawings', data)" />

        <div class="mt-8 flex items-center gap-6 px-4">
            <label class="flex items-center gap-3 cursor-pointer">
                <div class="relative flex items-center">
                    <input type="checkbox" v-model="showGradCam" class="peer sr-only">
                    <div
                        class="w-6 h-6 bg-white border-2 border-slate-400 rounded peer-checked:bg-[#0099ff] peer-checked:border-[#0099ff] transition-all">
                    </div>
                    <svg class="absolute w-4 h-4 text-white left-1 opacity-0 peer-checked:opacity-100"
                        viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"></path>
                    </svg>
                </div>
                <span class="font-bold text-slate-600">Grad-Cam</span>
            </label>

            <div class="flex-1 flex items-center gap-3">
                <div class="w-4 h-4 rounded-full bg-[#0099ff]"></div>
                <input type="range" min="0" max="1" step="0.05" v-model.number="gradCamOpacity"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0099ff]">
            </div>
        </div>

        <ImageInputModal :isOpen="showImageModal" @close="showImageModal = false" @confirm="handleImageConfirm" />
    </div>
</template>