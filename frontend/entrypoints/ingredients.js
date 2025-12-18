class MezivaIngredients extends HTMLElement {
  constructor() {
    super();
    this.track = this.querySelector('[data-role="track"]');
    this.prev = this.querySelector('[data-role="prev"]');
    this.next = this.querySelector('[data-role="next"]');

    this.onPrev = this.onPrev.bind(this);
    this.onNext = this.onNext.bind(this);
    this.onResize = this.onResize.bind(this);

    this.step = 320;
  }

  connectedCallback() {
    if (!this.track) return;
    this.computeStep();

    if (this.prev) this.prev.addEventListener("click", this.onPrev);
    if (this.next) this.next.addEventListener("click", this.onNext);

    window.addEventListener("resize", this.onResize, { passive: true });
  }

  disconnectedCallback() {
    if (this.prev) this.prev.removeEventListener("click", this.onPrev);
    if (this.next) this.next.removeEventListener("click", this.onNext);
    window.removeEventListener("resize", this.onResize);
  }

  computeStep() {
    const card = this.track.querySelector('[data-role="card"]');
    if (!card) return;
    const styles = window.getComputedStyle(this.track);
    const gap = parseFloat(styles.gap || styles.columnGap || "16") || 16;
    this.step = card.getBoundingClientRect().width + gap;
  }

  onPrev() {
    this.track.scrollBy({ left: -this.step, behavior: "smooth" });
  }

  onNext() {
    this.track.scrollBy({ left: this.step, behavior: "smooth" });
  }

  onResize() {
    this.computeStep();
  }
}

customElements.define("meziva-ingredients", MezivaIngredients);
