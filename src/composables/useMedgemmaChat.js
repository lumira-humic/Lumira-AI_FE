import { computed, ref, nextTick } from "vue";
import { useQuery } from "@tanstack/vue-query";

import { medgemmaService, validateImageFile } from "@/services/medgemmaService";
import { getApiErrorMessage } from "@/lib/apiResponse";


// ─────────────────────────────────────────────
// Date formatters
// ─────────────────────────────────────────────

const formatClock = (rawDate) => {
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const formatShortDate = (rawDate) => {
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};


// ─────────────────────────────────────────────
// Session preview — first user message as title, or BE-generated title
// ─────────────────────────────────────────────

const resolveSessionTitle = (session) => {
  if (session.title && typeof session.title === "string" && session.title.trim().length > 0) {
    const t = session.title.trim();
    return t.length > 48 ? t.slice(0, 48).trimEnd() + "…" : t;
  }
  const firstUserMsg = session.messages?.find((m) => m.sender === "user");
  const text = firstUserMsg?.message ?? "";
  return text.length > 48 ? text.slice(0, 48).trimEnd() + "…" : text || "Percakapan";
};


// ─────────────────────────────────────────────
// Transform BE message → FE message bubble
// ─────────────────────────────────────────────

const toUiMessage = (msg) => ({
  id: msg.id,
  from: msg.sender === "assistant" ? "assistant" : "user",
  text: msg.message,
  time: formatClock(msg.created_at),
  createdAt: msg.created_at,
  // No imagePreview for server-loaded messages (image not persisted in BE messages)
  imagePreview: null,
});


// ─────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────

export const useMedgemmaChat = () => {
  // state

  /** Currently active session ID (null = new conversation) */
  const activeSessionId = ref(null);

  /** Local message list for the active session */
  const messages = ref([]);

  /** Is AI currently generating a response? */
  const isSending = ref(false);

  /** Error message for the chat panel */
  const chatError = ref("");

  /** Whether the sessions sidebar is open */
  const sidebarOpen = ref(false);

  /** Ref to scroll container for auto-scroll */
  const scrollContainerRef = ref(null);

  /** Currently staged image file (waiting to be sent with next message) */
  const stagedImageFile = ref(null);

  /** Object URL for preview of staged image (revoked after use) */
  const stagedImagePreviewUrl = ref(null);


  // sessions list query

  const sessionsQuery = useQuery({
    queryKey: ["medgemma-sessions"],
    queryFn: () => medgemmaService.listSessions(),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  const sessions = computed(() => {
    const raw = Array.isArray(sessionsQuery.data.value) ? sessionsQuery.data.value : [];
    return raw.map((session) => ({
      id: session.session_id,
      title: resolveSessionTitle(session),
      updatedAt: session.updated_at,
      dateLabel: formatShortDate(session.updated_at),
      messageCount: session.messages?.length ?? 0,
    }));
  });

  const isLoadingSessions = computed(
    () => sessionsQuery.isPending.value && !sessionsQuery.data.value,
  );

  const sessionsError = computed(() => {
    if (!sessionsQuery.isError.value) return "";
    return getApiErrorMessage(sessionsQuery.error.value, "Gagal memuat daftar sesi.");
  });


  // helpers

  const scrollToBottom = async () => {
    await nextTick();
    const el = scrollContainerRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const clearChat = () => {
    messages.value = [];
    chatError.value = "";
  };

  /**
   * Release object URL to avoid memory leaks, then clear staged image state.
   */
  const clearStagedImage = () => {
    if (stagedImagePreviewUrl.value) {
      URL.revokeObjectURL(stagedImagePreviewUrl.value);
    }
    stagedImageFile.value = null;
    stagedImagePreviewUrl.value = null;
  };


  // image staging

  /**
   * Stage an image file for the next message send.
   * Validates type + size (BE: JPEG/PNG/WEBP, max 5MB) before creating preview URL.
   *
   * @param {File} file
   * @returns {{ valid: boolean, error: string|null }}
   */
  const stageImageFile = (file) => {
    const { valid, error } = validateImageFile(file);
    if (!valid) return { valid: false, error };

    // Release any previous preview URL
    clearStagedImage();

    stagedImageFile.value = file;
    stagedImagePreviewUrl.value = URL.createObjectURL(file);
    return { valid: true, error: null };
  };


  // actions

  const loadSession = async (sessionId) => {
    if (isSending.value) return;

    clearChat();
    clearStagedImage();
    activeSessionId.value = sessionId;
    isSending.value = true;

    try {
      const data = await medgemmaService.getSessionHistory(sessionId);
      const rawMessages = Array.isArray(data?.messages) ? data.messages : [];
      messages.value = rawMessages.map(toUiMessage);
      await scrollToBottom();
    } catch (err) {
      chatError.value = getApiErrorMessage(err, "Gagal memuat riwayat percakapan.");
    } finally {
      isSending.value = false;
    }
  };

  /**
   * Start a completely new conversation (reset all state).
   */
  const startNewConversation = () => {
    activeSessionId.value = null;
    clearChat();
    clearStagedImage();
    sidebarOpen.value = false;
  };

  /**
   * Send a message (with optional image file attachment) to MedGemma.
   * @param {string} userText
   * @param {File|null} [imageFile] - Optional image to attach. If null, uses stagedImageFile.
   */
  const sendMessage = async (userText, imageFile = null) => {
    const text = String(userText || "").trim();
    const fileToSend = imageFile ?? stagedImageFile.value;

    if (!text && !fileToSend) return;
    if (isSending.value) return;

    chatError.value = "";

    const tempId = `user-${Date.now()}`;
    const timeNow = formatClock(new Date().toISOString());
    const imagePreviewSnapshot = stagedImagePreviewUrl.value;

    messages.value.push({
      id: tempId,
      from: "user",
      text: text || (fileToSend ? "Tolong analisis gambar ini." : ""),
      time: timeNow,
      imagePreview: imagePreviewSnapshot,
    });
    await scrollToBottom();

    // Typing indicator
    const typingId = `typing-${Date.now()}`;
    messages.value.push({ id: typingId, from: "assistant", isTyping: true });
    await scrollToBottom();

    // Clear staged image immediately (user sees it in the bubble)
    clearStagedImage();

    isSending.value = true;

    try {
      const result = await medgemmaService.consult({
        userPrompt: text || "Tolong analisis gambar ini.",
        sessionId: activeSessionId.value,
        imageFile: fileToSend,
      });

      // Remove typing indicator
      messages.value = messages.value.filter((m) => m.id !== typingId);

      // Update active session from response (each consult returns a new session_id)
      if (result?.session_id) {
        activeSessionId.value = result.session_id;
      }

      // Push AI response bubble
      messages.value.push({
        id: `assistant-${Date.now()}`,
        from: "assistant",
        text: result?.response ?? "Maaf, tidak ada respons dari AI.",
        time: formatClock(new Date().toISOString()),
        imagePreview: null,
      });

      await scrollToBottom();

      // Refresh sessions sidebar (BE creates a new session per consult)
      sessionsQuery.refetch();

    } catch (err) {
      // Remove typing indicator on error
      messages.value = messages.value.filter((m) => m.id !== typingId);
      chatError.value = getApiErrorMessage(err, "Gagal mengirim pesan ke MedGemma AI.");
    } finally {
      isSending.value = false;
    }
  };

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
  };

  const refreshSessions = () => sessionsQuery.refetch();

  return {
    // State
    activeSessionId,
    messages,
    isSending,
    chatError,
    sidebarOpen,
    scrollContainerRef,
    // Staged image
    stagedImageFile,
    stagedImagePreviewUrl,
    stageImageFile,
    clearStagedImage,
    // Sessions
    sessions,
    isLoadingSessions,
    sessionsError,
    // Actions
    sendMessage,
    loadSession,
    startNewConversation,
    toggleSidebar,
    refreshSessions,
  };
};
