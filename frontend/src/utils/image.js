function resolveUploadsBase() {
  const explicit = String(import.meta.env.VITE_UPLOADS_BASE_URL || "").trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  // If uploads base is not provided, derive it from API base URL.
  // Example: https://api.example.com/api -> https://api.example.com
  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (apiBase) {
    return apiBase.replace(/\/+$/, "").replace(/\/api$/, "");
  }

  return "http://localhost:5000";
}

const uploadsBase = resolveUploadsBase();

export function buildUploadsImageUrl(profileImage) {
  if (!profileImage) return "";
  const raw = String(profileImage).trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("/uploads/")) {
    return `${uploadsBase}${raw}`;
  }

  const fileName = raw.split(/[\\/]/).pop();
  if (!fileName) return "";

  return `${uploadsBase}/uploads/${encodeURIComponent(fileName)}`;
}
