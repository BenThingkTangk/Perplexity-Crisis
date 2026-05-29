/*
 * @nirmata/atom-experience-system · v2.0.0
 * No-dependency browser helper that initializes the cinematic ATOM experience.
 *
 * Safe by design: any feature whose target elements are missing simply no-ops.
 * Honors prefers-reduced-motion. Idempotent — calling init() twice does not
 * double-bind handlers.
 *
 * Surfaces (data attrs):
 *   data-x-hero-spotlight  ← pointer-reactive hero spotlight
 *   data-x-orbital         ← parallax-tracking orbital element
 *   data-x-magnetic        ← magnetic button
 *   data-x-tilt            ← interactive card tilt
 *   data-x-reveal          ← reveal-on-scroll (single)
 *   data-x-reveal-stack    ← reveal-on-scroll for staggered children
 *   data-x-counter="1234"  ← count-up metric
 *   data-x-palette         ← command-palette overlay
 *   data-x-loader          ← cinematic loader root
 *
 * Theme:
 *   ATOMExperience.theme.set('dark' | 'light' | 'toggle')
 */
(function (global) {
  'use strict';

  var BOUND = '__atomXBound';
  var prefersReduce = function () {
    return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /* ----------------------------------------------------- */
  /* Theme                                                 */
  /* ----------------------------------------------------- */
  var theme = {
    get: function () {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    },
    set: function (next) {
      if (next === 'toggle') next = theme.get() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { dispatchEvent(new CustomEvent('atom:theme', { detail: { theme: next } })); } catch (_) {}
    },
  };

  /* ----------------------------------------------------- */
  /* Hero spotlight + orbital parallax                     */
  /* ----------------------------------------------------- */
  function initSpotlight() {
    var heroes = document.querySelectorAll('[data-x-hero-spotlight]');
    heroes.forEach(function (hero) {
      if (hero[BOUND + 'Spot']) return;
      hero[BOUND + 'Spot'] = true;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100;
        var y = ((e.clientY - r.top) / r.height) * 100;
        hero.style.setProperty('--x-spot-x', x + '%');
        hero.style.setProperty('--x-spot-y', y + '%');
      }, { passive: true });
      hero.addEventListener('pointerleave', function () {
        hero.style.setProperty('--x-spot-x', '50%');
        hero.style.setProperty('--x-spot-y', '30%');
      });
    });

    var orbitals = document.querySelectorAll('[data-x-orbital]');
    if (!orbitals.length || prefersReduce()) return;
    document.addEventListener('pointermove', function (e) {
      var cx = global.innerWidth / 2;
      var cy = global.innerHeight / 2;
      var dx = (e.clientX - cx) / cx;
      var dy = (e.clientY - cy) / cy;
      orbitals.forEach(function (el) {
        var depth = parseFloat(el.getAttribute('data-x-orbital')) || 12;
        el.style.transform = 'translate3d(' + (dx * depth).toFixed(2) + 'px,' + (dy * depth).toFixed(2) + 'px,0)';
      });
    }, { passive: true });
  }

  /* ----------------------------------------------------- */
  /* Magnetic buttons                                       */
  /* ----------------------------------------------------- */
  function initMagnetic() {
    if (prefersReduce()) return;
    var nodes = document.querySelectorAll('[data-x-magnetic], .x-magnetic');
    nodes.forEach(function (el) {
      if (el[BOUND + 'Mag']) return;
      el[BOUND + 'Mag'] = true;
      var strength = parseFloat(el.getAttribute('data-x-magnetic')) || 14;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.setProperty('--mx', (x * strength).toFixed(2) + 'px');
        el.style.setProperty('--my', (y * strength).toFixed(2) + 'px');
        el.setAttribute('data-magnetic-active', 'true');
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
        el.setAttribute('data-magnetic-active', 'false');
      });
    });
  }

  /* ----------------------------------------------------- */
  /* Card tilt                                              */
  /* ----------------------------------------------------- */
  function initTilt() {
    if (prefersReduce()) return;
    var nodes = document.querySelectorAll('[data-x-tilt], .x-tilt');
    nodes.forEach(function (el) {
      if (el[BOUND + 'Tilt']) return;
      el[BOUND + 'Tilt'] = true;
      var max = parseFloat(el.getAttribute('data-x-tilt')) || 6;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.setProperty('--tx', (x * max).toFixed(2) + 'deg');
        el.style.setProperty('--ty', (-y * max).toFixed(2) + 'deg');
        el.setAttribute('data-tilt-active', 'true');
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--tx', '0deg');
        el.style.setProperty('--ty', '0deg');
        el.setAttribute('data-tilt-active', 'false');
      });
    });
  }

  /* ----------------------------------------------------- */
  /* Reveal on scroll                                       */
  /* ----------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll('[data-x-reveal], [data-x-reveal-stack], .x-reveal, .x-reveal-stack');
    if (!targets.length || !global.IntersectionObserver) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------- */
  /* Counters                                               */
  /* ----------------------------------------------------- */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-x-counter]');
    if (!nodes.length || !global.IntersectionObserver) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el[BOUND + 'Counter']) return;
        el[BOUND + 'Counter'] = true;
        var target = parseFloat(el.getAttribute('data-x-counter'));
        var prefix = el.getAttribute('data-x-prefix') || '';
        var suffix = el.getAttribute('data-x-suffix') || '';
        var dec = parseInt(el.getAttribute('data-x-decimals') || '0', 10);
        var dur = parseInt(el.getAttribute('data-x-duration') || '1400', 10);
        if (prefersReduce()) {
          el.textContent = prefix + target.toFixed(dec) + suffix;
          io.unobserve(el); return;
        }
        var start = performance.now();
        function tick(t) {
          var p = Math.min(1, (t - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          var v = target * eased;
          el.textContent = prefix + v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------- */
  /* Command palette                                        */
  /* ----------------------------------------------------- */
  function initPalette() {
    var palette = document.querySelector('[data-x-palette]');
    if (!palette) return;
    function open() { palette.setAttribute('data-open', 'true'); var i = palette.querySelector('input'); if (i) i.focus(); }
    function close() { palette.setAttribute('data-open', 'false'); }
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        palette.getAttribute('data-open') === 'true' ? close() : open();
      } else if (e.key === 'Escape') {
        close();
      }
    });
    palette.addEventListener('click', function (e) { if (e.target === palette) close(); });
    global.ATOMPalette = { open: open, close: close };
  }

  /* ----------------------------------------------------- */
  /* Cinematic loader                                       */
  /* ----------------------------------------------------- */
  function initLoader() {
    var nodes = document.querySelectorAll('[data-x-loader]');
    nodes.forEach(function (el) {
      var mantra = el.querySelector('[data-x-loader-mantra]');
      var words = (el.getAttribute('data-x-loader-words') || 'PRECISION,EMPATHY,VELOCITY,INTELLIGENCE,DISRUPTION').split(',');
      var dur = parseInt(el.getAttribute('data-x-loader-duration') || '2800', 10);
      var holdAfter = parseInt(el.getAttribute('data-x-loader-hold') || '240', 10);
      var autoHide = el.getAttribute('data-x-loader-autohide') !== 'false';
      if (mantra) {
        var per = Math.max(800, Math.floor(dur / words.length));
        words.forEach(function (w, i) {
          setTimeout(function () {
            mantra.textContent = w.trim();
            mantra.setAttribute('data-active', 'true');
            setTimeout(function () { mantra.setAttribute('data-active', 'false'); }, per - 100);
          }, i * per);
        });
      }
      if (autoHide) setTimeout(function () { el.setAttribute('data-state', 'done'); }, dur + holdAfter);
    });
  }

  /* ----------------------------------------------------- */
  /* Public API                                             */
  /* ----------------------------------------------------- */
  function init(opts) {
    opts = opts || {};
    if (opts.theme) theme.set(opts.theme);
    initSpotlight();
    initMagnetic();
    initTilt();
    initReveal();
    initCounters();
    initPalette();
    initLoader();
  }

  var api = { init: init, theme: theme, _: { initReveal: initReveal, initCounters: initCounters, initMagnetic: initMagnetic, initTilt: initTilt, initSpotlight: initSpotlight, initLoader: initLoader } };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.ATOMExperience = api;

  // Auto-init when included as a plain script tag
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
