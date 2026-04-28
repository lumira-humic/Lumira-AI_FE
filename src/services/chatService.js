import httpClient from "@/lib/httpClient";
import { unwrapApiData, getApiErrorMessage } from "@/lib/apiResponse";


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const getUnwrapped = async (url, config) => {
  const { data } = await httpClient.get(url, config);
  return unwrapApiData(data);
};

const postUnwrapped = async (url, payload, config) => {
  const { data } = await httpClient.post(url, payload, config);
  return unwrapApiData(data);
};


// ─────────────────────────────────────────────
// Chat Service
// ─────────────────────────────────────────────

export const chatService = {
  /**
   * Create or resolve an existing chat room.
   *
   * BE logic:
   * - Room is uniquely tied to a medicalRecordId (unique index on chat_rooms.medical_record_id)
   * - If room already exists for that medicalRecordId → return existing room
   * - Patient actor: patientId (own id) + doctorId (required) + medicalRecordId (required)
   * - Doctor actor: patientId + medicalRecordId (required). doctorId resolved from actor.
   *
   * @param {object} params
   * @param {string} params.patientId
   * @param {string} params.medicalRecordId
   * @param {string} [params.doctorId] - Required when called as patient
   * @returns {Promise<ChatRoom>}
   */
  async createRoom({ patientId, medicalRecordId, doctorId }) {
    return postUnwrapped("/chat/rooms", {
      patientId,
      medicalRecordId,
      ...(doctorId ? { doctorId } : {}),
    });
  },

  /**
   * List all room summaries for the currently authenticated actor.
   * Includes: counterpart info, unread count, last message preview, presence text.
   *
   * @returns {Promise<ChatRoomSummary[]>}
   */
  async listRooms() {
    const payload = await getUnwrapped("/chat/rooms");
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * Get chat history for a specific room, grouped by UTC date.
   *
   * @param {string} roomId
   * @param {object} [options]
   * @param {number} [options.limit=20]
   * @param {string} [options.before]
   * @param {string} [options.after]
   * @returns {Promise<ChatHistoryGroup[]>}
   */
  async getChatHistory(roomId, options = {}) {
    const { limit = 20, before, after } = options;
    const params = {
      limit,
      ...(before ? { before } : {}),
      ...(after ? { after } : {}),
    };

    const payload = await getUnwrapped(`/chat/rooms/${roomId}/messages`, { params });
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * Send a new message to a room.
   * Uses clientMessageId as an idempotency key to prevent duplicate sends on retry.
   *
   * @param {string} roomId
   * @param {string} message - Max 5000 chars
   * @param {string} [clientMessageId] - Optional idempotency key (e.g. "msg-client-{timestamp}")
   * @returns {Promise<ChatMessage>}
   */
  async sendMessage(roomId, message, clientMessageId) {
    return postUnwrapped(`/chat/rooms/${roomId}/messages`, {
      message,
      ...(clientMessageId ? { clientMessageId } : {}),
    });
  },

  /**
   * Mark all unread messages in a room as read for the current actor.
   *
   * @param {string} roomId
   * @returns {Promise<{ updated: number }>}
   */
  async markRoomAsRead(roomId) {
    const { data } = await httpClient.put(`/chat/rooms/${roomId}/read`);
    return unwrapApiData(data);
  },

  /**
   * Mark a single message as read.
   *
   * @param {string} roomId
   * @param {string} messageId
   * @returns {Promise<{ updated: number }>}
   */
  async markMessageAsRead(roomId, messageId) {
    const { data } = await httpClient.put(
      `/chat/rooms/${roomId}/messages/${messageId}/read`,
    );
    return unwrapApiData(data);
  },

  /**
   * Send a presence heartbeat to update lastSeenAt for the current actor.
   * Should be called every 30–60 seconds while chat is in focus.
   *
   * @returns {Promise<void>}
   */
  async heartbeat() {
    await httpClient.post("/chat/heartbeat");
  },
};

export { getApiErrorMessage };
