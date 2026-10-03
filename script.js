(() => {
  "use strict";

  const FRAME_COUNT = 215;
  const FRAME_PATH = (i) => `frames/frame_${String(i).padStart(4, "0")}.jpg`;

  const canvas = document.getElementById("mixerCanvas");
  const ctx = canvas.getContext("2d");
  const heroSection = document.getElementById("hero");
  const heroCopy = document.querySelector(".hero-copy");
  const heroCopyEnd = document.querySelector(".hero-copy-end");
  const scrollCue = document.querySelector(".scroll-cue");
  const dialFill = document.getElementById("dialFill");
  const dialDeg = document.getElementById("dialDeg");
  const preloader = document.getElementById("preloader");
  const preloaderBar = document.getElementById("preloaderBar");
  const preloaderPct = document.getElementById("preloaderPct");

  const DIAL_CIRCUMFERENCE = 326.7; // 2 * PI * 52

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let currentFrame = 1;
  let renderedFrame = -1;

  function updatePreloader() {
    const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
    preloaderBar.style.width = pct + "%";
    preloaderPct.textContent = pct + "%";
    if (loadedCount >= FRAME_COUNT) {
      preloader.classList.add("hidden");
      resizeCanvas();
      drawFrame(1);
      requestAnimationFrame(loop);
    }
  }

  function preloadImages() {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        loadedCount++;
        updatePreloader();
      };
      img.src = FRAME_PATH(i);
      images[i - 1] = img;
    }
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFrame(index) {
    const img = images[index - 1];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // cover-fit
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function getHeroProgress() {
    const rect = heroSection.getBoundingClientRect();
    const total = heroSection.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    const scrolled = -rect.top;
    return Math.min(1, Math.max(0, scrolled / total));
  }

  function updateDial(progress) {
    const deg = Math.round(progress * 360);
    dialDeg.textContent = deg + "\u00B0";
    const offset = DIAL_CIRCUMFERENCE * (1 - progress);
    dialFill.style.strokeDashoffset = offset;
  }

  function updateCopy(progress) {
    // fade opening copy out over first 12% of scroll
    const outOpacity = Math.max(0, 1 - progress / 0.12);
    heroCopy.style.opacity = outOpacity;
    heroCopy.style.transform = `translateY(${(1 - outOpacity) * -16}px)`;

    // fade closing copy in over last 18% of scroll
    const inStart = 0.82;
    const inOpacity = progress > inStart ? Math.min(1, (progress - inStart) / 0.16) : 0;
    heroCopyEnd.style.opacity = inOpacity;
    heroCopyEnd.style.transform = `translateY(${(1 - inOpacity) * 16}px)`;

    // hide scroll cue after first movement
    scrollCue.style.opacity = progress > 0.03 ? 0 : 0.75;
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const progress = getHeroProgress();
        currentFrame = Math.min(
          FRAME_COUNT,
          Math.max(1, Math.round(progress * (FRAME_COUNT - 1)) + 1)
        );
        updateDial(progress);
        updateCopy(progress);
        ticking = false;
      });
      ticking = true;
    }
  }

  function loop() {
    if (renderedFrame !== currentFrame) {
      drawFrame(currentFrame);
      renderedFrame = currentFrame;
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    resizeCanvas();
    renderedFrame = -1;
  });

  if (reduceMotion) {
    // Skip the pinned scrub entirely; show a single representative frame
    heroSection.style.height = "100vh";
    document.querySelector(".dial").style.display = "none";
    scrollCue.style.display = "none";
  }

  preloadImages();
})();
