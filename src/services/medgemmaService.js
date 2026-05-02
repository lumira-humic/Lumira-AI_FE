import httpClient from "@/lib/httpClient";
import { unwrapApiData } from "@/lib/apiResponse";


const getUnwrapped = async (url, config) => {
  const { data } = await httpClient.get(url, config);
  return unwrapApiData(data);
};

export const medgemmaService = {
  /**
   * Send a consultation message to MedGemma AI.
   *
   * @param {object} params
   * @param {string} params.userPrompt
   * @param {string|null} [params.sessionId] 
   * @param {File|null} [params.imageFile] 
   * @returns {Promise<MedGemmaResponseDto>}
   */
  async consult({ userPrompt, sessionId = null, imageFile = null }) {
    const formData = new FormData();
    formData.append("user_prompt", userPrompt);
    formData.append("role", "patient"); // patient portal always uses "patient" role

    if (sessionId) {
      formData.append("session_id", sessionId);
    }

    if (imageFile instanceof File) {
      formData.append("image", imageFile, imageFile.name);
    }

    const { data } = await httpClient.post("/medgemma/consultation", formData);
    return unwrapApiData(data);
  },

  /**
   * Get all persisted MedGemma session conversations for the current patient.
   *
   * @returns {Promise<MedGemmaSessionConversationDto[]>}
   */
  async listSessions() {
    const payload = await getUnwrapped("/medgemma/sessions");
    return Array.isArray(payload) ? payload : [];
  },

  /**
   * Get the latest 10 messages for a specific MedGemma session.
   *
   * @param {string} sessionId
   * @returns {Promise<MedGemmaChatHistoryDto>}
   */
  async getSessionHistory(sessionId) {
    return getUnwrapped(`/medgemma/sessions/${sessionId}/history`);
  },
};


// ─────────────────────────────────────────────
// Image validation utility
// Used by the view to validate before sending
// ─────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const validateImageFile = (file) => {
  if (!(file instanceof File)) return { valid: false, error: "Bukan file yang valid." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Format tidak didukung. Gunakan JPEG, PNG, atau WEBP." };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: `Ukuran file melebihi batas 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).` };
  }
  return { valid: true, error: null };
};
