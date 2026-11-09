"use strict";
/* Teia: grafo de notas em canvas. A física vem de teia-layout.js (escala com o número de notas). Sem dependências. */
(function () {
  const data = window.TEIA || { nodes: [], links: [] };
  const listEl = document.getElementById("teiaList");
  const canvas = document.getElementById("teia");
  const emptyEl = document.getElementById("teiaEmpty");
  const exemploEl = document.getElementById("teiaExemplo");
  const infoEl = document.getElementById("teiaInfo");
  if (exemploEl) exemploEl.hidden = data.fonte !== "exemplo"; // aviso só quando as notas são as de tools/sample-vault

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
  const COL = { node: "#b85e18", nodeHi: "#ff7a1a", text: "#a8a8a8", textHi: "#f2f2f2", link: "#2b2b2b", linkHi: "#ff7a1a", pill: "rgba(13,13,13,.88)" };
  const FONTE = "ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif";

  const nodes = data.nodes.map(n => ({ ...n, deg: n.deg || 0, x: 0, y: 0, vx: 0, vy: 0 }));
  const nmap = new Map(nodes.map(n => [n.id, n]));
  const links = data.links.map(l => ({ s: nmap.get(l.s), t: nmap.get(l.t) })).filter(l => l.s && l.t);
  const neighbors = new Map(nodes.map(n => [n.id, new Set()]));
  links.forEach(l => { neighbors.get(l.s.id).add(l.t.id); neighbors.get(l.t.id).add(l.s.id); });
  const muitos = nodes.length > 24;
  const radius = n => (muitos ? 4 : 5) + Math.sqrt(n.deg + 1) * 2.4;
  // rótulos por prioridade: as notas mais conectadas primeiro (desempate por título)
  const ordem = [...nodes].sort((a, b) => b.deg - a.deg || a.title.localeCompare(b.title, "pt"));
  if (infoEl) infoEl.textContent = `${nodes.length} notas e ${links.length} conexões. Passe o mouse num ponto para ver o título e as notas ligadas; clique para abrir.` + (muitos ? " Os nomes fixos são das notas mais conectadas." : "");

  let W = 0, H = 0, dpr = 1, layout = null;
  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.height = TeiaLayout.alturaIdeal(nodes.length, canvas.clientWidth) + "px"; // mais notas, quadro mais alto
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }
  {
    const m = medir(); W = m.w; H = m.h;
    layout = TeiaLayout.criar(nodes, links, W, H); layout.iniciar();
  }

  let hover = null, drag = null, downAt = null, sujo = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const larguras = new Map();
  const larg = n => { let w = larguras.get(n.id); if (w === undefined) { ctx.font = `12px ${FONTE}`; w = ctx.measureText(n.title).width; larguras.set(n.id, w); } return w; };

  function rotulosVisiveis(hiSet) {
    const escolhidos = new Set(), caixas = [];
    const caixa = n => { const w = larg(n) + 8, r = radius(n); return { x: n.x - w / 2, y: n.y - r - 20, w, h: 15 }; };
    const livre = c => caixas.every(o => c.x + c.w < o.x || o.x + o.w < c.x || c.y + c.h < o.y || o.y + o.h < c.y) && c.x > 0 && c.x + c.w < W;
    if (hover) { // o nó em foco sempre tem nome; os vizinhos também, mas só os que não se sobrepõem (os mais conectados primeiro)
      escolhidos.add(hover); caixas.push(caixa(hover));
      for (const n of ordem) { if (!hiSet || !hiSet.has(n.id)) continue; const c = caixa(n); if (livre(c)) { escolhidos.add(n); caixas.push(c); } }
    }
    for (const n of ordem) {
      if (escolhidos.has(n)) continue;
      if (!muitos) { escolhidos.add(n); continue; }
      if (n.deg === 0) continue; // nota sem ligações: o nome só aparece ao passar o mouse
      const c = caixa(n); if (livre(c)) { escolhidos.add(n); caixas.push(c); }
    }
    return escolhidos;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const hiSet = hover ? neighbors.get(hover.id) : null;
    links.forEach(l => {
      const on = hover && (l.s === hover || l.t === hover);
      ctx.strokeStyle = on ? COL.linkHi : COL.link; ctx.globalAlpha = hover && !on ? 0.25 : 1;
      ctx.lineWidth = on ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(l.s.x, l.s.y); ctx.lineTo(l.t.x, l.t.y); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    if (layout.faixa.soltos) { // faixa das notas sem ligações
      ctx.strokeStyle = COL.link; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, layout.faixa.y + 0.5); ctx.lineTo(W - 14, layout.faixa.y + 0.5); ctx.stroke();
      ctx.font = `11px ${FONTE}`; ctx.fillStyle = COL.text; ctx.textAlign = "left";
      ctx.fillText(`Notas sem ligações (${layout.faixa.soltos}): passe o mouse para ver o título`, 18, layout.faixa.y + 16);
    }
    nodes.forEach(n => {
      const on = !hover || n === hover || (hiSet && hiSet.has(n.id));
      ctx.globalAlpha = on ? 1 : 0.3;
      ctx.beginPath(); ctx.arc(n.x, n.y, radius(n), 0, Math.PI * 2);
      ctx.fillStyle = (n === hover) ? COL.nodeHi : COL.node; ctx.fill();
    });
    ctx.globalAlpha = 1;
    const mostrar = rotulosVisiveis(hiSet);
    ctx.textAlign = "center";
    mostrar.forEach(n => {
      const destaque = hover && (n === hover || (hiSet && hiSet.has(n.id)));
      if (hover && !destaque) return; // com um nó em foco, só o foco e os vizinhos têm nome
      ctx.font = (n === hover ? "600 13px " : "12px ") + FONTE;
      const y = n.y - radius(n) - 6;
      if (destaque) { const w = ctx.measureText(n.title).width + 10; ctx.fillStyle = COL.pill; ctx.fillRect(n.x - w / 2, y - 12, w, 16); }
      ctx.fillStyle = (n === hover) ? COL.textHi : (destaque ? "#d6d6d6" : COL.text);
      ctx.fillText(n.title, n.x, y);
    });
  }

  function frame() {
    const animando = !!drag || !layout.pronto();
    if (animando) { layout.passo(drag); layout.passo(drag); sujo = true; }
    if (sujo) { draw(); sujo = false; }
    requestAnimationFrame(frame);
  }
  if (reduce) { for (let i = 0; i < 320; i++) layout.passo(null); draw(); }
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
    if (drag) { drag.x = Math.max(16, Math.min(W - 16, h.x)); drag.y = Math.max(16, Math.min(H - 16, h.y)); layout.esquentar(Math.min(W, H) / 14); }
    else { const prev = hover; hover = h.node; canvas.style.cursor = hover ? "pointer" : "grab"; if (hover !== prev) { sujo = true; if (reduce) draw(); } }
  });
  canvas.addEventListener("pointerleave", () => { if (hover && !drag) { hover = null; sujo = true; if (reduce) draw(); } });
  canvas.addEventListener("pointerdown", ev => { const h = at(ev); if (h.node) { drag = h.node; downAt = { x: h.x, y: h.y }; canvas.setPointerCapture(ev.pointerId); } });
  canvas.addEventListener("pointerup", ev => {
    const h = at(ev);
    if (drag && downAt && Math.hypot(h.x - downAt.x, h.y - downAt.y) < 5 && drag.url) { location.href = drag.url; }
    drag = null; downAt = null; sujo = true;
  });
  window.addEventListener("resize", () => {
    const m = medir(); W = m.w; H = m.h;
    layout = TeiaLayout.criar(nodes, links, W, H); layout.iniciar(); // largura nova: refaz o desenho (a faixa das notas soltas depende dela)
    sujo = true; if (reduce) { for (let i = 0; i < 320; i++) layout.passo(null); draw(); }
  });
})();
