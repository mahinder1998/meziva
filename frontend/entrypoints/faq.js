/* FILE: assets/faq.js
   Meziva FAQ — Smooth accordion (single-open)
   - No quick topics
   - No expand/collapse all button
*/

(function () {
  const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));

  function animate(panel, open) {
    panel.classList.remove("mb-hidden");
    const start = open ? 0 : panel.scrollHeight;
    const end = open ? panel.scrollHeight : 0;

    panel.style.overflow = "hidden";
    panel.style.height = start + "px";
    panel.style.transition = "height 260ms ease";

    panel.getBoundingClientRect(); // reflow
    panel.style.height = end + "px";

    window.setTimeout(() => {
      panel.style.transition = "";
      panel.style.overflow = "";
      panel.style.height = "";
      if (!open) panel.classList.add("mb-hidden");
    }, 280);
  }

  function setOpen(item, open) {
    const trigger = item.querySelector("[data-mb-faq-trigger]");
    const panel = item.querySelector("[data-mb-faq-panel]");
    if (!trigger || !panel) return;

    item.setAttribute("data-open", open ? "true" : "false");
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    animate(panel, open);
  }

  function initSection(sectionEl) {
    const items = $$(sectionEl, "[data-mb-faq-item]");
    if (!items.length) return;

    // Open first by default (nice UX)
    setOpen(items[0], true);

    items.forEach((item) => {
      const trigger = item.querySelector("[data-mb-faq-trigger]");
      if (!trigger) return;

      trigger.addEventListener("click", () => {
        const isOpen = item.getAttribute("data-open") === "true";

        // close others
        items.forEach((it) => {
          if (it !== item && it.getAttribute("data-open") === "true") setOpen(it, false);
        });

        setOpen(item, !isOpen);
      });
    });
  }

  function boot() {
    document.querySelectorAll("[data-mb-faq-section]").forEach(initSection);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  document.addEventListener("shopify:section:load", (e) => {
    if (!e?.target) return;
    e.target.querySelectorAll("[data-mb-faq-section]").forEach(initSection);
  });
})();
