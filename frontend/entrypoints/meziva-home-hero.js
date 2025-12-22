// frontend/entrypoints/meziva-home-hero.js
// ------------------------------
// KEEN SLIDER (in-section)
// ------------------------------
class MezivaKeenSlider extends HTMLElement {
  constructor() {
    super();
    this.container = this.querySelector("[data-keen-container]");
    this.prev = this.querySelector("[data-keen-prev]");
    this.next = this.querySelector("[data-keen-next]");
    this.dotsWrap = this.querySelector("[data-keen-dots]");

    this.showArrows = this.dataset.showArrows !== "false";
    this.showDots = this.dataset.showDots !== "false";
    this.autoplay = this.dataset.autoplay === "true";
    this.intervalSec = Math.max(2, parseInt(this.dataset.interval || "4", 10) || 4);

    this.slider = null;
    this._timer = null;
    this._isHover = false;
  }

  connectedCallback() {
    if (!this.container) return;

    if (!this.showArrows) {
      this.prev?.classList.add("mb-hidden");
      this.next?.classList.add("mb-hidden");
    }

    const autoplayPlugin = (slider) => {
      if (!this.autoplay) return;

      const clear = () => {
        if (this._timer) window.clearInterval(this._timer);
        this._timer = null;
      };

      const start = () => {
        clear();
        this._timer = window.setInterval(() => slider.next(), this.intervalSec * 1000);
      };

      slider.on("created", () => {
        this.container.addEventListener("mouseenter", () => {
          this._isHover = true;
          clear();
        });
        this.container.addEventListener("mouseleave", () => {
          this._isHover = false;
          start();
        });

        this.container.addEventListener("touchstart", clear, { passive: true });
        this.container.addEventListener("touchend", () => {
          if (!this._isHover) start();
        });

        start();
      });

      slider.on("dragStarted", clear);
      slider.on("animationEnded", () => {
        if (!this._isHover) start();
      });
      slider.on("updated", () => {
        if (!this._isHover) start();
      });
    };

    this.slider = new KeenSlider(
      this.container,
      {
        loop: false,
        rubberband: true,
        renderMode: "performance",
        slides: { perView: 1, spacing: 0 }
      },
      [autoplayPlugin]
    );

    this.prev?.addEventListener("click", () => this.slider?.prev());
    this.next?.addEventListener("click", () => this.slider?.next());

    if (this.showDots) this.buildDots();
    this.slider.on("slideChanged", () => this.updateDots());
    this.slider.on("created", () => this.updateDots());
    this.slider.on("updated", () => this.updateDots());
  }

  disconnectedCallback() {
    if (this._timer) window.clearInterval(this._timer);
    this._timer = null;
    this.slider?.destroy();
    this.slider = null;
  }

  buildDots() {
    if (!this.dotsWrap || !this.slider) return;
    const count = this.slider.track?.details?.slides?.length || 0;
    this.dotsWrap.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.className =
        "mb-h-2.5 mb-w-2.5 mb-rounded-full mb-border mb-border-[#724430]/10 mb-bg-white/80";
      b.addEventListener("click", () => this.slider?.moveToIdx(i));
      this.dotsWrap.appendChild(b);
    }
  }

  updateDots() {
    if (!this.dotsWrap || !this.slider) return;
    const rel = this.slider.track?.details?.rel ?? 0;

    [...this.dotsWrap.children].forEach((el, i) => {
      el.classList.toggle("mb-bg-black/70", i === rel);
      el.classList.toggle("mb-bg-white/80", i !== rel);
    });
  }
}

if (!customElements.get("meziva-keen-slider")) {
  customElements.define("meziva-keen-slider", MezivaKeenSlider);
}

// ------------------------------
// PRODUCT HERO (ATC + Sticky)
// ------------------------------
class MezivaSingleProductHero extends HTMLElement {
  constructor() {
    super();

    this.variantIdEl = this.querySelector("[data-role='variant-id']");
    this.qtyEl = this.querySelector("[data-role='qty']");
    this.minus = this.querySelector("[data-role='qty-minus']");
    this.plus = this.querySelector("[data-role='qty-plus']");
    this.form = this.querySelector("[data-role='atc-form']");
    this.btn = this.querySelector("[data-role='atc-btn']");
    this.status = this.querySelector("[data-role='status']");

    // sticky refs first
    this.sticky = this.querySelector("[data-role='sticky-atc']");
    this.stickyBtn = this.querySelector("[data-role='sticky-atc-btn']");
    this.stickyQtyEl = this.querySelector("[data-role='sticky-qty']");
    this.stickyMinus = this.querySelector("[data-role='sticky-qty-minus']");
    this.stickyPlus = this.querySelector("[data-role='sticky-qty-plus']");
    this.stickyPrice = this.querySelector("[data-role='sticky-price']");

    // mount sticky after refs
    this.mountStickyToBody();

    this.cartAddUrl = this.dataset.cartAddUrl || "/cart/add.js";
    this.checkoutUrl = this.dataset.checkoutUrl || "/checkout";
    this.redirect = this.dataset.redirect || "checkout";
    this.stickyEnabled = this.dataset.stickyEnabled !== "false";

    this.onSubmit = this.onSubmit.bind(this);
  }

  mountStickyToBody() {
    if (!this.sticky) return;
    if (this.sticky.dataset.mounted === "true") return;
    this.sticky.dataset.mounted = "true";
    document.body.appendChild(this.sticky);
  }

  connectedCallback() {
    this.minus?.addEventListener("click", () => this.setQty(this.getQty() - 1));
    this.plus?.addEventListener("click", () => this.setQty(this.getQty() + 1));

    this.stickyMinus?.addEventListener("click", () => this.setQty(this.getStickyQty() - 1));
    this.stickyPlus?.addEventListener("click", () => this.setQty(this.getStickyQty() + 1));

    this.form?.addEventListener("submit", this.onSubmit);
    this.stickyBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      this.onSubmit(e);
    });

    this.syncSticky();
    if (this.stickyEnabled) this.setupStickyVisibility();
  }

  disconnectedCallback() {
    if (this._stickyObserver) this._stickyObserver.disconnect();
    if (this._mq && this._mqHandler) this._mq.removeEventListener?.("change", this._mqHandler);
    document.body.style.paddingBottom = "";
  }

  hideSticky() {
    if (!this.sticky) return;
    this.sticky.classList.add("mb-translate-y-[120%]", "mb-opacity-0", "mb-pointer-events-none");
    this.sticky.classList.remove("mb-translate-y-0", "mb-opacity-100");
    document.body.style.paddingBottom = "";
  }

  showSticky() {
    if (!this.sticky) return;
    this.syncSticky();
    this.sticky.classList.remove("mb-translate-y-[120%]", "mb-opacity-0", "mb-pointer-events-none");
    this.sticky.classList.add("mb-translate-y-0", "mb-opacity-100");
    document.body.style.paddingBottom = "96px";
  }

  getQty() {
    return Math.max(1, parseInt(this.qtyEl?.value || "1", 10) || 1);
  }

  getStickyQty() {
    return Math.max(1, parseInt(this.stickyQtyEl?.value || "1", 10) || 1);
  }

  setQty(next) {
    const qty = Math.max(1, parseInt(next, 10) || 1);
    if (this.qtyEl) this.qtyEl.value = String(qty);
    if (this.stickyQtyEl) this.stickyQtyEl.value = String(qty);
    this.syncSticky();
  }

  setLoading(on) {
    const label = this.btn?.dataset.label || "Buy Now";
    const sLabel = this.stickyBtn?.dataset.label || "Buy Now";

    if (this.btn) {
      const hardDisabled = this.btn.hasAttribute("disabled");
      this.btn.disabled = hardDisabled ? true : !!on;
      this.btn.textContent = on ? "Adding..." : label;
    }
    if (this.stickyBtn) {
      const hardDisabled = this.stickyBtn.hasAttribute("disabled");
      this.stickyBtn.disabled = hardDisabled ? true : !!on;
      this.stickyBtn.textContent = on ? "Adding..." : sLabel;
    }
  }

  syncSticky() {
    const qty = this.getQty();
    if (this.stickyQtyEl) this.stickyQtyEl.value = String(qty);

    const disabled = this.btn?.disabled || this.btn?.hasAttribute("disabled");
    if (this.stickyBtn) this.stickyBtn.disabled = !!disabled;
  }

  setupStickyVisibility() {
    if (!this.sticky) return;

    this._mq = window.matchMedia("(max-width: 1023px)");
    const target = this.form || this.btn;
    if (!target) return;

    const apply = () => {
      if (!this._mq.matches) {
        this.sticky.classList.add("mb-hidden");
        document.body.style.paddingBottom = "";
        return;
      }

      this.sticky.classList.remove("mb-hidden");
      if (this._stickyObserver) this._stickyObserver.disconnect();

      this._stickyObserver = new IntersectionObserver(
        (entries) => {
          const visible = !!entries?.[0]?.isIntersecting;
          if (visible) this.hideSticky();
          else this.showSticky();
        },
        { threshold: 0.2 }
      );

      this._stickyObserver.observe(target);
    };

    this._mqHandler = apply;
    apply();
    this._mq.addEventListener?.("change", this._mqHandler);
  }

  async addToCart(variantId, qty) {
    const res = await fetch(this.cartAddUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id: variantId, quantity: qty })
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      const msg =
        (data && data.description) ||
        (data && data.message) ||
        (typeof data === "string" ? data : "Cart add failed");
      throw new Error(msg);
    }
    return data;
  }

  async onSubmit(e) {
    e.preventDefault();
    try {
      if (this.status) this.status.textContent = "";
      this.setLoading(true);

      const variantId = Number(this.variantIdEl?.value || 0);
      const qty = this.getQty();
      if (!variantId) throw new Error("Variant ID missing");

      await this.addToCart(variantId, qty);

      if (this.redirect === "checkout") window.location.href = this.checkoutUrl;
      else if (this.redirect === "cart") window.location.href = "/cart";
      else this.setLoading(false);
    } catch (err) {
      console.error("ATC error:", err);
      this.setLoading(false);
      if (this.status) this.status.textContent = err?.message || "Add to cart failed";
    }
  }
}

if (!customElements.get("meziva-single-product-hero")) {
  customElements.define("meziva-single-product-hero", MezivaSingleProductHero);
}

// ------------------------------
// LIGHTBOX POPUP: Slider + Zoom + LOW->HI swap
// + Drag-guard so swipe doesn't open popup
// + ✅ No-crop: object-contain
// ------------------------------
(function () {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  class MbLightboxSliderZoom {
    constructor(sectionId) {
      this.sectionId = sectionId;

      this.overlay = document.querySelector(`#mb-zoom-overlay-${sectionId}`);
      if (!this.overlay) return;

      this.panel = this.overlay.querySelector("[data-lb-panel]");
      this.track = this.overlay.querySelector("[data-lb-track]");
      this.btnPrev = this.overlay.querySelector("[data-lb-prev]");
      this.btnNext = this.overlay.querySelector("[data-lb-next]");
      this.btnClose = this.overlay.querySelector("[data-zoom-close]");

      this.images = [];
      this.index = 0;

      // zoom state
      this.scale = 1;
      this.minScale = 1;
      this.maxScale = 4;
      this.tx = 0;
      this.ty = 0;

      this.dragging = false;
      this.startX = 0;
      this.startY = 0;
      this.startTx = 0;
      this.startTy = 0;
      this.raf = null;

      this.onKeyDown = this.onKeyDown.bind(this);
      this.onWheel = this.onWheel.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);
      this.onScroll = this.onScroll.bind(this);

      this.btnClose?.addEventListener("click", () => this.close());
      this.btnPrev?.addEventListener("click", () => this.goTo(this.index - 1));
      this.btnNext?.addEventListener("click", () => this.goTo(this.index + 1));

      this.overlay.addEventListener("click", (e) => {
        if (e.target === this.overlay) this.close();
      });

      this.overlay.classList.add("mb-opacity-0", "mb-pointer-events-none");
      this.panel?.classList.add("mb-opacity-0", "mb-scale-[0.98]");
    }

    setImages(images) {
      this.images = images || [];
    }

    buildSlides() {
      if (!this.track) return;
      this.track.innerHTML = "";
      const frag = document.createDocumentFragment();

      this.images.forEach((it) => {
        const slide = document.createElement("div");
        slide.className = "mb-min-w-full mb-h-full mb-snap-start mb-flex mb-items-center mb-justify-center";

        const stage = document.createElement("div");
        stage.className =
          "mb-h-full mb-w-full mb-flex mb-items-center mb-justify-center mb-overflow-hidden mb-cursor-grab active:mb-cursor-grabbing";
        stage.setAttribute("data-lb-stage", "true");

        const img = document.createElement("img");
        // ✅ NO CROP in popup
        img.className = "mb-h-full mb-w-full mb-object-contain mb-select-none mb-pointer-events-none";
        img.decoding = "async";
        img.loading = "eager";
        img.alt = it.alt || "";

        // low first
        img.src = it.low || it.src;

        // swap hi
        if (it.src && (it.low || "") !== it.src) {
          const hi = new Image();
          hi.decoding = "async";
          hi.src = it.src;
          hi.onload = () => {
            img.src = it.src;
          };
        }

        stage.appendChild(img);
        slide.appendChild(stage);
        frag.appendChild(slide);
      });

      this.track.appendChild(frag);
    }

    open(startIndex = 0) {
      if (!this.overlay || !this.track) return;
      if (!this.images.length) return;

      this.buildSlides();
      this.index = clamp(startIndex, 0, this.images.length - 1);

      document.documentElement.classList.add("mb-overflow-hidden");
      document.body.classList.add("mb-overflow-hidden");

      this.overlay.classList.add("mb-opacity-0", "mb-pointer-events-none");
      this.panel?.classList.add("mb-opacity-0", "mb-scale-[0.98]");
      this.panel?.classList.remove("mb-opacity-100", "mb-scale-100");

      requestAnimationFrame(() => {
        this.overlay.classList.remove("mb-opacity-0", "mb-pointer-events-none");
        this.overlay.classList.add("mb-opacity-100");

        this.panel?.classList.remove("mb-opacity-0", "mb-scale-[0.98]");
        this.panel?.classList.add("mb-opacity-100", "mb-scale-100");
      });

      window.addEventListener("keydown", this.onKeyDown);
      this.track.addEventListener("scroll", this.onScroll, { passive: true });

      this.attachZoomToActiveStage();
      requestAnimationFrame(() => this.goTo(this.index, false));
    }

    close() {
      if (!this.overlay) return;

      this.panel?.classList.remove("mb-opacity-100", "mb-scale-100");
      this.panel?.classList.add("mb-opacity-0", "mb-scale-[0.98]");

      this.overlay.classList.remove("mb-opacity-100");
      this.overlay.classList.add("mb-opacity-0", "mb-pointer-events-none");

      window.setTimeout(() => {
        document.documentElement.classList.remove("mb-overflow-hidden");
        document.body.classList.remove("mb-overflow-hidden");

        window.removeEventListener("keydown", this.onKeyDown);
        this.track?.removeEventListener("scroll", this.onScroll);
        this.detachZoom();
      }, 180);
    }

    getSlideWidth() {
      if (!this.track) return 1;
      return this.track.getBoundingClientRect().width || 1;
    }

    goTo(i, smooth = true) {
      if (!this.track) return;
      const max = this.images.length - 1;
      this.index = clamp(i, 0, max);

      this.resetZoom(true);

      const w = this.getSlideWidth();
      this.track.scrollTo({ left: w * this.index, behavior: smooth ? "smooth" : "auto" });

      this.attachZoomToActiveStage();
    }

    onScroll() {
      if (!this.track) return;
      const w = this.getSlideWidth();
      const i = Math.round(this.track.scrollLeft / (w || 1));
      if (i !== this.index) {
        this.index = clamp(i, 0, this.images.length - 1);
        this.resetZoom(true);
        this.attachZoomToActiveStage();
      }
    }

    activeStage() {
      if (!this.track) return null;
      const slide = this.track.children?.[this.index];
      return slide?.querySelector?.("[data-lb-stage='true']") || null;
    }

    activeImg() {
      const stage = this.activeStage();
      return stage?.querySelector?.("img") || null;
    }

    attachZoomToActiveStage() {
      this.detachZoom();
      const stage = this.activeStage();
      if (!stage) return;

      this._stage = stage;
      stage.addEventListener("wheel", this.onWheel, { passive: false });
      stage.addEventListener("pointerdown", this.onPointerDown, { passive: false });
      window.addEventListener("pointermove", this.onPointerMove, { passive: false });
      window.addEventListener("pointerup", this.onPointerUp, { passive: true });
    }

    detachZoom() {
      if (this._stage) {
        this._stage.removeEventListener("wheel", this.onWheel);
        this._stage.removeEventListener("pointerdown", this.onPointerDown);
      }
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerup", this.onPointerUp);
      this._stage = null;
    }

    resetZoom(immediate = false) {
      this.scale = 1;
      this.tx = 0;
      this.ty = 0;
      this.applyTransform(immediate);
    }

    zoomBy(delta) {
      const next = clamp(this.scale + delta, this.minScale, this.maxScale);
      if (next === this.scale) return;
      this.scale = next;
      if (this.scale === 1) {
        this.tx = 0;
        this.ty = 0;
      }
      this.applyTransform(false);
    }

    applyTransform(immediate = false) {
      const img = this.activeImg();
      if (!img) return;

      const apply = () => {
        this.raf = null;
        img.style.transform = `translate3d(${this.tx}px, ${this.ty}px, 0) scale(${this.scale})`;
      };

      if (immediate) {
        img.style.transition = "transform 120ms ease";
        apply();
        window.setTimeout(() => {
          img.style.transition = "";
        }, 140);
        return;
      }

      if (this.raf) return;
      this.raf = requestAnimationFrame(apply);
    }

    onWheel(e) {
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      this.zoomBy(dir * 0.18);
    }

    onPointerDown(e) {
      if (this.scale <= 1) return;
      e.preventDefault();
      this.dragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startTx = this.tx;
      this.startTy = this.ty;
      this._stage?.setPointerCapture?.(e.pointerId);
    }

    onPointerMove(e) {
      if (!this.dragging) return;
      e.preventDefault();
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      this.tx = this.startTx + dx;
      this.ty = this.startTy + dy;
      this.applyTransform(false);
    }

    onPointerUp() {
      this.dragging = false;
    }

    onKeyDown(e) {
      if (e.key === "Escape") this.close();
      if (e.key === "ArrowLeft") this.goTo(this.index - 1);
      if (e.key === "ArrowRight") this.goTo(this.index + 1);

      if (e.key === "+" || e.key === "=") this.zoomBy(+0.25);
      if (e.key === "-" || e.key === "_") this.zoomBy(-0.25);
      if (e.key === "0") this.resetZoom(true);
    }
  }

  const instances = new Map();

  const getSectionIdFromTarget = (el) => {
    const sec = el.closest("section[id^='meziva-single-hero-']");
    if (!sec) return null;
    return sec.id.replace("meziva-single-hero-", "");
  };

  const collectImagesFromHero = (imgEl) => {
    const hero = imgEl.closest("meziva-single-product-hero") || document;
    const imgs = [...hero.querySelectorAll("img[data-zoom-src]")];

    return imgs
      .map((el) => ({
        src: el.getAttribute("data-zoom-src"),
        low: el.getAttribute("data-zoom-src-low") || el.getAttribute("data-zoom-src"),
        alt: el.getAttribute("alt") || "",
        el
      }))
      .filter((x) => !!x.src);
  };

  // ✅ Drag guard: swipe on keen should not open popup
  let MB_DRAGGING = false;

  document.addEventListener(
    "pointerdown",
    (e) => {
      const withinKeen = e.target?.closest?.("[data-keen-container]");
      if (!withinKeen) return;
      MB_DRAGGING = false;
    },
    { passive: true }
  );

  document.addEventListener(
    "pointermove",
    (e) => {
      const withinKeen = e.target?.closest?.("[data-keen-container]");
      if (!withinKeen) return;
      MB_DRAGGING = true;
    },
    { passive: true }
  );

  document.addEventListener("click", (e) => {
    if (MB_DRAGGING) return;

    const img = e.target?.closest?.("img[data-zoom-src]");
    if (!img) return;

    const sectionId = getSectionIdFromTarget(img);
    if (!sectionId) return;

    const list = collectImagesFromHero(img);
    if (!list.length) return;

    let inst = instances.get(sectionId);
    if (!inst) {
      inst = new MbLightboxSliderZoom(sectionId);
      instances.set(sectionId, inst);
    }

    inst.setImages(list.map((x) => ({ src: x.src, low: x.low, alt: x.alt })));

    const startIndex = Math.max(0, list.findIndex((x) => x.el === img));
    inst.open(startIndex);
  });
})();
