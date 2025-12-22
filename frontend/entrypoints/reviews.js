/* FILE: assets/reviews.js
   Meziva Reviews / UGC — Keen Slider (smooth + premium)
   Note: Ensure Keen Slider is available in your Vite bundle:
   - npm i keen-slider
   - import "keen-slider/keen-slider.min.css" in your main entry (once)
*/


function createDots(slider, dotsEl) {
  if (!dotsEl) return;

  dotsEl.innerHTML = "";
  const dots = [];

  for (let i = 0; i < slider.track.details.slides.length; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className =
      "mb-h-[8px] mb-w-[8px] mb-rounded-full mb-bg-black/20 mb-transition-all";
    b.setAttribute("aria-label", `Go to slide ${i + 1}`);
    b.addEventListener("click", () => slider.moveToIdx(i));
    dotsEl.appendChild(b);
    dots.push(b);
  }

  const setActive = () => {
    const rel = slider.track.details.rel;
    dots.forEach((d, i) => {
      d.className =
        i === rel
          ? "mb-h-[8px] mb-w-[28px] mb-rounded-full mb-bg-black/70 mb-transition-all"
          : "mb-h-[8px] mb-w-[8px] mb-rounded-full mb-bg-black/20 mb-transition-all";
    });
  };

  slider.on("created", setActive);
  slider.on("slideChanged", setActive);
  slider.on("updated", setActive);
}

function bindProgress(slider, progressEl) {
  if (!progressEl) return;

  const update = () => {
    const details = slider.track.details;
    // details.progress: 0..1 (loop mode can behave; still looks good)
    const p = Math.max(0, Math.min(1, details.progress));
    progressEl.style.width = `${p * 100}%`;
  };

  slider.on("created", update);
  slider.on("slideChanged", update);
  slider.on("detailsChanged", update);
  slider.on("updated", update);
}

function autoplayPlugin(ms = 4500) {
  return (slider) => {
    let t = null;

    const clear = () => {
      if (t) window.clearTimeout(t);
      t = null;
    };

    const next = () => {
      clear();
      t = window.setTimeout(() => {
        slider.next();
      }, ms);
    };

    slider.on("created", () => {
      slider.container.addEventListener("mouseenter", clear);
      slider.container.addEventListener("mouseleave", next);
      slider.container.addEventListener("touchstart", clear, { passive: true });
      slider.container.addEventListener("touchend", next, { passive: true });
      next();
    });

    slider.on("dragStarted", clear);
    slider.on("animationEnded", next);
    slider.on("updated", next);
  };
}

function initSection(sectionEl) {
  const sliderEl = sectionEl.querySelector("[data-mb-ugc-keen]");
  if (!sliderEl) return;

  // avoid double init
  if (sliderEl.dataset.mbInited === "true") return;
  sliderEl.dataset.mbInited = "true";

  const perM = Number(sectionEl.dataset.perviewM || 1);
  const perD = Number(sectionEl.dataset.perviewD || 3);
  const spacing = Number(sectionEl.dataset.spacing || 16);
  const loop = sectionEl.dataset.loop === "true";
  const autoplay = sectionEl.dataset.autoplay === "true";
  const autoplayMs = Number(sectionEl.dataset.autoplayMs || 4500);

  const showArrows = sectionEl.dataset.showArrows === "true";
  const showDots = sectionEl.dataset.showDots === "true";
  const showProgress = sectionEl.dataset.showProgress === "true";

  const prevBtn = sectionEl.querySelector("[data-mb-ugc-prev]");
  const nextBtn = sectionEl.querySelector("[data-mb-ugc-next]");
  const dotsEl = sectionEl.querySelector("[data-mb-ugc-dots]");
  const progressEl = sectionEl.querySelector("[data-mb-ugc-progress]");

  // Hide controls if disabled
  if (!showArrows) {
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
  }
  if (!showDots && dotsEl) dotsEl.style.display = "none";
  if (!showProgress && progressEl) progressEl.parentElement.style.display = "none";

  const plugins = [];
  if (autoplay) plugins.push(autoplayPlugin(autoplayMs));

  const slider = new KeenSlider(
    sliderEl,
    {
      loop,
      rubberband: true,
      mode: "snap",
      renderMode: "precision",
      slides: { perView: perM, spacing },
      breakpoints: {
        "(min-width: 768px)": {
          slides: { perView: perD, spacing },
        },
      },
    },
    plugins
  );

  if (prevBtn) prevBtn.addEventListener("click", () => slider.prev());
  if (nextBtn) nextBtn.addEventListener("click", () => slider.next());

  if (showDots) createDots(slider, dotsEl);
  if (showProgress) bindProgress(slider, progressEl);

  sliderEl._mbKeen = slider;
}

function boot() {
  document.querySelectorAll("[data-mb-ugc-section]").forEach(initSection);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

// Shopify Theme Editor support
document.addEventListener("shopify:section:load", (e) => {
  if (!e?.target) return;
  e.target.querySelectorAll("[data-mb-ugc-section]").forEach(initSection);
});

document.addEventListener("shopify:section:unload", (e) => {
  if (!e?.target) return;
  const sliderEl = e.target.querySelector("[data-mb-ugc-keen]");
  if (sliderEl && sliderEl._mbKeen) {
    sliderEl._mbKeen.destroy();
    sliderEl._mbKeen = null;
    sliderEl.dataset.mbInited = "false";
  }
});
