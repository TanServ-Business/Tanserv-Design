/* Admin-only preview boundary. Never reads or deletes the user's stored app data. */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const module = params.get("module") || "dashboard";
  const memory = new Map();
  window.IneburaAdminPreviewStorage = Object.freeze({
    getItem: key => memory.get(String(key)) ?? null,
    setItem: (key, value) => memory.set(String(key), String(value)),
    removeItem: key => memory.delete(String(key)),
    clear: () => memory.clear(),
  });
  window.IneburaAdminPage = Object.freeze({
    module,
    view: params.get("view") || "",
    renderer: ["invoice-master", "invoice-upload", "invoice-reallocation", "invoice-deletion"].includes(module) ? "invoice"
      : ["dashboard", "help-support", "strategy-manager"].includes(module) ? "composed"
      : ["invoice-preferences", "document-setup", "role-display", "user-setup", "notification-manager"].includes(module) ? "operational"
      : ["module-configuration", "bulk-document-upload", "client-master", "audit-retention", "audit-trail", "change-password"].includes(module) ? "specialized" : "registry",
  });
  const notify = () => {
    const toast = document.getElementById("adminToast");
    if (!toast) return;
    toast.textContent = "Design preview only — no changes were saved or sent.";
    toast.classList.add("is-visible");
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove("is-visible"), 3600);
  };
  window.IneburaAdminPreviewNotice = notify;
  // The Admin replica now demonstrates terminal states in the isolated in-memory
  // workspace. Block only links that could leave the replica for a real-world
  // communication target; module handlers own validation and mock outcomes.
  document.addEventListener("click", event => {
    const button = event.target.closest("button,a");
    if (!button) return;
    const href = button.tagName === "A" ? button.getAttribute("href") || "" : "";
    if (!/^(mailto:|tel:)/i.test(href)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    notify();
  }, true);

  // One focus/scroll boundary for the existing Admin dialog renderers.
  let returnFocus = null;
  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("adminModal");
    if (!modal) return;
    let wasOpen = false;
    new MutationObserver(() => {
      const open = modal.classList.contains("is-open");
      if (open === wasOpen) return;
      wasOpen = open;
      document.body.classList.toggle("adminDialogOpen", open);
      document.getElementById("adminPageContent")?.toggleAttribute("inert", open);
      if (open) {
        returnFocus = document.activeElement;
        const dialog = modal.querySelector('[role="dialog"]');
        const heading = dialog?.querySelector("h2,h3");
        if (heading && !dialog.hasAttribute("aria-label") && !dialog.hasAttribute("aria-labelledby")) {
          heading.id ||= "adminDialogHeading";
          dialog.setAttribute("aria-labelledby", heading.id);
        }
        requestAnimationFrame(() => modal.querySelector("input:not([type=hidden]):not(:disabled),select:not(:disabled),button")?.focus());
      } else if (returnFocus?.isConnected) returnFocus.focus();
    }).observe(modal, { attributes: true, attributeFilter: ["class"], childList: true });
    document.addEventListener("keydown", event => {
      if (!modal.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = "";
      }
      if (event.key !== "Tab") return;
      const items = [...modal.querySelectorAll('button,a,input,select,textarea,[tabindex="0"]')].filter(e => !e.disabled && e.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  });
})();
