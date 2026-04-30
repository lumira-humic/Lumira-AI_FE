import { onValue, ref as rtdbRef } from "firebase/database";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";

import { useToast } from "@/composables/useToast";
import { firebaseAuth, firestore, rtdb } from "@/lib/firebase";
import { chatService, getApiErrorMessage } from "@/services/chatService";


// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Hard cap from Firestore security rules (Section 6.3 / 7.2). */
const MAX_MESSAGE_LENGTH = 5000;


// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * Map UI counterpart type → RTDB actorType segment.
 * Backend uses 'user' for doctors+admins and 'patient' for patients.
 */
const counterpartTypeToRtdbSegment = (counterpartType) =>
  counterpartType === "patient" ? "patient" : "user";

/** Normalize a Firestore message doc snapshot → flat UI shape. */
const normalizeMessage = (snapDoc) => {
  const data = snapDoc.data() ?? {};
  const createdAt = data.created_at?.toDate ? data.created_at.toDate() : null;
  return {
    id: snapDoc.id,
    roomId: data.room_id,
    senderType: data.sender_type, // "doctor" | "patient"
    senderId: data.sender_id,
    receiverId: data.receiver_id,
    text: data.message ?? "",
    isRead: Boolean(data.is_read),
    readAt: data.read_at?.toDate ? data.read_at.toDate() : null,
    createdAt,
    clientMessageId: data.client_message_id ?? null,
    time: createdAt
      ? createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : "",
  };
};

/** Format the "Online / Last seen X ago" label per spec Section 9b.2. */
export const formatPresenceLabel = ({ isOnline, lastChanged }) => {
  if (isOnline) return "Online";
  if (!lastChanged) return "Offline";

  const diffMs = Date.now() - lastChanged.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Last seen just now";
  if (min < 60) return `Last seen ${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Last seen ${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `Last seen ${day} day${day === 1 ? "" : "s"} ago`;
  return `Last seen on ${lastChanged.toLocaleDateString()}`;
};

/** Day divider label per spec Section 9b.3 — "Today" or explicit date (no "Yesterday"). */
const formatDividerLabel = (d) => {
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/**
 * Insert day-divider sentinel items between message bubbles when the local
 * calendar day changes. Output shape is compatible with the existing UI which
 * checks `_isDayMarker` on each entry.
 */
export const withDateDividers = (messages) => {
  const out = [];
  let prevKey = null;
  for (const m of messages) {
    const d = m.createdAt;
    const key = d ? d.toDateString() : null;
    if (key && key !== prevKey) {
      out.push({
        _isDayMarker: true,
        id: `day-${key}`,
        dayLabel: formatDividerLabel(d),
      });
      prevKey = key;
    }
    out.push(m);
  }
  return out;
};


// ─────────────────────────────────────────────
// Composable: Chat Rooms (Inbox)
//
// Responsibilities:
//   1. Fetch slim room list via REST (Section 5.3).
//   2. For each room, attach a `lastMessage` Firestore listener (Step 5).
//   3. For each room, attach an unread-count Firestore listener (Step 9b.1).
//   4. For each room, attach an RTDB presence listener for the counterpart
//      and surface a `counterpartActivityText` label (Step 9 + 9b.2).
//
// Returns reactive view-model preserving the field names used by the
// existing UI (DoctorChatDock, ChatDoctor, History): `counterpartName`,
// `lastMessagePreview`, `timeLabel`, `unreadCount`, `counterpartActivityText`.
// ─────────────────────────────────────────────

export const useChatRooms = () => {
  const rooms = ref([]); // array of view-model room cards (sorted)
  const isPending = ref(true);
  const isError = ref(false);
  const errorMessage = ref("");

  /** Per-room subscriptions: { lastMsg, unread, presence } */
  const subs = new Map();
  /** Underlying mutable cards keyed by roomId, used by listeners. */
  const cards = reactive(new Map());

  /** Ticks every 30s so "Last seen X minutes ago" labels stay fresh. */
  const presenceTick = ref(0);
  const presenceTickInterval = setInterval(() => {
    presenceTick.value += 1;
  }, 30 * 1000);

  const computeTimeLabel = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const rebuildRooms = () => {
    const list = Array.from(cards.values());
    list.sort((a, b) => {
      const at = a.lastMessage?.at?.getTime?.() ?? new Date(a.createdAt).getTime();
      const bt = b.lastMessage?.at?.getTime?.() ?? new Date(b.createdAt).getTime();
      return bt - at;
    });
    rooms.value = list;
  };

  const totalUnread = computed(() =>
    rooms.value.reduce((sum, r) => sum + (r.unreadCount || 0), 0),
  );

  // Re-derive presence labels when the tick advances.
  watch(presenceTick, () => {
    for (const card of cards.values()) {
      if (card._presence && !card._presence.isOnline) {
        card.counterpartActivityText = formatPresenceLabel(card._presence);
      }
    }
    rebuildRooms();
  });

  const subscribeRoom = (room) => {
    const card = reactive({
      ...room,
      lastMessage: null,
      lastMessagePreview: null,
      lastMessageAt: null,
      lastMessageSenderType: null,
      timeLabel: "",
      unreadCount: 0,
      counterpartActivityText: "Offline",
      _presence: { isOnline: false, lastChanged: null },
    });
    cards.set(room.id, card);

    // 1. Last message listener
    const lastMsgQuery = query(
      collection(firestore, "rooms", room.id, "messages"),
      orderBy("created_at", "desc"),
      limit(1),
    );
    const unsubLast = onSnapshot(
      lastMsgQuery,
      (snap) => {
        const docSnap = snap.docs[0];
        if (docSnap) {
          const data = docSnap.data();
          const at = data.created_at?.toDate ? data.created_at.toDate() : null;
          card.lastMessage = { text: data.message, at, senderId: data.sender_id };
          card.lastMessagePreview = data.message ?? null;
          card.lastMessageAt = at ? at.toISOString() : null;
          card.lastMessageSenderType = data.sender_type ?? null;
          card.timeLabel = computeTimeLabel(at);
        } else {
          card.lastMessage = null;
          card.lastMessagePreview = null;
          card.lastMessageAt = null;
          card.lastMessageSenderType = null;
          card.timeLabel = "";
        }
        rebuildRooms();
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn(`Last-message listener failed for room ${room.id}`, err);
      },
    );

    // 2. Unread count listener (only counts messages where I am the receiver)
    const myUid = firebaseAuth.currentUser?.uid;
    let unsubUnread = () => {};
    if (myUid) {
      const unreadQuery = query(
        collection(firestore, "rooms", room.id, "messages"),
        where("receiver_id", "==", myUid),
        where("is_read", "==", false),
      );
      unsubUnread = onSnapshot(
        unreadQuery,
        (snap) => {
          card.unreadCount = snap.size;
          rebuildRooms();
        },
        (err) => {
          // eslint-disable-next-line no-console
          console.warn(`Unread listener failed for room ${room.id}`, err);
        },
      );
    }

    // 3. Counterpart presence listener
    const presencePath = `status/${counterpartTypeToRtdbSegment(room.counterpartType)}/${room.counterpartId}`;
    const presenceRefHandle = rtdbRef(rtdb, presencePath);
    const unsubPresence = onValue(presenceRefHandle, (snap) => {
      const data = snap.val();
      const lastChanged =
        typeof data?.last_changed === "number" ? new Date(data.last_changed) : null;
      card._presence = { isOnline: data?.state === "online", lastChanged };
      card.counterpartActivityText = formatPresenceLabel(card._presence);
      rebuildRooms();
    });

    subs.set(room.id, () => {
      try { unsubLast(); } catch { /* noop */ }
      try { unsubUnread(); } catch { /* noop */ }
      try { unsubPresence(); } catch { /* noop */ }
    });
  };

  const unsubscribeAllRooms = () => {
    for (const unsub of subs.values()) unsub();
    subs.clear();
    cards.clear();
    rooms.value = [];
  };

  const refetch = async () => {
    isPending.value = true;
    isError.value = false;
    errorMessage.value = "";
    try {
      const list = await chatService.listRooms();
      // Diff: drop rooms no longer present, add new ones.
      const incomingIds = new Set(list.map((r) => r.id));
      for (const [id, unsub] of subs.entries()) {
        if (!incomingIds.has(id)) {
          unsub();
          subs.delete(id);
          cards.delete(id);
        }
      }
      for (const room of list) {
        if (!subs.has(room.id)) subscribeRoom(room);
      }
      rebuildRooms();
    } catch (err) {
      isError.value = true;
      errorMessage.value = getApiErrorMessage(err, "Gagal memuat daftar chat.");
    } finally {
      isPending.value = false;
    }
  };

  // Initial load. Wait for Firebase auth to be ready, otherwise the unread
  // listener (which uses currentUser.uid) cannot attach.
  const startWhenReady = () => {
    if (firebaseAuth.currentUser) {
      refetch();
    } else {
      const off = firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          off();
          refetch();
        }
      });
    }
  };
  startWhenReady();

  onBeforeUnmount(() => {
    clearInterval(presenceTickInterval);
    unsubscribeAllRooms();
  });

  const invalidateRooms = () => refetch();

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
// Composable: Messages within a single room
// ─────────────────────────────────────────────

/**
 * @param {import('vue').Ref<string|null>} roomIdRef
 * @param {{ room?: import('vue').Ref<any>, myActorType?: 'doctor'|'patient' }} options
 *   - `room` is a ref to the room view-model from useChatRooms; required for
 *     resolving patientId/doctorId at send time. Falls back to inferring from
 *     the latest message snapshot.
 */
export const useChatMessages = (roomIdRef, { room: roomRef = ref(null) } = {}) => {
  const toast = useToast();

  const rawMessages = ref([]); // pre-divider list
  const isPending = ref(false);
  const isError = ref(false);
  const errorMessage = ref("");
  const draft = ref("");
  const isSending = ref(false);

  // Keep a snapshot of room ids so send() can resolve participants without
  // relying on a foreign ref always being kept in sync.
  let lastObservedRoomIds = null; // { patientId, doctorId }

  // Idempotency guard for read-receipts. Once we've issued an updateDoc to
  // mark a message read, we never retry — even if a stale cached Firestore
  // snapshot later re-delivers the same message with is_read=false. Without
  // this, the security rule §7.2 (which requires resource.data.is_read==false)
  // produces noisy "permission-denied" warnings on harmless duplicate writes.
  let markedReadIds = new Set();

  let unsub = null;

  const detach = () => {
    if (unsub) {
      try { unsub(); } catch { /* noop */ }
      unsub = null;
    }
  };

  const attach = (roomId) => {
    detach();
    rawMessages.value = [];
    markedReadIds = new Set();
    if (!roomId) return;

    isPending.value = true;
    isError.value = false;
    errorMessage.value = "";

    const q = query(
      collection(firestore, "rooms", roomId, "messages"),
      orderBy("created_at", "asc"),
    );
    unsub = onSnapshot(
      q,
      (snap) => {
        rawMessages.value = snap.docs.map(normalizeMessage);
        isPending.value = false;
        // Capture room participants from the most recent message in case the
        // upstream room ref is not provided.
        const lastDoc = snap.docs[snap.docs.length - 1];
        if (lastDoc) {
          const d = lastDoc.data();
          if (d.patient_id && d.doctor_id) {
            lastObservedRoomIds = { patientId: d.patient_id, doctorId: d.doctor_id };
          }
        }
      },
      (err) => {
        isPending.value = false;
        isError.value = true;
        errorMessage.value = err?.message || "Gagal memuat pesan.";
        // eslint-disable-next-line no-console
        console.warn("Messages listener failed", err);
      },
    );
  };

  watch(roomIdRef, (id) => attach(id), { immediate: true });

  onBeforeUnmount(detach);

  // Inject day-divider sentinels for the existing UI templates.
  const messages = computed(() => withDateDividers(rawMessages.value));

  const resolveParticipants = () => {
    const fromRoom = roomRef?.value;
    if (fromRoom?.patientId && fromRoom?.doctorId) {
      return { patientId: fromRoom.patientId, doctorId: fromRoom.doctorId };
    }
    return lastObservedRoomIds;
  };

  const sendMessage = async () => {
    const text = String(draft.value || "").trim();
    const roomId = roomIdRef.value;
    if (!text || !roomId || isSending.value) return;

    if (text.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Pesan terlalu panjang (maks ${MAX_MESSAGE_LENGTH} karakter).`);
      return;
    }

    const myUid = firebaseAuth.currentUser?.uid;
    if (!myUid) {
      toast.error("Sesi chat belum siap. Silakan coba lagi.");
      return;
    }

    const participants = resolveParticipants();
    if (!participants) {
      toast.error("Data ruang chat belum siap. Coba lagi sebentar.");
      return;
    }

    const isPatient = myUid === participants.patientId;
    const senderType = isPatient ? "patient" : "doctor";
    const receiverId = isPatient ? participants.doctorId : participants.patientId;

    isSending.value = true;

    const newDocRef = doc(collection(firestore, "rooms", roomId, "messages"));
    const messageId = newDocRef.id;

    const previousDraft = draft.value;
    draft.value = "";

    try {
      await setDoc(newDocRef, {
        message_id: messageId,
        room_id: roomId,
        patient_id: participants.patientId,
        doctor_id: participants.doctorId,
        sender_type: senderType,
        sender_id: myUid,
        receiver_id: receiverId,
        message: text,
        is_read: false,
        client_message_id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        created_at: serverTimestamp(),
      });

      // Fire-and-forget — must not block UI, must not retry aggressively.
      chatService.notifyMessage(roomId, messageId).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("Notify failed (push will not be sent for this message)", err);
      });
    } catch (err) {
      draft.value = previousDraft;
      // eslint-disable-next-line no-console
      console.error("Send message failed", err);
      toast.error("Pesan gagal terkirim. Silakan coba lagi.");
    } finally {
      isSending.value = false;
    }
  };

  /**
   * Mark every visible incoming-unread message in the current view as read.
   * Safe to call repeatedly — already-read messages are skipped.
   */
  const markVisibleAsRead = async () => {
    const roomId = roomIdRef.value;
    const myUid = firebaseAuth.currentUser?.uid;
    if (!roomId || !myUid) return;

    const unreadIncoming = rawMessages.value.filter(
      (m) => !m.isRead && m.receiverId === myUid && !markedReadIds.has(m.id),
    );

    // Optimistically claim these IDs before issuing writes so concurrent
    // watcher invocations (caused by Firestore re-delivering cached snapshots)
    // do not double-fire updateDoc for the same message — which would always
    // hit "permission-denied" because the rule requires is_read==false.
    for (const m of unreadIncoming) markedReadIds.add(m.id);

    await Promise.all(
      unreadIncoming.map((m) =>
        updateDoc(doc(firestore, "rooms", roomId, "messages", m.id), {
          is_read: true,
          read_at: serverTimestamp(),
        }).catch((err) => {
          // permission-denied here is benign: the doc was already marked read
          // by a previous successful write; rule §7.2 then rejects the retry.
          if (err?.code === "permission-denied") return;
          // eslint-disable-next-line no-console
          console.warn(`markRead failed for message ${m.id}`, err);
        }),
      ),
    );
  };

  // Auto-mark-read whenever new incoming messages arrive while the room is
  // open. This matches the previous UX (room considered "read" as soon as it's
  // visible).
  watch(rawMessages, () => {
    markVisibleAsRead();
  });

  return {
    messages,
    rawMessages,
    draft,
    isSending,
    isPending,
    isError,
    errorMessage,
    sendMessage,
    markAsRead: markVisibleAsRead,
  };
};


// ─────────────────────────────────────────────
// Composable: Create or resolve a room (REST passthrough)
// ─────────────────────────────────────────────

export const useCreateChatRoom = () => {
  const toast = useToast();

  const isCreating = ref(false);
  const createError = ref("");

  const createRoom = async ({ patientId, medicalRecordId, doctorId }) => {
    isCreating.value = true;
    createError.value = "";

    try {
      return await chatService.createRoom({ patientId, medicalRecordId, doctorId });
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


// ─────────────────────────────────────────────
// Composable: Counterpart presence (standalone)
//
// Useful when you have a roomless context (e.g. a chat header that knows the
// counterpart id+type but does not need the full inbox view-model).
// ─────────────────────────────────────────────

export const useCounterpartPresence = (counterpartTypeRef, counterpartIdRef) => {
  const presence = ref({ isOnline: false, lastChanged: null });
  const label = ref("Offline");
  let unsub = null;

  const tick = setInterval(() => {
    if (!presence.value.isOnline) {
      label.value = formatPresenceLabel(presence.value);
    }
  }, 30 * 1000);

  const detach = () => {
    if (unsub) {
      try { unsub(); } catch { /* noop */ }
      unsub = null;
    }
  };

  const attach = () => {
    detach();
    const id = counterpartIdRef.value;
    const type = counterpartTypeRef.value;
    if (!id || !type) return;

    const path = `status/${counterpartTypeToRtdbSegment(type)}/${id}`;
    unsub = onValue(rtdbRef(rtdb, path), (snap) => {
      const data = snap.val();
      const lastChanged =
        typeof data?.last_changed === "number" ? new Date(data.last_changed) : null;
      presence.value = { isOnline: data?.state === "online", lastChanged };
      label.value = formatPresenceLabel(presence.value);
    });
  };

  watch([counterpartIdRef, counterpartTypeRef], attach, { immediate: true });

  onBeforeUnmount(() => {
    clearInterval(tick);
    detach();
  });

  return { presence, label };
};
