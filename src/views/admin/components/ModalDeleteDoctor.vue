<script setup>
import BaseModal from '@/components/common/BaseModal.vue';


defineProps({
    isOpen: Boolean,
    doctor: Object
})

defineEmits(['close', 'confirm'])
</script>

<template>
    <BaseModal 
    :isOpen="isOpen" title="Delete Doctor" maxWidth="max-w-sm" @close="$emit('close')" :showCloseButton="false" :closeOnBackdrop="false" :centerTitle="true">
        <div class="text-center">
            <div class="bg-red-100 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-8 h-8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
            </div>
            <p class="text-gray-600 mb-1">Are you sure you want to delete</p>
            <p class="font-bold text-gray-800 text-lg mb-2">{{ doctor?.name || 'this doctor' }}?</p>
            <p class="text-sm text-gray-400">This action cannot be undone.</p>
        </div>

        <template #footer>
            <button @click="$emit('close')"
                class="cursor-pointer px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                Cancel
            </button>
            <button @click="$emit('confirm')"
                class="cursor-pointer px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow">
                Delete
            </button>
        </template>
    </BaseModal>
</template>
