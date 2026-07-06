/* ============================================================
   battle-fx.js
   Shared utilities + all combat visual effects for the pet
   battle system. Load battle-fx.css alongside this file.

   Usage:
     <link rel="stylesheet" href="battle-fx.css">
     <script src="battle-fx.js"></script>

     const arena = document.querySelector('#battle-result .battle-arena');
     BattleFX.init(arena); // call once, sets up the shared layers

     await BattleFX.lightning(arena, { from: {x, y}, to: {x, y} });
     await BattleFX.skyBeam(arena, { targetX, targetY });
     await BattleFX.laserSweep(arena, { originX, originY, groundY, groundLeft, groundRight, hitCount: 8 });
     await BattleFX.freezeShatter(arena, targetEl); // or { x, y, radius }
     await BattleFX.meteorShower(arena, { count: 6, zonePct: 0.4 });
     await BattleFX.earthSplitter(arena, { fromX, toX, groundY });

   Every effect resolves its Promise once it's fully finished
   (particles cleared, overlays faded back to 0).
   ============================================================ */

(function (global) {
  'use strict';

  const LAYER_IDS = {
    svg: 'fx-svg-layer',
    chunk: 'fx-chunk-layer',
    dark: 'fx-dark-overlay',
    tint: 'fx-cold-tint',
    flash: 'fx-flash-overlay'
  };

  // ---------------------------------------------------------
  // Setup: ensure the shared layers exist inside an arena element.
  // Safe to call multiple times - it won't duplicate layers.
  // ---------------------------------------------------------
  function init(arenaEl) {
    if (!arenaEl) throw new Error('BattleFX.init requires an arena element');
    if (getComputedStyle(arenaEl).position === 'static') {
      arenaEl.style.position = 'relative';
    }

    const layers = {};

    layers.svg = arenaEl.querySelector(`[data-fx="${LAYER_IDS.svg}"]`);
    if (!layers.svg) {
      layers.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      layers.svg.setAttribute('data-fx', LAYER_IDS.svg);
      layers.svg.setAttribute('class', 'fx-svg-layer');
      layers.svg.innerHTML = `
        <defs>
          <filter id="fx-glow-${uid(arenaEl)}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>`;
      arenaEl.appendChild(layers.svg);
    }

    layers.chunk = ensureDiv(arenaEl, LAYER_IDS.chunk, 'fx-chunk-layer');
    layers.dark = ensureDiv(arenaEl, LAYER_IDS.dark, 'fx-dark-overlay');
    layers.tint = ensureDiv(arenaEl, LAYER_IDS.tint, 'fx-cold-tint');
    layers.flash = ensureDiv(arenaEl, LAYER_IDS.flash, 'fx-flash-overlay');

    arenaEl.__fxLayers = layers;
    arenaEl.__fxGlowId = `fx-glow-${uid(arenaEl)}`;
    return layers;
  }

  function ensureDiv(arenaEl, dataId, className) {
    let el = arenaEl.querySelector(`[data-fx="${dataId}"]`);
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('data-fx', dataId);
      el.className = className;
      arenaEl.appendChild(el);
    }
    return el;
  }

  let _uidCounter = 0;
  const _uidMap = new WeakMap();
  function uid(el) {
    if (!_uidMap.has(el)) _uidMap.set(el, ++_uidCounter);
    return _uidMap.get(el);
  }

  function getLayers(arenaEl) {
    return arenaEl.__fxLayers || init(arenaEl);
  }

  function glowUrl(arenaEl) {
    return `url(#${arenaEl.__fxGlowId})`;
  }

  // ---------------------------------------------------------
  // Generic helpers
  // ---------------------------------------------------------
  function rectOf(arenaEl, el) {
    const a = arenaEl.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2, r: r.width / 2, rect: r };
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ---------------------------------------------------------
  // Particle primitives (shared across effects)
  // ---------------------------------------------------------
  function spawnBoom(arenaEl, x, y, size, color) {
    const el = document.createElement('div');
    el.className = 'fx-boom';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (x - size / 2) + 'px';
    el.style.top = (y - size / 2) + 'px';
    el.style.background = color;
    arenaEl.appendChild(el);
    setTimeout(() => el.remove(), 420);
  }

  function spawnRing(arenaEl, x, y, size) {
    const el = document.createElement('div');
    el.className = 'fx-ring';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (x - size / 2) + 'px';
    el.style.top = (y - size / 2) + 'px';
    arenaEl.appendChild(el);
    setTimeout(() => el.remove(), 570);
  }

  function spawnEmbers(arenaEl, x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 65;
      const ex = Math.cos(angle) * dist;
      const ey = Math.sin(angle) * dist * 0.6 - 12;
      const size = 3 + Math.random() * 5;
      const el = document.createElement('div');
      el.className = 'fx-ember';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = (x - size / 2) + 'px';
      el.style.top = (y - size / 2) + 'px';
      el.style.background = Math.random() > 0.5 ? '#ffb27a' : '#F0997B';
      el.style.setProperty('--ex', ex + 'px');
      el.style.setProperty('--ey', ey + 'px');
      arenaEl.appendChild(el);
      setTimeout(() => el.remove(), 620);
    }
  }

  function spawnScorch(arenaEl, x, y, size) {
    const el = document.createElement('div');
    el.className = 'fx-scorch';
    el.style.width = size + 'px';
    el.style.height = size * 0.4 + 'px';
    el.style.left = (x - size / 2) + 'px';
    el.style.top = (y - size * 0.2) + 'px';
    arenaEl.appendChild(el);
    setTimeout(() => el.remove(), 1450);
  }

  function spawnFrostBit(arenaEl, x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 65;
      const size = 3 + Math.random() * 5;
      const el = document.createElement('div');
      el.className = 'fx-frost-bit';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = (x - size / 2) + 'px';
      el.style.top = (y - size / 2) + 'px';
      el.style.background = '#E6F1FB';
      el.style.setProperty('--fx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--fy', Math.sin(angle) * dist + 'px');
      arenaEl.appendChild(el);
      setTimeout(() => el.remove(), 570);
    }
  }

  function spawnSpark(arenaEl, x, y) {
    const size = 6 + Math.random() * 6;
    const el = document.createElement('div');
    el.className = 'fx-spark';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (x - size / 2) + 'px';
    el.style.top = (y - size / 2) + 'px';
    arenaEl.appendChild(el);
    setTimeout(() => el.remove(), 190);
  }

  function spawnRock(arenaEl, x, y, size) {
    const el = document.createElement('div');
    el.className = 'fx-rock';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (x - size / 2) + 'px';
    el.style.top = (y - size / 2) + 'px';
    el.style.background = Math.random() > 0.5 ? '#5F5E5A' : '#3C3634';
    el.style.clipPath = Math.random() > 0.5
      ? 'polygon(20% 0%, 100% 30%, 80% 100%, 0% 70%)'
      : 'polygon(0% 20%, 60% 0%, 100% 60%, 40% 100%)';
    el.style.setProperty('--rot', (Math.random() * 140 - 70) + 'deg');
    el.style.setProperty('--rot2', (Math.random() * 280 - 140) + 'deg');
    arenaEl.appendChild(el);
    setTimeout(() => el.remove(), 520);
  }

  function spawnDust(arenaEl, x, y, count) {
    for (let i = 0; i < count; i++) {
      const dx = (Math.random() - 0.5) * 60;
      const dy = -10 - Math.random() * 40;
      const size = 8 + Math.random() * 14;
      const el = document.createElement('div');
      el.className = 'fx-dust';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = (x - size / 2) + 'px';
      el.style.top = (y - size / 2) + 'px';
      el.style.background = '#B4B2A9';
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      arenaEl.appendChild(el);
      setTimeout(() => el.remove(), 720);
    }
  }

  function shake(arenaEl, mag) {
    const frames = [
      { x: -mag, y: mag * 0.5 }, { x: mag * 0.8, y: -mag * 0.6 }, { x: -mag * 0.6, y: -mag * 0.4 },
      { x: mag, y: mag * 0.3 }, { x: -mag * 0.4, y: mag * 0.6 }, { x: mag * 0.3, y: -mag * 0.3 },
      { x: -mag * 0.5, y: mag * 0.4 }, { x: mag * 0.4, y: -mag * 0.3 }, { x: 0, y: 0 }
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i >= frames.length) { clearInterval(iv); arenaEl.style.transform = ''; return; }
      arenaEl.style.transform = `translate(${frames[i].x}px, ${frames[i].y}px)`;
      i++;
    }, 30);
  }

  function microShake(arenaEl, mag) {
    const dx = (Math.random() - 0.5) * mag * 2;
    const dy = (Math.random() - 0.5) * mag;
    arenaEl.style.transform = `translate(${dx}px, ${dy}px)`;
    setTimeout(() => { arenaEl.style.transform = ''; }, 45);
  }

  function bigBlast(arenaEl, x, y) {
    spawnBoom(arenaEl, x, y, 65, '#D85A30');
    spawnBoom(arenaEl, x - 24, y - 12, 36, '#ffb27a');
    spawnBoom(arenaEl, x + 26, y + 6, 32, '#ffb27a');
    spawnBoom(arenaEl, x, y - 22, 30, '#F0997B');
    setTimeout(() => spawnBoom(arenaEl, x + 10, y + 8, 40, '#D85A30'), 60);
    setTimeout(() => spawnBoom(arenaEl, x - 16, y - 4, 26, '#ffb27a'), 100);
    spawnRing(arenaEl, x, y, 40);
    setTimeout(() => spawnRing(arenaEl, x, y, 55), 80);
    setTimeout(() => spawnRing(arenaEl, x, y, 70), 160);
    spawnScorch(arenaEl, x, y, 100);
    spawnEmbers(arenaEl, x, y, 18);
  }

  function denseHitBlast(arenaEl, x, y) {
    const burstCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < burstCount; i++) {
      const ox = x + (Math.random() - 0.5) * 50;
      const oy = y + (Math.random() - 0.5) * 26;
      const size = 20 + Math.random() * 34;
      const color = Math.random() > 0.5 ? '#D85A30' : '#ffb27a';
      setTimeout(() => spawnBoom(arenaEl, ox, oy, size, color), i * 18);
    }
    spawnRing(arenaEl, x, y, 34);
    setTimeout(() => spawnRing(arenaEl, x, y, 46), 60);
    spawnEmbers(arenaEl, x, y, 14);
  }

  // ============================================================
  // EFFECT 1: Lightning (point-to-point jagged bolt with branches)
  // options: { from: {x,y}, to: {x,y}, flickers, jitter }
  // ============================================================
  function lightning(arenaEl, options) {
    const { svg } = getLayers(arenaEl);
    const opts = Object.assign({ flickers: 7, jitter: 45, segments: 10 }, options);
    const { from, to } = opts;

    return new Promise(resolve => {
      function genPath(x1, y1, x2, y2, segments, jitter) {
        let points = [{ x: x1, y: y1 }];
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter;
          const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter;
          points.push({ x, y });
        }
        points.push({ x: x2, y: y2 });
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
        return { d, points };
      }
      function genBranch(points, jitter) {
        if (points.length < 4) return null;
        const startIdx = 1 + Math.floor(Math.random() * (points.length - 3));
        const bx = points[startIdx].x, by = points[startIdx].y;
        const len = 2 + Math.floor(Math.random() * 2);
        let d = `M ${bx} ${by}`;
        let cx = bx, cy = by;
        for (let i = 0; i < len; i++) {
          cx += (Math.random() - 0.5) * jitter * 1.8;
          cy += (Math.random() - 0.5) * jitter * 1.2 + jitter * 0.4;
          d += ` L ${cx} ${cy}`;
        }
        return d;
      }

      const mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      mainPath.setAttribute('stroke', '#aefcff');
      mainPath.setAttribute('stroke-width', '3.5');
      mainPath.setAttribute('fill', 'none');
      mainPath.setAttribute('filter', glowUrl(arenaEl));
      mainPath.setAttribute('stroke-linecap', 'round');
      mainPath.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(mainPath);

      let branches = [];
      function redraw() {
        const { d, points } = genPath(from.x, from.y, to.x, to.y, opts.segments + Math.floor(Math.random() * 4), opts.jitter);
        mainPath.setAttribute('d', d);
        branches.forEach(b => b.remove());
        branches = [];
        const branchCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < branchCount; i++) {
          const bd = genBranch(points, opts.jitter);
          if (!bd) continue;
          const bp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          bp.setAttribute('stroke', '#d6faff');
          bp.setAttribute('stroke-width', '1.5');
          bp.setAttribute('fill', 'none');
          bp.setAttribute('filter', glowUrl(arenaEl));
          bp.setAttribute('stroke-linecap', 'round');
          bp.setAttribute('d', bd);
          svg.appendChild(bp);
          branches.push(bp);
        }
      }

      redraw();
      shake(arenaEl, 7);

      let flickers = 0;
      const iv = setInterval(() => {
        flickers++;
        redraw();
        if (flickers >= opts.flickers) {
          clearInterval(iv);
          mainPath.style.transition = 'opacity 0.15s';
          mainPath.style.opacity = '0';
          branches.forEach(b => { b.style.transition = 'opacity 0.15s'; b.style.opacity = '0'; });
          setTimeout(() => {
            mainPath.remove();
            branches.forEach(b => b.remove());
            resolve();
          }, 150);
        }
      }, 45);
    });
  }

  // ============================================================
  // EFFECT 2: Sky beam (falls from off-screen top, layered blast)
  // options: { targetX, targetY, duration }
  // ============================================================
  function skyBeam(arenaEl, options) {
    const { svg, dark, flash } = getLayers(arenaEl);
    const opts = Object.assign({ duration: 260 }, options);

    return new Promise(resolve => {
      dark.style.opacity = '0.78';
      const startY = -20;
      const beam = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      beam.setAttribute('x', opts.targetX - 5);
      beam.setAttribute('y', startY);
      beam.setAttribute('width', '10');
      beam.setAttribute('height', '10');
      beam.setAttribute('fill', '#ffb27a');
      beam.setAttribute('filter', glowUrl(arenaEl));
      svg.appendChild(beam);

      const start = performance.now();
      function animate(now) {
        const t = Math.min(1, (now - start) / opts.duration);
        const eased = t * t;
        const y = startY + (opts.targetY - startY) * eased;
        beam.setAttribute('y', startY);
        beam.setAttribute('height', Math.max(10, y - startY));

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          beam.remove();
          bigBlast(arenaEl, opts.targetX, opts.targetY);
          flash.style.background = '#ffd9c2';
          flash.style.transition = 'opacity 0.03s';
          flash.style.opacity = '0.9';
          shake(arenaEl, 8);
          setTimeout(() => {
            flash.style.transition = 'opacity 0.25s';
            flash.style.opacity = '0';
          }, 70);
          setTimeout(() => {
            dark.style.opacity = '0';
            resolve();
          }, 500);
        }
      }
      requestAnimationFrame(animate);
    });
  }

  // ============================================================
  // EFFECT 3: Laser sweep (Victor-ult style rotating beam)
  // options: { originX, originY, groundY, groundLeft, groundRight, hitCount }
  // Endpoint always stays on the ground line as the beam rotates.
  // Explosions are delayed until rotation finishes, then fire in
  // sequence across the hit points.
  // ============================================================
  function laserSweep(arenaEl, options) {
    const { svg, dark, flash } = getLayers(arenaEl);
    const opts = Object.assign({ hitCount: 8, duration: 500 }, options);

    return new Promise(resolve => {
      dark.style.opacity = '0.78';

      const positions = [];
      for (let i = 0; i < opts.hitCount; i++) {
        const x = opts.groundLeft + (opts.groundRight - opts.groundLeft) * ((i + 0.5) / opts.hitCount);
        positions.push({ x, y: opts.groundY });
      }

      const thetaMax = Math.atan2((opts.groundRight - 10) - opts.originX, opts.groundY - opts.originY);

      const beam = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      beam.setAttribute('x1', opts.originX);
      beam.setAttribute('y1', opts.originY);
      beam.setAttribute('x2', opts.originX);
      beam.setAttribute('y2', opts.groundY);
      beam.setAttribute('stroke', '#E24B4A');
      beam.setAttribute('stroke-width', '5');
      beam.setAttribute('stroke-linecap', 'round');
      beam.setAttribute('filter', glowUrl(arenaEl));
      svg.appendChild(beam);

      const start = performance.now();
      function animate(now) {
        const t = Math.min(1, (now - start) / opts.duration);
        const eased = 1 - Math.pow(1 - t, 2);
        const theta = thetaMax * eased;
        const dy = opts.groundY - opts.originY;
        const tipX = opts.originX + dy * Math.tan(theta);

        beam.setAttribute('x2', tipX);
        beam.setAttribute('y2', opts.groundY);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          beam.style.transition = 'opacity 0.15s';
          beam.style.opacity = '0';
          setTimeout(() => beam.remove(), 150);

          // explosions withheld until rotation is fully done, then fire in sequence
          positions.forEach((pos, i) => {
            setTimeout(() => {
              denseHitBlast(arenaEl, pos.x, pos.y);
              shake(arenaEl, 5);
            }, i * 65);
          });

          const totalHitTime = opts.hitCount * 65;
          setTimeout(() => {
            flash.style.background = '#ffd9c2';
            flash.style.transition = 'opacity 0.03s';
            flash.style.opacity = '0.75';
            shake(arenaEl, 10);
            setTimeout(() => {
              flash.style.transition = 'opacity 0.25s';
              flash.style.opacity = '0';
            }, 60);
            setTimeout(() => {
              dark.style.opacity = '0';
              resolve();
            }, 300);
          }, totalHitTime);
        }
      }
      requestAnimationFrame(animate);
    });
  }

  // ============================================================
  // EFFECT 4: Freeze / shatter
  // options: accepts either a target element or {x, y, radius}
  // ============================================================
  const ICE_CLIPS = [
    'polygon(20% 0%, 85% 10%, 100% 65%, 55% 100%, 0% 75%)',
    'polygon(10% 15%, 70% 0%, 100% 40%, 80% 100%, 20% 90%, 0% 50%)',
    'polygon(30% 0%, 100% 20%, 90% 80%, 40% 100%, 0% 55%)',
    'polygon(0% 20%, 60% 0%, 100% 55%, 70% 100%, 10% 85%)',
    'polygon(15% 0%, 100% 10%, 85% 100%, 30% 90%, 0% 40%)'
  ];
  const ICE_COLORS = ['#E6F1FB', '#B5D4F4', '#85B7EB', '#F1EFE8'];

  function freezeShatter(arenaEl, targetOrOpts) {
    const { chunk, tint, flash } = getLayers(arenaEl);
    let c;
    if (targetOrOpts instanceof Element) {
      c = rectOf(arenaEl, targetOrOpts);
    } else {
      c = { x: targetOrOpts.x, y: targetOrOpts.y, r: targetOrOpts.radius || 30 };
    }

    return new Promise(resolve => {
      chunk.innerHTML = '';
      const allPieces = [];
      tint.style.opacity = '0.16';

      // base layer guarantees full coverage
      const baseSize = c.r * 2.5;
      const base = document.createElement('div');
      base.className = 'fx-ice-base';
      base.style.width = baseSize + 'px';
      base.style.height = baseSize + 'px';
      base.style.left = (c.x - baseSize / 2) + 'px';
      base.style.top = (c.y - baseSize / 2) + 'px';
      base.style.background = '#CEE6F9';
      base.style.opacity = '0';
      base.style.transform = 'scale(0.3)';
      chunk.appendChild(base);
      allPieces.push({ el: base, angle: 0, rot: 0, isBase: true });
      requestAnimationFrame(() => {
        base.style.opacity = '0.85';
        base.style.transform = 'scale(1)';
      });

      const growWindow = 340;
      const chunkCount = 16;
      for (let i = 0; i < chunkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = c.r * (0.05 + Math.random() * 0.55);
        const size = c.r * (1.0 + Math.random() * 1.1);
        const ox = Math.cos(angle) * dist, oy = Math.sin(angle) * dist;
        const rot = Math.random() * 360 - 180;
        const growDuration = 0.12 + Math.random() * 0.2;
        const delay = 100 + Math.random() * growWindow;
        const overshoot = 0.9 + Math.random() * 0.35;

        const el = document.createElement('div');
        el.className = 'fx-ice-chunk';
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.left = (c.x + ox - size / 2) + 'px';
        el.style.top = (c.y + oy - size / 2) + 'px';
        el.style.background = ICE_COLORS[Math.floor(Math.random() * ICE_COLORS.length)];
        el.style.border = '1px solid rgba(255,255,255,0.7)';
        el.style.clipPath = ICE_CLIPS[Math.floor(Math.random() * ICE_CLIPS.length)];
        el.style.opacity = '0';
        el.style.transform = `scale(0) rotate(${rot}deg)`;
        el.style.transitionDuration = `${growDuration}s, ${growDuration * 0.8}s`;
        el.style.zIndex = String(4 + Math.floor(Math.random() * 8));

        const hl = document.createElement('div');
        hl.className = 'fx-highlight';
        el.appendChild(hl);
        chunk.appendChild(el);
        allPieces.push({ el, angle, rot });

        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = `scale(${overshoot}) rotate(${rot + (Math.random() - 0.5) * 30}deg)`;
          spawnSpark(arenaEl, c.x + ox, c.y + oy);
          if (Math.random() > 0.55) microShake(arenaEl, 2.5);
        }, delay);
      }

      const spikeCount = 6;
      for (let i = 0; i < spikeCount; i++) {
        const angle = (i / spikeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const length = c.r * (1.6 + Math.random() * 1.1);
        const width = 10 + Math.random() * 10;
        const spikeAngleDeg = angle * 180 / Math.PI + 90;
        const delay = 150 + Math.random() * growWindow;

        const el = document.createElement('div');
        el.className = 'fx-ice-spike';
        el.style.width = width + 'px';
        el.style.height = length + 'px';
        el.style.left = (c.x - width / 2) + 'px';
        el.style.top = (c.y - length + 8) + 'px';
        el.style.background = '#E6F1FB';
        el.style.opacity = '0';
        el.style.transformOrigin = '50% 100%';
        el.style.transform = `rotate(${spikeAngleDeg}deg) scale(0)`;
        el.style.transitionDuration = '0.22s, 0.16s';
        el.style.zIndex = '3';
        chunk.appendChild(el);
        allPieces.push({ el, angle, rot: spikeAngleDeg, isSpike: true });

        setTimeout(() => {
          el.style.opacity = '0.95';
          el.style.transform = `rotate(${spikeAngleDeg}deg) scale(1)`;
          microShake(arenaEl, 3);
        }, delay);
      }

      const growEndTime = 100 + growWindow + 260;

      setTimeout(() => {
        tint.style.transition = 'opacity 0.05s';
        tint.style.opacity = '0.05';
        flash.style.background = '#eafcff';
        flash.style.transition = 'opacity 0.03s';
        flash.style.opacity = '0.95';
        shake(arenaEl, 11);

        allPieces.forEach(({ el, angle, rot, isBase, isSpike }) => {
          if (isBase) {
            el.classList.add('fx-shatter');
            el.style.transform = `translate(${Math.cos(angle) * 40}px, ${Math.sin(angle) * 40}px) scale(1.4)`;
          } else if (isSpike) {
            el.classList.add('fx-shatter');
            el.style.transform = `rotate(${rot + (Math.random() > 0.5 ? 1 : -1) * 90}deg) translateY(${-40 - Math.random() * 40}px) scale(0.4)`;
          } else {
            const flyDist = 90 + Math.random() * 120;
            el.classList.add('fx-shatter');
            el.style.transform = `translate(${Math.cos(angle) * flyDist}px, ${Math.sin(angle) * flyDist}px) scale(${0.3 + Math.random() * 0.2}) rotate(${rot + (Math.random() > 0.5 ? 1 : -1) * (250 + Math.random() * 150)}deg)`;
          }
        });
        spawnFrostBit(arenaEl, c.x, c.y, 26);

        setTimeout(() => {
          flash.style.transition = 'opacity 0.2s';
          flash.style.opacity = '0';
          tint.style.transition = 'opacity 0.3s';
          tint.style.opacity = '0';
        }, 70);
        setTimeout(() => {
          chunk.innerHTML = '';
          resolve();
        }, 380);
      }, growEndTime + 480);
    });
  }

  // ============================================================
  // EFFECT 5: Meteor shower
  // options: { count, zonePct, arenaWidth, floorY }
  // zonePct = fraction of arena width the landing zone spans,
  // centered (e.g. 0.4 = center 40%)
  // ============================================================
  function meteorShower(arenaEl, options) {
    const { svg, dark } = getLayers(arenaEl);
    const arenaRect = arenaEl.getBoundingClientRect();
    const opts = Object.assign({
      count: 6,
      zonePct: 0.4,
      arenaWidth: arenaRect.width,
      floorY: arenaRect.height - 70
    }, options);

    return new Promise(resolve => {
      dark.style.opacity = '0.75';
      const zoneWidth = opts.arenaWidth * opts.zonePct;
      const zoneLeft = (opts.arenaWidth - zoneWidth) / 2;

      function dropOne(targetX, targetY, startY, duration) {
        return new Promise(res => {
          const beam = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          beam.setAttribute('x', targetX - 4);
          beam.setAttribute('y', startY);
          beam.setAttribute('width', '8');
          beam.setAttribute('height', '5');
          beam.setAttribute('fill', '#ffb27a');
          beam.setAttribute('filter', glowUrl(arenaEl));
          svg.appendChild(beam);

          const start = performance.now();
          function animate(now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = t * t;
            const y = startY + (targetY - startY) * eased;
            beam.setAttribute('height', Math.max(5, y - startY));
            if (t < 1) {
              requestAnimationFrame(animate);
            } else {
              beam.remove();
              bigBlast(arenaEl, targetX, targetY);
              res();
            }
          }
          requestAnimationFrame(animate);
        });
      }

      let maxDelay = 0;
      const promises = [];
      for (let i = 0; i < opts.count; i++) {
        const targetX = zoneLeft + Math.random() * zoneWidth;
        const startY = -15 - Math.random() * 20;
        const duration = 220 + Math.random() * 140;
        const delay = Math.random() * 550;
        maxDelay = Math.max(maxDelay, delay + duration);
        promises.push(new Promise(res => {
          setTimeout(() => dropOne(targetX, opts.floorY, startY, duration).then(res), delay);
        }));
      }

      Promise.all(promises).then(() => {
        setTimeout(() => {
          dark.style.opacity = '0';
          resolve();
        }, 350);
      });
    });
  }

  // ============================================================
  // EFFECT 6: Earth splitter (chaotic branching crack + implosion)
  // options: { fromX, toX, groundY }
  // ============================================================
  function earthSplitter(arenaEl, options) {
    const { svg, dark } = getLayers(arenaEl);
    const opts = options;

    return new Promise(resolve => {
      const crackLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      crackLine.setAttribute('stroke', '#0b0a09');
      crackLine.setAttribute('stroke-width', '4');
      crackLine.setAttribute('fill', 'none');
      crackLine.setAttribute('stroke-linecap', 'round');
      crackLine.setAttribute('stroke-linejoin', 'round');
      crackLine.style.transition = 'opacity 0.4s';

      const crackShadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      crackShadow.setAttribute('stroke', '#2C2C2A');
      crackShadow.setAttribute('stroke-width', '9');
      crackShadow.setAttribute('fill', 'none');
      crackShadow.setAttribute('stroke-linecap', 'round');
      crackShadow.setAttribute('stroke-linejoin', 'round');
      crackShadow.style.transition = 'opacity 0.4s';

      const branchGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      branchGroup.style.transition = 'opacity 0.4s';

      svg.appendChild(crackShadow);
      svg.appendChild(crackLine);
      svg.appendChild(branchGroup);

      function genChaoticCrackPath(x1, y, x2, segments) {
        let points = [{ x: x1, y }];
        let lastDir = 1;
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 10;
          const flip = Math.random() < 0.75 ? -1 : 1;
          const dir = lastDir * flip;
          lastDir = dir;
          const amp = Math.random() < 0.25 ? 20 + Math.random() * 10 : 4 + Math.random() * 10;
          points.push({ x, y: y + dir * amp });
        }
        points.push({ x: x2, y });
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
        return { d, points };
      }

      function drawBranch(group, px, py, angle, depth, maxDepth) {
        const len = (16 + Math.random() * 26) * (1 - depth * 0.16);
        const segs = 2 + Math.floor(Math.random() * 2);
        let x = px, y = py;
        let d = `M ${x} ${y}`;
        const segPoints = [{ x, y }];
        for (let i = 0; i < segs; i++) {
          const wobble = (Math.random() - 0.5) * 1.4;
          x += Math.cos(angle + wobble) * (len / segs);
          y += Math.sin(angle + wobble) * (len / segs);
          d += ` L ${x} ${y}`;
          segPoints.push({ x, y });
        }
        const bp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bp.setAttribute('stroke', '#0b0a09');
        bp.setAttribute('stroke-width', Math.max(0.6, 2.4 - depth * 0.5));
        bp.setAttribute('fill', 'none');
        bp.setAttribute('stroke-linecap', 'round');
        bp.setAttribute('d', d);
        group.appendChild(bp);

        if (depth < maxDepth) {
          const childCount = 1 + Math.floor(Math.random() * 3);
          for (let c = 0; c < childCount; c++) {
            const fromIdx = 1 + Math.floor(Math.random() * (segPoints.length - 1));
            const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.9);
            if (Math.random() > 0.12) {
              drawBranch(group, segPoints[fromIdx].x, segPoints[fromIdx].y, branchAngle, depth + 1, maxDepth);
            }
          }
        }
      }

      function flickerCrack() {
        const paths = [crackLine, crackShadow, ...branchGroup.querySelectorAll('path')];
        let flickers = 0;
        const totalFlickers = 8;
        const iv = setInterval(() => {
          flickers++;
          const white = flickers % 2 === 1;
          paths.forEach(p => {
            p.setAttribute('stroke', white ? '#ffffff' : '#0b0a09');
            p.setAttribute('filter', white ? glowUrl(arenaEl) : '');
          });
          if (flickers >= totalFlickers) {
            clearInterval(iv);
            paths.forEach(p => {
              p.setAttribute('stroke', '#0b0a09');
              p.setAttribute('filter', '');
            });
          }
        }, 45);
      }

      function implode(len) {
        dark.style.transition = 'opacity 0.08s';
        dark.style.opacity = '0.55';
        shake(arenaEl, 12);
        flickerCrack();

        const sampleCount = 16;
        for (let i = 0; i <= sampleCount; i++) {
          const dist = (i / sampleCount) * len;
          const pt = crackLine.getPointAtLength(dist);
          const delay = Math.random() * 90;
          setTimeout(() => {
            spawnRock(arenaEl, pt.x, pt.y, 14 + Math.random() * 16);
            spawnRock(arenaEl, pt.x + (Math.random() - 0.5) * 14, pt.y - 4, 10 + Math.random() * 12);
            spawnDust(arenaEl, pt.x, pt.y, 4);
          }, delay);
        }

        setTimeout(() => {
          dark.style.transition = 'opacity 0.35s';
          dark.style.opacity = '0';
          crackLine.style.opacity = '0';
          crackShadow.style.opacity = '0';
          branchGroup.style.opacity = '0';
          setTimeout(() => {
            crackLine.remove();
            crackShadow.remove();
            branchGroup.remove();
            resolve();
          }, 400);
        }, 200);
      }

      const { d } = genChaoticCrackPath(opts.fromX, opts.groundY, opts.toX, 30);
      crackLine.setAttribute('d', d);
      crackShadow.setAttribute('d', d);

      const len = crackLine.getTotalLength();
      crackLine.style.strokeDasharray = len;
      crackLine.style.strokeDashoffset = len;
      crackShadow.style.strokeDasharray = len;
      crackShadow.style.strokeDashoffset = len;

      const duration = 800;
      const start = performance.now();
      let lastRockDist = 0;
      let lastBranchDist = 0;

      function animate(now) {
        const t = Math.min(1, (now - start) / duration);
        const offset = len * (1 - t);
        crackLine.style.strokeDashoffset = offset;
        crackShadow.style.strokeDashoffset = offset;

        const traveled = len * t;
        if (traveled - lastRockDist > 18) {
          const pt = crackLine.getPointAtLength(traveled);
          spawnRock(arenaEl, pt.x, pt.y, 8 + Math.random() * 10);
          if (Math.random() > 0.5) spawnDust(arenaEl, pt.x, pt.y, 2);
          microShake(arenaEl, 2.5);
          lastRockDist = traveled;
        }
        if (traveled - lastBranchDist > 10) {
          const pt = crackLine.getPointAtLength(traveled);
          const angle = (Math.random() > 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.9);
          drawBranch(branchGroup, pt.x, pt.y, angle, 0, 4);
          lastBranchDist = traveled;
        }

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => implode(len), 120);
        }
      }
      requestAnimationFrame(animate);
    });
  }

  // ---------------------------------------------------------
  // Public API
  // ---------------------------------------------------------
  global.BattleFX = {
    init,
    lightning,
    skyBeam,
    laserSweep,
    freezeShatter,
    meteorShower,
    earthSplitter,
    // exposed in case you want to build new effects from the same primitives
    utils: {
      rectOf, wait, shake, microShake,
      spawnBoom, spawnRing, spawnEmbers, spawnScorch,
      spawnFrostBit, spawnSpark, spawnRock, spawnDust,
      bigBlast, denseHitBlast
    }
  };

})(window);
