import Typed from "typed.js";

class StickyHeader extends HTMLElement {
  constructor() {
    super();
    this.sticky = this.dataset.sticky == "true";

    // ✅ Landing page smooth scroll (opt-in)
    this.enableLandingScroll = this.dataset.landingScroll == "true";
    this.landingOffset = Number(this.dataset.landingOffset || 0);

    this.navDisplayBtns = this.querySelectorAll('[data-role="nav-display"]');
    this.navHideBtns = this.querySelectorAll('[data-role="nav-hide"]');
    this.mobileNavigation = this.querySelector('[data-role="mobile-nav"]');
    this.headerOverlay = this.querySelector('[data-role="header-overlay"]');
    this.headerMainWrapper = this.closest("#shopify-section-header-v2");
    this.headerTopBar = this.querySelector('[data-role="header-top-bar"]');
    this.announcementBar = document.querySelector(
      "#shopify-section-announcement-bar-v2"
    );
    this.mobileSearchWrapper = this.querySelector(
      '[data-role="mobile-search-wrapper"]'
    );
    this.lastScroll = 0;
    this.currentDisplay = true;
    this.cartOpenBtns = this.querySelectorAll('[data-role="cart-open"]');
    this.cartCountEls = this.querySelectorAll('[data-role="cart-count"]');

    this.headerWalletIcon = this.querySelector(
      '[data-role="header-cashback-icon"]'
    );
    this.cashbackLoginIcon = this.querySelector(
      '[data-role="header-cashback-login"]'
    );

    this.mobileLinks = Array.from(
      this.mobileNavigation?.querySelectorAll("a") || []
    );
    this.desktopLinks = Array.from(
      this.querySelectorAll('[data-role="parent-nav"]')
    );
    this.parentNavs = Array.from(
      document.querySelectorAll('[data-role="parent-nav"]')
    );

    // Handle multiple cart open buttons
    this.cartOpenBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.dispatchEvent(new Event("cart:open"));
      });
    });

    // Nav Hover (Mega Menu)
    this.parentNavs.forEach((el) => {
      el.addEventListener(
        "mouseenter",
        this.displayMegaDrop.bind(this, el, true)
      );
      el.addEventListener(
        "mouseleave",
        this.displayMegaDrop.bind(this, el, false)
      );
    });

    // Update cart count from events
    ["custom:updateCart", "cart:updated", "ajaxProduct:added"].forEach(
      (eventName) => {
        document.addEventListener(eventName, (e) => {
          const count = e?.detail?.cart?.item_count ?? 0;
          this.cartCountEls.forEach((el) => {
            el.innerHTML = count;
            el.style.opacity = count > 0 ? "1" : "0";
          });
        });
      }
    );

    // Mobile nav toggle
    this.navDisplayBtns.forEach((el) => {
      el.addEventListener("click", () => {
        this.displayMobileNavigation.call(this);
      });
    });
    this.navHideBtns.forEach((el) =>
      el.addEventListener("click", this.hideMobileNavigation.bind(this))
    );

    // Nav link clicks
    [...this.mobileLinks, ...this.desktopLinks].forEach((el) =>
      el.addEventListener("click", this.handleLinkClick.bind(this))
    );

    // Wallet login
    this.cashbackLoginIcon?.addEventListener("click", () => {
      window.handleKpAndShopifyLogin?.("/account");
    });

    // Wallet data
    if (
      this.headerWalletIcon?.querySelector(
        '[data-role="header-cashback-amount"]'
      )
    ) {
      this.getWalletData();
    }

    this.animation = null;
    this.closing = false;
    this.isExpanding = false;

    if (window.innerWidth < 768) {
      document.addEventListener("scroll", this.handleDocumentScroll.bind(this));
      if (this.announcementBar && this.headerMainWrapper) {
        this.headerMainWrapper.style.top =
          this.announcementBar.offsetHeight + "px";
      }
    }
  }

  connectedCallback() {
    new theme.CartDrawer();

    this.mobileNavigationClone = this.mobileNavigation?.cloneNode(true);
    this.mobileNavigation?.remove();
    this.mobileNavigation = this.mobileNavigationClone;

    this.headerMainWrapper?.insertAdjacentElement(
      "afterend",
      this.mobileNavigation
    );

    this.mobileNavigation
      ?.querySelector('[data-role="nav-hide"]')
      ?.addEventListener("click", this.hideMobileNavigation.bind(this));

    Array.from(this.mobileNavigation?.querySelectorAll("a")).forEach((el) =>
      el.addEventListener("click", this.handleLinkClick.bind(this))
    );
  }

  // ✅ helpers
  getAnchorFromEvent(e) {
    return e.target?.closest?.("a");
  }

 getScrollOffset() {
  const headerEl =
    document.querySelector("#shopify-section-header-v2") || this.headerMainWrapper;

  const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;

  const annEl = document.querySelector("#shopify-section-announcement-bar-v2");
  const annH = annEl ? annEl.getBoundingClientRect().height : 0;

  const extra = Number(this.landingOffset || 0); // slider

  // ✅ header + announcement + extra gap
  return Math.ceil(headerH + annH + extra);
}



  // ✅ NEW: close mobile menu + clean body states
  closeMobileMenuStates() {
    // close nav ui
    this.headerOverlay?.classList.remove("active");
    this.mobileNavigation?.classList.remove("active");

    // ✅ must remove both
    document.body.classList.remove("menu-open");
    document.body.style.overflow = ""; // remove overflow:hidden
  }

  // ✅ NEW: find target by div-id (supports id="product" AND id="#product")
  findLandingTargetByHash(hashId) {
    if (!hashId) return null;

    // Normal id
    let el = document.getElementById(hashId);
    if (el) return el;

    // Some markup has id="#product" (with # inside id attribute)
    el = document.getElementById(`#${hashId}`);
    if (el) return el;

    // Safe attribute selector fallback
    try {
      const esc = (v) =>
        window.CSS && CSS.escape ? CSS.escape(v) : v.replace(/"/g, '\\"');
      return (
        document.querySelector(`[id="${esc(hashId)}"]`) ||
        document.querySelector(`[id="${esc(`#${hashId}`)}"]`)
      );
    } catch (e) {
      return null;
    }
  }

  displayMegaDrop(el, show) {
    const drop = el.querySelector('[data-role="mega-drop"]');
    if (drop) {
      show ? this.displayDesktopDrop(drop) : this.hideDesktopDrop(drop);
    }
  }

  displayDesktopDrop(drop) {
    drop.style.display = "block";
    drop.animate({ opacity: [0, 1] }, { duration: 400, easing: "ease-out" });
  }

  hideDesktopDrop(drop) {
    const animation = drop.animate(
      { opacity: [1, 0] },
      { duration: 400, easing: "ease-out" }
    );
    animation.onfinish = () => (drop.style.display = "");
  }

  displayMobileNavigation() {
    this.headerOverlay?.classList.add("active");
    this.mobileNavigation?.classList.add("active");
    document.body.style.overflow = "hidden";
    this.expand();
  }

  hideMobileNavigation() {
    this.headerOverlay?.classList.remove("active");
    document.body.style.overflow = "";
    this.shrink();

    // ✅ also ensure menu-open removed whenever nav closes
    document.body.classList.remove("menu-open");
  }

  expand() {
    this.mobileNavigation?.classList.add("updating");
    this.isExpanding = true;
    this.mobileNavigation.style.overflow = "hidden";
    const startWidth = `0px`;
    const endWidth = `${this.mobileNavigation.offsetWidth}px`;
    if (this.animation) this.animation.cancel();
    this.animation = this.mobileNavigation?.animate(
      { width: [startWidth, endWidth] },
      { duration: 400, easing: "ease-out" }
    );
    this.animation.onfinish = () => this.onAnimationFinish();
    this.animation.oncancel = () => this.onAnimationFinish();
  }

  shrink() {
    this.mobileNavigation?.classList.add("updating");
    this.closing = true;
    this.mobileNavigation.style.overflow = "hidden";
    const startWidth = `${this.mobileNavigation.offsetWidth}px`;
    const endWidth = "0px";
    if (this.animation) this.animation.cancel();
    this.animation = this.mobileNavigation?.animate(
      { width: [startWidth, endWidth] },
      { duration: 400, easing: "ease-out" }
    );
    this.animation.onfinish = () => this.onAnimationFinish(true);
    this.animation.oncancel = () => this.onAnimationFinish(true);
  }

  onAnimationFinish(hide = false) {
    if (hide) this.mobileNavigation?.classList.remove("active");
    this.animation = null;
    this.closing = false;
    this.isExpanding = false;
    this.mobileNavigation.style.width = "";
    this.mobileNavigation.style.overflow = "";
    this.mobileNavigation?.classList.remove("updating");
  }

  // ✅ UPDATED: div-id based smooth scroll + close mobile menu & cleanup body states
  handleLinkClick(e) {
    const a = this.getAnchorFromEvent(e);
    const href = a?.getAttribute("href") || "";

    if (!href || href.startsWith("javascript:")) return;

    // If user is opening in new tab or using cmd/ctrl click -> allow default
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // ✅ Smooth scroll only for hash links when enabled
    if (this.enableLandingScroll && href.startsWith("#") && href.length > 1) {
      const id = href.slice(1);
      const targetEl = this.findLandingTargetByHash(id);

      if (targetEl) {
        e.preventDefault();

        // ✅ close mobile menu + remove overflow hidden + remove menu-open
        this.closeMobileMenuStates();

        const offset = this.getScrollOffset();
        let top = window.scrollY + targetEl.getBoundingClientRect().top - offset;
top = Math.max(0, top);


        window.history.replaceState(null, "", href);
        window.scrollTo({ top, behavior: "smooth" });
        return;
      }
      // If id not found, fallback to normal navigation
    }

    // ✅ Old behavior (navigate)
    e.preventDefault();

    // ✅ also close mobile menu states for normal navigation
    this.closeMobileMenuStates();

    // If href is absolute or has full path -> navigate safely
    try {
      const url = new URL(href, window.location.origin);

      if (url.origin === window.location.origin) {
        window.location.href = url.href;
      } else {
        window.open(url.href, "_self");
      }
    } catch (err) {
      window.location.pathname = href;
    }
  }

  async getCurrentCartData() {
    try {
      let cartId = sessionStorage.getItem("CARTID");
      if (!cartId) {
        const response = await fetch("/cart.js").then((r) => r.json());
        cartId = response.token;
        sessionStorage.setItem("CARTID", cartId);
      }
      return { cart: { id: cartId } };
    } catch (err) {
      console.log("Failed to get cart", err);
    }
  }

  async getGASessionId() {
    return new Promise((resolve) => {
      if (typeof gtag !== "function") return resolve(null);
      gtag("get", "G-N71XHS094H", "session_id", (id) => resolve(id));
      setTimeout(() => resolve(null), 3000);
    });
  }

  async getWalletData() {
    try {
      this.headerWalletIcon?.classList.add("activating");
      let sessionId = null;

      try {
        sessionId = await this.getGASessionId();
      } catch (err) {
        console.log("Failed to get ga session id", err?.message);
      }

      const response = await fetch(`/apps/latest-proxy/cashback/balance`, {
        headers: new Headers({
          "x-gasession-id": sessionId,
        }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error("Balance fetch failed");

      const amountEl = this.headerWalletIcon?.querySelector(
        '[data-role="header-cashback-amount"]'
      );
      if (amountEl) amountEl.innerHTML = this.moneyFormatter(data.balance);

      const wrapper = this.headerWalletIcon?.closest(
        '[data-role="header-cashback-wrapper"]'
      );
      if (wrapper) {
        if (data.balance == 0) wrapper.classList.remove("customer");
        else wrapper.classList.add("customer");
      }
    } catch (err) {
      console.warn("Wallet fetch error", err);
    } finally {
      this.headerWalletIcon?.classList.remove("activating");
    }
  }

  async eventHandler(eventName, params) {
    try {
      let session_id = await this.getGASessionId.call(this);
      const url = `/apps/latest-proxy/events`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName, session_id, params }),
      });
    } catch (err) {
      console.log("Failed to add event reason -->" + err.message);
    }
  }

  moneyFormatter(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  }

  hideHeaderTopBar() {
    if (!this.headerTopBar || !this.announcementBar || !this.headerMainWrapper) return;

    if (!this.currentDisplay) return;
    this.currentDisplay = false;

    if (this.headerTopBarAnimation) this.headerTopBarAnimation.cancel();

    let translateVal =
      this.headerTopBar.offsetHeight + this.announcementBar.offsetHeight - 12;

    this.headerTopBarAnimation = this.headerMainWrapper.animate(
      {
        transform: [`translateY(0px)`, `translateY(-${translateVal}px)`],
      },
      { duration: 150, easing: "ease-in", fill: "forwards" }
    );

    if (this.announcementBarAnimation) this.announcementBarAnimation.cancel();

    let announcementHeight = this.announcementBar.offsetHeight;
    this.announcementBarAnimation = this.announcementBar?.animate(
      {
        transform: [`translateY(0px)`, `translateY(-${announcementHeight}px)`],
      },
      { easing: "ease-in", duration: 150, fill: "forwards" }
    );

    this.announcementBarAnimation.onfinish = () => {
      this.mobileSearchWrapper?.classList.add("is-hidden");
      this.mobileSearchWrapper?.classList.remove("is-visible");
    };
  }

  displayHeaderTopBar() {
    if (!this.headerTopBar || !this.announcementBar || !this.headerMainWrapper) return;

    if (this.currentDisplay) return;
    this.currentDisplay = true;

    if (this.headerTopBarAnimation) this.headerTopBarAnimation.cancel();

    let translateVal =
      this.headerTopBar.offsetHeight + this.announcementBar.offsetHeight - 12;

    this.headerTopBarAnimation = this.headerMainWrapper.animate(
      {
        transform: [`translateY(-${translateVal}px)`, `translateY(0px)`],
      },
      { duration: 150, easing: "ease-in", fill: "forwards" }
    );

    if (this.announcementBarAnimation) this.announcementBarAnimation.cancel();

    let announcementHeight = this.announcementBar.offsetHeight;
    this.announcementBarAnimation = this.announcementBar?.animate(
      {
        transform: [`translateY(-${announcementHeight}px)`, `translateY(0px)`],
      },
      { easing: "ease-in", duration: 150, fill: "forwards" }
    );

    this.announcementBarAnimation.onfinish = () => {
      this.mobileSearchWrapper?.classList.remove("is-hidden");
      this.mobileSearchWrapper?.classList.add("is-visible");
    };
  }

  handleDocumentScroll() {
    let threshold = 50;
    const currentScroll = window.pageYOffset;
    const scrollDelta = currentScroll - this.lastScroll;
    if (Math.abs(scrollDelta) > threshold) {
      if (scrollDelta > 0) this.hideHeaderTopBar();
      else this.displayHeaderTopBar();
      this.lastScroll = currentScroll;
    }
  }
}

customElements.define("sticky-header", StickyHeader);

class ToggleExpand extends HTMLElement {
  constructor() {
    super();
    this.triggerButton = this.querySelector('[data-role="trigger"]');
    this.content = this.querySelector('[data-role="content"]');
    this.animation = null;

    this.triggerButton?.addEventListener("click", () => {
      this.classList.contains("active") ? this.shrink() : this.expand();
    });
  }

  expand() {
    this.content.style.maxHeight = "10000px";
    this.classList.add("active");

    const startHeight = "0px";
    const endHeight = `${this.content.offsetHeight}px`;

    if (this.animation) this.animation.cancel();

    this.animation = this.content.animate(
      { height: [startHeight, endHeight] },
      { duration: 400, easing: "ease-out" }
    );
  }

  shrink() {
    this.classList.remove("active");

    const startHeight = `${this.content.offsetHeight}px`;
    const endHeight = "0px";

    if (this.animation) this.animation.cancel();

    this.animation = this.content.animate(
      { height: [startHeight, endHeight] },
      { duration: 400, easing: "ease-out" }
    );

    this.animation.onfinish = () => (this.content.style.maxHeight = "");
  }
}
customElements.define("toggle-expand", ToggleExpand);

class PredectiveSearch extends HTMLElement {
  constructor() {
    super();
    this.searchInput = this.querySelector('[data-role="search-input"]');
    this.searchSection = document.querySelector("template#predective-search");
    this.searchCloseBtn = this.querySelector('[data-role="search-close"]');
    this.searchBtn = this.querySelector('[data-role="search]'); // (as-is from your code)
    this.searchSectionId = this.searchSection?.dataset?.id;
    this.searchIcon = this.querySelector('[data-role="search-icon"]');
    this.searchContainer = document.querySelector('[data-id="search-container"]');

    this.display = false;
    this.showing = false;
    this.closing = false;
    this.animation = null;

    this.debounceOnChange = this.debounce(() => {
      this.handleInput();
    }, 800);

    document.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("add-to-cart") ||
        e.target.closest(".add-to-cart")
      ) {
        // dataLayer removed
      }
    });

    this.searchInput?.addEventListener("focus", () => {
      if (!this.showing) {
        this.searchInput.classList.add("active");
        this.displayPredectiveSearch();
      }
    });

    this.searchIcon?.addEventListener("focus", () => {
      if (!this.showing) {
        this.searchInput.classList.add("active");
        this.displayPredectiveSearch();
      }
    });

    this.searchInput?.addEventListener("focusout", (e) => {
      if (
        e.relatedTarget?.closest("predective-search") ||
        e.target == this ||
        e.relatedTarget?.closest('[data-id="search-container"]')
      ) {
      } else {
        if (!this.display) {
          this.searchInput.blur();
          this.searchInput.value = "";
          this.searchInput.dispatchEvent(new Event("input"));
          this.searchInput.classList.remove("active");
          this.hidePredectiveSearch();
        }
      }
    });

    document.addEventListener("click", (e) => {
      if (
        e.target.closest("predective-search") ||
        e.target == this ||
        e.target.closest('[data-id="search-container"]')
      ) {
        this.display = true;
      } else {
        this.display = false;
        this.searchInput?.blur();
        if (this.searchInput) {
          this.searchInput.value = "";
          this.searchInput.dispatchEvent(new Event("input"));
          this.searchInput.classList.remove("active");
        }
        this.hidePredectiveSearch();
      }
    });

    document.addEventListener("click", (e) => {
      const searchBtn = e.target.closest('[data-role="search-btn"]');
      if (searchBtn) this.redirectToSearchPage();
    });

    this.searchCloseBtn?.addEventListener("click", () => {
      this.searchInput?.blur();
      if (this.searchInput) {
        this.searchInput.value = "";
        this.searchInput.dispatchEvent(new Event("input"));
        this.searchInput.classList.remove("active");
      }
      this.hidePredectiveSearch();
    });

    this.searchInput?.addEventListener("input", this.debounceOnChange);

    this.searchInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.redirectToSearchPage();
      }
    });

    document.addEventListener("click", (e) => {
      if (
        e.target.closest('[data-role="keyword"]') ||
        e.target.dataset.role == "keyword"
      ) {
        const el = e.target.closest('[data-role="keyword"]') || e.target;
        if (this.searchInput) {
          this.searchInput.value = el.innerHTML;
          this.searchInput.dispatchEvent(new Event("input"));
        }
      }
    });

    window.addEventListener("resize", this.setModalPositionForDesktop.bind(this));

    this.searchContainer?.addEventListener("click", (e) => {
      if (e.target.closest("product-card") && e.target.getAttribute("href")) {
        e.preventDefault();
        let link = e.target.getAttribute("href");
        window.location = link;
      }
    });
  }

  connectedCallback() {
    this.getSectionMarkup();
    this.initTypingEffect();
    this.setModalPositionForDesktop();
  }

  initTypingEffect() {
    const typingInputs = this.dataset.inputs?.split(",") || [];
    if (typingInputs.length > 0 && this.searchInput) {
      this.typed = new Typed(this.searchInput, {
        strings: typingInputs,
        typeSpeed: 50,
        attr: "placeholder",
        loop: true,
        fadeOutDelay: 400,
        backDelay: 1000,
        showCursor: true,
        cursorChar: "|",
      });

      this.searchInput.addEventListener("focus", () => this.typed?.start());
      this.searchInput.addEventListener("focusout", () => this.typed?.start());
    }
  }

  redirectToSearchPage() {
    const searchValue = this.searchInput?.value || "";
    if (searchValue.trim().length > 0) {
      window.location = `/search?q=${encodeURIComponent(searchValue)}&type=product`;
    }
  }

  getSectionMarkup() {
    if (!this.searchSection || !this.searchContainer) return;
    const markup = this.searchSection.content.cloneNode(true);
    const container = markup.querySelector('[data-role="container"]');
    if (container) this.searchContainer.innerHTML = container.outerHTML;
  }

  async handleInput() {
    if (!this.searchInput) return;
    if (this.searchInput.value.trim().length == 0) {
      this.getSectionMarkup();
    } else {
      await this.getResultsData();
    }
  }

  async getResultsData() {
    this.searchContainer?.classList.add("active");
    const url =
      window.Shopify.routes.root +
      `search/suggest?q=${encodeURIComponent(this.searchInput.value)}&resources[type]=product&resources[options][fields]=title,product_type,variants.title,variants.sku&section_id=${this.searchSectionId}`;

    const request = await fetch(url);
    const response = await request.text();
    const parser = new DOMParser();
    const resultHTML = parser.parseFromString(response, "text/html");
    const searchResult = resultHTML
      .querySelector("template")
      ?.content.cloneNode(true)
      .querySelector('[data-role="container"]')?.outerHTML;

    if (searchResult) this.searchContainer.innerHTML = searchResult;
    this.searchContainer?.classList.remove("active");
  }

  debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  setModalPositionForDesktop() {
    if (!this.searchContainer) return;

    if (window.innerWidth > 1024) {
      if (this.checkVisibility?.()) {
        let positionFromRight = this.offsetLeft + this.offsetWidth;
        this.searchContainer.style.right = `calc(100vw - ${positionFromRight}px)`;
      }
    } else {
      this.searchContainer.style.right = "";
    }
  }

  displayPredectiveSearch() {
    this.showing = true;
    this.closing = false;
    if (!this.searchContainer) return;

    this.searchContainer.style.display = "block";
    document.body.style.overflow = "hidden";

    if (this.animation) this.animation.cancel();

    this.animation = this.searchContainer.animate(
      { opacity: [0, 1] },
      { duration: 400, easing: "ease-out" }
    );
  }

  hidePredectiveSearch() {
    this.closing = true;
    this.showing = false;
    if (!this.searchContainer) return;

    if (this.animation) this.animation.cancel();

    this.animation = this.searchContainer.animate(
      { opacity: [1, 0] },
      { duration: 400, easing: "ease-out" }
    );

    this.animation.onfinish = () => {
      this.searchContainer.style.display = "";
      document.body.style.overflow = "";
    };
  }
}

customElements.define("predective-search", PredectiveSearch);

// Mobile search open/close helpers (NO dataLayer)
const mobileSearchWrapper = document.querySelector('[data-role="mobile-search-wrapper"]');
const searchTrigger = mobileSearchWrapper?.querySelector('[for="search-input"]');
const closeBtn = mobileSearchWrapper?.querySelector('[data-role="search-close"]');

const mobileMenuTrigger = document.querySelector('[data-role="nav-display"]');
const mobileMenuClose = document.querySelector('[data-role="nav-hide"]');
const body = document.body;

mobileMenuTrigger?.addEventListener("click", () => {
  body.classList.add("menu-open");
});

mobileMenuClose?.addEventListener("click", () => {
  body.classList.remove("menu-open");
  body.style.overflow = ""; // ✅ ensure overflow reset here too
});

function openSearch() {
  mobileSearchWrapper?.classList.add("expand-search");
}
function closeSearch() {
  mobileSearchWrapper?.classList.remove("expand-search");
}

searchTrigger?.addEventListener("click", function (e) {
  e.stopPropagation();
  openSearch();
});

closeBtn?.addEventListener("click", function (e) {
  e.stopPropagation();
  closeSearch();
});

document.addEventListener("click", function (e) {
  if (
    mobileSearchWrapper?.classList.contains("expand-search") &&
    !mobileSearchWrapper.contains(e.target)
  ) {
    closeSearch();
  }
});

// Circular logo redirection handler (NO dataLayer)
(() => {
  document.addEventListener("click", (e) => {
    if (
      e.target.dataset.role == "circular-logo-link" ||
      e.target.closest('[data-role="circular-logo-link"]')
    ) {
      e.preventDefault();
      let el =
        e.target.dataset.role == "circular-logo-link"
          ? e.target
          : e.target.closest('[data-role="circular-logo-link"]');
      let redirectionLink = el.getAttribute("href");
      if (redirectionLink) window.location.href = redirectionLink;
    }
  });
})();
