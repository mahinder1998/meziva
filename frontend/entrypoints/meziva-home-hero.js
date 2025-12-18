class MezivaSimpleSlider extends HTMLElement {
  constructor() {
    super();
    this.track = this.querySelector("[data-slider-track]");
    this.prev = this.querySelector("[data-slider-prev]");
    this.next = this.querySelector("[data-slider-next]");
    this.showArrows = this.dataset.showArrows !== "false";
    this.showDots = this.dataset.showDots !== "false";

    this.index = 0;
    this.step = 1;

    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  connectedCallback() {
    this.prev?.addEventListener("click", () => this.goTo(this.index - 1));
    this.next?.addEventListener("click", () => this.goTo(this.index + 1));
    this.track?.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onResize, { passive: true });

    requestAnimationFrame(() => this.rebuild());
    window.addEventListener("load", () => this.rebuild(), { once: true });
    if (!this.showArrows) {
      this.prev?.classList.add("sw-hidden");
      this.next?.classList.add("sw-hidden");
    }
    if (!this.showDots && this.dots) {
      this.dots.classList.add("sw-hidden");
    }

  }

  disconnectedCallback() {
    this.track?.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onResize);
  }

  slidesCount() {
    return this.track ? this.track.querySelectorAll("[data-slider-slide]").length : 0;
  }

  computeStep() {
    if (!this.track) return;
    const slide = this.track.querySelector("[data-slider-slide]");
    const slideW = slide?.getBoundingClientRect().width || 0;
    const trackW = this.track.getBoundingClientRect().width || 1;
    this.step = slideW > 0 ? slideW : trackW;
  }

  buildDots() {
    if (!this.showDots) return;
    if (!this.dots) return;
    const n = this.slidesCount();
    this.dots.innerHTML = "";
    if (n <= 1) return;

    for (let i = 0; i < n; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className =
        "sw-h-2.5 sw-w-2.5 sw-rounded-full sw-border sw-border-black/15 sw-bg-white/80 sw-transition";
      b.addEventListener("click", () => this.goTo(i));
      this.dots.appendChild(b);
    }
    this.updateDots();
  }

  updateDots() {
    if (!this.dots) return;
    [...this.dots.children].forEach((el, i) => {
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

    this.cartAddUrl = this.dataset.cartAddUrl || "/cart/add.js";
    this.checkoutUrl = this.dataset.checkoutUrl || "/checkout";

    this.onSubmit = this.onSubmit.bind(this);
  }

  connectedCallback() {
    this.minus?.addEventListener("click", () => {
      const v = parseInt(this.qtyEl?.value || "1", 10);
      if (this.qtyEl) this.qtyEl.value = String(Math.max(1, v - 1));
    });

    this.plus?.addEventListener("click", () => {
      const v = parseInt(this.qtyEl?.value || "1", 10);
      if (this.qtyEl) this.qtyEl.value = String(v + 1);
    });

    this.form?.addEventListener("submit", this.onSubmit);
  }

  setLoading(loading) {
    if (!this.btn) return;
    this.btn.disabled = loading;
    this.btn.textContent = loading ? "Adding..." : (this.btn.dataset.label || "Buy Now");
  }

  addToCartXHR(variantId, qty) {
    const payload = JSON.stringify({ id: variantId, quantity: qty });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", this.cartAddUrl, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Accept", "application/json");

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(true);
        else reject(new Error("Cart add failed: " + xhr.responseText));
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(payload);
    });
  }

  async onSubmit(e) {
    e.preventDefault();
    try {
      this.status && (this.status.textContent = "");
      this.setLoading(true);

      const variantId = Number(this.variantIdEl?.value || 0);
      const qty = parseInt(this.qtyEl?.value || "1", 10);

      if (!variantId) throw new Error("Missing variant id");

      await this.addToCartXHR(variantId, qty);

      window.location.href = this.checkoutUrl;
    } catch (err) {
      console.error(err);
      this.setLoading(false);
      this.status && (this.status.textContent = "Add to cart failed. Console check karo.");
    }
  }
}
customElements.define("meziva-single-product-hero", MezivaSingleProductHero);
