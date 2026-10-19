/* Brume du sous-bois (WebGL, OGL) + fondu de brume entre deux œuvres. Falls back to CSS when WebGL or motion is off. */
import { Renderer } from './vendor/ogl/core/Renderer.js';
import { Program } from './vendor/ogl/core/Program.js';
import { Mesh } from './vendor/ogl/core/Mesh.js';
import { Texture } from './vendor/ogl/core/Texture.js';
import { Triangle } from './vendor/ogl/extras/Triangle.js';
import { Flowmap } from './vendor/ogl/extras/Flowmap.js';
import { Vec2 } from './vendor/ogl/math/Vec2.js';

const LB = window.LB || { calm: false };
const calm = document.documentElement.classList.contains('calm');

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
const GL_OK = webglOK();

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0., 1.); }
`;

const NOISE = /* glsl */ `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p) { float v = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= .5; } return v; }
`;

const fogFragment = /* glsl */ `
precision highp float;
uniform float uTime; uniform float uAspect; uniform float uReveal; uniform float uDensity;
uniform vec2 uFocus; uniform vec3 uColor;
uniform sampler2D uTex; uniform sampler2D tFlow;
varying vec2 vUv;
${NOISE}
vec2 mirror(vec2 uv) { return 1. - abs(1. - mod(uv, 2.)); }
void main() {
  vec2 uv = vUv;
  vec3 flow = texture2D(tFlow, uv).rgb;
  vec2 p = vec2(uv.x * uAspect, uv.y) * 2.2;
  float t = uTime * .045;
  vec2 q = vec2(fbm(p + vec2(t, t * .3)), fbm(p + vec2(-t * .6, t * .2) + 3.1));
  float n = fbm(p + 1.7 * q + vec2(t * .5, 0.) - flow.xy * .6);
  float tex = texture2D(uTex, mirror(uv * .9 + vec2(t * .35, -t * .05) + q * .1)).r;
  float fog = smoothstep(.3, .98, n * .78 + tex * .6);
  fog *= mix(1., .45, smoothstep(0., .9, uv.y));
  float rf = length((uv - uFocus) * vec2(uAspect, 1.));
  fog *= mix(.22, 1., smoothstep(.18, .75, rf));
  fog += .22 * smoothstep(.6, 1.1, length((uv - .5) * vec2(uAspect, 1.)));
  float clear = clamp(length(flow.xy) * 1.8, 0., 1.);
  fog *= 1. - clear * .95;
  float r = rf + (n - .5) * .35;
  float R = uReveal * 2.2;
  float cleared = uReveal <= .001 ? 0. : 1. - smoothstep(R - .45, R, r);
  float veil = 1. - cleared;
  float a = max(fog * uDensity * .42, veil * (.9 + .1 * n));
  vec3 col = mix(uColor * (.78 + .3 * n), uColor * (.38 + .28 * n), veil);
  gl_FragColor = vec4(col, clamp(a, 0., .97));
}
`;

function fallback(el) {
  const f = document.createElement('div');
  f.className = 'fog-fallback';
  el.appendChild(f);
  if (window.gsap && !calm) window.gsap.set(f, { opacity: 0 });
  return {
    el,
    reveal(d = 1.2) { if (window.gsap && !calm) window.gsap.to(f, { opacity: .4, duration: d, ease: 'sine.out' }); },
    setDensity(v) { f.style.opacity = String(.25 + v * .45); },
    fallback: true,
  };
}

function createFog(el) {
  const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5) * .6, alpha: true, premultipliedAlpha: false, antialias: false, depth: false });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  el.appendChild(gl.canvas);
  gl.canvas.setAttribute('aria-hidden', 'true');

  const flowmap = new Flowmap(gl, { falloff: .28, dissipation: .965, alpha: .55 });
  const texture = new Texture(gl, { generateMipmaps: false, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
  const img = new Image();
  img.onload = () => { texture.image = img; };
  img.src = el.getAttribute('data-fog-tex');

  const focus = (el.getAttribute('data-fog-focus') || '.62,.5').split(',').map(Number);
  const program = new Program(gl, {
    vertex, fragment: fogFragment, transparent: true, depthTest: false,
    uniforms: {
      uTime: { value: 0 }, uAspect: { value: 1 }, uReveal: { value: el.hasAttribute('data-fog-start') ? 0 : 1 },
      uDensity: { value: parseFloat(el.getAttribute('data-fog-density') || '1') },
      uFocus: { value: new Vec2(focus[0], 1 - focus[1]) },
      uColor: { value: [.68, .66, .6] },
      uTex: { value: texture }, tFlow: flowmap.uniform,
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  let w = 1, h = 1;
  const resize = () => {
    const r = el.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h);
    program.uniforms.uAspect.value = w / h;
    flowmap.aspect = w / h;
  };
  resize();
  new ResizeObserver(resize).observe(el);

  const mouse = new Vec2(-1), velocity = new Vec2();
  let last = null, lastTime = 0, moved = false;
  window.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    mouse.set(x, y);
    const now = performance.now();
    if (!last) { last = { x: e.clientX, y: e.clientY }; lastTime = now; return; }
    const dt = Math.max(14, now - lastTime);
    velocity.x = (e.clientX - last.x) / dt; velocity.y = (e.clientY - last.y) / dt;
    last = { x: e.clientX, y: e.clientY }; lastTime = now; moved = true;
  }, { passive: true });

  let visible = true, raf = 0;
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: '80px' }).observe(el);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) raf = requestAnimationFrame(loop); });

  function loop(t) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (!moved) { velocity.x *= .9; velocity.y *= .9; }
    moved = false;
    flowmap.mouse.copy(mouse);
    flowmap.velocity.lerp(velocity, velocity.len() ? .5 : .1);
    flowmap.update();
    program.uniforms.uTime.value = t * .001;
    renderer.render({ scene: mesh });
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    el,
    reveal(d = 1.6) {
      const u = program.uniforms.uReveal;
      if (window.gsap) window.gsap.fromTo(u, { value: 0 }, { value: 1, duration: d, ease: 'power2.inOut' }); else u.value = 1;
    },
    setDensity(v) { program.uniforms.uDensity.value = v; },
    uniforms: program.uniforms,
  };
}

const fogs = [];
document.querySelectorAll('[data-fog]').forEach((el) => {
  let f;
  try { f = (!calm && GL_OK) ? createFog(el) : fallback(el); } catch (e) { console.warn(e); f = fallback(el); }
  el._fog = f;
  fogs.push(f);
  if (calm) f.reveal(0);
});
window.LBFog = fogs;
window.dispatchEvent(new CustomEvent('lb:fog-ready', { detail: fogs }));

/* ---------- Dissolve between two works (viewer) ---------- */
const dissolveFragment = /* glsl */ `
precision highp float;
uniform sampler2D tA; uniform sampler2D tB;
uniform float uProgress; uniform float uAspect; uniform float uAspA; uniform float uAspB;
varying vec2 vUv;
${NOISE}
vec4 contain(sampler2D t, vec2 uv, float a) {
  vec2 st = uv;
  if (a > uAspect) st.y = (uv.y - .5) / (uAspect / a) + .5; else st.x = (uv.x - .5) / (a / uAspect) + .5;
  if (st.x < 0. || st.x > 1. || st.y < 0. || st.y > 1.) return vec4(0.);
  return texture2D(t, st);
}
void main() {
  vec4 a = contain(tA, vUv, uAspA);
  vec4 b = contain(tB, vUv, uAspB);
  float n = fbm(vec2(vUv.x * uAspect, vUv.y) * 3.2) * .85 + vUv.y * .15;
  float w = .12;
  float m = smoothstep(n - w, n + w, uProgress * (1. + 2. * w) - w);
  float edge = (1. - abs(m * 2. - 1.)) * step(.001, uProgress) * step(uProgress, .999);
  vec4 c = mix(a, b, m);
  c.rgb += vec3(.93, .9, .84) * edge * .35;
  c.a = max(c.a, edge * .35);
  gl_FragColor = c;
}
`;

function createDissolve(canvas) {
  if (calm || !GL_OK) return null;
  const renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 2), alpha: true, premultipliedAlpha: false, depth: false });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  const tA = new Texture(gl, { generateMipmaps: false }), tB = new Texture(gl, { generateMipmaps: false });
  const program = new Program(gl, {
    vertex, fragment: dissolveFragment, transparent: true, depthTest: false,
    uniforms: { tA: { value: tA }, tB: { value: tB }, uProgress: { value: 0 }, uAspect: { value: 1 }, uAspA: { value: 1 }, uAspB: { value: 1 } },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const size = () => { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height); program.uniforms.uAspect.value = r.width / Math.max(1, r.height); };
  return {
    run(imgA, imgB, done) {
      canvas.hidden = false;
      size();
      tA.image = imgA; tB.image = imgB;
      program.uniforms.uAspA.value = imgA.naturalWidth / imgA.naturalHeight;
      program.uniforms.uAspB.value = imgB.naturalWidth / imgB.naturalHeight;
      const u = program.uniforms.uProgress;
      u.value = 0;
      canvas.hidden = false;
      const render = () => renderer.render({ scene: mesh });
      render();
      window.gsap.to(u, { value: 1, duration: 1.05, ease: 'power2.inOut', onUpdate: render, onComplete: () => { canvas.hidden = true; done && done(); } });
    },
  };
}
window.LBDissolve = createDissolve;
window.dispatchEvent(new CustomEvent('lb:dissolve-ready'));
