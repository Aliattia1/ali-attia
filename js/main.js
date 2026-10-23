// Ali Attia · AA Design Studio
// Motion follows the references in "a website/motion" and "a website/reference":
//  - loader: the AA monogram draws itself, then the screen splits open
//  - hero: a strip of thumbnails; the active one grows to become the full-screen image
//  - interiors: images on a 3D ring that turns with scroll and drag
//  - Swiss Heights: panels that fold open as they pass the centre
//  - text rises word by word, images are revealed with a wipe

// Change the handle or link here and every Instagram reference on the page follows.
const INSTAGRAM = { handle: "@ali.attia.design", url: "https://www.instagram.com/ali.attia.design/" };

(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = (fn) => { try { return fn(); } catch (e) { return null; } };

  /* Instagram + footer year */
  $$("[data-ig-handle]").forEach((el) => { el.textContent = INSTAGRAM.handle; });
  $$("[data-ig-link]").forEach((el) => { el.href = INSTAGRAM.url; });
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* Split headings and paragraphs into words so they can rise one by one */
  let wordIndex = 0;
  const splitWords = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement("span");
          const inner = document.createElement("span");
          w.className = "w";
          inner.style.setProperty("--i", wordIndex++);
          inner.textContent = part;
          w.appendChild(inner);
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== "BDI") {
        splitWords(child);
      }
    });
  };
  $$(".reveal-text").forEach((el) => { wordIndex = 0; splitWords(el); });

  /* Reveal on scroll */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); revealer.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
  $$(".reveal, .reveal-up, .reveal-text").forEach((el) => revealer.observe(el));

  /* Loader */
  const loader = $(".loader");
  const hero = $(".hero");
  const startHero = () => requestAnimationFrame(() => hero.classList.add("is-in"));
  const seen = root.classList.contains("intro-seen");
  if (!loader || seen || reduced) {
    if (loader) loader.classList.add("is-done");
    startHero();
  } else {
    const t0 = performance.now();
    const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
    loader.classList.add("is-waiting");
    fontsReady.then(() => {
      loader.classList.add("go");
      const wait = Math.max(0, 2500 - (performance.now() - t0));
      setTimeout(() => {
        loader.classList.add("is-open");
        startHero();
        store(() => sessionStorage.setItem("intro-seen", "1"));
        setTimeout(() => loader.classList.add("is-done"), 1200);
      }, wait);
    });
  }

  /* Nav background after scrolling */
  const nav = $(".nav");

  /* Menu */
  const menu = $("#menu");
  const menuBtn = $(".nav__menu");
  const menuImgs = $$(".menu__media img");
  const showMenuImg = (key) => menuImgs.forEach((img) => img.classList.toggle("is-on", img.dataset.for === key));
  const openMenu = () => {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add("is-open"));
    document.body.classList.add("is-locked", "menu-open");
    menuBtn.setAttribute("aria-expanded", "true");
    showMenuImg("foldtown");
    setTimeout(() => $("a", menu).focus(), 300);
  };
  const closeMenu = (focusBtn = true) => {
    menu.classList.remove("is-open");
    document.body.classList.remove("is-locked", "menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 900);
    if (focusBtn) menuBtn.focus();
  };
  menuBtn.addEventListener("click", () => (menu.classList.contains("is-open") ? closeMenu() : openMenu()));
  $$(".menu__list a").forEach((a) => {
    a.addEventListener("mouseenter", () => showMenuImg(a.dataset.key));
    a.addEventListener("focus", () => showMenuImg(a.dataset.key));
    a.addEventListener("click", () => closeMenu(false));
  });

  /* Hero: thumbnail strip that grows into the full-screen image */
  const items = $$(".strip__item");
  const bgs = $$(".hero__bg");
  const track = $(".strip__track");
  const strip = $(".strip");
  const meta = $(".hero__meta");
  const count = $(".hero__count");
  const bar = $(".hero__bar span");
  const DURATION = 6000;
  let current = 0, busy = false, barAnim = null, heroVisible = true;

  // Reads thumbnail sizes from a hidden probe so they're right even mid-transition
  const probe = document.createElement("span");
  probe.className = "strip__item is-active";
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:absolute;visibility:hidden;transition:none";
  track.appendChild(probe);
  const activeSize = () => ({ aw: probe.offsetWidth, ah: probe.offsetHeight });
  const inactiveW = () => { probe.classList.remove("is-active"); const w = probe.offsetWidth; probe.classList.add("is-active"); return w; };

  const centreStrip = (i) => {
    const { aw } = activeSize();
    const w = inactiveW();
    const gap = parseFloat(getComputedStyle(track).columnGap) || 8;
    const x = window.innerWidth / 2 - (i * (w + gap) + aw / 2);
    track.style.transform = `translate3d(${x}px,0,0)`;
  };

  const setMeta = (i) => {
    const d = items[i].dataset;
    meta.classList.add("is-swapping");
    setTimeout(() => {
      $(".hero__code", meta).textContent = d.code;
      $(".hero__project", meta).textContent = d.project;
      $(".hero__caption", meta).textContent = d.caption;
      $(".hero__place", meta).textContent = d.place;
      meta.classList.remove("is-swapping");
    }, reduced ? 0 : 380);
    count.textContent = String(i + 1).padStart(2, "0");
  };

  const runBar = () => {
    if (reduced) return;
    if (barAnim) barAnim.cancel();
    barAnim = bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: DURATION, easing: "linear", fill: "forwards" });
    barAnim.onfinish = () => goTo(current + 1);
    if (!heroVisible || document.hidden) barAnim.pause();
  };

  const goTo = (n) => {
    n = (n + items.length) % items.length;
    if (busy || n === current) return;
    busy = true;
    const prev = current;
    current = n;
    items.forEach((it, k) => it.classList.toggle("is-active", k === n));
    centreStrip(n);
    setMeta(n);

    const next = bgs[n];
    if (reduced) {
      bgs[prev].classList.remove("is-active");
      next.classList.add("is-active");
      busy = false;
      return;
    }
    // The new image starts exactly where the active thumbnail sits, then opens to full screen
    const hb = hero.getBoundingClientRect();
    const sb = strip.getBoundingClientRect();
    const { aw, ah } = activeSize();
    const left = hb.width / 2 - aw / 2, top = sb.top - hb.top;
    const from = `inset(${top}px ${hb.width - left - aw}px ${hb.height - top - ah}px ${left}px)`;
    next.classList.add("is-entering");
    const a = next.animate(
      [{ clipPath: from, transform: "scale(1.18)" }, { clipPath: "inset(0px 0px 0px 0px)", transform: "scale(1)" }],
      { duration: 1400, easing: "cubic-bezier(.77,0,.175,1)" }
    );
    bgs[prev].animate([{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(1.06)", filter: "brightness(.45)" }], { duration: 1400, easing: "cubic-bezier(.77,0,.175,1)" });
    a.onfinish = () => {
      bgs[prev].classList.remove("is-active");
      next.classList.add("is-active");
      next.classList.remove("is-entering");
      busy = false;
    };
    runBar();
  };

  items.forEach((it, k) => it.addEventListener("click", () => goTo(k)));
  hero.addEventListener("keydown", (e) => {
    if (e.target.closest(".strip") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      goTo(current + (e.key === "ArrowRight" ? 1 : -1));
      items[current].focus();
    }
  });
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    if (!barAnim) return;
    heroVisible && !document.hidden ? barAnim.play() : barAnim.pause();
  }, { threshold: 0.2 }).observe(hero);
  document.addEventListener("visibilitychange", () => {
    if (!barAnim) return;
    document.hidden || !heroVisible ? barAnim.pause() : barAnim.play();
  });
  centreStrip(0);
  requestAnimationFrame(() => track.classList.add("is-ready"));
  runBar();

  /* Project index: an image follows the cursor */
  const preview = $(".pindex__preview");
  const previewImg = $("img", preview);
  let px = 0, py = 0, tx = 0, ty = 0;
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".pindex a").forEach((a) => {
      a.addEventListener("mouseenter", () => { previewImg.src = a.dataset.img; preview.classList.add("is-on"); });
      a.addEventListener("mouseleave", () => preview.classList.remove("is-on"));
    });
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  }

  /* 3D ring */
  const ringSec = $(".ring-sec");
  const stage = $(".ring-stage");
  const ring = $(".ring");
  const ringItems = $$(".ring__item");
  let radius = 0, drag = 0, vel = 0, dragging = false, lastX = 0, moved = 0, drift = 0;
  const layoutRing = () => {
    const rw = clamp(window.innerWidth * (window.innerWidth < 760 ? 0.44 : 0.17), 150, 260);
    ring.style.setProperty("--rw", rw + "px");
    const n = ringItems.length;
    radius = (rw / 2) / Math.tan(Math.PI / n) * 1.18;
    ringItems.forEach((it, i) => { it.style.transform = `rotateY(${(360 / n) * i}deg) translateZ(${radius}px)`; });
  };
  layoutRing();
  stage.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; lastX = e.clientX; vel = 0;
    stage.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX; moved += Math.abs(dx);
    vel = dx * 0.25; drag += vel;
  }, { passive: true });
  window.addEventListener("pointerup", () => { dragging = false; stage.classList.remove("is-dragging"); });
  // A drag shouldn't open the lightbox
  stage.addEventListener("click", (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } }, true);

  /* Folding panels */
  const flowSec = $(".flow-sec");
  const flow = $(".flow");
  const flowItems = $$(".flow__item");
  const flowStage = $(".flow-stage");

  /* Smooth scrolling */
  const lenis = !reduced && window.Lenis ? new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9 }) : null;
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const target = a.getAttribute("href") === "#top" ? 0 : $(a.getAttribute("href"));
    if (!lenis || target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  }));
  const pauseScroll = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); };
  menuBtn.addEventListener("click", () => pauseScroll(menuBtn.getAttribute("aria-expanded") === "true"));
  $$(".menu__list a").forEach((a) => a.addEventListener("click", () => pauseScroll(false)));

  /* Text bands and the site-photo strip: duplicated so they loop seamlessly */
  const loops = $$(".marquee__track, .shell__track").map((track) => {
    track.append(...[...track.children].map((c) => { const k = c.cloneNode(true); k.setAttribute("aria-hidden", "true"); if (k.tagName === "IMG") k.alt = ""; return k; }));
    return { track, x: 0, speed: track.classList.contains("shell__track") ? 0.035 : 0.06, dir: track.closest(".marquee--light") ? 1 : -1 };
  });

  /* Before & after sliders */
  // The before photo is drawn at the slider's full width inside its narrower wrapper
  const baSize = new ResizeObserver((entries) => entries.forEach((e) => e.target.style.setProperty("--bw", e.contentRect.width + "px")));
  $$(".ba").forEach((ba) => {
    baSize.observe(ba);
    const range = $(".ba__range", ba);
    let touched = false;
    const set = (v) => ba.style.setProperty("--x", v + "%");
    range.addEventListener("input", () => { touched = true; set(range.value); });
    if (reduced) return;
    // When the slider first comes into view it sweeps once to show it can move
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now(), keys = [50, 88, 14, 50];
      const step = (now) => {
        if (touched) return;
        const t = Math.min(1, (now - t0) / 2600), seg = Math.min(2, Math.floor(t * 3)), local = t * 3 - seg;
        const ease = local < .5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2;
        const v = keys[seg] + (keys[seg + 1] - keys[seg]) * ease;
        set(v.toFixed(2)); range.value = v;
        if (t < 1) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 400);
    }, { threshold: 0.5 }).observe(ba);
  });

  /* Site film plays only while it's on screen */
  const film = $(".reno__film video");
  if (film) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reduced) { film.preload = "auto"; film.play().catch(() => {}); } else film.pause();
    }, { threshold: 0.25 }).observe(film);
  }

  /* Cursor follower, magnetic buttons and tilt (mouse only) */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduced;
  const cursor = $(".cursor");
  const cursorLabel = $(".cursor__label");
  let cx = 0, cy = 0, mx = -100, my = -100;
  if (fine) {
    window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; cursor.classList.add("is-on"); }, { passive: true });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
    document.addEventListener("pointerover", (e) => {
      const t = e.target;
      const label = t.closest(".ba, .ring-stage") ? "Drag" : t.closest("main figure.fig") ? "View" : t.closest(".strip__item") ? "Open" : "";
      cursorLabel.textContent = label;
      cursor.classList.toggle("is-label", !!label);
      cursor.classList.toggle("is-link", !label && !!t.closest("a, button, input"));
    });
    $$(".btn, .nav__menu").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 14}px, ${((e.clientY - r.top) / r.height - 0.5) * 10}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
    $$(".card .fig, .ig__grid a").forEach((el) => {
      el.classList.add("tilt");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((0.5 - (e.clientY - r.top) / r.height) * 8).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  /* Per-frame scroll effects */
  const openers = $$(".opener__img");
  const depthEls = $$("[data-depth]");
  const progressOf = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - window.innerHeight), 0, 1);
  };
  const inView = (el, pad = 0) => {
    const r = el.getBoundingClientRect();
    return r.bottom > -pad && r.top < window.innerHeight + pad;
  };
  let last = performance.now(), lastY = window.scrollY, velocity = 0;
  const frame = (now) => {
    const dt = Math.min(64, now - last); last = now;
    const vh = window.innerHeight;
    if (lenis) lenis.raf(now);

    // scroll velocity, smoothed, drives the text bands
    velocity += ((window.scrollY - lastY) / Math.max(dt, 1) - velocity) * 0.2;
    lastY = window.scrollY;

    nav.classList.toggle("is-scrolled", window.scrollY > 40);

    if (!reduced) {
      loops.forEach((l) => {
        if (!inView(l.track, 200)) return;
        const half = l.track.scrollWidth / 2;
        const boost = 1 + Math.min(Math.abs(velocity) * 3, 12);
        const dir = velocity < -0.05 ? -l.dir : l.dir;
        l.x += dir * l.speed * boost * dt;
        if (l.x <= -half) l.x += half;
        if (l.x > 0) l.x -= half;
        l.track.style.transform = `translate3d(${l.x.toFixed(1)}px,0,0)`;
      });
    }

    if (fine) {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    }

    // cursor preview follows with a little lag
    px += (tx - px) * 0.14; py += (ty - py) * 0.14;
    preview.style.transform = `translate3d(${px + 24}px, ${py - preview.offsetHeight / 2}px, 0) rotate(${clamp((tx - px) * 0.05, -8, 8)}deg)`;

    if (!reduced) {
      openers.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        img.style.setProperty("--py", (-r.top * 0.22).toFixed(1) + "px");
        img.style.setProperty("--ps", (1.02 + clamp(r.top / vh, 0, 1) * 0.12).toFixed(3));
      });
      depthEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        el.style.setProperty("--dy", ((r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.depth)).toFixed(1) + "px");
      });
    }

    if (inView(ringSec)) {
      if (!dragging) { vel *= 0.94; drag += vel; }
      if (!reduced) drift += dt * 0.004;
      const angle = progressOf(ringSec) * 300 + drag + drift;
      ring.style.transform = `translateZ(${-radius}px) rotateX(-7deg) rotateY(${-angle}deg)`;
      const n = ringItems.length;
      ringItems.forEach((it, i) => {
        const a = ((360 / n) * i - angle) * Math.PI / 180;
        const facing = Math.cos(a);
        it.firstElementChild.style.filter = `brightness(${(0.28 + 0.72 * (facing + 1) / 2).toFixed(2)})`;
        it.style.setProperty("--cap", clamp((facing - 0.55) * 4, 0, 1).toFixed(2));
      });
    }

    if (!reduced && inView(flowSec)) {
      const p = progressOf(flowSec);
      const vw = window.innerWidth;
      const travel = flow.scrollWidth - vw;
      const x = -p * travel;
      flow.style.transform = `translate3d(${x}px,0,0)`;
      flowStage.style.setProperty("--fp", p.toFixed(3));
      // Accordion: neighbours fold in opposite directions and open flat at the centre
      flowItems.forEach((it, k) => {
        const c = x + it.offsetLeft + it.offsetWidth / 2;
        const d = clamp((c - vw / 2) / (vw / 2), -1.6, 1.6);
        const fold = Math.min(1, Math.abs(d) * 1.8) * 52 * (k % 2 ? 1 : -1);
        it.style.transform = `rotateY(${fold.toFixed(2)}deg) translateZ(${(-Math.abs(d) * 180).toFixed(1)}px) scale(${(1 - Math.abs(d) * 0.06).toFixed(3)})`;
        it.style.zIndex = String(100 - Math.round(Math.abs(d) * 50));
      });
    }

    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { layoutRing(); centreStrip(current); }, 120);
  });

  /* Lightbox: every project figure, in page order */
  const figures = $$("main figure.fig");
  const box = $(".lightbox");
  const boxImg = $(".lightbox__img", box);
  const boxCap = $(".lightbox__cap", box);
  const closeBtn = $('[data-lb="close"]', box);
  let index = -1;
  const show = (i) => {
    index = (i + figures.length) % figures.length;
    const img = $("img", figures[index]);
    const cap = $("figcaption", figures[index]);
    boxImg.src = img.currentSrc || img.src;
    boxImg.alt = img.alt;
    boxImg.style.animation = "none"; void boxImg.offsetWidth; boxImg.style.animation = "";
    boxCap.textContent = `${String(index + 1).padStart(2, "0")} / ${figures.length} · ${cap ? cap.textContent : ""}`;
  };
  const open = (i) => { show(i); box.hidden = false; document.body.classList.add("is-locked"); pauseScroll(true); closeBtn.focus(); };
  const close = () => {
    box.hidden = true;
    document.body.classList.remove("is-locked");
    pauseScroll(false);
    boxImg.removeAttribute("src");
    if (figures[index]) figures[index].focus({ preventScroll: true });
  };
  figures.forEach((fig, i) => {
    fig.setAttribute("role", "button");
    fig.setAttribute("aria-label", `Open image: ${$("figcaption", fig)?.textContent || $("img", fig).alt}`);
    fig.addEventListener("click", () => open(i));
    fig.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
  });
  box.addEventListener("click", (e) => {
    const action = e.target.closest("[data-lb]")?.dataset.lb;
    if (action === "close" || e.target === box) close();
    else if (action === "prev") show(index - 1);
    else if (action === "next") show(index + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (!menu.hidden && e.key === "Escape") { closeMenu(); pauseScroll(false); return; }
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "Tab") {
      const btns = $$("button", box);
      if (e.shiftKey && document.activeElement === btns[0]) { e.preventDefault(); btns[btns.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === btns[btns.length - 1]) { e.preventDefault(); btns[0].focus(); }
    }
  });
})();
