/* Page série : salle horizontale + visionneuse (loupe, voir au mur, fondu de brume) */
(function () {
  'use strict';
  var d = document, LB = window.LB, DATA = window.LB_DATA || {};
  var S = DATA.serie;
  if (!S) return;
  var works = S.works;

  /* ---------- Viewer ---------- */
  var viewer = d.getElementById('viewer');
  var vImg = viewer.querySelector('.viewer__img');
  var vStage = viewer.querySelector('.viewer__stage');
  var vCanvas = viewer.querySelector('.viewer__canvas');
  var lens = viewer.querySelector('.lens');
  var cap = viewer.querySelector('.viewer__caption');
  var wallView = viewer.querySelector('.wall-view');
  var wallBg = wallView.querySelector('.wall__bg');
  var wallArt = wallView.querySelector('.wall__art');
  var wallArtImg = wallArt.querySelector('img');
  var wallDim = wallView.querySelector('.wall__dim');
  var current = 0, returnFocus = null, busy = false, dissolve = null, wallCm = 90;
  var ZOOM = 2.6;

  function srcOf(w, size) { var s = w.sizes.filter(function (x) { return x <= size; }); var pick = s.length ? s[s.length - 1] : w.sizes[0]; return DATA.prefix + 'assets/img/' + w.key + '-' + pick + '.webp'; }
  function biggest(w) { return DATA.prefix + 'assets/img/' + w.key + '-' + w.sizes[w.sizes.length - 1] + '.webp'; }
  function srcset(w) { return w.sizes.map(function (s) { return DATA.prefix + 'assets/img/' + w.key + '-' + s + '.webp ' + s + 'w'; }).join(', '); }

  function setCaption(i) {
    var w = works[i];
    cap.querySelector('[data-cap-no]').textContent = 'N° ' + String(i + 1).padStart(2, '0') + ' / ' + String(works.length).padStart(2, '0');
    cap.querySelector('[data-cap-alt]').textContent = w.alt;
    viewer.setAttribute('aria-label', S.name + ', photographie ' + (i + 1) + ' sur ' + works.length);
  }
  function load(i) {
    return new Promise(function (res) {
      var w = works[i], im = new Image();
      im.decoding = 'async';
      im.sizes = '100vw'; im.srcset = srcset(w); im.src = srcOf(w, 1600);
      var done = function () { res(im); };
      if (im.decode) im.decode().then(done, done); else { im.onload = done; im.onerror = done; }
    });
  }
  function show(i, animate) {
    if (busy) return;
    i = (i + works.length) % works.length;
    var w = works[i];
    if (!animate || LB.calm) {
      vImg.srcset = srcset(w); vImg.src = srcOf(w, 1600); vImg.alt = w.alt; vImg.width = w.w; vImg.height = w.h;
      current = i; setCaption(i); placeWall(); LB.tint(w.color); return;
    }
    busy = true;
    var from = vImg;
    load(i).then(function (im) {
      var finish = function () {
        vImg.srcset = im.srcset; vImg.src = im.src; vImg.alt = w.alt; vImg.width = w.w; vImg.height = w.h;
        vImg.style.visibility = '';
        current = i; setCaption(i); placeWall(); LB.tint(w.color); busy = false;
      };
      if (!dissolve && window.LBDissolve) dissolve = window.LBDissolve(vCanvas);
      if (dissolve && from.complete && from.naturalWidth) {
        dissolve.run(from, im, finish);
        setTimeout(function () { vImg.style.visibility = 'hidden'; }, 20);
      } else if (window.gsap) {
        gsap.to(vImg, { opacity: 0, filter: 'blur(10px)', duration: .35, onComplete: function () { finish(); gsap.to(vImg, { opacity: 1, filter: 'blur(0px)', duration: .6, clearProps: 'filter' }); } });
      } else finish();
    });
  }
  function open(i, trigger) {
    returnFocus = trigger || d.activeElement;
    viewer.hidden = false;
    d.documentElement.style.overflow = 'hidden';
    if (LB.lenis) LB.lenis.stop();
    show(i, false);
    if (window.gsap && !LB.calm) gsap.fromTo(viewer, { opacity: 0 }, { opacity: 1, duration: .5 });
    viewer.querySelector('[data-v-close]').focus();
  }
  function close() {
    viewer.hidden = true;
    setLoupe(false); setWall(false);
    d.documentElement.style.overflow = '';
    if (LB.lenis) LB.lenis.start();
    LB.tint(null);
    if (returnFocus) returnFocus.focus();
  }
  d.querySelectorAll('[data-open-work]').forEach(function (b) {
    b.addEventListener('click', function () { open(parseInt(b.getAttribute('data-open-work'), 10), b); });
  });
  viewer.querySelector('[data-v-close]').addEventListener('click', close);
  viewer.querySelector('[data-v-prev]').addEventListener('click', function () { show(current - 1, true); });
  viewer.querySelector('[data-v-next]').addEventListener('click', function () { show(current + 1, true); });
  d.addEventListener('keydown', function (e) {
    if (viewer.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') show(current + 1, true);
    else if (e.key === 'ArrowLeft') show(current - 1, true);
    LB.trap(viewer, e);
  });
  var tx = null;
  vStage.addEventListener('touchstart', function (e) { if (!viewer.classList.contains('is-loupe')) tx = e.touches[0].clientX; }, { passive: true });
  vStage.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1), true); tx = null; });

  /* Loupe */
  var loupeBtn = viewer.querySelector('[data-v-loupe]');
  function setLoupe(on) {
    viewer.classList.toggle('is-loupe', on);
    loupeBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!on) lens.classList.remove('is-on');
    else setWall(false);
  }
  loupeBtn.addEventListener('click', function () { setLoupe(!viewer.classList.contains('is-loupe')); });
  function moveLens(e) {
    if (!viewer.classList.contains('is-loupe')) return;
    var r = vImg.getBoundingClientRect(), sr = vStage.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) { lens.classList.remove('is-on'); return; }
    var L = lens.offsetWidth || 220;
    lens.classList.add('is-on');
    lens.style.left = (e.clientX - sr.left - L / 2) + 'px';
    lens.style.top = (e.clientY - sr.top - L / 2) + 'px';
    var big = biggest(works[current]);
    if (lens.getAttribute('data-src') !== big) { lens.style.backgroundImage = 'url("' + big + '")'; lens.setAttribute('data-src', big); }
    lens.style.backgroundSize = (r.width * ZOOM) + 'px ' + (r.height * ZOOM) + 'px';
    lens.style.backgroundPosition = (-(x * ZOOM - L / 2)) + 'px ' + (-(y * ZOOM - L / 2)) + 'px';
  }
  vStage.addEventListener('pointermove', moveLens);
  vStage.addEventListener('pointerdown', moveLens);
  vStage.addEventListener('pointerleave', function () { lens.classList.remove('is-on'); });

  /* Voir au mur, at an illustrative real scale */
  var wallBtn = viewer.querySelector('[data-v-wall]');
  function setWall(on) {
    viewer.classList.toggle('is-wall', on);
    wallBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) { setLoupe(false); placeWall(); }
  }
  wallBtn.addEventListener('click', function () { setWall(!viewer.classList.contains('is-wall')); });
  viewer.querySelectorAll('[data-v-size]').forEach(function (b) {
    b.addEventListener('click', function () {
      wallCm = parseInt(b.getAttribute('data-v-size'), 10);
      viewer.querySelectorAll('[data-v-size]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      placeWall();
    });
  });
  function placeWall() {
    if (!viewer.classList.contains('is-wall')) return;
    var sr = vStage.getBoundingClientRect();
    var cfg = sr.width / sr.height >= 1 ? DATA.walls.land : DATA.walls.port;
    var want = DATA.prefix + 'assets/img/' + cfg.img + '-' + cfg.size + '.webp';
    if (wallBg.getAttribute('src') !== want) wallBg.src = want;
    var s = Math.max(sr.width / cfg.w, sr.height / cfg.h);
    var ox = (sr.width - cfg.w * s) / 2, oy = (sr.height - cfg.h * s) / 2;
    var w = works[current], ratio = w.w / w.h;
    var wcm = ratio >= 1 ? wallCm : wallCm * ratio, hcm = ratio >= 1 ? wallCm / ratio : wallCm;
    var pw = wcm * cfg.pxcm * s, ph = hcm * cfg.pxcm * s;
    var cx = cfg.cx * s + ox, cy = cfg.cy * s + oy;
    wallArtImg.src = srcOf(w, 960); wallArtImg.alt = w.alt;
    wallArt.style.width = pw + 'px'; wallArt.style.height = ph + 'px';
    wallArt.style.left = (cx - pw / 2) + 'px'; wallArt.style.top = (cy - ph / 2) + 'px';
    wallDim.style.width = pw + 'px'; wallDim.style.left = (cx - pw / 2) + 'px'; wallDim.style.top = (cy + ph / 2 + 10) + 'px';
    wallDim.querySelector('span').textContent = Math.round(wcm) + ' × ' + Math.round(hcm) + ' cm';
  }
  window.addEventListener('resize', placeWall);

  viewer.querySelector('[data-v-request]').addEventListener('click', function () {
    var no = 'N° ' + String(current + 1).padStart(2, '0');
    close();
    var sel = d.getElementById('f-work');
    if (sel) sel.value = String(current);
    var target = d.getElementById('tirage');
    if (LB.lenis) LB.lenis.scrollTo(target, { offset: -40 }); else target.scrollIntoView();
    setTimeout(function () { var m = d.getElementById('f-message'); if (m) { if (!m.value) m.value = 'Bonjour, je souhaite connaître le prix d’un tirage de la photographie ' + no + ' de la série ' + S.name + '.'; m.focus({ preventScroll: true }); } }, 800);
  });

  /* ---------- Motion ---------- */
  LB.init(function () {
    var fogEl = d.querySelector('.s-hero [data-fog]');
    var go = function () { if (fogEl && fogEl._fog) fogEl._fog.reveal(LB.calm ? 0 : 1.6); };
    if (fogEl && fogEl._fog) go(); else window.addEventListener('lb:fog-ready', go, { once: true });
    if (LB.calm) return;
    var gsap = window.gsap;
    if (window.SplitText) {
      var sp = new SplitText('.s-hero__title', { type: 'words,chars', charsClass: 'sc' });
      gsap.from(sp.chars, { opacity: 0, filter: 'blur(16px)', yPercent: 40, duration: 1.4, ease: 'expo.out', stagger: { each: .04, from: 'random' }, delay: .2 });
    }
    gsap.from('.s-hero__meta > *, .s-hero__kicker, .crumbs', { opacity: 0, y: 20, duration: 1, stagger: .08, ease: 'expo.out', delay: .6 });

    var room = d.querySelector('.room'), track = room && room.querySelector('.room__track');
    if (room && track && LB.desktop()) {
      var items = track.querySelectorAll('.work');
      var count = room.querySelector('.room__count'), bar = room.querySelector('.room__bar i');
      room.classList.add('is-pinned');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var last = -1;
      var tw = gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: {
        trigger: room, start: 'top top+=' + 80, end: function () { return '+=' + dist(); }, pin: true, scrub: .7, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) {
          if (bar) bar.style.transform = 'scaleX(' + s.progress + ')';
          var best = Math.min(items.length - 1, Math.round(s.progress * (items.length - 1)));
          if (best !== last) { last = best; LB.tint(works[best].color); if (count) count.textContent = String(best + 1).padStart(2, '0') + ' / ' + String(works.length).padStart(2, '0'); }
        },
        onLeave: function () { LB.tint(null); }, onLeaveBack: function () { LB.tint(null); }
      } });
      track.addEventListener('focusin', function (e) {
        var it = e.target.closest('.work'); var st = tw.scrollTrigger;
        if (!it || !st) return;
        var cr = it.getBoundingClientRect(), tr = track.getBoundingClientRect();
        var left = cr.left - tr.left, want = Math.min(dist(), Math.max(0, left - (window.innerWidth - cr.width) / 2));
        var y = st.start + (want / Math.max(1, dist())) * (st.end - st.start);
        if (LB.lenis) LB.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      });
      items.forEach(function (it) {
        gsap.fromTo(it.querySelector('img'), { opacity: .3, scale: 1.05, transformOrigin: '50% 100%' }, { opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: it, containerAnimation: tw, start: 'left right', end: 'left 55%', scrub: true } });
      });
    } else if (room) {
      room.querySelectorAll('.work').forEach(function (it, i) {
        ScrollTrigger.create({ trigger: it, start: 'top 60%', end: 'bottom 40%', onToggle: function (s) { if (s.isActive) LB.tint(works[i].color); } });
      });
    }
  });
})();
