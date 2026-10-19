/* Page livre « Les arbres sacrés du Japon » */
(function () {
  'use strict';
  var d = document, LB = window.LB;
  LB.init(function () {
    var fogEl = d.querySelector('.b-hero [data-fog]');
    var go = function () { if (fogEl && fogEl._fog) fogEl._fog.reveal(LB.calm ? 0 : 1.8); };
    if (fogEl && fogEl._fog) go(); else window.addEventListener('lb:fog-ready', go, { once: true });
    if (LB.calm) return;
    var gsap = window.gsap;

    /* The book rises out of the forest floor */
    if (d.querySelector('.b-hero .book3d__inner')) gsap.fromTo('.b-hero .book3d__inner', { y: 140, rotationX: 28, rotationY: -40, opacity: 0 }, { y: 0, rotationX: 4, rotationY: -20, opacity: 1, duration: 2.2, ease: 'expo.out', delay: .3 });
    else gsap.from('.b-hero__cover figure', { y: 80, opacity: 0, filter: 'blur(12px)', duration: 2, ease: 'expo.out', delay: .3, clearProps: 'filter' });
    if (window.SplitText) {
      var sp = new SplitText('.b-hero__title', { type: 'words,chars', charsClass: 'sc' });
      gsap.from(sp.chars, { opacity: 0, filter: 'blur(14px)', yPercent: 30, duration: 1.3, ease: 'expo.out', stagger: { each: .025, from: 'random' }, delay: .4 });
    }
    gsap.from('.b-hero__text > :not(.b-hero__title)', { opacity: 0, y: 24, duration: 1.1, stagger: .08, ease: 'expo.out', delay: .8 });
    gsap.to('.b-hero__bg img', { yPercent: 12, scale: 1.06, ease: 'none', scrollTrigger: { trigger: '.b-hero', start: 'top top', end: 'bottom top', scrub: true } });
    if (LB.fine && d.querySelector('.b-hero .book3d')) {
      var stage = d.querySelector('.b-hero__cover');
      var ry = gsap.quickTo('.b-hero .book3d', 'rotationY', { duration: 1, ease: 'power3' }), rx = gsap.quickTo('.b-hero .book3d', 'rotationX', { duration: 1, ease: 'power3' });
      stage.addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 26); rx(-((e.clientY - r.top) / r.height - .5) * 16); });
      stage.addEventListener('pointerleave', function () { ry(0); rx(0); });
    }

    /* The pilgrimage path draws itself */
    var route = d.querySelector('.map .route');
    if (route) {
      var L = route.getTotalLength();
      route.style.strokeDasharray = L; route.style.strokeDashoffset = L;
      var tl = gsap.timeline({ scrollTrigger: { trigger: '.map', start: 'top 70%', end: 'center 45%', scrub: .8 } });
      tl.fromTo('.map .pin', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, stagger: .3, duration: .4, ease: 'back.out(2)' }, 0)
        .to(route, { strokeDashoffset: 0, duration: 1, ease: 'none' }, .1)
        .from('.map .route--todo', { opacity: 0, duration: .4 }, .9);
      gsap.to('.map .halo', { attr: { r: 26 }, opacity: 0, duration: 2.4, repeat: -1, ease: 'sine.out', stagger: .6 });
    }
  });
})();
