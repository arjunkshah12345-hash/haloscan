/*
  dither.js — dependency-free 4x4 Bayer canvas kit for the HaloScan site.
  Wires itself from data attributes and re-wires after client-side navigation:
    #heroField                      drifting full-bleed field behind the hero
    [data-meter] + data-max/-hl     bar meter, fills on scroll-in, shimmers on hover
    [data-heat] canvas[data-v]      heatmap cells, density = value (0..1)
    canvas[data-film]               dithered rendition of an <img> (data-src)
    .reveal                         section fade-in on intersection
  Loops run at 6-15fps, pause offscreen or when the tab is hidden, and render a
  single static frame under prefers-reduced-motion.
*/
(function () {
  "use strict";

  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var INK = [205, 205, 200];
  var DIM = [96, 96, 102];
  var ACCENT = [232, 166, 74];
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function bay(x, y) {
    return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  }

  function dpr() {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  // Low-res offscreen buffer, upscaled with smoothing off.
  function surface(cv, cell) {
    var w = Math.max(1, Math.round(cv.clientWidth));
    var h = Math.max(1, Math.round(cv.clientHeight));
    var d = dpr();
    cv.width = Math.round(w * d);
    cv.height = Math.round(h * d);
    var lw = Math.max(1, Math.ceil(w / cell));
    var lh = Math.max(1, Math.ceil(h / cell));
    var off = document.createElement("canvas");
    off.width = lw;
    off.height = lh;
    var octx = off.getContext("2d");
    var ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return { cv: cv, ctx: ctx, off: off, octx: octx, img: octx.createImageData(lw, lh), lw: lw, lh: lh };
  }

  function blit(s) {
    s.octx.putImageData(s.img, 0, 0);
    s.ctx.imageSmoothingEnabled = false;
    s.ctx.clearRect(0, 0, s.cv.width, s.cv.height);
    s.ctx.drawImage(s.off, 0, 0, s.lw, s.lh, 0, 0, s.cv.width, s.cv.height);
  }

  function put(img, i, rgb, a) {
    img.data[i] = rgb[0];
    img.data[i + 1] = rgb[1];
    img.data[i + 2] = rgb[2];
    img.data[i + 3] = a;
  }

  // Throttled loop that pauses offscreen / hidden tab.
  function loop(el, fps, draw) {
    var visible = false;
    var last = 0;
    var t0 = performance.now();
    var raf = 0;
    function tick(now) {
      raf = 0;
      if (!visible || document.hidden || !el.isConnected) return;
      if (now - last >= 1000 / fps) {
        last = now;
        draw((now - t0) / 1000);
      }
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (!raf) raf = requestAnimationFrame(tick);
    }
    draw(0);
    if (reduced) return;
    var io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && visible) start();
    });
  }

  /* ---------- hero field ---------- */
  function heroField(cv) {
    var s;
    var narrow = false;
    function size() {
      s = surface(cv, 4);
      narrow = cv.clientWidth < 900;
    }
    size();
    onResize(cv, size);
    loop(cv, 10, function (t) {
      var img = s.img;
      var shift = Math.floor(t * 2);
      for (var y = 0; y < s.lh; y++) {
        for (var x = 0; x < s.lw; x++) {
          var u = x / s.lw;
          var v = y / s.lh;
          // fade toward the text column on the left
          // empty behind the copy column, rising toward the right edge
          var fade = narrow ? Math.max(0, (v - 0.62) / 0.38) * 0.7 : Math.max(0, Math.min(1, (u - 0.5) / 0.5));
          var d =
            0.16 +
            0.16 * Math.sin(u * 7 + t * 0.35) * Math.cos(v * 5 - t * 0.25) +
            0.08 * Math.sin((u + v) * 13 + t * 0.6);
          d *= fade * (0.55 + 0.45 * (1 - v));
          var i = (y * s.lw + x) * 4;
          if (d > bay(x + shift, y)) put(img, i, DIM, 255);
          else put(img, i, DIM, 0);
        }
      }
      blit(s);
    });
  }

  /* ---------- meters ---------- */
  function meter(el) {
    var cv = el.querySelector("canvas");
    if (!cv) return;
    var value = parseFloat(el.getAttribute("data-meter")) || 0;
    var max = parseFloat(el.getAttribute("data-max")) || 1;
    var hl = el.hasAttribute("data-hl");
    var target = Math.max(0, Math.min(1, value / max));
    var progress = reduced ? 1 : 0;
    var hover = 0;
    var s;
    function size() {
      s = surface(cv, 3);
      paint(0);
    }
    function paint(t) {
      var img = s.img;
      var fill = target * easeOut(progress);
      var shift = Math.floor(t * 6);
      for (var y = 0; y < s.lh; y++) {
        for (var x = 0; x < s.lw; x++) {
          var u = (x + 0.5) / s.lw;
          var i = (y * s.lw + x) * 4;
          var on;
          if (u <= fill) {
            var d = 0.78 + (hover ? 0.18 * Math.sin(u * 30 - t * 6) : 0);
            on = d > bay(x + (hover ? shift : 0), y);
            put(img, i, hl ? ACCENT : INK, on ? 255 : 0);
          } else {
            on = 0.1 > bay(x, y);
            put(img, i, DIM, on ? 255 : 0);
          }
        }
      }
      blit(s);
    }
    size();
    onResize(cv, size);
    if (reduced) return;
    var started = false;
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !started) {
        started = true;
        var t0 = performance.now();
        (function step(now) {
          progress = Math.min(1, (now - t0) / 1100);
          paint(0);
          if (progress < 1) requestAnimationFrame(step);
        })(t0);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    var hoverRaf = 0;
    var last = 0;
    el.addEventListener("mouseenter", function () {
      hover = 1;
      var t0 = performance.now();
      (function h(now) {
        if (!hover) return paint(0);
        if (now - last > 1000 / 15) {
          last = now;
          paint((now - t0) / 1000);
        }
        hoverRaf = requestAnimationFrame(h);
      })(t0);
    });
    el.addEventListener("mouseleave", function () {
      hover = 0;
      cancelAnimationFrame(hoverRaf);
      paint(0);
    });
  }

  function easeOut(p) {
    return 1 - Math.pow(1 - p, 3);
  }

  /* ---------- heatmap cells ---------- */
  function heatCell(cv) {
    var v = Math.max(0, Math.min(1, parseFloat(cv.getAttribute("data-v")) || 0));
    var hl = cv.hasAttribute("data-hl");
    var s;
    function size() {
      s = surface(cv, 3);
    }
    size();
    onResize(cv, size);
    loop(cv, 6, function (t) {
      var img = s.img;
      var shift = Math.floor(t * 1.5);
      var d = v === 0 ? 0.02 : 0.08 + v * 0.86 + 0.03 * Math.sin(t * 0.9);
      for (var y = 0; y < s.lh; y++) {
        for (var x = 0; x < s.lw; x++) {
          var i = (y * s.lw + x) * 4;
          put(img, i, hl ? ACCENT : INK, d > bay(x + shift, y + shift) ? 255 : 0);
        }
      }
      blit(s);
    });
  }

  /* ---------- dithered film (image -> 1-bit) ---------- */
  function film(cv) {
    var src = cv.getAttribute("data-src");
    if (!src) return;
    var image = new Image();
    image.decoding = "async";
    image.onload = function () {
      var s;
      var lum;
      function size() {
        s = surface(cv, 2);
        var tmp = document.createElement("canvas");
        tmp.width = s.lw;
        tmp.height = s.lh;
        var tctx = tmp.getContext("2d");
        // cover-fit
        var r = Math.max(s.lw / image.width, s.lh / image.height);
        var w = image.width * r;
        var h = image.height * r;
        tctx.drawImage(image, (s.lw - w) / 2, (s.lh - h) / 2, w, h);
        var px = tctx.getImageData(0, 0, s.lw, s.lh).data;
        lum = new Float32Array(s.lw * s.lh);
        for (var k = 0; k < lum.length; k++) {
          var l = (px[k * 4] * 0.299 + px[k * 4 + 1] * 0.587 + px[k * 4 + 2] * 0.114) / 255;
          // stretch contrast so the disc reads clearly
          lum[k] = Math.max(0, Math.min(1, (l - 0.28) * 1.7));
        }
      }
      size();
      onResize(cv, size);
      loop(cv, 8, function (t) {
        var img = s.img;
        var shift = Math.floor(t * 1.2);
        for (var y = 0; y < s.lh; y++) {
          for (var x = 0; x < s.lw; x++) {
            var k = y * s.lw + x;
            var d = lum[k] + 0.03 * Math.sin(t * 0.8 + x * 0.05);
            put(img, k * 4, INK, d > bay(x + shift, y) ? 255 : 0);
          }
        }
        blit(s);
      });
    };
    image.src = src;
  }

  /* ---------- reveals ---------- */
  var revealIO = reduced
    ? null
    : new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              revealIO.unobserve(e.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px" },
      );

  function reveal(el) {
    if (reduced) {
      el.classList.add("in");
      return;
    }
    revealIO.observe(el);
  }

  /* ---------- resize (debounced, width only) ---------- */
  function onResize(el, fn) {
    var w = el.clientWidth;
    var timer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!el.isConnected) return;
        if (el.clientWidth !== w) {
          w = el.clientWidth;
          fn();
        }
      }, 150);
    });
  }

  /* ---------- wiring ---------- */
  function wire(root) {
    function each(sel, fn) {
      var list = root.querySelectorAll ? root.querySelectorAll(sel) : [];
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.__dither) continue;
        el.__dither = true;
        fn(el);
      }
    }
    each("#heroField", heroField);
    each("[data-meter]", meter);
    each("[data-heat] canvas[data-v]", heatCell);
    each("canvas[data-film]", film);
    each(".reveal", reveal);
  }

  function init() {
    document.documentElement.classList.add("dither-ready");
    wire(document);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        for (var j = 0; j < muts[i].addedNodes.length; j++) {
          var n = muts[i].addedNodes[j];
          if (n.nodeType === 1) wire(n.parentNode || n);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  window.Dither = { wire: wire, bay: bay };

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  else init();
})();
