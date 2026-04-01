/* ============================================================
   GLEN HARVEST — Grand Journey Scroll Animation v3
   ============================================================

   Architecture:
   ─────────────────────────────────────────────────────────────
   A) ENTRY ANIMATION  — runs IMMEDIATELY on page load (no scroll).
      Packages rise criss-cross into center. Hero text fades in.

   B) SCROLL-SCRUBBED TIMELINE  — controls everything after Beat 0
      is fully visible. Uses ScrollTrigger scrub on #journey-scroll-track.
      Phases:
        P1 (0→25%)  : Hero fades → Beat1 "What We Do" + pkgs separate
        P2 (25→50%) : Beat1 → Beat2 "Why Trust" + pkgs swap depth
        P3 (50→70%) : Beat2 → Beat3 "Meet Flavors" + pkgs re-center
        P4 (70→100%): Beat3 out → pkgs fly off canvas down → canvas fades

   C) CARD IMAGES  — `.card-pkg-img` start opacity:0, scale:0.6.
      Own ScrollTrigger fires when product section enters viewport,
      making it look like the packages "landed" in the cards.
   ──────────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {

  /* ── LENIS ─────────────────────────────────────────────────── */
  const lenis = new Lenis({
    duration: 1.25,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
    orientation: "vertical"
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  gsap.registerPlugin(ScrollTrigger);

  /* ── ELEMENT REFS ──────────────────────────────────────────── */
  const navElement = document.querySelector('nav');
  if (navElement) {
    initNavbar(navElement);
  }
  const track = document.getElementById("journey-scroll-track");
  const canvas = document.getElementById("journey-canvas");
  const pkg1 = document.getElementById("pkg1");
  const pkg2 = document.getElementById("pkg2");
  const bgGreen = document.getElementById("bg-green");
  const bgCream = document.getElementById("bg-cream");
  const pat = document.getElementById("journey-pattern");
  const beat0 = document.getElementById("beat-0");
  const beat1 = document.getElementById("beat-1");
  const beat2 = document.getElementById("beat-2");
  const beat3 = document.getElementById("beat-3");

  if (!track) {
    // not on home page — run generic animations only
    initGeneric(); return;
  }

  /* ── VIEWPORT ──────────────────────────────────────────────── */
  let VW = window.innerWidth;
  let VH = window.innerHeight;
  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    VW = window.innerWidth;
    VH = window.innerHeight;
    if (resizeRaf) {
      cancelAnimationFrame(resizeRaf);
    }
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      ScrollTrigger.refresh();
    });
  });

  /* ── RESPONSIVE POSITION CONFIG ───────────────────────────────
     On desktop: packages shift left/right so text occupies one side.
     On mobile:  packages stay vertically centered (upper half) and
                 text is anchored to the bottom of the canvas via CSS.
                 x values are kept small so packages never exit the screen.
  ────────────────────────────────────────────────────────────── */
  const isMobile = VW <= 640;

  const pkgPos = isMobile ? {
    // ── MOBILE ── packages float in upper half (negative y = above center)
    seed: {
      pkg1: { x: -50, y: 60 },   // start: slightly below upper area
      pkg2: { x: 50, y: 90 },
    },
    entry: {
      pkg1: { x: -80, y: 250, rotation: -28, scale: 1.0 },
      pkg2: { x: 80, y: 150, rotation: 28, scale: 0.92 },
    },
    p1: {
      pkg1: { x: -60, y: 220, rotation: 20, scale: 0.9 },
      pkg2: { x: 60, y: 100, rotation: -28, scale: 0.80 },
    },
    p2: {
      pkg2: { x: 40, y: 200, rotation: 5, scale: 0.92 },
      pkg1: { x: -40, y: 165, rotation: -18, scale: 0.76 },
    },
    p3: {
      pkg1: { x: -70, y: -90, rotation: -24, scale: 1.2 },
      pkg2: { x: 70, y: -55, rotation: 24, scale: 1.84 },
    },
    p4: {
      pkg1: { x: -280, y: 600, rotation: -50, scale: 0.35, opacity: 0 },
      pkg2: { x: 280, y: 650, rotation: 50, scale: 0.35, opacity: 0 },
    },
  } : {
    // ── DESKTOP ── packages shift wide left/right alongside text
    seed: {
      pkg1: { x: 0, y: 180 },
      pkg2: { x: 0, y: 220 },
    },
    entry: {
      pkg1: { x: -300, y: 300, rotation: -36, scale: 1.3 },
      pkg2: { x: 300, y: 300, rotation: 36, scale: 1.3 },
    },
    p1: {
      pkg1: { x: "100%", y: "6%", rotation: -8, scale: 0.96 },
      pkg2: { x: "32%", y: "-4%", rotation: 8, scale: 0.88 },
    },
    p2: {
      pkg2: { x: "-50%", y: "-12%", rotation: 4, scale: 1.02 },
      pkg1: { x: "-100%", y: "14%", rotation: -12, scale: 1.01 },
    },
    p3: {
      pkg1: { x: -160, y: 240, rotation: -28, scale: 1.25 },
      pkg2: { x: 160, y: 270, rotation: 28, scale: 1.18 },
    },
    p4: {
      pkg1: { x: -700, y: 900, rotation: -50, scale: 0.4, opacity: 0 },
      pkg2: { x: 700, y: 950, rotation: 50, scale: 0.4, opacity: 0 },
    },
  };

  /* ═════════════════════════════════════════════════════════════
     A) ENTRY ANIMATION — fires immediately, no scroll required
     ═════════════════════════════════════════════════════════════ */

  // Split hero title into chars
  const heroTitle = document.getElementById("hero-main-title");
  let heroChars = null;
  if (heroTitle) {
    const split = new SplitType(heroTitle, { types: "chars", tagName: "span" });
    heroChars = split.chars;
    gsap.set(heroChars, { yPercent: 110, opacity: 0 });
  }

  // CRITICAL: force correct initial states before any scroll
  gsap.set(bgCream, { opacity: 0, force3D: true });  // starts hidden — green shows
  gsap.set(bgGreen, { opacity: 1, force3D: true });  // green visible on load
  gsap.set(beat0, { opacity: 1, force3D: true });  // hero text visible
  gsap.set(beat1, { autoAlpha: 0, force3D: true });
  gsap.set(beat2, { autoAlpha: 0, force3D: true });
  gsap.set(beat3, { autoAlpha: 0, force3D: true });
  gsap.set(canvas, { opacity: 1, force3D: true });
  gsap.set(pat, { opacity: 1, force3D: true });

  /* Packages: both start at center of canvas, criss-crossed, hidden.
     top:50%, left:50% from CSS + xPercent/yPercent -50 = true center.
     Seed positions differ for mobile vs desktop. */
  gsap.set(pkg1, {
    xPercent: -50, yPercent: -50,
    x: pkgPos.seed.pkg1.x,
    y: pkgPos.seed.pkg1.y,
    rotation: -22,
    scale: isMobile ? 0.85 : 0.9,
    zIndex: 8,
    force3D: true,
  });
  gsap.set(pkg2, {
    xPercent: -50, yPercent: -50,
    x: pkgPos.seed.pkg2.x,
    y: pkgPos.seed.pkg2.y,
    rotation: 22,
    scale: isMobile ? 0.80 : 0.85,
    zIndex: 6,
    force3D: true,
  });

  const entry = gsap.timeline({ delay: 0.1 });

  // Badge appears first
  entry
    .from("#beat-0 .hero-badge", { y: 24, opacity: 0, duration: 0.55, ease: "power2.out" }, 0)

    // Hero title characters stagger in
    .to(heroChars || [], {
      yPercent: 0, opacity: 1,
      duration: 0.85,
      stagger: 0.028,
      ease: "power2.out",
    }, 0.1)

    // Packages rise UP into criss-cross position
    .to(pkg1, { opacity: 1, ...pkgPos.entry.pkg1, duration: 1.3, ease: "power2.inOut" }, 0.15)
    .to(pkg2, { opacity: 1, ...pkgPos.entry.pkg2, duration: 1.3, ease: "power2.inOut" }, 0.3)

    .from(".hero-sub", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" }, 0.65)
    .from(".hero-cta-row", { y: 16, opacity: 0, duration: 0.55, ease: "power2.out" }, 0.82)
    .from(".scroll-hint", { opacity: 0, duration: 0.6 }, 1.05);

  /* ═════════════════════════════════════════════════════════════
     BREATHING ANIMATION — active when no scroll + at hero
     ═════════════════════════════════════════════════════════════ */
  let breatheTl = null;
  let breatheDelay = null;

  function createBreathing() {
    if (breatheTl) return;
    // Timeline: breathe up/down in a continuous loop
    breatheTl = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
    breatheTl
      .to([pkg1, pkg2], { y: "-=10", duration: 1.8, ease: "sine.inOut" }, 0);
  }

  // Activate after entry animation completes (~1.6s)
  breatheDelay = setTimeout(() => {
    createBreathing();
    breatheTl.play(0);
  }, 1600);

  // Stop breathing when scrolling past hero, resume when back
  let breathScrollPaused = false;
  window.addEventListener('scroll', () => {
    if (window.scrollY >= 100 && !breathScrollPaused && breatheTl) {
      clearTimeout(breatheDelay);
      breathScrollPaused = true;
      breatheTl.pause();
    } else if (window.scrollY < 100 && breathScrollPaused && breatheTl) {
      breatheDelay = setTimeout(() => {
        breathScrollPaused = false;
        breatheTl.play();
      }, 800);
    } else if (window.scrollY >= 100) {
      clearTimeout(breatheDelay);
    }
  }, { passive: true });

  /* ═════════════════════════════════════════════════════════════
     B) SCROLL-SCRUBBED MASTER TIMELINE
     ═════════════════════════════════════════════════════════════ */

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.6,
      smooth: true,
      anticipatePin: true,
      invalidateOnRefresh: true,
    }
  });

  /* ── Helper: a "hold" pause in the timeline so each phase
       has breathing room while the user scrubs ─────────────── */
  const HOLD = 0.65;

  /* ──────────────────────────────────────────────────────────────
     P1 — "What We Do"  (Beat 1)
     bg → cream, packages separate to both sides of center
     Beat 1 text appears on LEFT half
     ────────────────────────────────────────────────────────────*/
  const p1 = 0;

  // Fade beat-0 OUT while cream bg fades IN
  tl.to(beat0, { opacity: 0, duration: 0.5, ease: "power1.inOut" }, p1)
    .to(bgCream, { opacity: 1, duration: 0.9, ease: "power2.out" }, p1)

    // Packages separate — positions differ mobile vs desktop
    .to(pkg1, { ...pkgPos.p1.pkg1, duration: 1.4, ease: "power2.inOut" }, p1)
    .to(pkg2, { ...pkgPos.p1.pkg2, duration: 1.4, ease: "power2.inOut" }, p1)

    // Beat 1 text in
    .to(beat1, { autoAlpha: 1, duration: 0.5 }, p1 + 0.6)
    .fromTo("#beat-1 .beat-badge", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, p1 + 0.7)
    .fromTo("#beat-1 .beat-heading", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" }, p1 + 0.8)
    .fromTo("#beat-1 .beat-body", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, p1 + 0.95)
    .fromTo("#beat-1 .chip", { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, ease: "power2.out" }, p1 + 1.05)
    .to({}, { duration: HOLD });  // HOLD

  /* ──────────────────────────────────────────────────────────────
     NOTE ON COORDINATE SYSTEM:
     The user has established a pixel-based system where x/y are
     GSAP transform offsets from the centered starting position.
     Entry: pkg1 lands at x:-300,y:300 | pkg2 at x:300,y:300
     P1   : pkg1 goes x≈400,y≈30  | pkg2 goes x≈130,y≈-15
     P2   : pkg2 goes x≈-200,y≈-50 | pkg1 goes x≈-400,y≈55
     P3   : re-criss-cross center  | P4: fly off screen
     ────────────────────────────────────────────────────────────*/

  /* ──────────────────────────────────────────────────────────────
     P2 — "Why Trust Us"  (Beat 2)
     Packages swap: pkg2 becomes foreground dominant
     ────────────────────────────────────────────────────────────*/
  const p2 = tl.duration(); // continues from where P1 ends

  tl.to(beat1, { autoAlpha: 0, duration: 0.45, ease: "power1.inOut" }, p2)

    // Packages swap depth/position
    .to(pkg2, { ...pkgPos.p2.pkg2, duration: 1.5, ease: "power2.inOut" }, p2)
    .to(pkg1, { ...pkgPos.p2.pkg1, duration: 1.5, ease: "power2.inOut" }, p2)

    .to(beat2, { autoAlpha: 1, duration: 0.5 }, p2 + 0.6)
    .fromTo("#beat-2 .beat-badge", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, p2 + 0.7)
    .fromTo("#beat-2 .beat-heading", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" }, p2 + 0.8)
    .fromTo("#beat-2 .beat-body", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, p2 + 0.95)
    .fromTo("#beat-2 .stat", { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.4, ease: "power2.out" }, p2 + 1.05)
    .to({}, { duration: HOLD });

  /* ──────────────────────────────────────────────────────────────
     P3 — "Meet the Flavors"  (Beat 3)
     Both packages re-converge to center in a dramatic criss-cross.
     Uses pixel values consistent with the entry animation system.
     ────────────────────────────────────────────────────────────*/
  const p3 = tl.duration();

  tl.to(beat2, { autoAlpha: 0, duration: 0.45, ease: "power1.inOut" }, p3)

    // Packages re-converge criss-cross
    .to(pkg1, { ...pkgPos.p3.pkg1, duration: 1.4, ease: "power2.inOut" }, p3)
    .to(pkg2, { ...pkgPos.p3.pkg2, duration: 1.4, ease: "power2.inOut" }, p3)

    .to(beat3, { autoAlpha: 1, duration: 0.5 }, p3 + 0.55)
    .fromTo("#beat-3 .beat-badge", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, p3 + 0.65)
    .fromTo("#beat-3 .beat-heading", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" }, p3 + 0.75)
    .fromTo("#beat-3 .beat-body", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, p3 + 0.9)
    .to({}, { duration: HOLD });

  /* ──────────────────────────────────────────────────────────────
     P4 — FINALE: Packages fly off canvas → products emerge below.
     Mobile uses smaller pixel values to stay in-bounds.
     ────────────────────────────────────────────────────────────*/
  const p4 = tl.duration();

  tl.to(beat3, { autoAlpha: 0, duration: 0.4, ease: "power1.inOut" }, p4)
    .to(pat, { opacity: 0, duration: 0.5, ease: "power2.in" }, p4)

    // Both packages fly off — direction/distance from pkgPos config
    .to(pkg1, { ...pkgPos.p4.pkg1, duration: 1.8, ease: "power3.in" }, p4 + 0.1)
    .to(pkg2, { ...pkgPos.p4.pkg2, duration: 1.8, ease: "power3.in" }, p4 + 0.15)

    // Canvas fades out — products section emerges underneath
    .to(canvas, { opacity: 0, duration: 1.2, ease: "power2.inOut" }, p4 + 0.9);

  /* ═════════════════════════════════════════════════════════════
     C) PRODUCT CARD IMAGES — the "landing" effect
     Fires when the products section scrolls into view AFTER
     the journey canvas has faded. Packages emerge from nothing
     inside their cards — making it look they just landed there.
     ═════════════════════════════════════════════════════════════ */

  const cardImg1 = document.getElementById("card-img-pkg1");
  const cardImg2 = document.getElementById("card-img-pkg2");

  if (cardImg1) {
    gsap.fromTo(cardImg1,
      { scale: 0.5, rotation: -30, opacity: 0, y: 80, force3D: true },
      {
        scale: 0.7, rotation: -10, opacity: 1, y: -40,
        duration: 1.2,
        ease: "back.out(1.4)",
        overwrite: "auto",
        force3D: true,
        scrollTrigger: {
          trigger: "#card-pkg1",
          start: "top 85%",
          toggleActions: "play none none reverse",
        }
      }
    );
  }

  if (cardImg2) {
    gsap.fromTo(cardImg2,
      { scale: 0.5, rotation: 30, opacity: 0, y: 80, force3D: true },
      {
        scale: 0.7, rotation: 10, opacity: 1, y: -40,
        duration: 1.2,
        delay: 0.2,
        ease: "back.out(1.4)",
        overwrite: "auto",
        force3D: true,
        scrollTrigger: {
          trigger: "#card-pkg2",
          start: "top 85%",
          toggleActions: "play none none reverse",
        }
      }
    );
  }

  /* ═════════════════════════════════════════════════════════════
     D) GENERIC SCROLL ANIMATIONS (all pages)
     ═════════════════════════════════════════════════════════════ */
  initGeneric();

  /* ── Flavor card 3D hover tilt ────────────────────────────── */
  document.querySelectorAll(".flavor-card").forEach(card => {
    gsap.set(card, {
      transformPerspective: 1000,
      transformStyle: "preserve-3d",
      force3D: true
    });

    const tiltX = gsap.quickTo(card, "rotateX", {
      duration: 0.45,
      ease: "power2.out"
    });
    const tiltY = gsap.quickTo(card, "rotateY", {
      duration: 0.45,
      ease: "power2.out"
    });
    const tiltScale = gsap.quickTo(card, "scale", {
      duration: 0.45,
      ease: "power2.out"
    });

    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      tiltX(-dy * 4);
      tiltY(dx * 4);
      tiltScale(1.02);
    });
    card.addEventListener("mouseleave", () => {
      tiltX(0);
      tiltY(0);
      tiltScale(1);
    });
  });

}); // end DOMContentLoaded


/* ─────────────────────────────────────────────────────────────
   GENERIC ANIMATIONS — runs on every page
   ───────────────────────────────────────────────────────────── */
function initGeneric() {
  gsap.registerPlugin(ScrollTrigger);

  // Fade-up elements
  document.querySelectorAll("[data-animate='fade-up']").forEach(el => {
    gsap.from(el, {
      y: 40, opacity: 0,
      duration: 1.0,
      delay: Number(el.dataset.delay || 0),
      ease: "power2.out",
      force3D: true,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none reverse",
      }
    });
  });

  // Zoom-in elements
  document.querySelectorAll("[data-animate='zoom-in']").forEach(el => {
    gsap.from(el, {
      scale: 0.9, opacity: 0, duration: 1.1,
      ease: "power2.out",
      force3D: true,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none reverse",
      }
    });
  });

  // SplitType headings
  document.querySelectorAll("[data-split='true']").forEach(el => {
    const split = new SplitType(el, { types: "chars", tagName: "span" });
    gsap.from(split.chars, {
      yPercent: 110, opacity: 0,
      duration: 0.8,
      stagger: 0.03,
      ease: "power2.out",
      force3D: true,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none reverse",
      }
    });
  });

  // Benefit blocks stagger
  document.querySelectorAll(".benefit-block").forEach((el, i) => {
    gsap.from(el, {
      y: 30, opacity: 0, duration: 0.8,
      delay: i * 0.12,
      ease: "power2.out",
      force3D: true,
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none reverse",
      }
    });
  });

  // Parallax on non-journey images
  document.querySelectorAll(".img-wrapper img:not(.card-pkg-img):not(.journey-pkg)").forEach(img => {
    gsap.to(img, {
      yPercent: 10, ease: "none",
      scrollTrigger: {
        trigger: img.parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.5,
      }
    });
  });

  // Interactive pattern dots
  const overlays = document.querySelectorAll('.pattern-overlay');
  if (overlays.length > 0) {
    let overlayMouseX = 0;
    let overlayMouseY = 0;
    let overlayFrame = 0;

    const syncOverlayPointer = () => {
      overlayFrame = 0;
      overlays.forEach(overlay => {
        const rect = overlay.getBoundingClientRect();
        overlay.style.setProperty('--mouse-x', `${overlayMouseX - rect.left}px`);
        overlay.style.setProperty('--mouse-y', `${overlayMouseY - rect.top}px`);
        if (!overlay.classList.contains('mouse-active')) {
          overlay.classList.add('mouse-active');
        }
      });
    };

    window.addEventListener('mousemove', (e) => {
      overlayMouseX = e.clientX;
      overlayMouseY = e.clientY;
      if (!overlayFrame) {
        overlayFrame = requestAnimationFrame(syncOverlayPointer);
      }
    }, { passive: true });
  }
}

/* ─────────────────────────────────────────────────────────────
   NAVBAR — entrance + microinteractions
   Runs on every page as soon as DOMContentLoaded fires.
   ───────────────────────────────────────────────────────────── */
function initNavbar(nav) {
  if (!nav) return;

  const isMobileNav = window.innerWidth <= 768;

  /*
   * KEY FIX: Set the initial state via GSAP so it owns the FULL transform.
   * CSS had `left:50%` but NO transform — GSAP now handles xPercent:-50
   * (which equals translateX(-50%)) AND y:20 together.
   * This prevents any subsequent gsap.to({ y }) call from wiping xPercent.
   */
  gsap.set(nav, { xPercent: -50, y: 20, opacity: 0, force3D: true });

  /* Slide in — spring ease for premium feel */
  gsap.to(nav, {
    opacity: 1,
    y: 0,
    duration: 1.0,
    delay: 0.4,
    ease: 'power2.out',
  });

  /* Stagger nav links after the bar appears */
  const links = nav.querySelectorAll('.nav-link');
  if (links.length) {
    gsap.from(links, {
      opacity: 0,
      y: isMobileNav ? -8 : 8,
      duration: 0.55,
      stagger: 0.08,
      delay: 0.8,
      ease: 'power2.out',
      force3D: true,
    });
  }

  /* CTA button pops in last */
  const cta = nav.querySelector('.nav-cta');
  if (cta) {
    gsap.from(cta, {
      opacity: 0,
      scale: 0.85,
      duration: 0.6,
      delay: 1.1,
      ease: 'back.out(1.5)',
      force3D: true,
    });
  }

  /* Scroll hide/show — always include xPercent so centering is preserved */
  let lastScroll = 0;
  let navHidden = false;
  let scrollTicking = false;
  const setNavY = gsap.quickTo(nav, "y", { duration: 0.4, ease: "power2.out" });

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;

    requestAnimationFrame(() => {
      scrollTicking = false;

      const sy = window.scrollY;
      const shouldHide = sy > 80 && sy > lastScroll;

      if (shouldHide !== navHidden) {
        navHidden = shouldHide;
        setNavY(shouldHide ? -100 : 0);
      }

      lastScroll = sy;
    });
  }, { passive: true });
}

