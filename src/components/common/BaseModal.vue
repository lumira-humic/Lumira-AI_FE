<script setup>
import { X } from '@lucide/vue';

defineProps({
    isOpen: Boolean,
    title: String,
    maxWidth: {
        type: String,
        default: 'max-w-md'
    },
    showCloseButton: {
        type: Boolean,
        default: true
    },
    centerTitle: {
        type: Boolean,
        default: false
    },
    closeOnBackdrop: {
        type: Boolean,
        default: true
    }
})

defineEmits(['close'])
</script>

<template>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform opacity-0"
        enter-to-class="transform opacity-100" leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform opacity-100" leave-to-class="transform opacity-0">
        <div v-if="isOpen"
            class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 backdrop-blur-sm bg-black/30"
            @click.self="closeOnBackdrop && $emit('close')">
            <div class="relative w-full bg-white rounded-xl shadow-2xl pt-6 px-6 pb-4 transition-all" :class="maxWidth">
                <!-- Header -->
                <div class="flex items-center justify-center mb-8">
                    <h3 class="text-lg not-only:sm:text-xl font-bold text-neutral-800" :class="centerTitle ? 'w-full text-center' : ''">{{
                        title }}
                    </h3>
                    <!-- Close Button -->
                    <button v-if="showCloseButton" @click="$emit('close')"
                        class="absolute top-5 right-5 rounded-full hover:bg-neutral-100 p-1.5 text-neutral-600 hover:text-neutral-800 cursor-pointer">
                        <X class="w-5 h-5" />
                    </button>
                </div>
                <!-- Body -->
                <div class="mb-1">
                    <slot></slot>
                </div>
                <!-- Footer -->
                <div v-if="$slots.footer" class="flex justify-end gap-3 pt-5">
                    <slot name="footer"></slot>
                </div>
            </div>
        </div>
    </Transition>
</template>
