import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";

import { chatService } from "@/services/chatService";
import { getApiErrorMessage } from "@/lib/apiResponse";
import { useAppStore } from "@/stores/appStore";
import { useToast } from "@/composables/useToast";


// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** How often to poll for new messages inside an active room (ms) */
const MESSAGE_POLL_INTERVAL_MS = 4000;

/** How often to poll the room list (ms) */
const ROOM_LIST_POLL_INTERVAL_MS = 10000;

/** Heartbeat interval while chat panel is open (ms) */
const HEARTBEAT_INTERVAL_MS = 30000;


// ─────────────────────────────────────────────
// Normalizers
// ─────────────────────────────────────────────

/**
 * Flatten ChatHistoryGroup[] → flat message array with a dayLabel marker.
 * Each group: { date: "2026-04-24", dateLabel: "Today" | "2026-04-24", messages: [...] }
 */
const flattenHistoryGroups = (groups) => {
  if (!Array.isArray(groups)) return [];

  return groups.flatMap((group) => {
    const dayMarker = { _isDayMarker: true, id: `day-${group.date}`, dayLabel: group.dateLabel };
    const msgs = (group.messages || []).map((m) => normalizeMessage(m));
    return [dayMarker, ...msgs];
  });
};

/**
 * Normalize a raw chat message data from BE into a flat shape for the UI.
 */
const normalizeMessage = (raw) => ({
  id: raw.id,
  roomId: raw.room_id,
  senderType: raw.sender_type,   // "doctor" | "patient"
  senderId: raw.sender_id,
  receiverId: raw.receiver_id,
  text: raw.message,
  isRead: raw.is_read,
  clientMessageId: raw.client_message_id ?? null,
  createdAt: raw.created_at,
  time: raw.created_at
    ? new Date(raw.created_at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",
});

/**
 * Normalize a raw chat room data from BE.
 */
const normalizeRoomSummary = (raw) => ({
  id: raw.id,
  patientId: raw.patientId,
  doctorId: raw.doctorId,
  medicalRecordId: raw.medicalRecordId,
  unreadCount: Number(raw.unreadCount || 0),
  lastMessagePreview: raw.lastMessagePreview ?? null,
  lastMessageSenderType: raw.lastMessageSenderType ?? null,
  lastMessageAt: raw.lastMessageAt ?? null,
  counterpartId: raw.counterpartId,
  counterpartName: raw.counterpartName ?? "",
  counterpartType: raw.counterpartType,
  counterpartActivityText: raw.counterpartActivityText ?? "",
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
  // Derived time label for the conversation list
  timeLabel: raw.lastMessageAt
    ? new Date(raw.lastMessageAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",
});


// ─────────────────────────────────────────────
// Composable: Room List (Doctor & Patient)
// ─────────────────────────────────────────────

/**
 * Composable for fetching and managing the list of chat rooms.
 * Automatically polls every ROOM_LIST_POLL_INTERVAL_MS while enabled.
 */
export const useChatRooms = () => {
  const queryClient = useQueryClient();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: async () => {
      const raw = await chatService.listRooms();
      return raw.map(normalizeRoomSummary);
    },
    staleTime: ROOM_LIST_POLL_INTERVAL_MS,
    refetchInterval: ROOM_LIST_POLL_INTERVAL_MS,
    retry: 2,
  });

  const rooms = computed(() => data.value ?? []);

  const totalUnread = computed(() =>
    rooms.value.reduce((sum, r) => sum + r.unreadCount, 0),
  );

  const errorMessage = computed(() =>
    isError.value ? getApiErrorMessage(error.value, "Gagal memuat daftar chat.") : "",
  );

  const invalidateRooms = () => queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });

  return {
    rooms,
    totalUnread,
    isPending,
    isError,
    errorMessage,
    refetch,
    invalidateRooms,
  };
};


// ─────────────────────────────────────────────
// Composable: Single Room Chat
// ─────────────────────────────────────────────

/**
 * Composable for the full chat experience within one room.
 *
 * @param {import("vue").Ref<string | null>} roomIdRef - Reactive room ID
 * @param {object} [options]
 * @param {string} [options.myActorType] - "doctor" | "patient"
 */
export const useChatMessages = (roomIdRef, { myActorType = "patient" } = {}) => {
  const appStore = useAppStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  const draft = ref("");
  const isSending = ref(false);

  // Query: chat history
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: computed(() => ["chat-messages", roomIdRef.value]),
    queryFn: async () => {
      if (!roomIdRef.value) return [];
      const groups = await chatService.getChatHistory(roomIdRef.value, { limit: 50 });
      return flattenHistoryGroups(groups);
    },
    enabled: computed(() => Boolean(roomIdRef.value)),
    staleTime: MESSAGE_POLL_INTERVAL_MS,
    refetchInterval: computed(() => (roomIdRef.value ? MESSAGE_POLL_INTERVAL_MS : false)),
    retry: 2,
    // Keep previous data while re-fetching so the UI doesn't flash
    placeholderData: (prev) => prev,
  });

  const messages = computed(() => data.value ?? []);

  const errorMessage = computed(() =>
    isError.value ? getApiErrorMessage(error.value, "Gagal memuat pesan.") : "",
  );

  // Mutation: send message
  const sendMessageMutation = useMutation({
    mutationFn: ({ roomId, text, clientMessageId }) =>
      chatService.sendMessage(roomId, text, clientMessageId),

    onMutate: async ({ text, clientMessageId }) => {
      // Optimistic update — append immediately so UI feels instant
      const tempMessage = {
        id: clientMessageId,
        roomId: roomIdRef.value,
        senderType: myActorType,
        senderId: appStore.profile?.id ?? "",
        receiverId: "",
        text,
        isRead: false,
        clientMessageId,
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        _isOptimistic: true,
      };

      await queryClient.cancelQueries({ queryKey: ["chat-messages", roomIdRef.value] });
      const previous = queryClient.getQueryData(["chat-messages", roomIdRef.value]);
      queryClient.setQueryData(["chat-messages", roomIdRef.value], (old) => [
        ...(old ?? []),
        tempMessage,
      ]);

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Roll back optimistic update
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["chat-messages", roomIdRef.value], context.previous);
      }
      toast.error("Pesan gagal terkirim. Silakan coba lagi.");
    },

    onSuccess: () => {
      // Replace optimistic message with the real one from server
      queryClient.invalidateQueries({ queryKey: ["chat-messages", roomIdRef.value] });
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });

  // Send handler
  const sendMessage = async () => {
    const text = String(draft.value || "").trim();
    if (!text || !roomIdRef.value || isSending.value) return;

    isSending.value = true;
    const clientMessageId = `msg-${Date.now()}`;

    try {
      draft.value = "";
      await sendMessageMutation.mutateAsync({
        roomId: roomIdRef.value,
        text,
        clientMessageId,
      });
    } finally {
      isSending.value = false;
    }
  };

  // Mark as read when room is opened
  const markAsRead = async () => {
    if (!roomIdRef.value) return;
    try {
      await chatService.markRoomAsRead(roomIdRef.value);
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    } catch {
      // Non-critical
    }
  };

  // Heartbeat
  let heartbeatTimer = null;

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatTimer = setInterval(async () => {
      try {
        await chatService.heartbeat();
      } catch {
        // Non-critical
      }
    }, HEARTBEAT_INTERVAL_MS);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  onMounted(() => {
    startHeartbeat();
    markAsRead();
  });

  onBeforeUnmount(() => {
    stopHeartbeat();
  });

  // Re-mark as read whenever the active room changes
  watch(roomIdRef, (newId) => {
    if (newId) {
      markAsRead();
    }
  });

  return {
    messages,
    draft,
    isSending,
    isPending,
    isError,
    errorMessage,
    refetch,
    sendMessage,
    markAsRead,
  };
};


// ─────────────────────────────────────────────
// Composable: Create / Resolve Room
// ─────────────────────────────────────────────

/**
 * Composable for creating/resolving a chat room.
 * Used on patient side when entering the Chat with Doctor page.
 */
export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const isCreating = ref(false);
  const createError = ref("");

  const createRoom = async ({ patientId, medicalRecordId, doctorId }) => {
    isCreating.value = true;
    createError.value = "";

    try {
      const room = await chatService.createRoom({ patientId, medicalRecordId, doctorId });
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
      return room;
    } catch (err) {
      createError.value = getApiErrorMessage(err, "Gagal membuat room chat.");
      toast.error(createError.value);
      return null;
    } finally {
      isCreating.value = false;
    }
  };

  return {
    isCreating,
    createError,
    createRoom,
  };
};
