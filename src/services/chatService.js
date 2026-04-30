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
// Chat Service (REST endpoints only)
//
//   - Messages, read receipts, presence are handled by Firebase SDK
//     directly (Firestore + RTDB), NOT REST.
//   - REST is only used for: minting Firebase custom token, listing
//     room metadata, creating/resolving a room, and firing the
//     fire-and-forget push notify after a message write.
// ─────────────────────────────────────────────

export const chatService = {
  /**
   * POST /chat/firebase-token — mint a short-lived (3600s) Firebase Custom Token.
   *
   * @returns {Promise<{ customToken: string, expiresIn: number, uid: string, actorType: 'user'|'patient' }>}
   */
  async mintFirebaseToken() {
    return postUnwrapped("/chat/firebase-token", {});
  },

  /**
   * GET /chat/rooms — slim metadata only (no last message, no unread count).
   * lastMessage / unreadCount must be derived client-side via Firestore.
   *
   * @returns {Promise<ChatRoomSummary[]>}
   */
  async listRooms() {
    const payload = await getUnwrapped("/chat/rooms");
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * POST /chat/rooms — create or resolve an existing room (idempotent on medicalRecordId).
   *
   * @param {{ patientId: string, medicalRecordId: string, doctorId?: string }} params
   * @returns {Promise<ChatRoomDto>}
   */
  async createRoom({ patientId, medicalRecordId, doctorId }) {
    return postUnwrapped("/chat/rooms", {
      patientId,
      medicalRecordId,
      ...(doctorId ? { doctorId } : {}),
    });
  },

  /**
   * POST /chat/rooms/:roomId/notify — fire-and-forget push trigger after the
   * frontend has successfully written a message to Firestore.
   *
   * IMPORTANT: do NOT block UI on this; do NOT retry aggressively.
   *
   * @param {string} roomId
   * @param {string} messageId  Firestore doc ID of the just-written message
   * @returns {Promise<{ delivered: number, deactivated: number }>}
   */
  async notifyMessage(roomId, messageId) {
    return postUnwrapped(`/chat/rooms/${roomId}/notify`, { messageId });
  },
};

export { getApiErrorMessage };
