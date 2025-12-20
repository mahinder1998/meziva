class MezivaSimpleSlider extends HTMLElement {
  constructor() {
    super();
    this.track = this.querySelector("[data-slider-track]");
    this.prev = this.querySelector("[data-slider-prev]");
    this.next = this.querySelector("[data-slider-next]");
    this.dotsWrap = this.querySelector("[data-slider-dots]");

    this.showArrows = this.dataset.showArrows !== "false";
    this.showDots = this.dataset.showDots !== "false";
    this.autoplay = this.dataset.autoplay === "true";
    this.intervalSec = Math.max(2, parseInt(this.dataset.interval || "4", 10) || 4);

    this.index = 0;
    this.step = 1;
    this.timer = null;
    this.isInteracting = false;

    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  connectedCallback() {
    if (!this.track) return;

    if (!this.showArrows) {
      this.prev?.classList.add("sw-hidden");
      this.next?.classList.add("sw-hidden");
    }

    this.prev?.addEventListener("click", () => this.goTo(this.index - 1));
    this.next?.addEventListener("click", () => this.goTo(this.index + 1));
    this.track.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onResize, { passive: true });

    this.track.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    window.addEventListener("pointerup", this.onPointerUp, { passive: true });

    requestAnimationFrame(() => this.rebuild());
    window.addEventListener("load", () => this.rebuild(), { once: true });

    this.startAutoplay();
  }

  disconnectedCallback() {
    this.stopAutoplay();
    this.track?.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onResize);
    this.track?.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  slides() {
    return this.track ? [...this.track.querySelectorAll("[data-slider-slide]")] : [];
  }

  slidesCount() {
    return this.slides().length;
  }

  computeStep() {
    if (!this.track) return;
    const slide = this.track.querySelector("[data-slider-slide]");
    const slideW = slide?.getBoundingClientRect().width || 0;
    const trackW = this.track.getBoundingClientRect().width || 1;
    this.step = slideW > 0 ? slideW : trackW;
  }

  buildDots() {
    if (!this.showDots || !this.dotsWrap) return;
    const count = this.slidesCount();
    this.dotsWrap.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.className = "sw-h-2.5 sw-w-2.5 sw-rounded-full sw-border sw-border-black/10 sw-bg-white/80";
      b.addEventListener("click", () => this.goTo(i));
      this.dotsWrap.appendChild(b);
    }
    this.updateDots();
  }

  updateDots() {
    if (!this.dotsWrap) return;
    [...this.dotsWrap.children].forEach((el, i) => {
      el.classList.toggle("sw-bg-black/70", i === this.index);
      el.classList.toggle("sw-bg-white/80", i !== this.index);
    });
  }

  goTo(i, smooth = true) {
    if (!this.track) return;
    this.computeStep();
    const max = Math.max(0, this.slidesCount() - 1);
    this.index = Math.max(0, Math.min(i, max));
    this.track.scrollTo({ left: this.step * this.index, behavior: smooth ? "smooth" : "auto" });
    this.updateDots();
  }

  onScroll() {
    if (!this.track) return;
    this.computeStep();
    const i = Math.round(this.track.scrollLeft / (this.step || 1));
    if (i !== this.index) {
      this.index = i;
      this.updateDots();
    }
  }

  onResize() {
    this.computeStep();
    this.goTo(this.index, false);
  }

  rebuild() {
    this.computeStep();
    this.buildDots();
    this.goTo(this.index, false);
    this.updateDots();
  }

  onPointerDown() {
    this.isInteracting = true;
    this.stopAutoplay();
  }

  onPointerUp() {
    this.isInteracting = false;
    this.startAutoplay();
  }

  startAutoplay() {
    if (!this.autoplay || this.timer || this.isInteracting) return;
    const count = this.slidesCount();
    if (count <= 1) return;

    this.timer = window.setInterval(() => {
      const next = this.index + 1 >= count ? 0 : this.index + 1;
      this.goTo(next);
    }, this.intervalSec * 1000);
  }

  stopAutoplay() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}
customElements.define("meziva-simple-slider", MezivaSimpleSlider);

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
    this.priceEl = this.querySelector("[data-role='price']");
    this.mountStickyToBody();

    this.sticky = this.querySelector("[data-role='sticky-atc']");
    this.stickyBtn = this.querySelector("[data-role='sticky-atc-btn']");
    this.stickyQtyEl = this.querySelector("[data-role='sticky-qty']");
    this.stickyMinus = this.querySelector("[data-role='sticky-qty-minus']");
    this.stickyPlus = this.querySelector("[data-role='sticky-qty-plus']");
    this.stickyPrice = this.querySelector("[data-role='sticky-price']");

    this.cartAddUrl = this.dataset.cartAddUrl || "/cart/add.js";
    this.checkoutUrl = this.dataset.checkoutUrl || "/checkout";
    this.redirect = this.dataset.redirect || "checkout";
    this.stickyEnabled = this.dataset.stickyEnabled !== "false";

    this.onSubmit = this.onSubmit.bind(this);
  }

  mountStickyToBody() {
    if (!this.sticky) return;

    // already moved
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

  hideSticky() {
    if (!this.sticky) return;
    this.sticky.classList.add("sw-translate-y-[120%]", "sw-opacity-0", "sw-pointer-events-none");
    this.sticky.classList.remove("sw-translate-y-0", "sw-opacity-100");
    document.body.style.paddingBottom = "";
  }

  showSticky() {
    if (!this.sticky) return;
    this.syncSticky();
    this.sticky.classList.remove("sw-translate-y-[120%]", "sw-opacity-0", "sw-pointer-events-none");
    this.sticky.classList.add("sw-translate-y-0", "sw-opacity-100");
    document.body.style.paddingBottom = "96px";
  }

  disconnectedCallback() {
    if (this._stickyObserver) this._stickyObserver.disconnect();
    if (this._mq && this._mqHandler) this._mq.removeEventListener?.("change", this._mqHandler);
    document.body.style.paddingBottom = "";
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
      this.btn.disabled = on || this.btn.hasAttribute("disabled");
      this.btn.textContent = on ? "Adding..." : label;
    }
    if (this.stickyBtn) {
      this.stickyBtn.disabled = on || this.stickyBtn.hasAttribute("disabled");
      this.stickyBtn.textContent = on ? "Adding..." : sLabel;
    }
  }

  syncSticky() {
    const qty = this.getQty();
    if (this.stickyQtyEl) this.stickyQtyEl.value = String(qty);

    const priceText = (this.priceEl?.textContent || "").trim();
    if (priceText && this.stickyPrice) this.stickyPrice.textContent = priceText;

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
        this.sticky.classList.add("sw-hidden");
        document.body.style.paddingBottom = "";
        return;
      }

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
    // IMPORTANT: credentials include to keep session cookie safe
    const res = await fetch(this.cartAddUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ id: variantId, quantity: qty })
    });

    // Shopify returns 422 with json message
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = (data && data.description) || (data && data.message) || (typeof data === "string" ? data : "Cart add failed");
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

      // redirect
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
customElements.define("meziva-single-product-hero", MezivaSingleProductHero);
