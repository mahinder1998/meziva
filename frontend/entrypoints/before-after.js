/* FILE: assets/before-after.js
   Clean Before/After:
   - Drag anywhere (mouse/touch) + range input
   - Works for multiple sections safely
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
    var x = clamp(clientX - rect.left, 0, rect.width);
    return (x / rect.width) * 100;
  }

  function initCompare(compareEl) {
    var range = compareEl.querySelector("[data-mb-range]");
    if (!range) return;

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

    // drag anywhere
    var dragging = false;

    function onDown(e) {
      dragging = true;
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      setPos(compareEl, posFromClientX(compareEl, x));
    }

    function onMove(e) {
      if (!dragging) return;
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      setPos(compareEl, posFromClientX(compareEl, x));
      if (e.cancelable) e.preventDefault();
    }

    function onUp() {
      dragging = false;
    }

    compareEl.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    compareEl.addEventListener("touchstart", onDown, { passive: true });
    compareEl.addEventListener("touchmove", onMove, { passive: false });
    compareEl.addEventListener("touchend", onUp, { passive: true });
  }

  function initSection(sectionEl) {
    if (!sectionEl) return;
    var compares = sectionEl.querySelectorAll("[data-mb-compare]");
    compares.forEach(initCompare);
  }

  function boot() {
    document
      .querySelectorAll("[data-mb-before-after-section]")
      .forEach(initSection);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Shopify Theme Editor
  document.addEventListener("shopify:section:load", function (e) {
    if (!e || !e.target) return;
    var sectionEl = e.target.querySelector("[data-mb-before-after-section]");
    if (sectionEl) initSection(sectionEl);
  });
})();
