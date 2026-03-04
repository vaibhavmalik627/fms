const uploadsBase = (import.meta.env.VITE_UPLOADS_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

export function buildUploadsImageUrl(profileImage) {
  if (!profileImage) return "";
  const raw = String(profileImage).trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const fileName = raw.split(/[\\/]/).pop();
  if (!fileName) return "";

  return `${uploadsBase}/uploads/${encodeURIComponent(fileName)}`;
}
