/* promēsa v2: choreography. Content is always in the HTML; this only moves it. */
(function () {
  const doc = document.documentElement;
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!window.gsap && !!window.ScrollTrigger;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- EU stars ---------- */
  const stars = $('#stars');
  if (stars) {
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, x = 200 + 150 * Math.cos(a), y = 200 + 150 * Math.sin(a);
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const pts = [];
      for (let k = 0; k < 10; k++) { const r = k % 2 ? 4.5 : 11, t = k / 10 * Math.PI * 2 - Math.PI / 2; pts.push((x + r * Math.cos(t)).toFixed(1) + ',' + (y + r * Math.sin(t)).toFixed(1)); }
      p.setAttribute('d', 'M' + pts.join('L') + 'Z'); p.setAttribute('fill', '#D99A2B'); stars.appendChild(p);
    }
  }

  /* ---------- Form (concept: not connected) ---------- */
  const form = $('#lead');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const note = $('#form-note'), name = form.elements.name.value.trim(), email = form.elements.email;
    if (!name || !email.value || !email.validity.valid) { note.textContent = 'Add your name and a valid email so we can reply.'; return; }
    note.textContent = 'Thanks, ' + name + '. In this concept the form is not connected yet.';
  });

  /* ---------- Menu ---------- */
  const toggle = $('#navToggle'), menu = $('#menu');
  function setMenu(open) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', open); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open); menu.setAttribute('aria-hidden', !open);
    body.classList.toggle('menu-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  if (toggle) {
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Without GSAP or with reduced motion: plain page ---------- */
  const reel = $('#reel');
  let lenis = null;
  if (!hasGsap || reduce) {
    doc.classList.remove('js');
    body.classList.remove('is-loading');
    if (reel) reel.classList.add('is-stacked');
    navScroll(false);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => lenis ? lenis.scrollTo(target, { duration: 1.4 }) : window.scrollTo({ top: typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY, behavior: 'smooth' });
  $$('a[href^="#"]').forEach(a => {
    if (a.dataset.slide !== undefined) return;
    a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = $(id); if (!el) return;
      e.preventDefault(); scrollTo(id === '#top' ? 0 : el);
    });
  });

  /* ---------- Split headings into words ---------- */
  $$('[data-split]').forEach(h => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            w.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em';
            const i = document.createElement('span'); i.style.display = 'inline-block'; i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    walk(h);
    $$('.w', h).forEach(w => w.setAttribute('aria-hidden', 'true'));
    gsap.from($$('.w > span', h), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .05,
      scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
  });

  /* ---------- Reveals: staggered per group ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .08, overwrite: true })
  });

  /* ---------- Counters ---------- */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '', o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.fromTo(o, { v: 0 }, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => el.textContent = Math.round(o.v) + suf }) });
  });

  /* ---------- Nav: hides going down, turns solid past the hero ---------- */
  function navScroll(animated) {
    const nav = $('#nav'), hero = $('.hero');
    if (!nav) return;
    let last = 0;
    const onScroll = () => {
      const y = scrollY, past = hero ? y > hero.offsetHeight - 70 : y > 40;
      nav.classList.toggle('is-solid', past);
      if (animated && !body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > last && y > 500);
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  navScroll(true);

  /* ---------- Hero entrance ---------- */
  function heroIn(delay) {
    if (!$('.hero')) { gsap.from('.nav', { opacity: 0, y: -10, duration: .9, ease: 'expo.out', delay }); return; }
    gsap.from('.hero h1 .line > span', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .1, delay });
    gsap.from('[data-hero-fade]', { opacity: 0, y: 24, duration: 1.1, ease: 'expo.out', stagger: .1, delay: delay + .35 });
    gsap.from('.wall__label', { opacity: 0, y: -12, duration: .9, ease: 'expo.out', stagger: .06, delay: delay + .2 });
    gsap.from('.nav', { opacity: 0, y: -10, duration: .9, ease: 'expo.out', delay: delay + .1 });
  }
  // Wall pictures drift slowly while you read the first screen
  if ($('.hero')) gsap.to('.wall__panel img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Veil: five cuts, the mark, then the curtain lifts ---------- */
  const veil = $('#veil');
  if (body.classList.contains('is-loading') && veil) {
    const cuts = $$('.veil__cut', veil), mark = $('.veil__mark', veil);
    const tl = gsap.timeline({ onComplete: done });
    cuts.forEach((c, i) => {
      tl.set(c, { opacity: 1 }, i * .26)
        .fromTo($('img', c), { scale: 1.16 }, { scale: 1.04, duration: .5, ease: 'power2.out' }, i * .26);
      if (i) tl.set(cuts[i - 1], { opacity: 0 }, i * .26);
    });
    tl.to(mark, { opacity: 1, duration: .35, ease: 'power2.out' }, cuts.length * .26 - .15)
      .to(cuts[cuts.length - 1], { opacity: .35, duration: .3 }, '<')
      .to(veil, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '+=.25')
      .fromTo('.wall__panel img', { scale: 1.25 }, { scale: 1.06, duration: 1.4, ease: 'expo.out', stagger: .05 }, '<+.2');
    heroIn(tl.duration() - .7);
    function done() {
      body.classList.remove('is-loading'); doc.classList.remove('veil-on');
      try { sessionStorage.setItem('pv2-veil', '1'); } catch (e) {}
      ScrollTrigger.refresh();
    }
    const skip = () => { tl.progress(1); };
    veil.addEventListener('click', skip);
    addEventListener('keydown', function k(e) { if (e.key === 'Escape') { skip(); removeEventListener('keydown', k); } });
    if (lenis) { lenis.stop(); tl.eventCallback('onComplete', () => { done(); lenis.start(); }); }
  } else {
    body.classList.remove('is-loading');
    heroIn(.1);
  }

  /* ---------- Road and reel ---------- */
  const mm = gsap.matchMedia();
  if (reel) mm.add('(min-width: 901px)', () => {
    /* The road: the scroll moves the cursor; stops snap the text */
    const nodes = $$('#roadNodes .road__node');
    const big = $('#roadBig'), kick = $('#roadKicker'), note = $('#roadNote');
    const fill = $('#roadFill'), cursor = $('#roadCursor');
    let cur = 0;
    const show = (i) => {
      if (i === cur) return; cur = i;
      nodes.forEach((n, k) => n.classList.toggle('is-on', k === i));
      const n = nodes[i];
      gsap.timeline()
        .to([big, kick, note], { opacity: 0, y: -14, duration: .2, ease: 'power2.in' })
        .add(() => { big.textContent = n.dataset.big; kick.textContent = n.dataset.kick; note.textContent = n.dataset.note; })
        .fromTo([kick, big, note], { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .6, ease: 'expo.out', stagger: .05 });
    };
    const roadST = ScrollTrigger.create({
      trigger: '.road', start: 'top top', end: () => '+=' + innerHeight * 2.4, pin: true, scrub: true,
      onUpdate: self => {
        const p = self.progress, pos = .1 + p * .8;
        gsap.set(fill, { scaleX: pos }); gsap.set(cursor, { left: (pos * 100) + '%' });
        show(Math.min(nodes.length - 1, Math.round(p * (nodes.length - 1))));
      }
    });
    gsap.fromTo('#roadImg', { xPercent: 0 }, { xPercent: -22, ease: 'none', scrollTrigger: { trigger: '.road', start: 'top top', end: () => '+=' + innerHeight * 2.4, scrub: true } });
    nodes.forEach((n, i) => $('button', n).addEventListener('click', () => {
      scrollTo(roadST.start + (roadST.end - roadST.start) * (i / (nodes.length - 1)) + 2);
    }));

    /* The reel: one project per screen, the scroll crossfades */
    reel.classList.remove('is-stacked');
    const slides = $$('.reel__slide', reel), idx = $('#reelIdx'), bar = $('#reelBar');
    const n = slides.length;
    gsap.set(slides, { opacity: 0, visibility: 'hidden' }); gsap.set(slides[0], { opacity: 1, visibility: 'visible' });
    const tl = gsap.timeline();
    slides.forEach((s, i) => {
      const img = $('img', s), copy = $$('.reel__name, .reel__line, .reel__meta', s);
      tl.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', duration: 1 }, i);
      if (i < n - 1) {
        const next = slides[i + 1];
        tl.to(copy, { opacity: 0, y: -30, ease: 'power1.in', duration: .25, stagger: .03 }, i + .7)
          .fromTo(next, { opacity: 0, visibility: 'visible', clipPath: 'inset(100% 0 0 0)' }, { opacity: 1, clipPath: 'inset(0% 0 0 0)', ease: 'power2.inOut', duration: .35 }, i + .75)
          .fromTo($$('.reel__name, .reel__line, .reel__meta', next), { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: 'expo.out', duration: .3, stagger: .04 }, i + .95)
          .set(s, { visibility: 'hidden' }, i + 1.1);
      }
    });
    const reelST = ScrollTrigger.create({
      trigger: reel, start: 'top top', end: () => '+=' + innerHeight * (n - .3), pin: true, scrub: .6, animation: tl,
      onUpdate: self => {
        const i = Math.min(n - 1, Math.floor(self.progress * (n - .3) + .3));
        idx.textContent = Math.min(n, Math.max(1, Math.round(self.progress * (n - 1)) + 1));
        gsap.set(bar, { scaleX: self.progress });
      }
    });
    $$('[data-slide]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const i = +a.dataset.slide;
      scrollTo(reelST.start + (reelST.end - reelST.start) * (i / (n - 1)) + 2);
    }));
    return () => { reel.classList.add('is-stacked'); gsap.set(slides, { clearProps: 'all' }); };
  });
  if (reel) mm.add('(max-width: 900px)', () => {
    reel.classList.add('is-stacked');
    $$('.reel__slide', reel).forEach(s => {
      gsap.fromTo($('img', s), { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from($$('.reel__name, .reel__line, .reel__meta', s), { opacity: 0, y: 26, duration: .9, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: s, start: 'top 60%', once: true } });
    });
    gsap.from('.road__list li', { opacity: 0, x: -20, duration: .9, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.road__list', start: 'top 80%', once: true } });
    $$('[data-slide]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const s = $$('.reel__slide', reel)[+a.dataset.slide]; if (s) scrollTo(s);
    }));
  });

  /* ---------- Finale picture drifts; footer name rises ---------- */
  if ($('#finaleImg')) gsap.fromTo('#finaleImg', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.foot__name', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 90%', once: true } });

  /* ---------- Buttons: a small press ---------- */
  $$('.btn').forEach(b => b.addEventListener('pointerdown', () => gsap.fromTo(b, { scale: .95 }, { scale: 1, duration: .6, ease: 'elastic.out(1,.4)' })));

  addEventListener('load', () => ScrollTrigger.refresh());
})();
