const TAG = "mb-ingredients-slider";

function DotsPlugin(dotsWrap) {
  return (slider) => {
    if (!dotsWrap) return;
    let dots = [];

    const dotClass = (active) =>
      [
        "mb-w-[8px]",
        "mb-h-[8px]",
        "mb-rounded-full",
        "mb-bg-mb-accent",
        active ? "mb-opacity-100" : "mb-opacity-30",
        "mb-transition",
      ].join(" ");

    const update = () => {
      const rel = slider.track.details.rel;
      dots.forEach((d, idx) => {
        d.className = dotClass(idx === rel);
        d.setAttribute("aria-current", idx === rel ? "true" : "false");
      });
    };

    slider.on("created", () => {
      dotsWrap.innerHTML = "";
      const count = slider.track.details.slides.length;

      dots = Array.from({ length: count }).map((_, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = dotClass(idx === 0);
        btn.setAttribute("aria-label", `Go to card ${idx + 1}`);
        btn.addEventListener("click", () => slider.moveToIdx(idx));
        dotsWrap.appendChild(btn);
        return btn;
      });

      update();
    });

    slider.on("slideChanged", update);
    slider.on("updated", update);
  };
}

function AutoplayPlugin(getInterval) {
  return (slider) => {
    let timeout = null;
    let mouseOver = false;

    const clear = () => {
      if (timeout) window.clearTimeout(timeout);
      timeout = null;
    };

    const next = () => {
      clear();
      if (mouseOver) return;
      const interval = Number(getInterval?.() || 3500);
      timeout = window.setTimeout(() => slider.next(), interval);
    };

    slider.on("created", () => {
      const el = slider.container;

      el.addEventListener("mouseover", () => {
        mouseOver = true;
        clear();
      });

      el.addEventListener("mouseout", () => {
        mouseOver = false;
        next();
      });

      el.addEventListener("touchstart", clear, { passive: true });
      el.addEventListener("touchend", next, { passive: true });

      next();
    });

    slider.on("dragStarted", clear);
    slider.on("animationEnded", next);
    slider.on("updated", next);
    slider.on("destroyed", clear);
  };
}

class MBIngredientsSlider extends HTMLElement {
  constructor() {
    super();
    this.slider = null;
    this._inited = false;
    this._onResize = this._onResize.bind(this);
  }

  connectedCallback() {
    if (this._inited) return;
    this._inited = true;

    this.keenEl = this.querySelector("[data-mb-keen]");
    this.dotsWrap = this.querySelector("[data-mb-dots]");
    this.slides = Array.from(this.querySelectorAll("[data-mb-slide]"));

    if (!this.keenEl || this.slides.length === 0) return;

    this.keenEl.classList.add("keen-slider");
    this.slides.forEach((s) => s.classList.add("keen-slider__slide"));

    this._mount();
    window.addEventListener("resize", this._onResize, { passive: true });

    if (!window.KeenSlider) {
      window.addEventListener("custom:KeenLoaded", () => this._mount(), { once: true });
    }
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this._onResize);
    this._destroy();
  }

  _onResize() {
    this._mount();
  }

  _isVisible() {
    return window.getComputedStyle(this).display !== "none";
  }

  _enabled() {
    return String(this.dataset.enabled ?? "true") === "true";
  }

  _showDots() {
    return String(this.dataset.showDots ?? "false") === "true";
  }

  _autoplay() {
    return String(this.dataset.autoplay ?? "false") === "true";
  }

  _autoplayTime() {
    return Number(this.dataset.autoplayTime || 3500);
  }

  _mount() {
    if (this._enabled() && this._isVisible() && window.KeenSlider) {
      this._init();
    } else {
      this._destroy();
    }
  }

  _init() {
    if (this.slider) return;

    const perView = Number(this.dataset.perViewMobile || 1);
    const spacing = Number(this.dataset.spacingMobile || 16);

    const plugins = [];
    if (this._showDots() && this.dotsWrap) plugins.push(DotsPlugin(this.dotsWrap));
    if (this._autoplay()) plugins.push(AutoplayPlugin(() => this._autoplayTime()));

    this.slider = new window.KeenSlider(
      this.keenEl,
      { loop: false, renderMode: "performance", slides: { perView, spacing } },
      plugins
    );

    this.setAttribute("data-slider-ready", "true");
  }

  _destroy() {
    if (this.slider) {
      this.slider.destroy();
      this.slider = null;
    }
    this.removeAttribute("data-slider-ready");
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, MBIngredientsSlider);

document.addEventListener("shopify:section:load", (e) => {
  e.target.querySelectorAll(TAG).forEach((el) => {
    el._destroy?.();
    el._inited = false;
    el.connectedCallback?.();
  });
});

document.addEventListener("shopify:section:unload", (e) => {
  e.target.querySelectorAll(TAG).forEach((el) => el._destroy?.());
});
