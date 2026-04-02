import { t } from "./i18n.js";

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function domainBadgeClass(domain) {
  if (domain === "rail") return "badge-rail";
  if (domain === "road") return "badge-road";
  if (domain === "marine") return "badge-marine";
  return "badge-multi";
}

export function showToast(message) {
  const existing = document.querySelector(".copy-toast");
  existing?.remove();
  const toast = document.createElement("div");
  toast.className = "copy-toast";
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  showToast(t("toast.copied"));
}
