const DEFAULT_ERROR_MESSAGE = "Terjadi kesalahan. Silakan coba lagi.";

export function unwrapApiData(payload) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload;
}

export function getApiErrorMessage(error, fallbackMessage = DEFAULT_ERROR_MESSAGE) {
  const payload = error?.response?.data;
  const responseMessage = payload?.message;

  if (Array.isArray(responseMessage) && responseMessage.length > 0) {
    return responseMessage.join(", ");
  }

  if (typeof responseMessage === "string" && responseMessage.trim().length > 0) {
    return responseMessage;
  }

  if (typeof error?.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

export function getApiFieldErrors(error) {
  const fieldErrors = error?.response?.data?.errors;

  if (!Array.isArray(fieldErrors)) {
    return [];
  }

  return fieldErrors
    .filter((item) => item && typeof item.message === "string")
    .map((item) => ({
      field: item.field || "",
      message: item.message,
    }));
}
