<script setup>
import { computed } from "vue";


const props = defineProps({
    title: {
        type: String,
        required: true,
    },
    value: {
        type: [String, Number],
        required: true,
    },
    icon: {
        type: String,
        required: true,
    },
    theme: {
        type: String,
        default: "blue", // blue, dark-blue, green, red
        validator: (value) =>
            ["blue", "dark-blue", "green", "red"].includes(value),
    },
});

const themeClasses = computed(() => {
    switch (props.theme) {
        case "blue":
            return {
                hoverBorder: "group-hover:border-[#0099ff]/50",
                iconBg: "bg-blue-50",
            };
        case "dark-blue":
            return {
                hoverBorder: "group-hover:border-[#004d80]/50",
                iconBg: "bg-[#eef5fa]",
            };
        case "green":
            return {
                hoverBorder: "group-hover:border-green-500/50",
                iconBg: "bg-green-50",
            };
        case "red":
            return {
                hoverBorder: "group-hover:border-red-500/50",
                iconBg: "bg-red-50",
            };
        default:
            return {
                hoverBorder: "group-hover:border-[#0099ff]/50",
                iconBg: "bg-blue-50",
            };
    }
});
</script>

<template>
    <div class="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm relative h-32 flex flex-col justify-between group transition-all cursor-pointer"
        :class="themeClasses.hoverBorder">
        <div class="flex items-start justify-between">
            <div class="min-w-[48px] h-[48px] flex items-center justify-center rounded-xl p-2.5"
                :class="themeClasses.iconBg">
                <img :src="props.icon" :alt="props.title" class="w-6 h-6 object-contain" />
            </div>
            <span class="text-gray-500 text-sm font-medium pt-1 text-right">{{
                props.title
                }}</span>
        </div>
        <div class="flex justify-end items-end">
            <span class="text-4xl text-gray-800 font-normal leading-none mb-1">{{
                props.value
                }}</span>
        </div>
    </div>
</template>
