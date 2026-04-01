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
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  gsap.registerPlugin(ScrollTrigger);

  /* ── ELEMENT REFS ──────────────────────────────────────────── */
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
  window.addEventListener("resize", () => {
    VW = window.innerWidth;
    VH = window.innerHeight;
    ScrollTrigger.refresh();
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
      pkg1: { x: -80, y: -100, rotation: -28, scale: 1.0 },
      pkg2: { x: 80, y: -60, rotation: 28, scale: 0.92 },
    },
    p1: {
      pkg1: { x: -60, y: -120, rotation: -14, scale: 0.88, zIndex: 12 },
      pkg2: { x: 60, y: -75, rotation: 10, scale: 0.80, zIndex: 11 },
    },
    p2: {
      pkg2: { x: 40, y: -110, rotation: 5, scale: 0.92, zIndex: 12 },
      pkg1: { x: -40, y: -65, rotation: -18, scale: 0.76, zIndex: 11 },
    },
    p3: {
      pkg1: { x: -70, y: -90, rotation: -24, scale: 0.90, zIndex: 12 },
      pkg2: { x: 70, y: -55, rotation: 24, scale: 0.84, zIndex: 11 },
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
      pkg1: { x: "100%", y: "6%", rotation: -8, scale: 0.96, zIndex: 12 },
      pkg2: { x: "32%", y: "-4%", rotation: 8, scale: 0.88, zIndex: 11 },
    },
    p2: {
      pkg2: { x: "-50%", y: "-12%", rotation: 4, scale: 1.02, zIndex: 12 },
      pkg1: { x: "-100%", y: "14%", rotation: -12, scale: 1.01, zIndex: 11 },
    },
    p3: {
      pkg1: { x: -160, y: 240, rotation: -28, scale: 1.25, zIndex: 12 },
      pkg2: { x: 160, y: 270, rotation: 28, scale: 1.18, zIndex: 11 },
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
  gsap.set(bgCream, { opacity: 0 });  // starts hidden — green shows
  gsap.set(bgGreen, { opacity: 1 });  // green visible on load
  gsap.set(beat0, { opacity: 1 });  // hero text visible
  gsap.set(beat1, { opacity: 0, pointerEvents: "none" });
  gsap.set(beat2, { opacity: 0, pointerEvents: "none" });
  gsap.set(beat3, { opacity: 0, pointerEvents: "none" });
  gsap.set(canvas, { opacity: 1 });
  gsap.set(pat, { opacity: 1 });

  /* Packages: both start at center of canvas, criss-crossed, hidden.
     top:50%, left:50% from CSS + xPercent/yPercent -50 = true center.
     Seed positions differ for mobile vs desktop. */
  gsap.set(pkg1, {
    xPercent: -50, yPercent: -50,
    x: pkgPos.seed.pkg1.x,
    y: pkgPos.seed.pkg1.y,
    rotation: -22,
    scale: isMobile ? 0.85 : 0.9,
    zIndex: 12,
  });
  gsap.set(pkg2, {
    xPercent: -50, yPercent: -50,
    x: pkgPos.seed.pkg2.x,
    y: pkgPos.seed.pkg2.y,
    rotation: 22,
    scale: isMobile ? 0.80 : 0.85,
    zIndex: 11,
  });

  const entry = gsap.timeline({ delay: 0.1 });

  // Badge appears first
  entry
    .from("#beat-0 .hero-badge", { y: 24, opacity: 0, duration: 0.55, ease: "power3.out" }, 0)

    // Hero title characters stagger in
    .to(heroChars || [], {
      yPercent: 0, opacity: 1,
      duration: 0.75,
      stagger: 0.025,
      ease: "power3.out",
    }, 0.1)

    // Packages rise UP into criss-cross position
    .to(pkg1, { opacity: 1, ...pkgPos.entry.pkg1, duration: 1.1, ease: "power3.out" }, 0.15)
    .to(pkg2, { opacity: 1, ...pkgPos.entry.pkg2, duration: 1.1, ease: "power3.out" }, 0.3)

    .from(".hero-sub", { y: 20, opacity: 0, duration: 0.5, ease: "power3.out" }, 0.65)
    .from(".hero-cta-row", { y: 16, opacity: 0, duration: 0.45, ease: "power3.out" }, 0.82)
    .from(".scroll-hint", { opacity: 0, duration: 0.5 }, 1.05);

  /* ═════════════════════════════════════════════════════════════
     B) SCROLL-SCRUBBED MASTER TIMELINE
     ═════════════════════════════════════════════════════════════ */

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.6,
    }
  });

  /* ── Helper: a "hold" pause in the timeline so each phase
       has breathing room while the user scrubs ─────────────── */
  const HOLD = 0.5;

  /* ──────────────────────────────────────────────────────────────
     P1 — "What We Do"  (Beat 1)
     bg → cream, packages separate to both sides of center
     Beat 1 text appears on LEFT half
     ────────────────────────────────────────────────────────────*/
  const p1 = 0;

  // Fade beat-0 OUT while cream bg fades IN
  tl.to(beat0, { opacity: 0, duration: 0.4, ease: "power2.in" }, p1)
    .to(bgCream, { opacity: 1, duration: 0.8 }, p1)

    // Packages separate — positions differ mobile vs desktop
    .to(pkg1, { ...pkgPos.p1.pkg1, duration: 1.2, ease: "power2.inOut" }, p1)
    .to(pkg2, { ...pkgPos.p1.pkg2, duration: 1.2, ease: "power2.inOut" }, p1)

    // Beat 1 text in
    .to(beat1, { opacity: 1, pointerEvents: "auto", duration: 0.45 }, p1 + 0.55)
    .from("#beat-1 .beat-badge", { y: 22, opacity: 0, duration: 0.4 }, p1 + 0.65)
    .from("#beat-1 .beat-heading", { y: 30, opacity: 0, duration: 0.5 }, p1 + 0.75)
    .from("#beat-1 .beat-body", { y: 18, opacity: 0, duration: 0.4 }, p1 + 0.9)
    .from("#beat-1 .chip", { y: 14, opacity: 0, stagger: 0.09, duration: 0.35 }, p1 + 1.0)
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

  tl.to(beat1, { opacity: 0, pointerEvents: "none", duration: 0.35 }, p2)

    // Packages swap depth/position
    .to(pkg2, { ...pkgPos.p2.pkg2, duration: 1.2, ease: "power2.inOut" }, p2)
    .to(pkg1, { ...pkgPos.p2.pkg1, duration: 1.2, ease: "power2.inOut" }, p2)

    .to(beat2, { opacity: 1, pointerEvents: "auto", duration: 0.45 }, p2 + 0.55)
    .from("#beat-2 .beat-badge", { y: 22, opacity: 0, duration: 0.4 }, p2 + 0.65)
    .from("#beat-2 .beat-heading", { y: 30, opacity: 0, duration: 0.5 }, p2 + 0.75)
    .from("#beat-2 .beat-body", { y: 18, opacity: 0, duration: 0.4 }, p2 + 0.9)
    .from("#beat-2 .stat", { y: 14, opacity: 0, stagger: 0.1, duration: 0.35 }, p2 + 1.0)
    .to({}, { duration: HOLD });

  /* ──────────────────────────────────────────────────────────────
     P3 — "Meet the Flavors"  (Beat 3)
     Both packages re-converge to center in a dramatic criss-cross.
     Uses pixel values consistent with the entry animation system.
     ────────────────────────────────────────────────────────────*/
  const p3 = tl.duration();

  tl.to(beat2, { opacity: 0, pointerEvents: "none", duration: 0.35 }, p3)

    // Packages re-converge criss-cross
    .to(pkg1, { ...pkgPos.p3.pkg1, duration: 1.1, ease: "power2.inOut" }, p3)
    .to(pkg2, { ...pkgPos.p3.pkg2, duration: 1.1, ease: "power2.inOut" }, p3)

    .to(beat3, { opacity: 1, pointerEvents: "auto", duration: 0.45 }, p3 + 0.5)
    .from("#beat-3 .beat-badge", { y: 22, opacity: 0, duration: 0.4 }, p3 + 0.6)
    .from("#beat-3 .beat-heading", { y: 30, opacity: 0, duration: 0.5 }, p3 + 0.7)
    .from("#beat-3 .beat-body", { y: 18, opacity: 0, duration: 0.4 }, p3 + 0.85)
    .to({}, { duration: HOLD });

  /* ──────────────────────────────────────────────────────────────
     P4 — FINALE: Packages fly off canvas → products emerge below.
     Mobile uses smaller pixel values to stay in-bounds.
     ────────────────────────────────────────────────────────────*/
  const p4 = tl.duration();

  tl.to(beat3, { opacity: 0, pointerEvents: "none", duration: 0.3 }, p4)
    .to(pat, { opacity: 0, duration: 0.4 }, p4)

    // Both packages fly off — direction/distance from pkgPos config
    .to(pkg1, { ...pkgPos.p4.pkg1, duration: 1.5, ease: "power3.in" }, p4 + 0.1)
    .to(pkg2, { ...pkgPos.p4.pkg2, duration: 1.5, ease: "power3.in" }, p4 + 0.25)

    // Canvas fades out — products section emerges underneath
    .to(canvas, { opacity: 0, duration: 1.0, ease: "power2.inOut" }, p4 + 0.85);

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
      { scale: 0.5, rotation: -30, opacity: 0, y: 80 },
      {
        scale: 0.7, rotation: -10, opacity: 1, y: -40,
        duration: 1.0,
        ease: "back.out(1.6)",
        scrollTrigger: {
          trigger: "#card-pkg1",
          start: "top 82%",
          toggleActions: "play none none reverse",
        }
      }
    );
  }

  if (cardImg2) {
    gsap.fromTo(cardImg2,
      { scale: 0.5, rotation: 30, opacity: 0, y: 80 },
      {
        scale: 0.7, rotation: 10, opacity: 1, y: -40,
        duration: 1.0,
        delay: 0.15,
        ease: "back.out(1.6)",
        scrollTrigger: {
          trigger: "#card-pkg2",
          start: "top 82%",
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
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      gsap.to(card, {
        rotateX: -dy * 5, rotateY: dx * 5, scale: 1.025,
        duration: 0.4, ease: "power2.out",
        transformPerspective: 900,
      });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotateX: 0, rotateY: 0, scale: 1,
        duration: 0.6, ease: "elastic.out(1, 0.45)",
      });
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
      duration: 0.85,
      delay: Number(el.dataset.delay || 0),
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 87%",
        toggleActions: "play none none reverse",
      }
    });
  });

  // Zoom-in elements
  document.querySelectorAll("[data-animate='zoom-in']").forEach(el => {
    gsap.from(el, {
      scale: 0.9, opacity: 0, duration: 1.0,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 87%",
        toggleActions: "play none none reverse",
      }
    });
  });

  // SplitType headings
  document.querySelectorAll("[data-split='true']").forEach(el => {
    const split = new SplitType(el, { types: "chars", tagName: "span" });
    gsap.from(split.chars, {
      yPercent: 110, opacity: 0,
      duration: 0.7,
      stagger: 0.028,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 87%",
        toggleActions: "play none none reverse",
      }
    });
  });

  // Benefit blocks stagger
  document.querySelectorAll(".benefit-block").forEach((el, i) => {
    gsap.from(el, {
      y: 30, opacity: 0, duration: 0.7,
      delay: i * 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none reverse",
      }
    });
  });

  // Parallax on non-journey images
  document.querySelectorAll(".img-wrapper img:not(.card-pkg-img):not(.journey-pkg)").forEach(img => {
    gsap.to(img, {
      yPercent: 12, ease: "none",
      scrollTrigger: {
        trigger: img.parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
  });
}
