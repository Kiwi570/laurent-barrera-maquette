/* Laurent Barrera — maquette. Shared behaviours for every page. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, body = d.body;
  root.classList.add('js');

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} },
    sget: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    sset: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} },
    sdel: function (k) { try { window.sessionStorage.removeItem(k); } catch (e) {} }
  };

  var prefersReduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saved = store.get('lb-calm');
  var calm = saved === null ? prefersReduced : saved === '1';
  if (calm) root.classList.add('calm');
  if (saved === '0') root.classList.add('motion-ok');
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var DATA = window.LB_DATA || {};

  var LB = window.LB = { calm: calm, fine: fine, store: store, data: DATA, gsap: hasGsap, lenis: null, inits: [], started: false };
  LB.init = function (fn) { if (LB.started) { try { fn(LB); } catch (e) { console.error(e); } } else LB.inits.push(fn); };
  LB.mq = function (q) { return window.matchMedia ? matchMedia(q).matches : false; };
  LB.desktop = function () { return LB.mq('(min-width: 901px)'); };

  /* ---------- Toast ---------- */
  var toastEl, toastTimer;
  LB.toast = function (msg) {
    if (!toastEl) {
      toastEl = d.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.hidden = false;
    if (hasGsap && !calm) gsap.fromTo(toastEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'expo.out' });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 5200);
  };

  /* ---------- Colour tint of the night ---------- */
  var NIGHT = [14, 18, 16];
  function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mixNight(hex, a) {
    var c = hexToRgb(hex);
    var r = c.map(function (v, i) { return Math.round(NIGHT[i] * (1 - a) + v * a); });
    return 'rgb(' + r.join(',') + ')';
  }
  var currentTint = null;
  LB.tint = function (hex) {
    var target = hex ? mixNight(hex, .12) : 'rgb(14,18,16)';
    if (target === currentTint) return;
    currentTint = target;
    if (hasGsap && !calm) gsap.to(body, { backgroundColor: target, duration: 1.2, ease: 'sine.out', overwrite: true });
    else body.style.backgroundColor = target;
  };

  /* ---------- Calm mode toggle ---------- */
  d.querySelectorAll('[data-calm-toggle]').forEach(function (b) {
    b.setAttribute('aria-pressed', calm ? 'true' : 'false');
    b.addEventListener('click', function () {
      store.set('lb-calm', calm ? '0' : '1');
      store.sset('lb-scroll', String(window.scrollY || 0));
      window.location.reload();
    });
  });
  var restore = store.sget('lb-scroll');
  if (restore !== null) { store.sdel('lb-scroll'); window.addEventListener('load', function () { window.scrollTo(0, parseInt(restore, 10) || 0); }); }

  /* ---------- Mobile menu ---------- */
  var menu = d.getElementById('mobile-menu');
  var lastFocus = null;
  function trap(container, e) {
    if (e.key !== 'Tab') return;
    var f = container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
    f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null || el === d.activeElement; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  LB.trap = trap;
  function openMenu() {
    if (!menu) return;
    lastFocus = d.activeElement;
    menu.hidden = false;
    d.querySelectorAll('[data-menu-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    if (LB.lenis) LB.lenis.stop();
    if (hasGsap && !calm) gsap.from(menu.querySelectorAll('a'), { y: 30, opacity: 0, duration: .7, stagger: .04, ease: 'expo.out' });
    var c = menu.querySelector('[data-menu-close]'); if (c) c.focus();
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    d.querySelectorAll('[data-menu-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (LB.lenis) LB.lenis.start();
    if (lastFocus) lastFocus.focus();
  }
  LB.closeMenu = closeMenu;
  d.querySelectorAll('[data-menu-open]').forEach(function (b) { b.addEventListener('click', openMenu); });
  if (menu) {
    menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); trap(menu, e); });
    menu.querySelectorAll('[data-menu-close], a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  /* ---------- Copy buttons ---------- */
  d.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy');
      var done = function () { var t = b.textContent; b.textContent = 'Copié'; setTimeout(function () { b.textContent = t; }, 1600); };
      var fallback = function () {
        var target = b.closest('.coord') && b.closest('.coord').querySelector('.v');
        if (target) { var r = d.createRange(); r.selectNodeContents(target); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
        LB.toast('Texte sélectionné : utilisez Copier de votre appareil.');
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
        else fallback();
      } catch (e) { fallback(); }
    });
  });

  /* ---------- Simulated forms ---------- */
  d.querySelectorAll('form[data-sim]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var st = form.querySelector('.form__status');
      if (st) { st.hidden = false; st.textContent = form.getAttribute('data-sim'); }
      LB.toast('Simulation : rien n’a été envoyé.');
    });
  });
  function fillForm(form, subject, message) {
    var sel = form.querySelector('select[name="subject"]'), msg = form.querySelector('textarea');
    if (sel && subject) { for (var k = 0; k < sel.options.length; k++) if (sel.options[k].text === subject) sel.selectedIndex = k; }
    if (msg && message) msg.value = message;
    var target = form.closest('section') || form;
    if (LB.lenis) LB.lenis.scrollTo(target, { offset: -40, duration: 1.4 }); else target.scrollIntoView();
    setTimeout(function () { if (msg) msg.focus({ preventScroll: true }); }, 900);
  }
  LB.prefill = function (subject, message, page) {
    var form = d.querySelector('form[data-prefill-target]');
    if (!form) {
      store.sset('lb-prefill', JSON.stringify({ s: subject || '', m: message || '' }));
      window.location.href = (DATA.prefix || '') + (page || 'contact.html');
      return;
    }
    fillForm(form, subject, message);
  };
  LB.restorePrefill = function () {
    var raw = store.sget('lb-prefill');
    if (!raw) return;
    store.sdel('lb-prefill');
    var form = d.querySelector('form[data-prefill-target]');
    if (!form) return;
    try { var o = JSON.parse(raw); fillForm(form, o.s, o.m); } catch (e) {}
  };
  d.addEventListener('click', function (e) {
    var p = e.target.closest('[data-prefill]');
    if (!p) return;
    e.preventDefault();
    LB.prefill(p.getAttribute('data-prefill'), p.getAttribute('data-message'), p.getAttribute('data-prefill-page'));
  });

  /* ---------- Cart (simulated) ---------- */
  var BOOKS = {};
  (DATA.books || []).forEach(function (b) { BOOKS[b.id] = b; });
  var cart = {};
  try { cart = JSON.parse(store.get('lb-cart') || '{}') || {}; } catch (e) { cart = {}; }
  var drawer = d.getElementById('cart'), backdrop = d.getElementById('cart-backdrop');
  function cartCount() { var n = 0; for (var k in cart) n += cart[k]; return n; }
  function saveCart() { store.set('lb-cart', JSON.stringify(cart)); }
  function fmt(n) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'; }
  function renderCart() {
    var n = cartCount();
    d.querySelectorAll('.cart-count').forEach(function (c) { c.textContent = n; c.hidden = n === 0; });
    if (!drawer) return;
    var bodyEl = drawer.querySelector('.drawer__body');
    var total = 0;
    bodyEl.innerHTML = '';
    if (!n) { bodyEl.innerHTML = '<p class="cart-empty">Le panier est vide. Le livre Koï peut y être ajouté depuis la section Livres.</p>'; }
    Object.keys(cart).forEach(function (id) {
      var b = BOOKS[id]; if (!b || !cart[id]) return;
      total += b.price * cart[id];
      var line = d.createElement('div');
      line.className = 'cart-line';
      line.innerHTML = '<img src="' + (DATA.prefix || '') + b.coverSrc + '" alt="" width="64" height="85">' +
        '<div><b>' + b.title + '</b><span class="mono">' + fmt(b.price) + ' l’exemplaire</span><div class="qty"><button type="button" aria-label="Retirer un exemplaire" data-q="-1">−</button><output aria-live="polite">' + cart[id] + '</output><button type="button" aria-label="Ajouter un exemplaire" data-q="1">+</button></div></div>' +
        '<span>' + fmt(b.price * cart[id]) + '</span>';
      line.querySelectorAll('[data-q]').forEach(function (q) {
        q.addEventListener('click', function () { cart[id] = Math.max(0, cart[id] + parseInt(q.getAttribute('data-q'), 10)); if (!cart[id]) delete cart[id]; saveCart(); renderCart(); });
      });
      bodyEl.appendChild(line);
    });
    drawer.querySelector('[data-total]').textContent = fmt(total);
    var checkout = drawer.querySelector('[data-checkout]');
    if (checkout) checkout.disabled = !n;
  }
  var cartReturn = null;
  function openCart() {
    if (!drawer) return;
    cartReturn = d.activeElement;
    renderCart();
    drawer.hidden = false; backdrop.hidden = false;
    var st = drawer.querySelector('.form__status'); if (st) st.hidden = true;
    if (LB.lenis) LB.lenis.stop();
    if (hasGsap && !calm) { gsap.fromTo(drawer, { xPercent: 100 }, { xPercent: 0, duration: .7, ease: 'expo.out' }); gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: .4 }); }
    drawer.querySelector('[data-cart-close]').focus();
  }
  function closeCart() {
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true; backdrop.hidden = true;
    if (LB.lenis) LB.lenis.start();
    if (cartReturn) cartReturn.focus();
  }
  d.querySelectorAll('[data-open-cart]').forEach(function (b) { b.addEventListener('click', openCart); });
  if (drawer) {
    drawer.querySelector('[data-cart-close]').addEventListener('click', closeCart);
    backdrop.addEventListener('click', closeCart);
    drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); trap(drawer, e); });
    drawer.querySelector('[data-checkout]').addEventListener('click', function () {
      var st = drawer.querySelector('.form__status');
      st.hidden = false;
      st.textContent = 'Simulation : aucune commande n’a été passée. Dans le site final, Laurent reçoit la demande et confirme l’envoi et le paiement par mail.';
    });
  }
  LB.addToCart = function (id, fromEl) {
    cart[id] = (cart[id] || 0) + 1; saveCart();
    var hd = d.querySelector('.site-header'); if (hd) hd.classList.remove('is-hidden');
    var btn = d.querySelector('.site-header [data-open-cart]');
    var img = fromEl && fromEl.querySelector ? fromEl.querySelector('img') : null;
    if (hasGsap && !calm && img && btn) {
      var r = img.getBoundingClientRect(), t = btn.getBoundingClientRect();
      var fly = img.cloneNode(); fly.className = 'flyer'; fly.removeAttribute('srcset');
      fly.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
      body.appendChild(fly);
      gsap.to(fly, { x: t.left + t.width / 2 - r.left - r.width / 2, y: t.top + t.height / 2 - r.top - r.height / 2, scale: .08, rotation: -12, opacity: .3, duration: .9, ease: 'power3.in', onComplete: function () { fly.remove(); renderCart(); gsap.fromTo(btn, { scale: 1.25 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .4)' }); } });
    } else renderCart();
    LB.toast(BOOKS[id].title + ' a été ajouté au panier (simulation).');
  };
  renderCart();

  /* ---------- Countdown « sève » ---------- */
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  LB.daysLeft = function () {
    var rel = DATA.release ? new Date(DATA.release).getTime() : 0;
    return Math.ceil((rel - Date.now()) / 86400000);
  };
  d.querySelectorAll('[data-days-left]').forEach(function (el) {
    var n = LB.daysLeft();
    el.textContent = n > 0 ? 'J-' + n : 'Disponible';
  });
  function buildCountdown(el) {
    var target = new Date(el.getAttribute('data-countdown')).getTime();
    var units = el.querySelectorAll('[data-unit]');
    var sr = el.querySelector('.sr-only');
    var prev = {};
    function setDigits(numEl, str, key) {
      var digits = numEl.querySelectorAll('.digit');
      if (digits.length !== str.length) {
        numEl.innerHTML = '';
        for (var i = 0; i < str.length; i++) { var s = d.createElement('span'); s.className = 'digit'; s.innerHTML = '<span>' + str[i] + '</span>'; numEl.appendChild(s); }
        prev[key] = str; return;
      }
      for (var j = 0; j < str.length; j++) {
        if (prev[key] && prev[key][j] === str[j]) continue;
        var slot = digits[j], old = slot.firstElementChild, nu = d.createElement('span');
        nu.textContent = str[j];
        slot.appendChild(nu);
        if (hasGsap && !calm) {
          gsap.fromTo(nu, { yPercent: 100 }, { yPercent: 0, duration: .7, ease: 'expo.out' });
          gsap.to(old, { yPercent: -100, duration: .7, ease: 'expo.out', onComplete: (function (o) { return function () { o.remove(); }; })(old) });
        } else old.remove();
      }
      prev[key] = str;
    }
    function tick() {
      var ms = target - Date.now();
      if (ms <= 0) { el.classList.add('is-out'); return false; }
      var s = Math.floor(ms / 1000), dd = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
      var vals = { d: pad(dd, 2), h: pad(hh, 2), m: pad(mm, 2), s: pad(ss, 2) };
      units.forEach(function (u) { var k = u.getAttribute('data-unit'); setDigits(u.querySelector('.countdown__num'), vals[k], k); });
      if (sr) sr.textContent = 'Parution dans ' + dd + ' jours et ' + hh + ' heures.';
      return true;
    }
    if (tick()) { var iv = setInterval(function () { if (!tick()) clearInterval(iv); }, 1000); }
  }
  d.querySelectorAll('[data-countdown]').forEach(buildCountdown);

  /* ---------- Language chips on covers (generic) ---------- */

  /* ---------- Page transitions (fog veil) ---------- */
  var veil = d.querySelector('.veil');
  function isInternal(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|sms|javascript):/i.test(href)) return false;
    var u; try { u = new URL(href, window.location.href); } catch (e) { return false; }
    if (u.origin !== window.location.origin) return false;
    if (u.pathname === window.location.pathname && u.hash) return false;
    return true;
  }

  /* ---------- Start once fonts are ready ---------- */
  var fontsReady = new Promise(function (res) {
    var done = false; var go = function () { if (!done) { done = true; res(); } };
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(go);
    setTimeout(go, 1400);
  });

  function start() {
    if (!hasGsap) { LB.inits.forEach(function (fn) { try { fn(LB); } catch (e) { console.error(e); } }); return; }
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    gsap.config({ nullTargetWarn: false });

    /* Smooth scroll */
    if (!calm && window.Lenis) {
      var lenis = new Lenis({ lerp: .09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.2 });
      LB.lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* Anchor links */
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[href*="#"]');
      if (!a) return;
      var u; try { u = new URL(a.getAttribute('href'), window.location.href); } catch (er) { return; }
      if (u.pathname !== window.location.pathname || !u.hash) return;
      var el = d.getElementById(u.hash.slice(1));
      if (!el) return;
      e.preventDefault();
      closeMenu();
      if (LB.lenis) LB.lenis.scrollTo(el, { offset: -20, duration: 1.6 }); else el.scrollIntoView();
      el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true });
    });

    /* Header hide on scroll down */
    var header = d.querySelector('.site-header'), lastY = window.scrollY;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function () {
      var y = window.scrollY;
      if (header) header.classList.toggle('is-hidden', y > lastY && y > 240 && !(menu && !menu.hidden));
      lastY = y;
    } });

    /* Page transition veil */
    if (veil && !calm) {
      if (store.sget('lb-veil')) {
        store.sdel('lb-veil');
        veil.classList.add('is-on');
        gsap.fromTo(veil, { opacity: 1 }, { opacity: 0, duration: 1.1, ease: 'sine.inOut', delay: .1, onComplete: function () { veil.classList.remove('is-on'); } });
      }
      d.addEventListener('click', function (e) {
        var a = e.target.closest('a[href]');
        if (!isInternal(a) || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
        e.preventDefault();
        var href = a.href;
        veil.classList.add('is-on');
        gsap.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: .6, ease: 'sine.in', onComplete: function () { store.sset('lb-veil', '1'); window.location.href = href; } });
      });
      window.addEventListener('pageshow', function (e) { if (e.persisted) { veil.classList.remove('is-on'); gsap.set(veil, { opacity: 0 }); } });
    }

    /* Cursor ensō */
    if (fine && !calm) {
      root.classList.add('has-cursor');
      var cur = d.createElement('div');
      cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true');
      cur.innerHTML = '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" transform="rotate(-70 22 22)"></circle></svg><i class="cursor-dot"></i><span class="cursor-label">Voir</span>';
      body.appendChild(cur);
      var label = cur.querySelector('.cursor-label');
      var qx = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
      gsap.set(cur, { opacity: 0 });
      var seenMove = false;
      window.addEventListener('pointermove', function (e) {
        if (!seenMove) { seenMove = true; gsap.set(cur, { x: e.clientX, y: e.clientY }); gsap.to(cur, { opacity: 1, duration: .4 }); }
        qx(e.clientX); qy(e.clientY);
      }, { passive: true });
      d.addEventListener('pointerover', function (e) {
        var v = e.target.closest('[data-cursor]');
        var l = e.target.closest('a, button, [role="button"], label, select, summary');
        cur.classList.toggle('is-view', !!v);
        cur.classList.toggle('is-link', !v && !!l);
        if (v) label.textContent = v.getAttribute('data-cursor');
      });
      d.addEventListener('pointerleave', function () { gsap.to(cur, { opacity: 0, duration: .3 }); });
      d.addEventListener('pointerenter', function () { if (seenMove) gsap.to(cur, { opacity: 1, duration: .3 }); });
    }

    /* Magnetic buttons */
    if (fine && !calm) {
      d.querySelectorAll('[data-magnetic]').forEach(function (el) {
        var s = parseFloat(el.getAttribute('data-magnetic')) || .35;
        var xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * s); yTo((e.clientY - r.top - r.height / 2) * s); });
        el.addEventListener('pointerleave', function () { gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .35)' }); });
      });
      d.querySelectorAll('[data-tilt]').forEach(function (el) {
        var m = parseFloat(el.getAttribute('data-tilt')) || 6;
        var rx = gsap.quickTo(el, 'rotationX', { duration: .8, ease: 'power3' }), ry = gsap.quickTo(el, 'rotationY', { duration: .8, ease: 'power3' });
        gsap.set(el, { transformPerspective: 900 });
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * m * 2); rx(-((e.clientY - r.top) / r.height - .5) * m * 2); });
        el.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });
    }

    if (!calm) {
      /* Focus-pull titles (blur to sharp, like a lens) */
      if (window.SplitText) {
        d.querySelectorAll('[data-focus]').forEach(function (el) {
          var split = new SplitText(el, { type: 'words,chars', wordsClass: 'sw', charsClass: 'sc' });
          gsap.from(split.chars, { opacity: 0, filter: 'blur(12px)', yPercent: 30, duration: 1.2, ease: 'expo.out', stagger: { each: .025, from: 'random' },
            scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        });
      }
      /* Simple reveals */
      d.querySelectorAll('[data-reveal]').forEach(function (el) {
        gsap.from(el, { y: 44, opacity: 0, duration: 1.2, ease: 'expo.out', delay: parseFloat(el.getAttribute('data-reveal')) || 0, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
      });
      d.querySelectorAll('[data-stagger]').forEach(function (el) {
        gsap.from(el.children, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });
      /* Photo reveal: the photograph comes into focus out of the fog (never cropped at rest) */
      d.querySelectorAll('[data-unveil]').forEach(function (el) {
        gsap.fromTo(el, { clipPath: 'inset(18% 8% 18% 8%)', filter: 'blur(14px) brightness(.6)' }, { clipPath: 'inset(0% 0% 0% 0%)', filter: 'blur(0px) brightness(1)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true }, clearProps: 'filter,clipPath' });
      });
      /* Parallax */
      d.querySelectorAll('[data-parallax]').forEach(function (el) {
        var amt = parseFloat(el.getAttribute('data-parallax')) || .12;
        gsap.fromTo(el, { yPercent: amt * 100 }, { yPercent: -amt * 100, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }

    /* Counters */
    d.querySelectorAll('[data-count]').forEach(function (el) {
      var to = parseInt(el.getAttribute('data-count'), 10);
      if (calm) { el.textContent = to; return; }
      var o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, { v: to, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: function () { el.textContent = Math.round(o.v); } });
    });

    /* Night tint per section */
    var tints = d.querySelectorAll('[data-tint]');
    tints.forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 45%', onToggle: function (self) {
        if (self.isActive) LB.tint(el.getAttribute('data-tint'));
        else { var any = Array.prototype.some.call(tints, function (t) { var r = t.getBoundingClientRect(); return r.top < innerHeight * .55 && r.bottom > innerHeight * .45; }); if (!any) LB.tint(null); }
      } });
    });

    LB.inits.forEach(function (fn) { try { fn(LB); } catch (e) { console.error(e); } });
    ScrollTrigger.refresh();
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* Spores: slow particles of light drifting up, drawn toward calls to action */
  function spores() {
    if (calm) return;
    var c = d.createElement('canvas');
    c.className = 'spores'; c.setAttribute('aria-hidden', 'true');
    body.insertBefore(c, body.firstChild);
    var ctx = c.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var N = window.innerWidth < 700 ? 26 : 64, P = [];
    var attract = null;
    function resize() { W = window.innerWidth; H = window.innerHeight; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    resize(); window.addEventListener('resize', resize);
    for (var i = 0; i < N; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: .5 + Math.random() * 1.5, vx: (Math.random() - .5) * .12, vy: -.08 - Math.random() * .22, ph: Math.random() * 6.28, f: .25 + Math.random() * .45, a: .25 + Math.random() * .5, amber: Math.random() < .45 });
    d.querySelectorAll('[data-attract]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { var r = el.getBoundingClientRect(); attract = { x: r.left + r.width / 2, y: r.top + r.height / 2, el: el }; });
      el.addEventListener('pointerleave', function () { attract = null; });
    });
    var t0 = performance.now(), running = true;
    d.addEventListener('visibilitychange', function () { running = !d.hidden; if (running) requestAnimationFrame(loop); });
    function loop(now) {
      if (!running) return;
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      if (attract) { var rr = attract.el.getBoundingClientRect(); attract.x = rr.left + rr.width / 2; attract.y = rr.top + rr.height / 2; }
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.x += p.vx + Math.sin(t * .3 + p.ph) * .08; p.y += p.vy;
        if (attract) { var dx = attract.x - p.x, dy = attract.y - p.y, dist = Math.sqrt(dx * dx + dy * dy); if (dist < 380) { p.x += dx * .012; p.y += dy * .012; } }
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        var al = p.a * (.55 + .45 * Math.sin(t * p.f + p.ph));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = p.amber ? 'rgba(227,197,146,' + al + ')' : 'rgba(237,230,214,' + (al * .7) + ')';
        ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* Add-to-cart buttons */
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add-cart]');
    if (!b) return;
    LB.addToCart(b.getAttribute('data-add-cart'), b.closest('[data-book-card]') || d.querySelector('[data-book-card]'));
  });

  var domReady = new Promise(function (res) { if (d.readyState === 'complete') res(); else d.addEventListener('DOMContentLoaded', function () { res(); }, { once: true }); });
  Promise.all([fontsReady, domReady]).then(function () { spores(); start(); LB.started = true; setTimeout(LB.restorePrefill, 600); });
})();
