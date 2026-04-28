<script setup>
import { ref } from 'vue';
import BaseModal from './BaseModal.vue'; // Reusing your existing BaseModal

const props = defineProps({
    isOpen: Boolean
});

const emit = defineEmits(['close', 'confirm']);

const activeTab = ref('upload'); // 'upload' | 'url'
const imageUrl = ref('');
const selectedFile = ref(null);
const previewSrc = ref('');

// Handle File Selection
const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
        // Create a local preview URL
        previewSrc.value = URL.createObjectURL(file);
    }
};

// Handle Confirm Action
const handleConfirm = () => {
    if (activeTab.value === 'upload' && previewSrc.value) {
        emit('confirm', previewSrc.value); // Send the local blob URL
    } else if (activeTab.value === 'url' && imageUrl.value) {
        emit('confirm', imageUrl.value); // Send the string URL
    }
    closeModal();
};

const closeModal = () => {
    // Reset fields on close
    selectedFile.value = null;
    previewSrc.value = '';
    imageUrl.value = '';
    emit('close');
};
</script>

<template>
    <BaseModal :isOpen="isOpen" title="Select Ultrasound Image" @close="closeModal">

        <div class="flex border-b border-slate-200 mb-6">
            <button @click="activeTab = 'upload'" class="flex-1 pb-3 font-bold text-sm transition-colors relative"
                :class="activeTab === 'upload' ? 'text-[#0099ff]' : 'text-slate-400 hover:text-slate-600'">
                Upload File
                <div v-if="activeTab === 'upload'" class="absolute bottom-0 left-0 w-full h-0.5 bg-[#0099ff]"></div>
            </button>
            <button @click="activeTab = 'url'" class="flex-1 pb-3 font-bold text-sm transition-colors relative"
                :class="activeTab === 'url' ? 'text-[#0099ff]' : 'text-slate-400 hover:text-slate-600'">
                Fetch from URL
                <div v-if="activeTab === 'url'" class="absolute bottom-0 left-0 w-full h-0.5 bg-[#0099ff]"></div>
            </button>
        </div>

        <div class="space-y-4">
            <div v-if="activeTab === 'upload'">
                <label
                    class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg class="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12">
                            </path>
                        </svg>
                        <p class="mb-2 text-sm text-slate-500"><span class="font-semibold">Click to upload</span> or
                            drag and drop</p>
                        <p class="text-xs text-slate-500">PNG, JPG or DICOM</p>
                    </div>
                    <input type="file" class="hidden" accept="image/*" @change="handleFileChange" />
                </label>

                <div v-if="previewSrc" class="mt-4 p-2 border border-slate-200 rounded-lg">
                    <p class="text-xs font-bold text-slate-400 mb-2 uppercase">Preview</p>
                    <img :src="previewSrc" class="h-32 w-full object-cover rounded-md" />
                </div>
            </div>

            <div v-if="activeTab === 'url'">
                <label class="block text-sm font-bold text-slate-700 mb-2">Image URL</label>
                <input v-model="imageUrl" type="text"
                    class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0099ff] outline-none text-sm" />
                <p class="mt-2 text-xs text-slate-400">Paste a direct link to the X-Ray image.</p>
            </div>

        </div>

        <template #footer>
            <button @click="closeModal"
                class="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-bold text-sm transition">Cancel</button>
            <button @click="handleConfirm"
                class="px-6 py-2 rounded-lg bg-[#0099ff] text-white font-bold text-sm shadow-md hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="(activeTab === 'upload' && !previewSrc) || (activeTab === 'url' && !imageUrl)">
                Load Image
            </button>
        </template>

    </BaseModal>
</template>