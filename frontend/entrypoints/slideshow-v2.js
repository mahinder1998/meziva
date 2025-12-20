if (!customElements.get("banner-slideshow")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", defineBannerSlideshow);
  } else {
    defineBannerSlideshow();
  }
  function defineBannerSlideshow() {
    class BannerSlideshow extends HTMLElement {
      constructor() {
        super();
        this.sliderWrapper = this.querySelector('[data-role="slides-wrapper"]');
        this.slides = Array.from(this.querySelectorAll('[data-role="slide"]'));
        this.nextBtn = this.querySelector('[data-role="next-btn"]');
        this.prevBtn = this.querySelector('[data-role="prev-btn"]');
        this.sliderAutoplay = this.dataset.autoplay == "true" ? true : false;
        this.sliderAutoplayTime = Number(this.dataset.autoplayInterval) * 1000;

        this.slides.forEach((el, ind) => {
          if (ind > 0) {
            el.style.position = "absolute";
          }
        });

        this.nextBtn
          ? this.nextBtn.addEventListener("click", () => {
              this.slider.next();
              dataLayer.push({
                event: window.custom_data_events.slideshow.events[1].name,
              });
            })
          : "";
        this.prevBtn
          ? this.prevBtn.addEventListener("click", () => {
              this.slider.prev();
              dataLayer.push({
                event: window.custom_data_events.slideshow.events[0].name,
              });
            })
          : "";
      }
      connectedCallback() {
        if (window.KeenSlider) {
          this.initializeSlider.call(this, window.KeenSlider);
        } else {
          document.addEventListener("custom:KeenLoaded", () => {
            this.initializeSlider.call(this, window.KeenSlider);
          });
        }
        if (this.sliderAutoplay) {
          this.autoplay.call(this);
        }
      }
      initializeSlider(Slider) {
        let autoplay = this.autoplay;
        this.slider = new Slider(this.sliderWrapper, {
          loop: true,
          defaultAnimation: {
            duration: 1000,
          },
          detailsChanged: (s) => {
            let activeSlideindex = 0;
            s.track.details.slides.forEach((el, ind) => {
              if (el.distance == 0) {
                activeSlideindex = ind;
              }
            });
            // s.slides.forEach((element, idx) => {
            //   element.style.opacity = s.track.details.slides[idx].portion;
            //   idx == activeSlideindex
            //     ? (element.style.pointerEvents = "auto")
            //     : (element.style.pointerEvents = "none");
            // });
            s.slides.forEach((element, idx) => {
              const isActive = s.track.details.rel === idx;
              if (isActive) {
                element.style.opacity = "1";
                element.style.pointerEvents = "auto";
                element.style.visibility = "visible";
                element.style.zIndex = "2";
                element.style.position = "relative"; // bring on top
              } else {
                element.style.opacity = "0";
                element.style.pointerEvents = "none";
                element.style.visibility = "hidden";
                element.style.zIndex = "1";
                element.style.position = "absolute";
              }
            });
          },
          renderMode: "custom",
        });
        if (this.sliderAutoplay) {
          this.slider.on("animationEnded", () => {
            clearTimeout(this.timeout);
            this.autoplay.call(this);
          });
          this.slider.on("updated", () => {
            clearTimeout(this.timeout);
            this.autoplay.call(this);
          });
        }
      }
      autoplay() {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(() => {
          this.slider.next();
        }, this.sliderAutoplayTime);
      }
    }

    customElements.define("banner-slideshow", BannerSlideshow);
  }
}
