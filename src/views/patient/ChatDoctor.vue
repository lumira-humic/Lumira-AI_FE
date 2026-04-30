<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { SendHorizontal, Loader2, RefreshCw, AlertCircle, MessageSquareOff } from "@lucide/vue";

import { usePatientPortalData } from "@/composables/usePatientPortalData";
import { useChatRooms, useChatMessages, useCreateChatRoom } from "@/composables/useFirebaseChat";
import { useAppStore } from "@/stores/appStore";
import Loading from "@/components/common/Loading.vue";
import LumiraLogo from "@/assets/images/lumira-logo-img.png";


const appStore = useAppStore();
const chatThreadRef = ref(null);

const { portalData, isLoading: isPortalLoading } = usePatientPortalData();

// ─────────────────────────────────────────────
// Room Resolution Strategy
//
// BE rule: Each room is uniquely tied to ONE medicalRecordId.
// Patient can only see rooms they are part of.
//
// Step 1: GET /chat/rooms — list rooms for patient actor.
//   → BE returns rooms with: id, patientId, doctorId, medicalRecordId,
//     counterpartId (=doctorId for patient actor), counterpartName (=doctor name)
//
// Step 2: Find the room matching the latest medical record.
//   → If found → activeRoomId = room.id, we have doctor info from the room.
//
// Step 3: If no room yet (first time opening chat for a record):
//   → POST /chat/rooms with { patientId, medicalRecordId, doctorId }
//   → doctorId is sourced from: the matching room's doctorId (step 2),
//     OR falls back to the first available room's doctorId.
//
// Why not get doctorId from medical records?
//   → The patient-detail DTO's medical_records[] does NOT include validatorId/doctorId.
//   → The only reliable source of doctorId for patient actor is the room list.
//
// If no rooms exist AND no medical record has an assigned doctor:
//   → Show "no chat available" state.
// ─────────────────────────────────────────────

const activeRoomId = ref(null);
const isResolvingRoom = ref(false);
const resolveError = ref("");

// Room list composable — Firestore listeners hydrate last-message and unread
const {
  rooms,
  isPending: isRoomsLoading,
  refetch: refetchRooms,
  invalidateRooms,
} = useChatRooms();

// Create/resolve room composable
const { isCreating, createRoom } = useCreateChatRoom();

// The latest medical record from portal data
const latestRecord = computed(() => {
  const records = portalData.value?.statusRecords ?? [];
  // Prefer records that are in_review or done (have an assigned doctor)
  return (
    records.find((r) => r.statusKey === "in_review" || r.statusKey === "done") ??
    records[0] ??
    null
  );
});

// My patient ID from auth profile
const myPatientId = computed(() => appStore.profile?.id ?? "");

// Find existing room matching the latest medical record
const matchingRoom = computed(() => {
  if (!latestRecord.value || rooms.value.length === 0) return null;
  return (
    rooms.value.find((r) => r.medicalRecordId === latestRecord.value?.id) ??
    null
  );
});

// Doctor info: prefer from matchingRoom (authoritative from BE),
// fallback to portalData activeDoctor name
const doctorInfo = computed(() => {
  if (matchingRoom.value) {
    return {
      name: matchingRoom.value.counterpartName,
      activityText: matchingRoom.value.counterpartActivityText,
    };
  }

  return {
    name: portalData.value?.activeDoctor?.name ?? "Assigned Doctor",
    activityText: portalData.value?.activeDoctor?.activeLabel ?? "",
  };
});

// ─────────────────────────────────────────────
// Room initialization
// ─────────────────────────────────────────────

const initRoom = async () => {
  if (isResolvingRoom.value) return;

  resolveError.value = "";

  // Case 1: Already have a matching room → use it
  if (matchingRoom.value) {
    activeRoomId.value = matchingRoom.value.id;
    return;
  }

  // Case 2: No medical record → can't create room
  if (!latestRecord.value?.id) {
    resolveError.value = "Belum ada medical record yang tersedia untuk chat.";
    return;
  }

  // Case 3: Rooms loaded but no matching room → need to create one.
  // Must have doctorId. Try to get it from any existing room as fallback,
  // since we don't have it from medical_records directly.
  const existingRoom = rooms.value[0] ?? null;
  const doctorId = existingRoom?.doctorId ?? null;

  if (!doctorId) {
    // No rooms exist at all and no doctorId available.
    // This means: no doctor has been assigned to any record yet.
    resolveError.value =
      "Dokter belum ditugaskan untuk rekam medis Anda. Silakan tunggu konfirmasi dari admin.";
    return;
  }

  // Create or resolve the room
  isResolvingRoom.value = true;
  try {
    const room = await createRoom({
      patientId: myPatientId.value,
      medicalRecordId: latestRecord.value.id,
      doctorId,
    });

    if (room?.id) {
      activeRoomId.value = room.id;
      await invalidateRooms();
    }
  } catch {
    resolveError.value = "Gagal membuka sesi chat. Silakan coba lagi.";
  } finally {
    isResolvingRoom.value = false;
  }
};

// ─────────────────────────────────────────────
// Messages composable (uses activeRoomId reactively)
// ─────────────────────────────────────────────

const activeRoom = computed(
  () => rooms.value.find((r) => r.id === activeRoomId.value) ?? null,
);


const {
  messages,
  draft,
  isSending,
  isPending: isMessagesLoading,
  errorMessage: messagesError,
  sendMessage,
} = useChatMessages(activeRoomId, { room: activeRoom });

// ─────────────────────────────────────────────
// Auto-scroll to bottom
// ─────────────────────────────────────────────

const scrollToBottom = async () => {
  await nextTick();
  if (chatThreadRef.value) {
    chatThreadRef.value.scrollTop = chatThreadRef.value.scrollHeight;
  }
};

watch(messages, scrollToBottom, { flush: "post" });

// ─────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────

// Init room once both portal data and rooms are loaded
const isReadyToInit = computed(
  () => !isPortalLoading.value && !isRoomsLoading.value,
);

watch(isReadyToInit, async (ready) => {
  if (ready && !activeRoomId.value) {
    await initRoom();
  }
});

onMounted(async () => {
  if (isReadyToInit.value) {
    await initRoom();
  }
});

// Re-init if matchingRoom appears after rooms are fetched
watch(matchingRoom, (room) => {
  if (room && !activeRoomId.value) {
    activeRoomId.value = room.id;
  }
});

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

const handleSend = async () => {
  await sendMessage();
  scrollToBottom();
};

const handleKeyEnter = async (e) => {
  if (e.shiftKey) return;
  await handleSend();
};

const handleRetry = async () => {
  resolveError.value = "";
  activeRoomId.value = null;
  await refetchRooms();
  await initRoom();
};

// Combined loading: waiting for portal OR rooms OR room resolution
const isInitializing = computed(
  () => isPortalLoading.value || isRoomsLoading.value || isResolvingRoom.value || isCreating.value,
);
</script>

<template>
  <section class="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
    <!-- Background -->
    <img
      :src="LumiraLogo"
      alt="Lumira Background Watermark"
      class="pointer-events-none absolute inset-0 m-auto hidden w-[42%] max-w-md opacity-10 sm:block"
    />
    <div v-if="isInitializing" class="flex min-h-0 flex-1 items-center justify-center">
      <Loading text="Menghubungkan ke sesi chat..." />
    </div>
    <div
      v-else-if="resolveError"
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <MessageSquareOff class="h-8 w-8 text-amber-500" />
      </div>
      <div>
        <p class="text-base font-semibold text-neutral-800">Chat tidak tersedia</p>
        <p class="mt-1 text-sm text-neutral-500">{{ resolveError }}</p>
      </div>
      <button
        type="button"
        @click="handleRetry"
        class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
      >
        <RefreshCw class="h-4 w-4" />
        Coba Lagi
      </button>
    </div>

    <!-- ── Active chat ────────────────────────────────────────────── -->
    <div v-else class="relative z-10 flex min-h-0 flex-1 flex-col gap-3">
      <!-- Chat header -->
      <div class="rounded-br-3xl border border-sky-300 bg-white px-3 py-2">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <!-- Avatar -->
            <div class="h-14 w-14 rounded-full bg-neutral-200 shrink-0 flex items-center justify-center overflow-hidden p-3">
              <img src="@/assets/icons/icon-doctor.png" alt="Doctor Icon" class="w-full h-full object-contain">
            </div>
            <div>
              <p class="text-base font-semibold text-neutral-700">
                {{ doctorInfo.name }}
              </p>
              <p class="text-xs text-neutral-500">
                {{ doctorInfo.activityText }}
              </p>
            </div>
          </div>
          <!-- Refresh button -->
          <button
            title="Refresh Chat"
            type="button"
            @click="refetchRooms"
            class="cursor-pointer rounded-full p-2 text-neutral-500 hover:bg-neutral-100 transition"
            aria-label="Refresh chat"
          >
            <RefreshCw class="h-4 w-4" />
          </button>
        </div>
      </div>
      <!-- No room assigned yet (after init but no room) -->
      <div
        v-if="!activeRoomId"
        class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
      >
        Sesi chat sedang disiapkan. Silakan tunggu sebentar.
      </div>
      <!-- Messages -->
      <div
        ref="chatThreadRef"
        class="chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5"
      >
        <!-- Loading skeleton -->
        <div
          v-if="isMessagesLoading && messages.length === 0"
          class="flex justify-center py-6"
        >
          <Loading text="Memuat pesan..." />
        </div>
        <!-- API error -->
        <div
          v-else-if="messagesError"
          class="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600"
        >
          <AlertCircle class="h-4 w-4 shrink-0" />
          {{ messagesError }}
        </div>
        <!-- No messages yet -->
        <div
          v-else-if="messages.length === 0 && activeRoomId"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50">
            <img :src="LumiraLogo" alt="Lumira" class="h-10 w-10 object-contain opacity-50" />
          </div>
          <p class="text-sm font-semibold text-neutral-600">Belum ada pesan</p>
          <p class="mt-1 text-xs text-neutral-400">Mulai percakapan dengan dokter Anda</p>
        </div>
        <!-- Message bubbles + day separators -->
        <template v-else>
          <template v-for="item in messages" :key="item.id">
            <!-- Day separator -->
            <div v-if="item._isDayMarker" class="flex justify-center my-2">
              <span class="rounded-lg bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                {{ item.dayLabel }}
              </span>
            </div>
            <!-- Message bubble -->
            <div
              v-else
              :class="item.senderType === 'patient' ? 'flex justify-end' : 'flex justify-start'"
            >
              <div
                class="max-w-[78%] rounded-xl px-3 py-2 text-sm shadow-sm sm:text-base"
                :class="
                  item.senderType === 'patient'
                    ? 'bg-neutral-200 text-neutral-800'
                    : 'bg-[#84D0FF] text-neutral-900'
                "
              >
                <p class="whitespace-pre-wrap">{{ item.text }}</p>
                <p class="mt-1 text-right text-xs font-semibold opacity-60">
                  {{ item.time }}
                </p>
              </div>
            </div>
          </template>
        </template>
      </div>
      <!-- Input area -->
      <div class="shrink-0 rounded-2xl border border-neutral-300 bg-white px-3 py-2 mx-4 mb-4">
        <div class="flex items-center gap-2">
          <input
            v-model="draft"
            type="text"
            placeholder="Tuliskan pesan..."
            class="w-full bg-transparent px-1 py-2 text-sm outline-none"
            @keyup.enter="handleKeyEnter"
            :disabled="isSending || !activeRoomId"
            aria-label="Tulis pesan untuk dokter"
          />
          <button
            type="button"
            @click="handleSend"
            :disabled="!draft.trim() || isSending || !activeRoomId"
            class="cursor-pointer rounded-full p-2 text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Kirim pesan"
          >
            <Loader2 v-if="isSending" class="h-5 w-5 animate-spin" />
            <SendHorizontal v-else class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.chat-scroll {
  scrollbar-width: thin;
  scrollbar-color: #c5c5c5 transparent;
}

.chat-scroll::-webkit-scrollbar {
  width: 5px;
}

.chat-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.chat-scroll::-webkit-scrollbar-thumb {
  background: #c5c5c5;
  border-radius: 999px;
}
</style>
