"use strict";
/* Teia: grafo de notas em canvas, com layout por força. Sem dependências. */
(function () {
  const data = window.TEIA || { nodes: [], links: [] };
  const listEl = document.getElementById("teiaList");
  const canvas = document.getElementById("teia");
  const emptyEl = document.getElementById("teiaEmpty");

  // lista de notas (acessível e funciona mesmo sem o grafo)
  if (listEl) {
    const sorted = [...data.nodes].sort((a, b) => a.title.localeCompare(b.title, "pt"));
    listEl.replaceChildren(...sorted.map(n => {
      const a = document.createElement("a");
      a.href = n.url; a.className = "teia-chip"; a.textContent = n.title;
      return a;
    }));
  }
  if (!canvas) return;
  if (!data.nodes.length) { if (emptyEl) emptyEl.hidden = false; return; }

  const ctx = canvas.getContext("2d");
  const COL = { node: "#b85e18", nodeHi: "#ff7a1a", text: "#9a9a9a", textHi: "#f2f2f2", link: "#2b2b2b", linkHi: "#ff7a1a" };

  const byId = new Map(data.nodes.map(n => [n.id, n]));
  const nodes = data.nodes.map(n => ({ ...n, x: 0, y: 0, vx: 0, vy: 0 }));
  const nmap = new Map(nodes.map(n => [n.id, n]));
  const links = data.links.map(l => ({ s: nmap.get(l.s), t: nmap.get(l.t) })).filter(l => l.s && l.t);
  const neighbors = new Map(nodes.map(n => [n.id, new Set()]));
  links.forEach(l => { neighbors.get(l.s.id).add(l.t.id); neighbors.get(l.t.id).add(l.s.id); });
  const radius = n => 5 + Math.sqrt(n.deg + 1) * 2.6;

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  // posições iniciais em círculo
  nodes.forEach((n, i) => { const a = (i / nodes.length) * Math.PI * 2; n.x = W / 2 + Math.cos(a) * Math.min(W, H) * 0.3; n.y = H / 2 + Math.sin(a) * Math.min(W, H) * 0.3; });

  let hover = null, drag = null, downAt = null, alpha = 1;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function step() {
    const k = 0.9, rep = 5200, spring = 0.035, len = 90, center = 0.012;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy || 0.01;
        const f = rep / d2; const d = Math.sqrt(d2);
        const ux = dx / d, uy = dy / d;
        a.vx += ux * f * 0.001; a.vy += uy * f * 0.001;
        b.vx -= ux * f * 0.001; b.vy -= uy * f * 0.001;
      }
      a.vx += (W / 2 - a.x) * center; a.vy += (H / 2 - a.y) * center;
    }
    links.forEach(l => {
      let dx = l.t.x - l.s.x, dy = l.t.y - l.s.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - len) * spring; const ux = dx / d, uy = dy / d;
      l.s.vx += ux * f; l.s.vy += uy * f; l.t.vx -= ux * f; l.t.vy -= uy * f;
    });
    nodes.forEach(n => {
      if (n === drag) { n.vx = 0; n.vy = 0; return; }
      n.vx *= k; n.vy *= k; n.x += n.vx * alpha; n.y += n.vy * alpha;
      n.x = Math.max(16, Math.min(W - 16, n.x)); n.y = Math.max(16, Math.min(H - 16, n.y));
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const hiSet = hover ? neighbors.get(hover.id) : null;
    links.forEach(l => {
      const on = hover && (l.s === hover || l.t === hover);
      ctx.strokeStyle = on ? COL.linkHi : COL.link; ctx.globalAlpha = hover && !on ? 0.3 : 1;
      ctx.lineWidth = on ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(l.s.x, l.s.y); ctx.lineTo(l.t.x, l.t.y); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    nodes.forEach(n => {
      const on = !hover || n === hover || (hiSet && hiSet.has(n.id));
      ctx.globalAlpha = on ? 1 : 0.35;
      ctx.beginPath(); ctx.arc(n.x, n.y, radius(n), 0, Math.PI * 2);
      ctx.fillStyle = (n === hover) ? COL.nodeHi : COL.node; ctx.fill();
      ctx.font = (n === hover ? "600 13px " : "12px ") + "ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif";
      ctx.fillStyle = (n === hover) ? COL.textHi : COL.text; ctx.textAlign = "center";
      ctx.fillText(n.title, n.x, n.y - radius(n) - 5);
    });
    ctx.globalAlpha = 1;
  }

  function frame() { if (alpha > 0.02) { step(); alpha *= 0.985; } draw(); requestAnimationFrame(frame); }
  if (reduce) { for (let i = 0; i < 300; i++) step(); alpha = 0; draw(); }
  else requestAnimationFrame(frame);

  function at(ev) {
    const r = canvas.getBoundingClientRect();
    const x = ev.clientX - r.left, y = ev.clientY - r.top;
    let best = null, bd = 1e9;
    nodes.forEach(n => { const d = Math.hypot(n.x - x, n.y - y); if (d < radius(n) + 8 && d < bd) { bd = d; best = n; } });
    return { x, y, node: best };
  }
  canvas.addEventListener("pointermove", ev => {
    const h = at(ev);
    if (drag) { drag.x = h.x; drag.y = h.y; alpha = Math.max(alpha, 0.3); }
    else { const prev = hover; hover = h.node; canvas.style.cursor = hover ? "pointer" : "grab"; if (hover !== prev && reduce) draw(); }
  });
  canvas.addEventListener("pointerdown", ev => { const h = at(ev); if (h.node) { drag = h.node; downAt = { x: h.x, y: h.y }; canvas.setPointerCapture(ev.pointerId); } });
  canvas.addEventListener("pointerup", ev => {
    const h = at(ev);
    if (drag && downAt && Math.hypot(h.x - downAt.x, h.y - downAt.y) < 5 && drag.url) { location.href = drag.url; }
    drag = null; downAt = null;
  });
  window.addEventListener("resize", () => { resize(); alpha = Math.max(alpha, 0.5); if (reduce) { for (let i = 0; i < 120; i++) step(); draw(); } });
})();
