<script setup>
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
    }
})

defineEmits(['close'])
</script>

<template>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
        <div v-if="isOpen"
            class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 backdrop-blur-sm bg-black/30"
            @click.self="$emit('close')">
            <div class="relative w-full bg-white rounded-xl shadow-2xl pt-6 px-6 pb-4 transition-all" :class="maxWidth">
                <!-- Header -->
                <div class="flex items-center justify-between mb-8">
                    <h3 class="text-xl font-bold text-gray-800" :class="centerTitle ? 'w-full text-center' : ''">{{
                        title }}</h3>
                    <button v-if="showCloseButton" @click="$emit('close')"
                        class="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                            stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Body -->
                <div class="mb-1">
                    <slot></slot>
                </div>

                <!-- Footer -->
                <div v-if="$slots.footer" class="flex justify-end gap-3 pt-2">
                    <slot name="footer"></slot>
                </div>
            </div>
        </div>
    </Transition>
</template>
