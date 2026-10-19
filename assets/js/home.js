/* Accueil */
(function () {
  'use strict';
  var d = document;
  var LB = window.LB, DATA = window.LB_DATA || {};

  /* ---------- Shelf + book detail (works without GSAP) ---------- */
  var shelf = d.querySelector('.shelf'), detail = d.getElementById('book-detail');
  function selectBook(id, focus) {
    if (!detail) return;
    var tpl = d.getElementById('book-tpl-' + id);
    if (!tpl) return;
    d.querySelectorAll('.shelf-book').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-book') === id ? 'true' : 'false'); });
    var swap = function () {
      detail.innerHTML = '';
      detail.appendChild(tpl.content.cloneNode(true));
      bindLangs();
      if (window.gsap && !LB.calm) gsap.fromTo(detail.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8, stagger: .08, ease: 'expo.out' });
      if (focus) { var h = detail.querySelector('h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    };
    if (window.gsap && !LB.calm && detail.children.length) gsap.to(detail.children, { opacity: 0, y: -12, duration: .25, onComplete: swap });
    else swap();
  }
  function bindLangs() {
    detail.querySelectorAll('[data-lang-src]').forEach(function (b) {
      b.addEventListener('click', function () {
        var img = detail.querySelector('.book-detail__cover img');
        detail.querySelectorAll('[data-lang-src]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        img.src = b.getAttribute('data-lang-src');
        img.srcset = b.getAttribute('data-lang-srcset');
        img.alt = b.getAttribute('data-lang-alt');
      });
    });
  }
  if (shelf) {
    shelf.addEventListener('click', function (e) { var b = e.target.closest('.shelf-book'); if (b) selectBook(b.getAttribute('data-book'), true); });
    bindLangs();
  }
  d.querySelectorAll('[data-filter]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      d.querySelectorAll('[data-filter]').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      var first = null;
      d.querySelectorAll('.shelf-book').forEach(function (b) {
        var match = f === 'all' || b.getAttribute('data-genre') === f;
        b.classList.toggle('is-dim', !match);
        if (match && !first) first = b;
      });
      var cur = d.querySelector('.shelf-book[aria-pressed="true"]');
      if (first && cur && cur.classList.contains('is-dim')) selectBook(first.getAttribute('data-book'));
    });
  });

  /* ---------- Parcours filters ---------- */
  d.querySelectorAll('[data-evt-filter]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-evt-filter');
      d.querySelectorAll('[data-evt-filter]').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      d.querySelectorAll('.year-block').forEach(function (yb) {
        var any = false;
        yb.querySelectorAll('.event').forEach(function (ev) {
          var types = ev.getAttribute('data-type');
          var ok = f === 'all' || f.split(',').indexOf(types) > -1;
          ev.hidden = !ok; if (ok) any = true;
        });
        yb.hidden = !any;
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Wall (voir au mur) ---------- */
  var wall = d.querySelector('[data-wall]');
  var wallState = { work: 0, cm: 90 };
  function placeWall() {
    if (!wall) return;
    var cfg = DATA.walls.land, works = DATA.wallWorks, w = works[wallState.work];
    var long = wallState.cm, ratio = w.w / w.h;
    var wcm = ratio >= 1 ? long : long * ratio, hcm = ratio >= 1 ? long / ratio : long;
    var pw = wcm * cfg.pxcm, ph = hcm * cfg.pxcm;
    var art = wall.querySelector('.wall__art'), dim = wall.querySelector('.wall__dim');
    var pc = function (v, t) { return (v / t * 100).toFixed(3) + '%'; };
    art.style.width = pc(pw, cfg.w); art.style.height = pc(ph, cfg.h);
    art.style.left = pc(cfg.cx - pw / 2, cfg.w); art.style.top = pc(cfg.cy - ph / 2, cfg.h);
    dim.style.width = pc(pw, cfg.w); dim.style.left = pc(cfg.cx - pw / 2, cfg.w); dim.style.top = pc(cfg.cy + ph / 2 + 12, cfg.h);
    dim.querySelector('span').textContent = Math.round(wcm) + ' × ' + Math.round(hcm) + ' cm';
  }
  if (wall) {
    var artImg = wall.querySelector('.wall__art img');
    d.querySelectorAll('[data-wall-work]').forEach(function (b) {
      b.addEventListener('click', function () {
        wallState.work = parseInt(b.getAttribute('data-wall-work'), 10);
        d.querySelectorAll('[data-wall-work]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        var w = DATA.wallWorks[wallState.work];
        artImg.src = w.src; artImg.alt = w.alt;
        placeWall();
      });
    });
    d.querySelectorAll('[data-wall-size]').forEach(function (b) {
      b.addEventListener('click', function () {
        wallState.cm = parseInt(b.getAttribute('data-wall-size'), 10);
        d.querySelectorAll('[data-wall-size]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        placeWall();
      });
    });
    placeWall();
  }

  /* ---------- Motion ---------- */
  LB.init(function () {
    var calm = LB.calm;
    var gsap = window.gsap;

    /* Opening */
    var opening = d.querySelector('.opening');
    var heroFog = d.querySelector('.hero [data-fog]');
    function revealFog(dur) {
      var go = function () { if (heroFog && heroFog._fog) heroFog._fog.reveal(dur); };
      if (heroFog && heroFog._fog) go(); else window.addEventListener('lb:fog-ready', go, { once: true });
    }
    var heroName = d.querySelectorAll('.hero__name .line');
    var heroRest = d.querySelectorAll('.hero__text .eyebrow, .hero__haiku, .hero__cue');
    function heroIn(delay) {
      if (calm) return;
      if (window.SplitText) {
        heroName.forEach(function (l, i) {
          var sp = new SplitText(l, { type: 'chars', charsClass: 'sc' });
          gsap.from(sp.chars, { opacity: 0, filter: 'blur(16px)', yPercent: 40, duration: 1.4, ease: 'expo.out', stagger: { each: .035, from: 'random' }, delay: delay + i * .15 });
        });
      }
      gsap.from(heroRest, { opacity: 0, y: 24, duration: 1.2, ease: 'expo.out', stagger: .1, delay: delay + .5 });
      gsap.from('.hero__figure', { scale: 1.035, duration: 2.6, ease: 'expo.out', delay: delay });
    }
    var seen = LB.store.sget('lb-opened');
    if (!calm && opening && !seen) {
      LB.store.sset('lb-opened', '1');
      opening.classList.add('is-active');
      if (LB.lenis) LB.lenis.stop();
      var enso = opening.querySelector('.opening__enso img');
      var tl = gsap.timeline({ onComplete: function () { opening.classList.remove('is-active'); if (LB.lenis) LB.lenis.start(); } });
      tl.fromTo(enso, { '--a': '0deg' }, { '--a': '362deg', duration: 1.05, ease: 'power2.inOut' }, 0);
      var nm = opening.querySelector('.opening__name');
      if (window.SplitText) { var sp = new SplitText(nm, { type: 'chars' }); tl.from(sp.chars, { opacity: 0, filter: 'blur(10px)', duration: .7, stagger: .028, ease: 'power2.out' }, .45); }
      tl.from('.opening__role', { opacity: 0, y: 8, duration: .5 }, .8);
      tl.to(opening, { opacity: 0, duration: .6, ease: 'sine.inOut' }, 1.55);
      tl.call(function () { revealFog(1.5); heroIn(0); }, null, 1.6);
      setTimeout(function () { if (opening.classList.contains('is-active')) { opening.classList.remove('is-active'); if (LB.lenis) LB.lenis.start(); } }, 4200);
    } else {
      revealFog(calm ? 0 : 1.4);
      heroIn(.1);
    }

    if (calm) return;
    var desktop = LB.desktop();

    /* Hero scroll: text drifts up, fog closes behind the visitor */
    gsap.to('.hero__text', { yPercent: -18, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__figure', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    if (heroFog) ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onUpdate: function (s) { if (heroFog._fog) heroFog._fog.setDensity(1 + s.progress * 1.2); } });

    /* Release: growth rings + book turning toward the reader */
    var rings = d.querySelectorAll('.release .rings circle');
    rings.forEach(function (c) { var L = 2 * Math.PI * c.r.baseVal.value; c.style.strokeDasharray = L; c.style.strokeDashoffset = L; });
    gsap.to(rings, { strokeDashoffset: 0, ease: 'none', stagger: .06, scrollTrigger: { trigger: '.release', start: 'top 80%', end: 'center 45%', scrub: .8 } });
    var book = d.querySelector('.release .book3d__inner');
    if (book) {
      gsap.fromTo(book, { rotationY: -48, rotationX: 10, y: 60 }, { rotationY: -18, rotationX: 3, y: 0, ease: 'none', scrollTrigger: { trigger: '.release', start: 'top 85%', end: 'center 50%', scrub: 1 } });
      if (LB.fine) {
        var stage = d.querySelector('.release__stage');
        var tz = gsap.quickTo('.release .book3d', 'rotationY', { duration: 1, ease: 'power3' }), tx = gsap.quickTo('.release .book3d', 'rotationX', { duration: 1, ease: 'power3' });
        stage.addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(); tz(((e.clientX - r.left) / r.width - .5) * 22); tx(-((e.clientY - r.top) / r.height - .5) * 14); });
        stage.addEventListener('pointerleave', function () { tz(0); tx(0); });
      }
    }

    /* Manifesto: words light up as you read */
    var mt = d.querySelector('.manifesto__text');
    if (mt && window.SplitText) {
      var sp2 = new SplitText(mt, { type: 'words', wordsClass: 'w' });
      gsap.fromTo(sp2.words, { opacity: .14 }, { opacity: 1, ease: 'none', stagger: .05, scrollTrigger: { trigger: mt, start: 'top 78%', end: 'bottom 45%', scrub: .6 } });
    }

    /* Series: horizontal walk through six rooms */
    var hs = d.querySelector('.hscroll'), track = hs && hs.querySelector('.hscroll__track');
    if (hs && track && desktop) {
      var cards = track.querySelectorAll('.series-card');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var bar = hs.querySelector('.hscroll__progress i');
      hs.classList.add('is-pinned');
      var hTween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: {
        trigger: hs, start: 'top top+=' + 70, end: function () { return '+=' + dist(); }, pin: true, scrub: .7, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) {
          if (bar) bar.style.transform = 'scaleX(' + s.progress + ')';
          var c = window.innerWidth / 2, best = null, bd = 1e9;
          cards.forEach(function (card) { var r = card.getBoundingClientRect(), dd = Math.abs(r.left + r.width / 2 - c); if (dd < bd) { bd = dd; best = card; } });
          if (best) LB.tint(best.getAttribute('data-color'));
        },
        onLeave: function () { LB.tint(null); }, onLeaveBack: function () { LB.tint(null); }
      } });
      cards.forEach(function (card) {
        var img = card.querySelector('img');
        gsap.fromTo(img, { filter: 'blur(10px) brightness(.55)' }, { filter: 'blur(0px) brightness(1)', ease: 'none', scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left right', end: 'left 45%', scrub: true } });
      });
    }

    /* Shelf: the spines turn to show their covers */
    gsap.fromTo('.shelf-book', { rotationY: -78, x: -20, opacity: .3, transformOrigin: '0% 50%' }, { rotationY: 0, x: 0, opacity: 1, duration: 1.6, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.shelf', start: 'top 82%', once: true } });

    /* Parcours: rings grow from the heart of the trunk; the current year lights up */
    var trunk = d.querySelector('.trunk');
    if (trunk) {
      var trings = trunk.querySelectorAll('.ring');
      trings.forEach(function (c) { var L = 2 * Math.PI * c.r.baseVal.value; c.style.strokeDasharray = c.classList.contains('is-future') ? '' : L; if (!c.classList.contains('is-future')) c.style.strokeDashoffset = L; });
      gsap.to(Array.prototype.filter.call(trings, function (c) { return !c.classList.contains('is-future'); }), { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: .14, scrollTrigger: { trigger: trunk, start: 'top 75%', once: true } });
      var label = trunk.querySelector('.trunk__year b'), sub = trunk.querySelector('.trunk__year span');
      d.querySelectorAll('.year-block').forEach(function (yb) {
        ScrollTrigger.create({ trigger: yb, start: 'top 55%', end: 'bottom 55%', onToggle: function (s) {
          if (!s.isActive) return;
          var y = yb.getAttribute('data-year');
          trings.forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('data-year') === y); });
          if (label.textContent !== y) { gsap.fromTo(label, { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: .6 }); label.textContent = y; }
          sub.textContent = yb.getAttribute('data-summary');
        } });
      });
      trings.forEach(function (c) {
        c.addEventListener('click', function () { var yb = d.querySelector('.year-block[data-year="' + c.getAttribute('data-year') + '"]'); if (yb && LB.lenis) LB.lenis.scrollTo(yb, { offset: -120 }); });
      });
    }

    /* Marquee of distinctions, speeding up with the scroll */
    var mq = d.querySelector('.marquee__track');
    if (mq) {
      var half = mq.scrollWidth / 2;
      var loop = gsap.to(mq, { x: -half, duration: 60, ease: 'none', repeat: -1 });
      var boost = { v: 1 };
      ScrollTrigger.create({ trigger: '.distinctions', start: 'top bottom', end: 'bottom top', onUpdate: function (s) {
        var v = Math.min(5, 1 + Math.abs(s.getVelocity()) / 300);
        gsap.to(boost, { v: v, duration: .2, overwrite: true, onUpdate: function () { loop.timeScale(boost.v); }, onComplete: function () { gsap.to(boost, { v: 1, duration: 1.2, onUpdate: function () { loop.timeScale(boost.v); } }); } });
      } });
    }

    /* Contact: the ensō closes around the call */
    var er = d.querySelector('.contact__title .enso-ring');
    if (er) gsap.fromTo(er, { '--a': '0deg' }, { '--a': '362deg', duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: er, start: 'top 80%', once: true } });
  });
})();
