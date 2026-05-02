<script setup>
import { ref, computed } from "vue";
import {
  SendHorizontal,
  PanelLeftOpen,
  PanelLeftClose,
  SquarePen,
  Bot,
  LoaderCircle,
  ImagePlus,
  X,
  ImageIcon,
} from "@lucide/vue";

import { useMedgemmaChat } from "@/composables/useMedgemmaChat";
import { useToast } from "@/composables/useToast";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";


const toast = useToast();

const {
  messages,
  isSending,
  chatError,
  sidebarOpen,
  scrollContainerRef,
  sessions,
  isLoadingSessions,
  sessionsError,
  activeSessionId,
  stagedImagePreviewUrl,
  stageImageFile,
  clearStagedImage,
  sendMessage,
  loadSession,
  startNewConversation,
  toggleSidebar,
} = useMedgemmaChat();

const draft = ref("");
const textareaRef = ref(null);
const fileInputRef = ref(null);

const hasContent = computed(
  () => String(draft.value || "").trim().length > 0 || !!stagedImagePreviewUrl.value,
);

const handleSend = async () => {
  const text = String(draft.value || "").trim();
  if ((!text && !stagedImagePreviewUrl.value) || isSending.value) return;
  draft.value = "";
  resetTextareaHeight();
  await sendMessage(text);
};

const handleKeydown = (event) => {
  // Shift+Enter = newline, Enter alone = send
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
};

// Auto-grow textarea (max ~5 lines / 120px)
const autoGrow = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
};

const resetTextareaHeight = () => {
  const el = textareaRef.value;
  if (el) el.style.height = "auto";
};


// ─────────────────────────────────────────────
// Image file picker
// ─────────────────────────────────────────────
const openFilePicker = () => {
  fileInputRef.value?.click();
};

/**
 * Handle file selection from the OS picker.
 * Validates type (JPEG/PNG/WEBP) and size (≤5MB) via the composable
 * which delegates to validateImageFile() from medgemmaService.
 */
const handleFileChange = (event) => {
  const file = event.target.files?.[0];
  // Reset input so the same file can be re-selected after removal
  if (event.target) event.target.value = "";

  if (!file) return;

  const { valid, error } = stageImageFile(file);
  if (!valid) {
    toast.error(error);
  }
};

const removeStagedImage = () => {
  clearStagedImage();
};

const handleSessionClick = (sessionId) => {
  sidebarOpen.value = false;
  loadSession(sessionId);
};

const isSessionActive = (sessionId) => activeSessionId.value === sessionId;

const parseMarkdown = (text) => {
  if (!text) return "";

  // 1. Escape HTML biar aman
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // 2. Bold: **teks** → <strong>teks</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // 3. Bullet list: baris yang diawali "* " atau "*   "
  const lines = html.split("\n");
  const rendered = [];
  let inList = false;

  for (const line of lines) {
    const bullet = line.match(/^\*\s+(.*)/);
    if (bullet) {
      if (!inList) {
        rendered.push('<ul class="my-1 list-disc space-y-0.5 pl-4">');
        inList = true;
      }
      rendered.push(`<li>${bullet[1]}</li>`);
    } else {
      if (inList) {
        rendered.push("</ul>");
        inList = false;
      }
      rendered.push(line);
    }
  }
  if (inList) rendered.push("</ul>");

  // 4. Newline jadi <br> (kecuali di dalam tag HTML)
  return rendered.join("\n").replace(/\n(?!<\/?(ul|li))/g, "<br>");
};
</script>

<template>
  <section class="relative flex h-full min-h-0 overflow-hidden bg-white">
    <!-- Logo Background -->
    <img
      :src="LumiraLogo"
      alt="Lumira Logo"
      class="pointer-events-none absolute inset-0 z-0 m-auto hidden w-[38%] max-w-sm select-none opacity-[0.07] sm:block"
    />
    <!-- Sessions Sidebar -->
    <transition
      enter-active-class="transition-all duration-250 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="-translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="-translate-x-full opacity-0"
    >
      <aside
        v-if="sidebarOpen"
        class="relative z-10 flex w-56 shrink-0 flex-col bg-[#E8E8E8] border-l-2 border-neutral-300"
      >
        <!-- Sidebar header -->
        <!-- <div class="flex items-center justify-between border-b border-neutral-300 px-3 py-3">
          <button
            type="button"
            @click="toggleSidebar"
            class="cursor-pointer rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-200"
            aria-label="Close sidebar"
          >
            <PanelLeftClose class="h-5 w-5" />
          </button>
        </div> -->
        <!-- New conversation button -->
        <button
          type="button"
          @click="startNewConversation"
          class="cursor-pointer mx-3 mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 border border-neutral-200"
        >
          <SquarePen class="h-4 w-4 text-sky-600 shrink-0" />
          <span>Percakapan Baru</span>
        </button>

        <!-- Sessions list -->
        <div class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <div v-if="isLoadingSessions" class="px-2 py-4 text-center text-xs text-neutral-400">
            Memuat sesi…
          </div>
          <div v-else-if="sessionsError" class="px-2 py-3 text-xs text-red-500">
            {{ sessionsError }}
          </div>
          <div v-else-if="sessions.length === 0" class="px-2 py-4 text-center text-xs text-neutral-400">
            Belum ada percakapan
          </div>
          <template v-else>
            <p class="px-2 py-1.5 text-xs font-semibold text-neutral-500 tracking-wide uppercase">
              Lumira AI
            </p>
            <button
              v-for="session in sessions"
              :key="session.id"
              type="button"
              @click="handleSessionClick(session.id)"
              class="group mb-1 w-full rounded-lg px-2 py-2 text-left text-sm text-neutral-700 transition"
              :class="isSessionActive(session.id)
                ? 'bg-sky-100 font-semibold text-sky-800'
                : 'hover:bg-neutral-300'"
            >
              <p class="truncate leading-snug">{{ session.title }}</p>
            </button>
          </template>
        </div>
      </aside>
    </transition>

    <!-- Main Chat Area -->
    <div class="relative z-10 flex min-w-0 flex-1 flex-col">
      <!-- Sidebar toggle button -->
      <div class="shrink-0 px-3 pt-3">
        <button
          type="button"
          @click="toggleSidebar"
          class="cursor-pointer rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100"
          :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'"
        >
          <PanelLeftOpen v-if="!sidebarOpen" class="h-5 w-5" />
          <PanelLeftClose v-else class="h-5 w-5" />
        </button>
      </div>

      <!-- Messages area -->
      <div
        ref="scrollContainerRef"
        class="min-h-0 flex-1 overflow-y-auto px-4 py-2 sm:px-6"
      >
        <!-- Empty state -->
        <div
          v-if="messages.length === 0 && !isSending"
          class="flex h-full flex-col items-center justify-center gap-3 select-none"
        >
          <Bot class="h-12 w-12 text-neutral-200" />
          <p class="text-xl font-semibold text-neutral-400 sm:text-2xl">
            Mulai percakapan dengan Lumira AI
          </p>
          <p class="text-sm text-neutral-400">
            Tanyakan apa saja seputar kondisi medis Anda
          </p>
        </div>

        <!-- Message bubbles -->
        <div v-else class="flex flex-col gap-3 py-2">
          <template v-for="message in messages" :key="message.id">

            <!-- User bubble -->
            <div v-if="message.from === 'user'" class="flex justify-end">
              <div class="max-w-[80%] sm:max-w-[70%] space-y-1.5">
                <!-- Image attachment thumbnail (in user bubble) -->
                <div
                  v-if="message.imagePreview"
                  class="overflow-hidden rounded-xl border border-neutral-300 bg-neutral-100"
                >
                  <img
                    :src="message.imagePreview"
                    alt="Attached image"
                    class="max-h-48 w-full object-contain"
                  />
                </div>
                <!-- Text bubble (only render if there's text content) -->
                <div
                  v-if="message.text"
                  class="rounded-2xl rounded-tr-sm bg-neutral-200 px-4 py-2.5 text-sm text-neutral-800 shadow-sm"
                >
                  <p class="whitespace-pre-wrap leading-relaxed">{{ message.text }}</p>
                  <p class="mt-1 text-right text-[10px] text-neutral-500">{{ message.time }}</p>
                </div>
                <!-- Time only (if image-only message) -->
                <div v-else-if="message.imagePreview" class="text-right">
                  <span class="text-[10px] text-neutral-400">{{ message.time }}</span>
                </div>
              </div>
            </div>

            <!-- AI typing indicator -->
            <div v-else-if="message.isTyping" class="flex justify-start">
              <div class="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-[#C2E8FF] px-4 py-3 shadow-sm">
                <span
                  v-for="i in 3"
                  :key="i"
                  class="h-2 w-2 animate-bounce rounded-full bg-sky-500"
                  :style="{ animationDelay: `${(i - 1) * 0.15}s` }"
                />
              </div>
            </div>

            <!-- AI response bubble -->
            <div v-else class="flex justify-start">
              <div class="flex max-w-[80%] gap-2 sm:max-w-[75%]">
                <!-- AI avatar -->
                <div class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100">
                  <Bot class="h-4 w-4 text-sky-600" />
                </div>
                <div class="rounded-2xl rounded-tl-sm bg-[#C2E8FF] px-4 py-2.5 text-sm text-neutral-800 shadow-sm">
                  <div
                    class="prose-sm leading-relaxed"
                    v-html="parseMarkdown(message.text)"
                  />
                  <p class="mt-1 text-[10px] text-neutral-500">{{ message.time }}</p>
                </div>
              </div>
            </div>

          </template>
        </div>
      </div>

      <!-- Chat error banner -->
      <transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-150"
        enter-from-class="opacity-0 translate-y-1"
        leave-to-class="opacity-0"
      >
        <div
          v-if="chatError"
          class="mx-4 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
        >
          {{ chatError }}
        </div>
      </transition>

      <!-- Input Area -->
      <div class="shrink-0 px-4 pb-4 pt-1 sm:px-6">

        <!-- Staged image preview (above input bar) -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="stagedImagePreviewUrl"
            class="mb-2 flex items-start gap-2"
          >
            <div class="relative inline-block rounded-xl overflow-hidden border border-neutral-300 bg-neutral-100 shadow-sm">
              <img
                :src="stagedImagePreviewUrl"
                alt="Image preview"
                class="max-h-28 max-w-[180px] object-contain sm:max-h-36 sm:max-w-[220px]"
              />
              <!-- Remove button overlay -->
              <button
                type="button"
                @click="removeStagedImage"
                class="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                aria-label="Remove image"
              >
                <X class="h-3 w-3" />
              </button>
            </div>
            <span class="mt-1 text-xs text-neutral-500">
              Gambar siap dikirim
            </span>
          </div>
        </transition>

        <!-- Input bar -->
        <div
          class="flex items-end gap-2 rounded-2xl border border-neutral-300 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-200"
        >
          <!-- Hidden file input — accepts JPEG, PNG, WEBP (max 5MB enforced in composable) -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            class="hidden"
            aria-hidden="true"
            @change="handleFileChange"
          />

          <!-- Image attach button -->
          <button
            type="button"
            @click="openFilePicker"
            :disabled="isSending"
            class="cursor-pointer shrink-0 rounded-full p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Lampirkan gambar"
            title="Lampirkan gambar (JPEG / PNG / WEBP, maks. 5 MB)"
          >
            <ImageIcon v-if="stagedImagePreviewUrl" class="h-5 w-5 text-sky-500" />
            <ImagePlus v-else class="h-5 w-5" />
          </button>

          <!-- Message textarea -->
          <textarea
            ref="textareaRef"
            v-model="draft"
            rows="1"
            :disabled="isSending"
            placeholder="Tuliskan Pesan"
            class="min-h-[24px] flex-1 resize-none bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400 disabled:opacity-50"
            @keydown="handleKeydown"
            @input="autoGrow"
          />

          <!-- Send button -->
          <button
            type="button"
            @click="handleSend"
            :disabled="!hasContent || isSending"
            class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-sky-500 text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
            aria-label="Kirim pesan"
          >
            <LoaderCircle v-if="isSending" class="h-4 w-4 animate-spin" />
            <SendHorizontal v-else class="h-4 w-4" />
          </button>
        </div>

        <p class="mt-1.5 text-center text-[10px] text-neutral-400">
          Lumira AI dapat membuat kesalahan. Selalu konsultasikan dengan dokter Anda.
        </p>
      </div>
    </div>
  </section>
</template>
