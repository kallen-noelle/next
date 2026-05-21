let container: HTMLDivElement | null = null;

function getContainer() {
  if (typeof document === "undefined") return null;
  if (!container) {
    container = document.createElement("div");
    container.style.cssText =
      "position:fixed;top:12px;right:12px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:420px;";
    document.body.appendChild(container);
  }
  return container;
}

export function showSuccessToast(message: string) {
  const c = getContainer();
  if (!c) return;

  const el = document.createElement("div");
  el.style.cssText =
    "pointer-events:auto;background:rgba(34,197,94,0.92);backdrop-filter:blur(12px);color:#fff;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;box-shadow:0 4px 20px rgba(34,197,94,0.3);animation:fadeIn 0.3s ease;font-family:system-ui,sans-serif;word-break:break-all;";

  el.innerHTML = `<strong>${escapeHtml(message)}</strong>`;

  c.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.4s";
    setTimeout(() => el.remove(), 400);
  }, 3000);
}

export function showErrorToast(message: string, detail?: string) {
  const c = getContainer();
  if (!c) return;

  const el = document.createElement("div");
  el.style.cssText =
    "pointer-events:auto;background:rgba(239,68,68,0.92);backdrop-filter:blur(12px);color:#fff;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;box-shadow:0 4px 20px rgba(239,68,68,0.3);animation:fadeIn 0.3s ease;font-family:system-ui,sans-serif;word-break:break-all;";

  el.innerHTML = `<strong>${escapeHtml(message)}</strong>${detail ? `<br><span style="opacity:0.8;font-size:11px">${escapeHtml(detail)}</span>` : ""}`;

  c.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.4s";
    setTimeout(() => el.remove(), 400);
  }, 5000);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Inject keyframe once
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = "@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}";
  document.head.appendChild(style);
}
