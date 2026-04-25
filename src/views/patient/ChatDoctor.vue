<script setup>
import { computed, ref, watch } from "vue";
import { SendHorizontal } from "@lucide/vue";

import { usePatientPortalData } from "@/composables/usePatientPortalData";
import { useAppStore } from "@/stores/appStore";
import Loading from "@/components/common/Loading.vue";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";

const appStore = useAppStore();
const { portalData, isLoading } = usePatientPortalData();

const draft = ref("");
const messages = ref([]);

watch(
    () => portalData.value.doctorChatMessages,
    (nextMessages) => {
        messages.value = nextMessages.map((item) => ({ ...item }));
    },
    { immediate: true },
);

const isRealtimeReady = computed(() => appStore.featureToggles.chatEnabled);

const sendMessage = () => {
    const content = String(draft.value || "").trim();
    if (!content) {
        return;
    }

    messages.value.push({
        id: `draft-${Date.now()}`,
        from: "patient",
        text: content,
        time: new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    });

    draft.value = "";
};
</script>

<template>
    <section class="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <img :src="LumiraLogo" alt="Lumira watermark"
            class="pointer-events-none absolute inset-0 m-auto hidden w-[42%] max-w-md opacity-10 sm:block" />
        <div v-if="isLoading" class="flex min-h-0 flex-1 items-center justify-center">
            <Loading text="Loading doctor chat..." />
        </div>
        <div v-else class="relative z-10 flex min-h-0 flex-1 flex-col gap-3">
            <!-- Header -->
            <div class="rounded-br-3xl border-2 border-sky-500 bg-white px-3 py-2 shadow">
                <div class="grid grid-cols-3 gap-3">
                    <div class="flex gap-2 items-center col-span-1">
                        <div class="h-14 w-14 rounded-full bg-neutral-200"></div>
                        <div>
                            <p class="text-lg font-semibold text-neutral-700">
                                {{ portalData.activeDoctor.name }}
                            </p>
                            <p class="text-sm text-neutral-500">
                                {{ portalData.activeDoctor.subtitle }}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center justify-center col-span-1">
                        <p class="text-xl    font-semibold text-neutral-600">
                            {{ portalData.activeDoctor.activeLabel }}
                        </p>
                    </div>
                </div>
            </div>
            <div v-if="!isRealtimeReady" class="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Realtime socket is not enabled on backend yet. This page currently runs in preview mode
            </div>
            <!-- Main Data -->
            <div class="min-h-0 flex-1 p-5 space-y-3 overflow-y-auto bg-white/40">
                <template v-for="message in messages" :key="message.id">
                    <div v-if="message.dayLabel" class="flex justify-center">
                        <span class="rounded-lg bg-[#C2E8FF] px-3 py-1 text-sm font-semibold text-neutral-700">{{
                            message.dayLabel }}</span>
                    </div>

                    <div :class="message.from === 'patient'
                            ? 'flex justify-end'
                            : 'flex justify-start'
                        ">
                        <div class="max-w-[78%] rounded-xl px-3 py-2 text-lg shadow-sm" :class="message.from === 'patient'
                                ? 'bg-neutral-200 text-neutral-800'
                                : 'bg-[#84D0FF] text-neutral-900'
                            ">
                            <p class="whitespace-pre-wrap">{{ message.text }}</p>
                            <p class="font-semibold text-black mt-1 text-right text-xs opacity-75">
                                {{ message.time }}
                            </p>
                        </div>
                    </div>
                </template>
            </div>
            <!-- Action Buttons -->
            <div class="shrink-0 rounded-2xl border border-neutral-300 bg-white px-3 py-2 mx-4 mb-4">
                <div class="flex items-center gap-2">
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
