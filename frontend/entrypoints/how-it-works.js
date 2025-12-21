
class MezivaSimpleSlider extends HTMLElement {
  constructor() {
    super();
    this.slider = null;
    this._inited = false;
    this._onResize = this._onResize.bind(this);
    this._onSectionUnload = this._onSectionUnload.bind(this);
  }

  connectedCallback() {
    if (this._inited) return;
    this._inited = true;

    this.keenEl = this.querySelector("[data-mb-keen]");
    this.dotsWrap = this.querySelector("[data-mb-dots]");
    this.slides = Array.from(this.querySelectorAll("[data-mb-slide]"));

    if (!this.keenEl || !this.dotsWrap || this.slides.length === 0) return;

    // ensure required keen classes (in case you forgot in liquid)
    this.keenEl.classList.add("keen-slider");
    this.slides.forEach((s) => s.classList.add("keen-slider__slide"));

    this._mountIfMobile();
    window.addEventListener("resize", this._onResize, { passive: true });

    // Shopify editor safety (when section is removed)
    document.addEventListener("shopify:section:unload", this._onSectionUnload);
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener("shopify:section:unload", this._onSectionUnload);
    this._destroy();
  }

  _onSectionUnload(e) {
    if (e?.target && e.target.contains(this)) this._destroy();
  }

  _isMobile() {
    return window.matchMedia("(max-width: 1023px)").matches;
  }

  _onResize() {
    this._mountIfMobile();
  }

  _mountIfMobile() {
    if (this._isMobile()) {
      this._initKeen();
    } else {
      // desktop: no slider, but content visible
      this._destroy();
    }
  }

  _initKeen() {
    if (this.slider) return;

    const perView = Number(this.getAttribute("data-per-view-mobile") || 1);
    const spacing = Number(this.getAttribute("data-spacing-mobile") || 16);

    this._buildDots(0);

    this.slider = new KeenSlider(this.keenEl, {
      loop: false,
      slides: { perView, spacing },
      created: (s) => this._buildDots(s.track.details.rel),
      slideChanged: (s) => this._setActiveDot(s.track.details.rel),
    });
  }

  _destroy() {
    if (this.slider) {
      this.slider.destroy();
      this.slider = null;
    }
    if (this.dotsWrap) this.dotsWrap.innerHTML = "";
  }

  _buildDots(activeIndex = 0) {
    if (!this.dotsWrap) return;

    this.dotsWrap.innerHTML = "";
    this.dots = this.slides.map((_, idx) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to slide ${idx + 1}`);
      dot.className =
        "mb-w-[7px] mb-h-[7px] mb-rounded-full mb-bg-[#c4a880]/35 mb-transition mb-duration-200";

      dot.addEventListener("click", () => {
        if (this.slider) this.slider.moveToIdx(idx);
      });

      this.dotsWrap.appendChild(dot);
      return dot;
    });

    this._setActiveDot(activeIndex);
  }

  _setActiveDot(index) {
    if (!this.dots?.length) return;

    const i = Math.max(0, Math.min(index, this.dots.length - 1));
    this.dots.forEach((dot, di) => {
      const active = di === i;
      dot.classList.toggle("mb-bg-[#c4a880]/90", active);
      dot.classList.toggle("mb-bg-[#c4a880]/35", !active);
      dot.style.transform = active ? "scale(1.15)" : "scale(1)";
    });
  }
}

if (!customElements.get("meziva-simple-slider")) {
  customElements.define("meziva-simple-slider", MezivaSimpleSlider);
}

// IMPORTANT: section re-render in theme editor
document.addEventListener("shopify:section:load", (e) => {
  e.target.querySelectorAll("meziva-simple-slider").forEach((el) => {
    // force re-connect init in editor
    if (el._destroy) el._destroy();
    el._inited = false;
    el.connectedCallback?.();
  });
});

