<script setup>
import { computed, ref, watch } from "vue";
import { ImagePlus, SendHorizontal, Sparkles } from "@lucide/vue";

import { usePatientPortalData } from "@/composables/usePatientPortalData";
import { useAppStore } from "@/stores/appStore";
import Loading from "@/components/common/Loading.vue";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";


const appStore = useAppStore();
const { portalData, isLoading } = usePatientPortalData();

const messages = ref([]);
const draft = ref("");
const fileInputRef = ref(null);
const selectedFileName = ref("");

watch(
    () => portalData.value.aiChatMessages,
    (nextMessages) => {
        messages.value = nextMessages.map((item) => ({ ...item }));
    },
    { immediate: true },
);

const isMedgemmaReady = computed(() => appStore.featureToggles.medgemmaEnabled);

const openFilePicker = () => {
    if (fileInputRef.value) {
        fileInputRef.value.click();
    }
};

const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    selectedFileName.value = file?.name || "";
};

const sendMessage = () => {
    const content = String(draft.value || "").trim();
    if (!content && !selectedFileName.value) {
        return;
    }

    const timeLabel = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const outgoingText = selectedFileName.value
        ? `${content || "Please analyze this image"}\n[Attached image: ${selectedFileName.value}]`
        : content;

    messages.value.push({
        id: `ai-out-${Date.now()}`,
        from: "patient",
        text: outgoingText,
        time: timeLabel,
    });

    messages.value.push({
        id: `ai-in-${Date.now() + 1}`,
        from: "assistant",
        text: "Thank you. This is preview mode. Once backend MedGemma integration is available, I will return a complete clinical explanation.",
        time: timeLabel,
    });

    draft.value = "";
    selectedFileName.value = "";
};
</script>

<template>
    <section class="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <img :src="LumiraLogo" alt="Lumira watermark"
            class="pointer-events-none absolute inset-0 m-auto hidden w-[42%] max-w-md opacity-10 sm:block" />

        <div v-if="isLoading" class="flex min-h-0 flex-1 items-center justify-center">
            <Loading text="Loading AI consultation..." />
        </div>

        <div v-else class="relative z-10 flex min-h-0 flex-1 flex-col gap-3">
            <div v-if="!isMedgemmaReady"
                class="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                MedGemma integration is disabled. This page currently runs in preview mode.
            </div>

            <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
                <template v-for="message in messages" :key="message.id">
                    <div v-if="message.dayLabel" class="flex justify-center">
                        <span class="rounded-lg bg-sky-200 px-3 py-1 text-xs font-semibold text-neutral-700">{{
                            message.dayLabel }}</span>
                    </div>
                    <div :class="message.from === 'patient' ? 'flex justify-end' : 'flex justify-start'">
                        <div class="max-w-[78%] rounded-xl px-3 py-2 text-lg shadow-sm"
                            :class="message.from === 'patient' ? 'bg-neutral-200 text-neutral-800' : 'bg-[#80C4EC] text-neutral-900'">
                            <p class="whitespace-pre-wrap">{{ message.text }}</p>
                            <p class="mt-1 text-right text-xs opacity-75">{{ message.time }}</p>
                        </div>
                    </div>
                </template>
            </div>
            <!-- Action Buttons -->
            <div class="shrink-0 rounded-2xl border border-neutral-300 bg-white px-3 py-2 mx-4 mb-4">
                <div class="mb-2 flex items-center gap-2" v-if="selectedFileName">
                    <span class="rounded-lg bg-sky-50 px-2 py-1 text-xs text-sky-700">Attached: {{ selectedFileName
                        }}</span>
                </div>

                <div class="flex items-center gap-2">
                    <input ref="fileInputRef" type="file" class="hidden" accept="image/*" @change="handleFileChange" />

                    <button type="button" @click="openFilePicker"
                        class="cursor-pointer rounded-full p-2 text-neutral-700 transition hover:bg-neutral-100"
                        aria-label="Attach image">
                        <ImagePlus class="h-5 w-5" />
                    </button>

                    <input v-model="draft" type="text" placeholder="Tuliskan pesan"
                        class="w-full bg-transparent px-1 py-2 text-sm outline-none" @keyup.enter="sendMessage" />

                    <button type="button" @click="sendMessage"
                        class="cursor-pointer rounded-full p-2 text-neutral-700 transition hover:bg-neutral-100"
                        aria-label="Send message">
                        <SendHorizontal class="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
