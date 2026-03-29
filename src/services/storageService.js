const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || "";

export const getPublicImageUrl = (filePath) => {
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;

  if (!FILE_BASE_URL) {
    return filePath;
  }

  const normalizedBase = FILE_BASE_URL.replace(/\/$/, "");
  const normalizedPath = String(filePath).replace(/^\//, "");
  return `${normalizedBase}/${normalizedPath}`;
};
