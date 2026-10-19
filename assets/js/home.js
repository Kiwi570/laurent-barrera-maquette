/* Accueil : ouverture orchestrée, brume de l'ouverture, marche horizontale à travers les séries. */
(function () {
  'use strict';
  var d = document;
  var LB = window.LB;

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
  });
})();
