/* FILE: assets/before-after.js
   Clean Before/After (mobile scroll-safe):
   - Horizontal drag controls slider
   - Vertical swipe scrolls page
   - No "stuck scroll" (touchend/touchcancel handled on window)
*/
(function () {
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setPos(compareEl, val) {
    var v = clamp(Number(val || 50), 0, 100);

    var afterImg = compareEl.querySelector(".mb-after");
    var divider = compareEl.querySelector(".mb-divider");
    var knob = compareEl.querySelector(".mb-knob");
    var range = compareEl.querySelector("[data-mb-range]");

    if (afterImg) afterImg.style.clipPath = "inset(0 " + (100 - v) + "% 0 0)";
    if (divider) divider.style.left = v + "%";
    if (knob) knob.style.left = v + "%";
    if (range) range.value = String(v);
  }

  function posFromClientX(compareEl, clientX) {
    var rect = compareEl.getBoundingClientRect();
    var x = clamp(clientX - rect.left, 0, rect.width || 1);
    return (x / (rect.width || 1)) * 100;
  }

  function initCompare(compareEl) {
    var range = compareEl.querySelector("[data-mb-range]");
    if (!range) return;

    // ensure scroll remains possible on touch devices
    // (also set in Liquid style as touch-action: pan-y)
    try {
      compareEl.style.touchAction = compareEl.style.touchAction || "pan-y";
    } catch (e) {}

    // init
    setPos(compareEl, range.value);

    // range input
    range.addEventListener(
      "input",
      function (e) {
        setPos(compareEl, e.target.value);
      },
      { passive: true }
    );

    var dragging = false;
    var pointerDown = false;
    var startX = 0;
    var startY = 0;
    var activePointerId = null;
    var DRAG_THRESHOLD = 6; // px

    function getXY(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function onDown(e) {
      // only left click for mouse
      if (e.type === "mousedown" && e.button !== 0) return;

      pointerDown = true;
      dragging = false;

      var p = getXY(e);
      startX = p.x;
      startY = p.y;

      // set instantly on down (nice UX)
      setPos(compareEl, posFromClientX(compareEl, p.x));
    }

    function onMove(e) {
      if (!pointerDown) return;

      var p = getXY(e);
      var dx = p.x - startX;
      var dy = p.y - startY;

      // Decide drag direction only after threshold
      if (!dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

        // Start dragging ONLY if horizontal intent
        if (Math.abs(dx) > Math.abs(dy)) {
          dragging = true;
        } else {
          // vertical intent => allow page scroll, stop tracking
          pointerDown = false;
          dragging = false;
          return;
        }
      }

      // dragging horizontal
      setPos(compareEl, posFromClientX(compareEl, p.x));
      if (e.cancelable) e.preventDefault();
    }

    function onUp() {
      pointerDown = false;
      dragging = false;
      activePointerId = null;
    }

    // Mouse
    compareEl.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp, { passive: true });

    // Touch (IMPORTANT: end/cancel on window so it never gets stuck)
    compareEl.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp, { passive: true });
    window.addEventListener("touchcancel", onUp, { passive: true });

    // Optional: Pointer Events (if supported) – improves Android/desktop hybrids
    if (window.PointerEvent) {
      compareEl.addEventListener(
        "pointerdown",
        function (e) {
          activePointerId = e.pointerId;
          try {
            compareEl.setPointerCapture(activePointerId);
          } catch (err) {}
          onDown(e);
        },
        { passive: true }
      );

      window.addEventListener(
        "pointermove",
        function (e) {
          if (activePointerId != null && e.pointerId !== activePointerId) return;
          onMove(e);
        },
        { passive: false }
      );

      window.addEventListener(
        "pointerup",
        function (e) {
          if (activePointerId != null && e.pointerId !== activePointerId) return;
          onUp();
        },
        { passive: true }
      );

      window.addEventListener(
        "pointercancel",
        function (e) {
          if (activePointerId != null && e.pointerId !== activePointerId) return;
          onUp();
        },
        { passive: true }
      );
    }
  }

  function initSection(sectionEl) {
    if (!sectionEl) return;
    var compares = sectionEl.querySelectorAll("[data-mb-compare]");
    compares.forEach(initCompare);
  }

  function boot() {
    document.querySelectorAll("[data-mb-before-after-section]").forEach(initSection);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener("shopify:section:load", function (e) {
    if (!e || !e.target) return;
    var sectionEl = e.target.querySelector("[data-mb-before-after-section]");
    if (sectionEl) initSection(sectionEl);
  });
})();
