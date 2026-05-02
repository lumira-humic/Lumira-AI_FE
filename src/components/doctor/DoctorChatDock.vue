<script setup>
import { computed, nextTick, ref, watch } from "vue";
import {
  ChevronUp,
  Loader2,
  MailOpen,
  MessageSquareMore,
  RefreshCw,
  Search,
  SendHorizontal,
  X,
} from "@lucide/vue";

import { useChatRooms, useChatMessages } from "@/composables/useFirebaseChat";
import Loading from "@/components/common/Loading.vue";


const isOpen = ref(false);
const searchQuery = ref("");
const activeRoomId = ref(null);
const chatThreadRef = ref(null);

// ─────────────────────────────────────────────
// Room list
// ─────────────────────────────────────────────

const {
  rooms,
  totalUnread,
  isPending: isRoomsLoading,
  errorMessage: roomsError,
  refetch: refetchRooms,
} = useChatRooms();

const filteredRooms = computed(() => {
  const keyword = searchQuery.value.toLowerCase().trim();
  if (!keyword) return rooms.value;

  return rooms.value.filter((room) =>
    room.counterpartName.toLowerCase().includes(keyword),
  );
});

const activeRoom = computed(() =>
  rooms.value.find((r) => r.id === activeRoomId.value) ?? null,
);

// ─────────────────────────────────────────────
// Messages in active room
// ─────────────────────────────────────────────

const {
  messages,
  draft,
  isSending,
  isPending: isMessagesLoading,
  errorMessage: messagesError,
  sendMessage,
} = useChatMessages(activeRoomId, { room: activeRoom });

// ─────────────────────────────────────────────
// Auto-scroll to bottom when messages arrive
// ─────────────────────────────────────────────

const scrollToBottom = async () => {
  await nextTick();
  if (chatThreadRef.value) {
    chatThreadRef.value.scrollTop = chatThreadRef.value.scrollHeight;
  }
};

watch(messages, scrollToBottom, { flush: "post" });

// ─────────────────────────────────────────────
// Panel actions
// ─────────────────────────────────────────────

const openPanel = () => {
  isOpen.value = true;
};

const closePanel = () => {
  isOpen.value = false;
  activeRoomId.value = null;
};

const selectRoom = async (roomId) => {
  activeRoomId.value = roomId;
  scrollToBottom();
};

const handleSend = async () => {
  await sendMessage();
  scrollToBottom();
};

const handleKeyEnter = async (e) => {
  if (e.shiftKey) return; // allow shift+enter for newlines if wanted
  await handleSend();
};
</script>

<template>
  <div class="absolute bottom-20 right-4 lg:bottom-0 lg:right-0 lg:relative">
    <!-- Collapsed Button -->
    <button
      v-if="!isOpen"
      type="button"
      @click="openPanel"
      class="cursor-pointer flex justify-center items-center gap-2 rounded-xl bg-[#FFB200] px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base xl:text-xl font-medium text-black shadow-sm transition hover:bg-[#e8a300]"
      aria-label="Buka chat pasien"
    >
      <MessageSquareMore class="w-5 h-5 sm:h-6 sm:w-6" />
      <span>Chat</span>
      <span
        v-if="totalUnread > 0"
        class="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-red-500 text-xs sm:text-sm font-semibold text-white"
      >
        {{ totalUnread > 99 ? "99+" : totalUnread }}
      </span>
    </button>

    <!-- Expanded Chat Panel -->
    <div
      v-else
      class="fixed bottom-2 right-2 z-50 h-[68vh] w-[calc(100vw-1rem)] overflow-hidden rounded-2xl bg-[#D9D9D9] shadow-xl sm:absolute sm:bottom-0 sm:right-0 sm:h-130 sm:w-[min(800px,calc(100vw-1rem))]"
    >
      <div class="h-full md:grid md:grid-cols-[280px_1fr]">

        <!-- Left: Room List -->
        <aside
          class="h-full min-h-0 flex-col md:flex"
          :class="activeRoom ? 'hidden md:flex' : 'flex'"
        >
          <!-- Header -->
          <div class="px-4 pt-3 pb-2">
            <div class="flex items-start justify-between mb-2">
              <h3 class="sm:text-xl xl:text-2xl font-semibold text-black">
                Chat
                <span class="text-xs sm:text-sm text-red-500 align-top">
                  ({{ totalUnread }})
                </span>
              </h3>
              <div class="flex items-center gap-1">
                <!-- Refresh button -->
                <button
                  type="button"
                  @click="refetchRooms"
                  class="cursor-pointer rounded-full p-1 text-neutral-600 hover:bg-neutral-200 transition"
                  aria-label="Refresh daftar chat"
                >
                  <RefreshCw class="h-4 w-4" />
                </button>
                <!-- Close on mobile -->
                <button
                  type="button"
                  @click="closePanel"
                  class="lg:hidden cursor-pointer rounded-full p-1 text-neutral-800 hover:bg-neutral-200 transition"
                  aria-label="Tutup chat"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>
            </div>

            <!-- Search -->
            <div class="flex items-center rounded-full bg-white px-3 py-1.5 gap-2">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari nama pasien"
                class="w-full bg-transparent text-xs outline-none"
                aria-label="Cari pasien"
              />
              <Search class="h-4 w-4 text-neutral-500 shrink-0" />
            </div>
          </div>
          <!-- List -->
          <div class="chat-list-scroll min-h-0 flex-1 overflow-y-auto border-r border-neutral-300">
            <!-- Loading state -->
            <div v-if="isRoomsLoading" class="flex items-center justify-center py-10">
              <Loading text="Memuat chat..." />
            </div>
            <!-- Error state -->
            <div
              v-else-if="roomsError"
              class="m-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600"
            >
              {{ roomsError }}
            </div>
            <!-- Empty state -->
            <div
              v-else-if="filteredRooms.length === 0"
              class="flex flex-col items-center justify-center py-10 px-4 text-center"
            >
              <p class="text-sm text-neutral-500">
                {{ searchQuery ? "Tidak ada hasil pencarian" : "Belum ada chat dari pasien." }}
              </p>
            </div>
            <!-- Room items -->
            <button
              v-else
              v-for="room in filteredRooms"
              :key="room.id"
              type="button"
              @click="selectRoom(room.id)"
              class="w-full border-b border-neutral-300 cursor-pointer px-4 py-3 text-left transition"
              :class="activeRoomId === room.id ? 'bg-neutral-100' : 'hover:bg-neutral-100/60'"
            >
              <!-- Avatar + Name -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="h-9 w-9 shrink-0 rounded-full bg-sky-200 flex items-center justify-center text-sky-700 font-bold text-sm">
                    {{ room.counterpartName?.charAt(0)?.toUpperCase() || "P" }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm sm:text-base font-semibold text-black truncate">
                      {{ room.counterpartName }}
                    </p>
                    <p
                      v-if="room.lastMessagePreview"
                      class="text-xs text-neutral-500 truncate max-w-[140px]"
                    >
                      {{ room.lastMessagePreview }}
                    </p>
                  </div>
                </div>
                <!-- Time + Unread badge -->
                <div class="flex flex-col items-end shrink-0 gap-1">
                  <span class="text-xs text-neutral-400">{{ room.timeLabel }}</span>
                  <span
                    v-if="room.unreadCount > 0"
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                  >
                    {{ room.unreadCount > 9 ? "9+" : room.unreadCount }}
                  </span>
                </div>
              </div>
              <!-- Presence -->
              <p class="mt-1 text-xs text-neutral-400 pl-11">
                {{ room.counterpartActivityText }}
              </p>
            </button>
          </div>
        </aside>

        <!-- Right: Active Chat -->
        <section
          class="relative h-full min-h-0 flex-col overflow-hidden bg-neutral-50 md:flex"
          :class="activeRoom ? 'flex' : 'hidden md:flex'"
        >
          <!-- Close button (only when no active room) -->
          <button
            v-if="!activeRoom"
            type="button"
            @click="closePanel"
            class="absolute right-2 top-2 cursor-pointer rounded-full p-1 text-neutral-800 hover:bg-neutral-200"
            aria-label="Tutup chat"
          >
            <X class="h-6 w-6" />
          </button>

          <!-- Active conversation -->
          <template v-if="activeRoom">
            <!-- Top bar -->
            <div class="w-full h-10 sm:h-12 flex justify-end items-center bg-[#D9D9D9] px-4">
              <MailOpen class="w-5 h-5 sm:h-7 sm:w-7 text-neutral-800" />
            </div>

            <!-- Patient name header -->
            <div class="flex items-center justify-between rounded-br-3xl bg-[#00d0ff86] px-4 py-3">
              <div>
                <h4 class="text-base sm:text-lg xl:text-xl font-semibold text-black">
                  {{ activeRoom.counterpartName }}
                </h4>
                <p class="text-xs text-neutral-600">{{ activeRoom.counterpartActivityText }}</p>
              </div>
              <button
                type="button"
                @click="activeRoomId = null"
                class="flex items-center justify-center gap-1 cursor-pointer text-xs sm:text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition"
              >
                <span>Tutup</span>
                <ChevronUp class="hidden h-5 w-5 md:inline-block" />
              </button>
            </div>
            <!-- Messages -->
            <div
              ref="chatThreadRef"
              class="chat-thread-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-4"
            >
              <!-- Loading skeleton -->
              <div v-if="isMessagesLoading && messages.length === 0" class="flex justify-center py-6">
                <Loading text="Memuat pesan..." />
              </div>
              <!-- Error -->
              <div
                v-else-if="messagesError"
                class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 text-center"
              >
                {{ messagesError }}
              </div>

              <template v-else>
                <template v-for="item in messages" :key="item.id">
                  <!-- Day label separator -->
                  <div v-if="item._isDayMarker" class="flex justify-center my-2">
                    <span class="rounded-lg bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {{ item.dayLabel }}
                    </span>
                  </div>
                  <!-- Message bubble -->
                  <div
                    v-else
                    class="flex"
                    :class="item.senderType === 'doctor' ? 'justify-end' : 'justify-start'"
                  >
                    <div
                      class="max-w-[80%] rounded-xl px-3 py-2 text-sm shadow-sm"
                      :class="
                        item.senderType === 'doctor'
                          ? 'bg-[#a8e2ef] text-neutral-800'
                          : 'bg-neutral-200 text-neutral-800'
                      "
                    >
                      <p class="whitespace-pre-wrap wrap-break-word">{{ item.text }}</p>
                      <p class="mt-1 text-right text-[10px] opacity-60">{{ item.time }}</p>
                    </div>
                  </div>
                </template>
              </template>
            </div>
            <!-- Input Chat -->
            <div class="shrink-0 border-t-2 border-neutral-200 bg-neutral-50 px-3 py-2">
              <div class="flex items-center gap-2">
                <input
                  v-model="draft"
                  type="text"
                  placeholder="Tuliskan pesan..."
                  class="h-9 w-full rounded-lg bg-white px-3 text-sm outline-none border border-neutral-200 focus:border-sky-400 transition"
                  @keyup.enter="handleKeyEnter"
                  :disabled="isSending"
                  aria-label="Tulis pesan"
                />
                <button
                  type="button"
                  @click="handleSend"
                  :disabled="!draft.trim() || isSending"
                  class="cursor-pointer rounded-full p-2 text-neutral-600 hover:text-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Kirim pesan"
                >
                  <Loader2 v-if="isSending" class="h-5 w-5 animate-spin" />
                  <SendHorizontal v-else class="h-5 w-5" />
                </button>
              </div>
            </div>
          </template>
          <!-- Onboarding (no room selected) -->
          <template v-else>
            <div class="flex h-full min-h-0 flex-col items-center justify-center p-6 text-center">
              <img
                src="@/assets/icons/doctor/icon-chat-onboarding.png"
                alt="Chat Onboarding"
                class="mb-6 w-16 sm:w-24 xl:w-34"
              />
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
