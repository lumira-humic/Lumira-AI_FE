<script setup>
import { computed, ref } from "vue";
import { MessageSquareMore, SendHorizontal, ChevronUp, Search, X, MailOpen } from '@lucide/vue';

import { doctorChatMock } from "@/lib/mocks/doctorChat.mock";


const isOpen = ref(false);
const searchQuery = ref("");
const messageDraft = ref("");
const conversations = ref(doctorChatMock.map((item) => ({ ...item })));
const activeConversationId = ref(null);

const unreadTotal = computed(() => {
  return conversations.value.reduce((total, item) => total + Number(item.unreadCount || 0), 0);
});

const filteredConversations = computed(() => {
  const keyword = searchQuery.value.toLowerCase();

  return conversations.value.filter((item) => {
    const matchName = item.patientName.toLowerCase().includes(keyword);
    return matchName;
  });
});

const activeConversation = computed(() => {
  if (!activeConversationId.value) {
    return null;
  }

  return (
    conversations.value.find((item) => item.id === activeConversationId.value) || null
  );
});

const openPanel = () => {
  isOpen.value = true;
};

const closePanel = () => {
  isOpen.value = false;
  activeConversationId.value = null;
};

const selectConversation = (conversationId) => {
  activeConversationId.value = conversationId;

  const index = conversations.value.findIndex((item) => item.id === conversationId);
  if (index >= 0) {
    conversations.value[index].unreadCount = 0;
  }
};

const sendMessage = () => {
  const content = messageDraft.value.trim();
  if (!content || !activeConversation.value) {
    return;
  }

  activeConversation.value.messages.push({
    id: `d-${Date.now()}`,
    from: "doctor",
    text: content,
  });
  messageDraft.value = "";
};
</script>

<template>
  <div class="absolute bottom-20 right-4 lg:bottom-0 lg:right-0 lg:relative">
    <!-- Button Chat Dock -->
    <button
      v-if="!isOpen"
      type="button"
      @click="openPanel"
      class="cursor-pointer flex justify-center items-center gap-2 rounded-xl bg-[#FFB200] px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base xl:text-xl font-medium text-black shadow-sm transition hover:bg-[#e8a300]"
    >
      <MessageSquareMore class="w-5 h-5 sm:h-6 sm:w-6" />
      <span>Chat</span>
      <span v-if="unreadTotal > 0" class="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-red-500 text-xs sm:text-sm font-semibold text-white">
        {{ unreadTotal }}
      </span>
    </button>
    <!-- Open Chat Dock -->
    <div
      v-else
      class="fixed bottom-2 right-2 z-50 h-[68vh] w-[calc(100vw-1rem)] overflow-hidden rounded-2xl bg-[#D9D9D9] shadow-md sm:absolute sm:bottom-0 sm:right-0 sm:h-130 sm:w-[min(800px,calc(100vw-1rem))]"
    >
      <div class="h-full md:grid md:grid-cols-[280px_1fr]">
        <!-- Left Sidebar - Chat List -->
        <aside
          class="h-full min-h-0 flex-col md:flex"
          :class="activeConversation ? 'hidden md:flex' : 'flex'"
        >
          <!-- Header -->
          <div class="px-4 pt-2">
            <div class="mb-2 flex items-start justify-between">
              <h3 class="sm:text-xl xl:text-2xl font-semibold text-black">Chat
                <span class="text-xs sm:text-sm text-red-500 align-top">({{ unreadTotal }})</span>
              </h3>
              <button
                type="button"
                @click="closePanel"
                class="lg:hidden cursor-pointer rounded-full p-1 text-neutral-800 transition hover:bg-neutral-200"
                aria-label="Close chat"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
          <!-- Chat Filter -->
          <div class="px-4">
            <div class="mb-4 flex items-center justify-between gap-2 text-xs">
              <div class="flex flex-1 items-center rounded-full bg-white px-3 py-1.5">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari nama"
                  class="w-full bg-transparent outline-none"
                />
                <Search class="mr-1 h-4 w-4 text-neutral-500" />
              </div>
              <div class="cursor-pointer bg-blue-600 px-3 py-1 text-white text-xs font-medium rounded-full">
                View
              </div>
              <!-- <div class="relative inline-block">
                <select
                  v-model="selectedFilter"
                  class="appearance-none bg-neutral-200 ring ring-[#1aa0f3c5] cursor-pointer rounded-full pl-3 pr-8 py-1.5 text-neutral-800 outline-none max-w-34"
                >
                  <option value="all">Semua</option>
                  <option value="unread">Belum dibaca</option>
                </select>
                <ChevronDown
                  class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600"
                />
              </div> -->
            </div>
          </div>
          <!-- Chat List -->
          <div class="chat-list-scroll min-h-0 flex-1 overflow-y-scroll border-r border-neutral-300">
            <button
              v-for="conversation in filteredConversations"
              :key="conversation.id"
              type="button"
              @click="selectConversation(conversation.id)"
              class="border-b border-neutral-300 cursor-pointer w-full px-4 py-3 text-left transition"
              :class="activeConversationId === conversation.id ? 'bg-neutral-100' : 'hover:bg-neutral-100/50'"
            >
              <div class="flex items-start justify-between gap-2">
                <span class="text-base sm:text-lg xl:text-xl font-semibold text-black">{{ conversation.patientName }}</span>
                <div class="text-right text-xs text-neutral-800">
                  <div>{{ conversation.timeLabel }}</div>
                  <span
                    v-if="conversation.unreadCount > 0"
                    class="mt-1 inline-flex w-5 h-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                  >
                    {{ conversation.unreadCount }}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </aside>
        <!-- Right Content - Active Chat -->
        <section
          class="relative h-full min-h-0 flex-col overflow-hidden bg-neutral-50 md:flex"
          :class="activeConversation ? 'flex' : 'hidden md:flex'"
        >
          <!-- Close Button (only when no active conversation) -->
          <button
            v-if="!activeConversation"
            type="button"
            @click="closePanel"
            class="absolute right-2 top-2 cursor-pointer rounded-full p-1 text-neutral-800 transition hover:bg-neutral-200"
            aria-label="Close chat"
          >
            <X class="h-6 w-6" />
          </button>
          <!-- Detail Chat -->
          <template v-if="activeConversation">
            <!-- Header -->
            <div class="w-full h-10 sm:h-12 flex justify-end items-center bg-[#D9D9D9]">
              <MailOpen class="w-5 h-5 sm:h-7 sm:w-7 text-neutral-800 mr-4" />
            </div>
            <!-- Second Header -->
            <div class="flex items-center justify-between rounded-br-3xl bg-[#00d0ff86] px-4 py-3">
              <h4 class="text-base sm:text-lg xl:text-xl font-semibold text-black">{{ activeConversation.patientName }}</h4>
              <button
                type="button"
                @click="activeConversationId = null"
                class="flex items-center justify-center gap-1 cursor-pointer text-xs sm:text-sm font-semibold text-neutral-700 transition hover:text-neutral-900"
              >
                <span>Tutup</span>
                <ChevronUp class="hidden h-5 w-5 md:inline-block" />
              </button>
            </div>
            <!-- Value Chat -->
            <div class="chat-thread-scroll min-h-0 flex-1 space-y-3 overflow-y-scroll p-4">
              <div
                v-for="message in activeConversation.messages"
                :key="message.id"
                class="max-w-[84%] wrap-break-word rounded-xl px-3 py-2 text-sm md:max-w-[72%]"
                :class="message.from === 'doctor' ? 'ml-auto bg-[#a8e2ef]' : 'bg-neutral-200'"
              >
                {{ message.text }}
              </div>
            </div>
            <!-- Actions -->
            <div class="sticky bottom-0 border-t-2 border-neutral-300 bg-neutral-50 p-3">
              <div class="relative">
                <input
                  v-model="messageDraft"
                  type="text"
                  placeholder="Tuliskan pesan..."
                  class="h-9 w-full bg-white px-3 pr-10 text-sm outline-none"
                  @keyup.enter="sendMessage"
                />

                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-600 hover:text-sky-500"
                  aria-label="Send message"
                  @click="sendMessage"
                >
                  <SendHorizontal class="h-5 w-5" />
                </button>
              </div>
            </div>
          </template>
          <!-- Onboarding Chat -->
          <template v-else>
            <div class="flex h-full min-h-0 flex-col items-center justify-center p-6 text-center">
              <img src="@/assets/icons/doctor/icon-chat-onboarding.png" alt="Onboarding Chat Icon" class="mb-6 w-16 sm:24 xl:w-34" />
              <p class="text-xl font-semibold text-neutral-800">Selamat datang di chat Lumira AI</p>
              <p class="text-base text-neutral-600">Leading-edge technology for better diagnosis</p>
            </div>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-list-scroll,
.chat-thread-scroll {
  scrollbar-width: thin;
  scrollbar-color: #939393 #d9d9d9;
}

.chat-list-scroll::-webkit-scrollbar,
.chat-thread-scroll::-webkit-scrollbar {
  width: 6px;
}

.chat-list-scroll::-webkit-scrollbar-track,
.chat-thread-scroll::-webkit-scrollbar-track {
  background: #d9d9d9;
}

.chat-list-scroll::-webkit-scrollbar-thumb,
.chat-thread-scroll::-webkit-scrollbar-thumb {
  background: #8a8a8a;
  border-radius: 999px;
}
</style>
