/* ============================================================
   CHANDRABALI RUDRA — CINEMATIC PORTFOLIO
   main.js — All Animations, Interactions & Motion Logic
   ============================================================ */

'use strict';

// ─── GLOBAL STATE ───────────────────────────────────────────
const state = {
  mouseX: 0,
  mouseY: 0,
  cursorX: 0,
  cursorY: 0,
  ringX: 0,
  ringY: 0,
  lenis: null,
  threeScene: null,
  isMenuOpen: false,
  lightboxItems: [],
  lightboxIndex: 0,
  waveAnimId: null,
};

// ─── UTILITY FUNCTIONS ──────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function splitIntoWords(el) {
  const html = el.innerHTML;
  const words = html.split(/(<[^>]+>|\s+)/);
  el.innerHTML = '';
  words.forEach(token => {
    if (token.trim() === '' || token.startsWith('<')) {
      el.insertAdjacentHTML('beforeend', token || ' ');
    } else {
      const wrap = document.createElement('span');
      wrap.className = 'word-wrap';
      wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;';
      const inner = document.createElement('span');
      inner.className = 'word';
      inner.style.cssText = 'display:inline-block;transform:translateY(110%);will-change:transform;';
      inner.textContent = token;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      el.insertAdjacentText('beforeend', ' ');
    }
  });
  return $$('.word', el);
}

function animateCounter(el, target, duration = 2000) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = clamp(elapsed / duration, 0, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.round(ease * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  };
  requestAnimationFrame(update);
}

// ─── 1. LENIS SMOOTH SCROLL ──────────────────────────────────
function initLenis() {
  state.lenis = new Lenis({
    duration: 1.4,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
  });

  // Connect Lenis to GSAP ticker for perfect sync
  gsap.ticker.add(time => state.lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Close mobile menu on link click
  $$('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
      // Give scroll a moment before nav closes
    });
  });
}

// ─── 2. THREE.JS PARTICLE SCENE ──────────────────────────────
function initThreeJS() {
  const canvas = $('#heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 9;

  // ── Particle System ──
  const COUNT = 1400;
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);
  const velocity  = new Float32Array(COUNT * 3);

  const gold   = new THREE.Color(0xC9A84C);
  const cream  = new THREE.Color(0xF0EAD8);
  const violet = new THREE.Color(0x6B3FA0);

  for (let i = 0; i < COUNT; i++) {
    // Wide flat-cloud distribution fills the viewport
    const x = (Math.random() - 0.5) * 22;
    const y = (Math.random() - 0.5) * 14;
    const z = (Math.random() - 0.5) * 8 - 1;
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Drift velocity (very slow)
    velocity[i * 3]     = (Math.random() - 0.5) * 0.002;
    velocity[i * 3 + 1] = (Math.random() - 0.5) * 0.001 - 0.0003; // slight upward drift
    velocity[i * 3 + 2] = 0;

    // Color: mix gold, cream, violet
    const t = Math.random();
    let c;
    if (t < 0.65)      c = gold.clone().lerp(cream, Math.random() * 0.6);
    else if (t < 0.85) c = gold.clone().lerp(violet, Math.random() * 0.4);
    else               c = cream.clone();

    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = Math.random() * 3 + 0.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.07,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // ── Second small particles layer (slower) ──
  const COUNT2 = 400;
  const pos2   = new Float32Array(COUNT2 * 3);
  const col2   = new Float32Array(COUNT2 * 3);
  for (let i = 0; i < COUNT2; i++) {
    pos2[i * 3]     = (Math.random() - 0.5) * 24;
    pos2[i * 3 + 1] = (Math.random() - 0.5) * 15;
    pos2[i * 3 + 2] = (Math.random() - 0.5) * 4 - 3;
    const c2 = gold.clone().lerp(cream, Math.random());
    col2[i * 3]     = c2.r;
    col2[i * 3 + 1] = c2.g;
    col2[i * 3 + 2] = c2.b;
  }
  const geo2  = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  geo2.setAttribute('color',    new THREE.BufferAttribute(col2, 3));
  const mat2  = new THREE.PointsMaterial({
    size: 0.04, vertexColors: true, transparent: true,
    opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const particles2 = new THREE.Points(geo2, mat2);
  scene.add(particles2);

  // ── Mouse interaction ──
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  document.addEventListener('mousemove', e => {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    targetRotX =  ny * 0.25;
    targetRotY = -nx * 0.35;
  });

  // ── Animate loop ──
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Drift each particle
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += velocity[i * 3];
      pos[i * 3 + 1] += velocity[i * 3 + 1];
      // Wrap around bounds
      if (pos[i * 3]     >  12) pos[i * 3]     = -12;
      if (pos[i * 3]     < -12) pos[i * 3]     =  12;
      if (pos[i * 3 + 1] >   8) pos[i * 3 + 1] =  -8;
      if (pos[i * 3 + 1] <  -8) pos[i * 3 + 1] =   8;
    }
    geometry.attributes.position.needsUpdate = true;

    // Gentle slow rotation of the whole cloud
    particles.rotation.y = t * 0.018;
    particles.rotation.x = Math.sin(t * 0.012) * 0.08;

    // Mouse-driven tilt
    currentRotX = lerp(currentRotX, targetRotX, 0.04);
    currentRotY = lerp(currentRotY, targetRotY, 0.04);
    particles.rotation.x += currentRotX * 0.4;
    particles.rotation.y += currentRotY * 0.4;

    particles2.rotation.y = -t * 0.01;
    particles2.rotation.x = Math.cos(t * 0.008) * 0.06;

    // Pulse opacity
    material.opacity = 0.65 + Math.sin(t * 0.5) * 0.1;

    renderer.render(scene, camera);
  }
  animate();

  // ── Resize ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  state.threeScene = { scene, camera, renderer };
}

// ─── 3. CUSTOM CURSOR ─────────────────────────────────────────
function initCursor() {
  const dot  = $('#cursorDot');
  const ring = $('#cursorRing');
  const text = $('#cursorText');
  if (!dot || !ring) return;

  let raf;
  function updateCursor() {
    state.cursorX = lerp(state.cursorX, state.mouseX, 0.9);
    state.cursorY = lerp(state.cursorY, state.mouseY, 0.9);
    state.ringX   = lerp(state.ringX,   state.mouseX, 0.12);
    state.ringY   = lerp(state.ringY,   state.mouseY, 0.12);

    dot.style.left = state.cursorX + 'px';
    dot.style.top  = state.cursorY + 'px';
    ring.style.left = state.ringX + 'px';
    ring.style.top  = state.ringY + 'px';
    text.style.left = state.ringX + 'px';
    text.style.top  = state.ringY + 'px';
    raf = requestAnimationFrame(updateCursor);
  }
  updateCursor();

  document.addEventListener('mousemove', e => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
  });

  // Magnetic & hover elements
  const hoverEls = $$('a, button, .g-item, .class-card, .tl-card, .t-card, [data-cursor]');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-hover');
      const label = el.dataset.cursor;
      if (label) {
        text.textContent = label.toUpperCase();
        document.body.classList.add('cursor-text-active');
      }
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hover', 'cursor-text-active');
      text.textContent = '';
    });
  });

  // Click ripple
  document.addEventListener('click', e => {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position:fixed;left:${e.clientX}px;top:${e.clientY}px;
      width:0;height:0;border-radius:50%;
      border:1px solid rgba(201,168,76,0.5);
      transform:translate(-50%,-50%);
      pointer-events:none;z-index:99998;
    `;
    document.body.appendChild(ripple);
    gsap.to(ripple, {
      width: 80, height: 80, opacity: 0, duration: 0.6,
      ease: 'power2.out',
      onComplete: () => ripple.remove(),
    });
  });
}

// ─── 4. MAGNETIC BUTTONS ──────────────────────────────────────
function initMagnetic() {
  $$('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) * 0.3;
      const dy = (e.clientY - cy) * 0.3;
      gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.5)' });
    });
  });
}

// ─── 5. NAVIGATION ────────────────────────────────────────────
function initNav() {
  const nav     = $('#nav');
  const burger  = $('#navBurger');
  const mobileNav = $('#mobileNav');

  // Scroll-based nav style
  ScrollTrigger.create({
    start: 'top -80',
    onEnter:  () => nav.classList.add('nav-scrolled'),
    onLeaveBack: () => nav.classList.remove('nav-scrolled'),
  });

  // Hamburger
  burger && burger.addEventListener('click', () => {
    state.isMenuOpen ? closeMobileMenu() : openMobileMenu();
  });

  $$('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  function openMobileMenu() {
    state.isMenuOpen = true;
    mobileNav.classList.add('is-open');
    burger.classList.add('is-active');
    const spans = $$('span', burger);
    gsap.to(spans[0], { rotation: 45, y: 6,  duration: 0.3 });
    gsap.to(spans[1], { opacity: 0,   x: -8, duration: 0.2 });
    gsap.to(spans[2], { rotation: -45, y: -6, duration: 0.3 });
    gsap.from('.mobile-nav-link', {
      y: 40, opacity: 0, stagger: 0.08, duration: 0.5,
      ease: 'power3.out',
    });
  }

  window.closeMobileMenu = function() {
    state.isMenuOpen = false;
    mobileNav.classList.remove('is-open');
    const spans = $$('span', burger);
    gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
    gsap.to(spans[1], { opacity: 1, x: 0, duration: 0.2 });
    gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
  };
}

// ─── 6. PRELOADER ─────────────────────────────────────────────
function initPreloader() {
  const preloader = $('#preloader');
  if (!preloader) return;

  // After 2.6 seconds, dismiss preloader
  gsap.to(preloader, {
    opacity: 0,
    duration: 0.8,
    delay: 2.6,
    ease: 'power2.inOut',
    onStart: () => {
      document.body.classList.remove('is-loading');
    },
    onComplete: () => {
      preloader.style.display = 'none';
      runHeroEntrance();
    },
  });
}

// ─── 7. HERO ENTRANCE ─────────────────────────────────────────
function runHeroEntrance() {
  // Nav entrance
  gsap.to(['#navLogo', '#navLinks'], {
    opacity: 1, y: 0, duration: 0.8,
    stagger: 0.1, ease: 'power3.out', delay: 0.1,
  });

  // Portrait emerge removed

  // Text sequence
  const tl = gsap.timeline({ delay: 0.4 });

  tl.to('#heroEyebrow', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
  })
  .to('#heroPart1', {
    clipPath: 'inset(0 0 0% 0)', duration: 1.0,
    ease: 'power4.out',
  }, '-=0.3')
  .to('#heroPart2', {
    clipPath: 'inset(0 0 0% 0)', duration: 1.0,
    ease: 'power4.out',
  }, '-=0.7')
  .to('#heroTagline', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
  }, '-=0.4')
  .to('#heroStats', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
    onStart: () => {
      // Animate counters
      $$('[data-target]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target), 2500);
      });
    },
  }, '-=0.4')
  .to('#heroActions', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
  }, '-=0.5');

  // Parallax on mouse for hero layers
  document.addEventListener('mousemove', e => {
    const nx = (e.clientX / window.innerWidth  - 0.5);
    const ny = (e.clientY / window.innerHeight - 0.5);
    gsap.to('#heroTextCol', {
      x: nx * 8, y: ny * 5,
      duration: 1.4, ease: 'power2.out',
    });
    gsap.to('#heroNotesLayer', {
      x: nx * 30, y: ny * 20,
      duration: 1.6, ease: 'power2.out',
    });
  });
}

// ─── 8. SCROLL TRIGGER ANIMATIONS ────────────────────────────
function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  // ── Helper: Animate split titles ──
  $$('.split-title').forEach(el => {
    const words = splitIntoWords(el);
    gsap.fromTo(words,
      { y: '110%' },
      {
        y: '0%',
        stagger: 0.06,
        duration: 0.9,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  // ── Section labels ──
  $$('.section-label-wrap').forEach(wrap => {
    gsap.fromTo(wrap,
      { opacity: 0, x: -20 },
      {
        opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: wrap, start: 'top 88%' },
      }
    );
  });

  // ── Stagger paragraphs ──
  $$('.stagger-para').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // ── Stagger list items ──
  $$('.stagger-item').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      delay: i * 0.1,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // ── About image reveals ──
  $$('.img-mask-reveal').forEach((el, i) => {
    gsap.to(el, {
      clipPath: 'inset(0 0 0% 0)',
      duration: 1.2, ease: 'power4.out', delay: i * 0.15,
      scrollTrigger: { trigger: el, start: 'top 80%' },
    });
  });

  // Floating cards
  gsap.fromTo('#floatStatCard',
    { opacity: 0, x: 30, y: 20 },
    { opacity: 1, x: 0,  y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '#floatStatCard', start: 'top 82%' } }
  );
  gsap.fromTo('#floatAwardCard',
    { opacity: 0, x: -20, y: 20 },
    { opacity: 1, x: 0,   y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '#floatAwardCard', start: 'top 82%' } }
  );

  // ── About counter ──
  ScrollTrigger.create({
    trigger: '.float-stat-card',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      $$('.counter').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target), 2200);
      });
    },
  });

  // ── Timeline spine growth ──
  ScrollTrigger.create({
    trigger: '.timeline-wrap',
    start: 'top 70%',
    end: 'bottom 30%',
    scrub: 0.8,
    onUpdate: self => {
      const fill = $('#timelineSpineFill');
      if (fill) fill.style.height = (self.progress * 100) + '%';
    },
  });

  // ── Timeline cards ──
  $$('.tl-item').forEach((item, i) => {
    const isLeft = item.classList.contains('tl-left');
    gsap.fromTo(item.querySelector('.tl-card'),
      { opacity: 0, x: isLeft ? -60 : 60 },
      {
        opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 82%' },
      }
    );
    gsap.fromTo(item.querySelector('.tl-dot'),
      { scale: 0, opacity: 0 },
      {
        scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)',
        scrollTrigger: { trigger: item, start: 'top 82%' },
      }
    );
  });

  // ── Class cards stagger ──
  gsap.fromTo('.class-card',
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0,
      stagger: 0.12, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.classes-grid', start: 'top 78%' },
    }
  );

  // ── Philosophy word reveal (called separately in init) ──

  // ── Philosophy attribution ──
  gsap.to('#philosophyAttr', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '#philosophyAttr', start: 'top 85%' },
  });

  // ── Testimonials heading ──
  // (handled by split-title above)

  // ── Gallery items ──
  gsap.fromTo('.g-item',
    { opacity: 0, y: 40, scale: 0.96 },
    {
      opacity: 1, y: 0, scale: 1,
      stagger: 0.08, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '.gallery-grid', start: 'top 78%' },
    }
  );

  // ── Contact section ──
  gsap.fromTo('.field-group',
    { opacity: 0, y: 24 },
    {
      opacity: 1, y: 0,
      stagger: 0.1, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-form', start: 'top 78%' },
    }
  );
  gsap.fromTo('.contact-detail-item',
    { opacity: 0, x: -24 },
    {
      opacity: 1, x: 0,
      stagger: 0.1, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-details', start: 'top 80%' },
    }
  );

  // ── Horizontal scroll for testimonials section header ──
  gsap.fromTo('.testimonials .section-title em',
    { x: 30 },
    {
      x: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.testimonials', start: 'top 80%' },
    }
  );
}

// ─── 9. PHILOSOPHY QUOTE WORDS ────────────────────────────────
function initPhilosophyQuote() {
  const quoteEl = $('#quoteText');
  if (!quoteEl) return;

  const quoteString = 'Music is not just an art form — it is a conversation between the soul and the universe, written in the eternal language of sound.';
  const words = quoteString.split(' ');

  quoteEl.innerHTML = '';
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'quote-word';
    span.textContent = word;
    span.style.transitionDelay = `${i * 0.04}s`;
    quoteEl.appendChild(span);
    if (i < words.length - 1) quoteEl.appendChild(document.createTextNode(' '));
  });

  // Reveal words as they scroll into view
  ScrollTrigger.create({
    trigger: '#quoteBlock',
    start: 'top 75%',
    end: 'bottom 40%',
    scrub: false,
    once: true,
    onEnter: () => {
      gsap.to('.quote-word', {
        opacity: 1,
        y: 0,
        stagger: 0.04,
        duration: 0.6,
        ease: 'power3.out',
      });
    },
  });

  // Cursor light effect in philosophy section
  const philSection = $('#philosophy');
  const light = $('#philosophyLight');
  if (philSection && light) {
    philSection.addEventListener('mousemove', e => {
      const rect = philSection.getBoundingClientRect();
      light.style.left = (e.clientX - rect.left) + 'px';
      light.style.top  = (e.clientY - rect.top)  + 'px';
    });
  }
}

// ─── 10. WAVEFORM CANVAS ──────────────────────────────────────
function initWaveform() {
  const canvas = $('#waveCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let phase = 0;

  function drawWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width;
    const cy = canvas.height;

    // Wave 1
    ctx.beginPath();
    ctx.moveTo(0, cy * 0.5);
    for (let x = 0; x <= cx; x++) {
      const y = cy * 0.5 + Math.sin((x / cx) * Math.PI * 8 + phase) * (cy * 0.06);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(201,168,76,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wave 2 (offset)
    ctx.beginPath();
    ctx.moveTo(0, cy * 0.5);
    for (let x = 0; x <= cx; x++) {
      const y = cy * 0.5 + Math.sin((x / cx) * Math.PI * 12 + phase * 1.4 + 1.5) * (cy * 0.04);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(139,26,60,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wave 3 (slow, tall)
    ctx.beginPath();
    ctx.moveTo(0, cy * 0.5);
    for (let x = 0; x <= cx; x++) {
      const y = cy * 0.5 + Math.sin((x / cx) * Math.PI * 4 + phase * 0.6) * (cy * 0.1);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(201,168,76,0.06)';
    ctx.lineWidth = 2;
    ctx.stroke();

    phase += 0.012;
    state.waveAnimId = requestAnimationFrame(drawWave);
  }

  // Start when section in view
  ScrollTrigger.create({
    trigger: '#philosophy',
    start: 'top bottom',
    end: 'bottom top',
    onEnter:      () => { if (!state.waveAnimId) drawWave(); },
    onEnterBack:  () => { if (!state.waveAnimId) drawWave(); },
    onLeave:      () => { cancelAnimationFrame(state.waveAnimId); state.waveAnimId = null; },
    onLeaveBack:  () => { cancelAnimationFrame(state.waveAnimId); state.waveAnimId = null; },
  });
}

// ─── 11. CARD 3D TILT ─────────────────────────────────────────
function initCardTilt() {
  $$('.tilt-card').forEach(card => {
    let rect, cx, cy;

    card.addEventListener('mouseenter', () => {
      rect = card.getBoundingClientRect();
      cx = rect.left + rect.width  / 2;
      cy = rect.top  + rect.height / 2;
    });

    card.addEventListener('mousemove', e => {
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotX = -dy * 6;
      const rotY =  dx * 6;
      gsap.to(card, {
        rotateX: rotX, rotateY: rotY,
        transformPerspective: 800,
        transformOrigin: 'center center',
        duration: 0.5, ease: 'power2.out',
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0, rotateY: 0, duration: 0.7,
        ease: 'elastic.out(1, 0.5)',
      });
    });
  });
}

// ─── 12. TESTIMONIALS ─────────────────────────────────────────
function initTestimonials() {
  // Pure CSS infinite scroll handles the loop
  // But we want to pause on hover (handled in CSS) and allow drag
  const track = $('#testimonialsTrack');
  if (!track) return;

  let isDragging  = false;
  let startX      = 0;
  let scrollLeft  = 0;

  track.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    track.style.animationPlayState = 'paused';
  });
  track.addEventListener('mouseleave', () => {
    isDragging = false;
    track.style.animationPlayState = 'running';
  });
  track.addEventListener('mouseup', () => {
    isDragging = false;
    setTimeout(() => track.style.animationPlayState = 'running', 1000);
  });
}

// ─── 13. GALLERY LIGHTBOX ─────────────────────────────────────
function initGallery() {
  const items = $$('.g-item');
  const lightbox = $('#lightbox');
  const lbBackdrop = $('#lbBackdrop');
  const lbClose    = $('#lbClose');
  const lbPrev     = $('#lbPrev');
  const lbNext     = $('#lbNext');
  const lbIcon     = $('#lbIcon');
  const lbCaption  = $('#lbCaption');
  const lbDisplay  = $('#lbDisplay');

  if (!lightbox) return;

  // Store gallery data
  state.lightboxItems = items.map(el => ({
    icon:    el.dataset.icon    || '🎵',
    caption: el.dataset.caption || 'Gallery Image',
    bg:      el.querySelector('.g-ph') ? getComputedStyle(el.querySelector('.g-ph')).background : '',
  }));

  function openLightbox(index) {
    state.lightboxIndex = index;
    showLightboxItem(index);
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function showLightboxItem(index) {
    const item = state.lightboxItems[index];
    if (!item) return;
    lbIcon.textContent    = item.icon;
    lbCaption.textContent = item.caption;
    if (lbDisplay) {
      lbDisplay.style.background = item.bg || 'linear-gradient(135deg, #1A0A35, #0A061A)';
      gsap.fromTo(lbDisplay,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }

  items.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  lbBackdrop && lbBackdrop.addEventListener('click', closeLightbox);
  lbClose    && lbClose.addEventListener('click', closeLightbox);

  lbPrev && lbPrev.addEventListener('click', () => {
    const next = (state.lightboxIndex - 1 + state.lightboxItems.length) % state.lightboxItems.length;
    showLightboxItem(next);
    state.lightboxIndex = next;
  });

  lbNext && lbNext.addEventListener('click', () => {
    const next = (state.lightboxIndex + 1) % state.lightboxItems.length;
    showLightboxItem(next);
    state.lightboxIndex = next;
  });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  lbPrev.click();
    if (e.key === 'ArrowRight') lbNext.click();
  });
}

// ─── 14. CONTACT FORM ─────────────────────────────────────────
function initContactForm() {
  const form      = $('#contactForm');
  const submitBtn = $('#submitBtn');
  if (!form || !submitBtn) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const name  = $('#fName').value.trim();
    const email = $('#fEmail').value.trim();
    if (!name || !email) {
      // Shake empty fields
      $$('.field-input:invalid, .field-input[value=""]', form).forEach(field => {
        gsap.to(field, {
          x: [-6, 6, -4, 4, 0],
          duration: 0.4,
          ease: 'power2.inOut',
        });
      });
      return;
    }

    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    // Simulate async send
    setTimeout(() => {
      submitBtn.classList.remove('is-loading');
      submitBtn.classList.add('is-success');

      // Ripple success animation
      gsap.fromTo(submitBtn,
        { scale: 0.95 },
        { scale: 1, duration: 0.5, ease: 'back.out(2)' }
      );

      // Reset after 4 seconds
      setTimeout(() => {
        submitBtn.classList.remove('is-success');
        submitBtn.disabled = false;
        form.reset();
      }, 4000);
    }, 1800);
  });

  // Floating label for select
  const sel = $('#fInterest');
  if (sel) {
    sel.addEventListener('change', () => {
      sel.classList.toggle('has-value', sel.value !== '');
    });
  }
}

// ─── 15. SECTION-LEVEL PARALLAX ───────────────────────────────
function initParallax() {
  // Parallax on the about section image stack
  gsap.to('.about-img-secondary', {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: {
      trigger: '.about',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.5,
    },
  });

  // Floating stat card drift
  gsap.to('#floatStatCard', {
    y: -20,
    ease: 'none',
    scrollTrigger: {
      trigger: '.about',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2,
    },
  });

  // Timeline background parallax
  gsap.to('.timeline-depth-bg', {
    yPercent: -20,
    ease: 'none',
    scrollTrigger: {
      trigger: '.timeline-sec',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });

  // Philosophy overlay parallax
  gsap.to('.philosophy-overlay', {
    yPercent: 10,
    ease: 'none',
    scrollTrigger: {
      trigger: '.philosophy',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });

  // Gallery items subtle y-shift on scroll
  $$('.g-item').forEach((item, i) => {
    const yAmt = (i % 3 === 0) ? -15 : (i % 3 === 1) ? 10 : -20;
    gsap.to(item, {
      y: yAmt,
      ease: 'none',
      scrollTrigger: {
        trigger: '.gallery-sec',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5 + (i * 0.1),
      },
    });
  });

  // Contact ambient bg parallax
  gsap.to('.contact-ambient-bg', {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: {
      trigger: '.contact',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });
}

// ─── 16. FOOTER NOTES FLOAT ───────────────────────────────────
function initFooterNotes() {
  gsap.fromTo('.f-note',
    { opacity: 0, y: 20 },
    {
      opacity: 1, y: 0,
      stagger: 0.15,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.footer', start: 'top 90%' },
    }
  );
}

// ─── 17. SECTION BACKGROUND PIN (Philosophy) ──────────────────
function initSectionEffects() {
  // Hero section exit fade
  gsap.to('.hero', {
    opacity: 0.6,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'bottom 70%',
      end: 'bottom 20%',
      scrub: 1,
    },
  });

  // Portrait scale removed

  // Classes section heading slide
  gsap.fromTo('.section-subtitle',
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.section-subtitle', start: 'top 85%' },
    }
  );
}

// ─── 18. NAVBAR ACTIVE SECTION HIGHLIGHT ──────────────────────
function initActiveNav() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');

  ScrollTrigger.create({
    onUpdate: () => {
      const scrollY = window.scrollY;
      sections.forEach(sec => {
        const top    = sec.offsetTop - 120;
        const bottom = top + sec.offsetHeight;
        if (scrollY >= top && scrollY < bottom) {
          navLinks.forEach(link => link.classList.remove('nav-link-active'));
          const active = navLinks.find(l => l.getAttribute('href') === `#${sec.id}`);
          if (active) active.classList.add('nav-link-active');
        }
      });
    },
  });
}

// ─── 19. SMOOTH ANCHOR SCROLL ─────────────────────────────────
function initAnchorScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target || !state.lenis) return;
      e.preventDefault();
      state.lenis.scrollTo(target, { offset: -80, duration: 1.6 });
    });
  });
}

// ─── 20. PAGE TRANSITION ON LOAD ──────────────────────────────
function initPageEntrance() {
  // Initial body reveal after preloader
  gsap.set(document.body, { opacity: 1 });
}

// ─── 19b. SCROLL PROGRESS BAR ────────────────────────────────
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scrollProgressBar';
  bar.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'height:2px',
    'background:linear-gradient(to right,#C9A84C,#E8C97A,#8B1A3C)',
    'width:0%', 'z-index:99999', 'pointer-events:none',
    'box-shadow:0 0 8px rgba(201,168,76,0.7)',
    'transition:width 0.05s linear',
  ].join(';');
  document.body.prepend(bar);

  ScrollTrigger.create({
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: self => { bar.style.width = (self.progress * 100) + '%'; },
  });
}

// Portrait shimmer removed

// ─── INIT ALL ─────────────────────────────────────────────────
function init() {
  // Register GSAP plugin
  gsap.registerPlugin(ScrollTrigger);

  // Set initial states BEFORE anything starts
  gsap.set(['#navLogo', '#navLinks'], { opacity: 0, y: -20 });
  gsap.set('#heroEyebrow', { opacity: 0, y: 20 });
  gsap.set('.hero-name-part', { clipPath: 'inset(0 0 100% 0)' });
  gsap.set('#heroTagline', { opacity: 0, y: 20 });
  gsap.set('#heroStats', { opacity: 0, y: 20 });
  gsap.set('#heroActions', { opacity: 0, y: 20 });

  // Initialise all systems
  initLenis();
  initThreeJS();
  initCursor();
  initNav();
  initScrollProgress();
  initScrollAnimations();
  initPhilosophyQuote();
  initWaveform();
  initCardTilt();
  initTestimonials();
  initGallery();
  initContactForm();
  initParallax();
  initFooterNotes();
  initSectionEffects();
  initActiveNav();
  initAnchorScroll();
  initPageEntrance();
  initMagnetic();

  // Preloader fires last (it will call runHeroEntrance when done)
  initPreloader();
}

// ─── WAIT FOR DOM + LIBRARIES ─────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ─── PERFORMANCE: Pause non-visible animations ────────────────
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gsap.globalTimeline.pause();
    if (state.lenis) state.lenis.stop();
    if (state.waveAnimId) { cancelAnimationFrame(state.waveAnimId); state.waveAnimId = null; }
  } else {
    gsap.globalTimeline.resume();
    if (state.lenis) state.lenis.start();
  }
});

// ─── RESIZE: Refresh ScrollTrigger ────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 250);
});
