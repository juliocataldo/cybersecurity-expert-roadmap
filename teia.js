"use strict";
/* Teia: grafo de notas em canvas, com zoom e arraste. A física vem de teia-layout.js. Sem dependências.
   Mundo x tela: a física roda num "mundo" maior que o quadro; a câmera (k = zoom, ox/oy = deslocamento) leva o mundo para a tela.
   Mouse: passar por cima destaca; clicar seleciona (mostra o cartão); clicar de novo, ou duplo clique, abre a nota.
   Toque: 1º toque seleciona, 2º abre. Um dedo rola a página (o quadro não prende a rolagem) até você dar zoom;
   com zoom, um dedo move o mapa e a pinça aproxima/afasta. */
(function () {
  const data = window.TEIA || { nodes: [], links: [] };
  const canvas = document.getElementById("teia");
  const emptyEl = document.getElementById("teiaEmpty");
  const exemploEl = document.getElementById("teiaExemplo");
  const infoEl = document.getElementById("teiaInfo");
  const cardEl = document.getElementById("teiaCard");
  const legEl = document.getElementById("teiaLegenda");
  const ctrlEl = document.getElementById("teiaCtrl");
  if (exemploEl) exemploEl.hidden = data.fonte !== "exemplo"; // aviso só quando as notas são as de tools/sample-vault
  if (!canvas) return;

  // só as notas com ligações entram no grafo; as soltas estão na página Notas (com busca)
  const todos = data.nodes.map(n => ({ ...n, deg: n.deg || 0, x: 0, y: 0, vx: 0, vy: 0 }));
  const nodes = todos.filter(n => n.deg > 0);
  const nmap = new Map(nodes.map(n => [n.id, n]));
  const links = data.links.map(l => ({ s: nmap.get(l.s), t: nmap.get(l.t) })).filter(l => l.s && l.t);
  if (!nodes.length) { if (emptyEl) emptyEl.hidden = false; if (ctrlEl) ctrlEl.hidden = true; return; }

  const ctx = canvas.getContext("2d");
  const COL = { node: "#b85e18", nodeHi: "#ff7a1a", text: "#a8a8a8", textHi: "#f2f2f2", link: "#333", linkHi: "#ff7a1a", pill: "rgba(13,13,13,.9)" };
  const FONTE = "ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif";
  // cor por pasta do vault: cor fixa por nome (nunca pela ordem), paleta validada para o fundo escuro e daltonismo.
  // O laranja fica de fora de propósito: é a cor de destaque do site (foco e ligações em foco).
  const CORES = { "Offsec": "#3987e5", "OS": "#199e70", "Swiss Army Kmife": "#c98500", "Swiss Army Knife": "#c98500", "Network": "#d55181", "Web APP and API": "#9085e9", "Defsec": "#e66767" };
  const OUTRAS = "Outras", COR_OUTRAS = "#8a8a8a";
  const grupo = n => (CORES[n.pasta] ? n.pasta : OUTRAS);
  const cor = n => CORES[n.pasta] || COR_OUTRAS;
  let pastaSel = null; // legenda clicada: destaca só as notas daquela pasta
  const neighbors = new Map(nodes.map(n => [n.id, new Set()]));
  links.forEach(l => { neighbors.get(l.s.id).add(l.t.id); neighbors.get(l.t.id).add(l.s.id); });
  const raioMundo = n => 4 + Math.sqrt(n.deg + 1) * 2.4;
  const ordem = [...nodes].sort((a, b) => b.deg - a.deg || a.title.localeCompare(b.title, "pt")); // rótulos: mais conectadas primeiro
  const soltas = todos.length - nodes.length;
  if (infoEl) infoEl.textContent = `${nodes.length} notas ligadas e ${links.length} conexões. Clique ou toque num ponto para ver a nota; de novo para abrir. `
    + "Arraste o fundo para mover; use + e − (ou Ctrl + roda do mouse, ou a pinça no celular) para o zoom."
    + (soltas ? ` As ${soltas} notas sem ligações estão na página Notas.` : "");

  /* ---------- tamanhos: quadro (tela) e mundo (física) ---------- */
  let W = 0, H = 0, dpr = 1;
  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  medir();
  // mundo com a mesma proporção do quadro e área suficiente para as notas respirarem
  const area = nodes.length * 120 * 120;
  const WW = Math.max(W, Math.sqrt(area * W / H)), WH = WW * H / W;
  const layout = TeiaLayout.criar(nodes, links, WW, WH, { semBorda: true, gravidade: 0.8 }); layout.iniciar(); // sem parede: a câmera enquadra

  /* ---------- câmera ---------- */
  let k = 1, ox = 0, oy = 0, kFit = 1, mexeu = false; // mexeu = a pessoa deu zoom/arrastou: paramos de reenquadrar sozinhos
  const tela = n => ({ x: n.x * k + ox, y: n.y * k + oy });
  const mundo = (sx, sy) => ({ x: (sx - ox) / k, y: (sy - oy) / k });
  const raio = n => raioMundo(n) * Math.min(1.6, Math.max(0.75, Math.sqrt(k)));
  function enquadrar() {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const n of nodes) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }
    const pad = 28, topo = 22; // folga para os nomes acima dos pontos
    kFit = Math.min((W - 2 * pad) / Math.max(x1 - x0, 1), (H - 2 * pad - topo) / Math.max(y1 - y0, 1), 2.2);
    k = kFit; ox = (W - (x1 - x0) * k) / 2 - x0 * k; oy = (H - (y1 - y0) * k) / 2 - y0 * k + topo / 2;
    aplicarToque();
  }
  const kMin = () => kFit * 0.5, kMax = () => Math.max(kFit * 6, 3);
  function zoomEm(sx, sy, f) {
    const k2 = Math.min(kMax(), Math.max(kMin(), k * f));
    ox = sx - (sx - ox) * (k2 / k); oy = sy - (sy - oy) * (k2 / k); k = k2;
    mexeu = true; aplicarToque(); sujo = true;
  }
  // sem zoom, o dedo rola a página; com zoom, o dedo move o mapa
  function aplicarToque() { canvas.style.touchAction = k > kFit * 1.05 ? "none" : "pan-y"; }

  /* ---------- desenho ---------- */
  let hover = null, sel = null, sujo = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const larguras = new Map();
  const larg = n => { let w = larguras.get(n.id); if (w === undefined) { ctx.font = `12px ${FONTE}`; w = ctx.measureText(n.title).width; larguras.set(n.id, w); } return w; };

  function rotulos(foco, viz) {
    const escolhidos = new Set(), caixas = [];
    const caixa = n => { const p = tela(n), w = larg(n) + 10; return { x: p.x - w / 2, y: p.y - raio(n) - 20, w, h: 16 }; };
    const livre = c => c.x > 2 && c.x + c.w < W - 2 && c.y > 2 && c.y + c.h < H - 2
      && caixas.every(o => c.x + c.w < o.x || o.x + o.w < c.x || c.y + c.h < o.y || o.y + o.h < c.y);
    if (foco) { escolhidos.add(foco); caixas.push(caixa(foco)); }
    for (const n of ordem) {
      if (escolhidos.has(n) || (foco && !viz.has(n.id))) continue; // com foco, só ele e os vizinhos têm nome
      if (!foco && pastaSel && grupo(n) !== pastaSel) continue;     // com uma pasta escolhida na legenda, só ela tem nome
      const c = caixa(n); if (livre(c)) { escolhidos.add(n); caixas.push(c); }
    }
    return escolhidos;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const foco = hover || sel;
    const viz = foco ? neighbors.get(foco.id) : null;
    const naPasta = n => !pastaSel || grupo(n) === pastaSel;
    for (const l of links) {
      const on = foco && (l.s === foco || l.t === foco);
      const a = tela(l.s), b = tela(l.t);
      const apagada = (foco && !on) || (!foco && pastaSel && !(naPasta(l.s) && naPasta(l.t)));
      ctx.strokeStyle = on ? COL.linkHi : COL.link; ctx.globalAlpha = apagada ? 0.25 : 1; ctx.lineWidth = on ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (const n of nodes) {
      const p = tela(n);
      ctx.globalAlpha = foco ? (n === foco || viz.has(n.id) ? 1 : 0.25) : (naPasta(n) ? 1 : 0.18);
      ctx.beginPath(); ctx.arc(p.x, p.y, raio(n) + (n === foco ? 1.5 : 0), 0, Math.PI * 2);
      ctx.fillStyle = cor(n); ctx.fill();
      if (n === foco) { ctx.strokeStyle = n === sel ? COL.textHi : COL.nodeHi; ctx.lineWidth = 2; ctx.stroke(); }
    }
    ctx.globalAlpha = 1; ctx.textAlign = "center";
    for (const n of rotulos(foco, viz)) {
      const p = tela(n), y = p.y - raio(n) - 6, destaque = !!foco;
      ctx.font = (n === foco ? "600 13px " : "12px ") + FONTE;
      if (destaque) { const w = ctx.measureText(n.title).width + 10; ctx.fillStyle = COL.pill; ctx.fillRect(p.x - w / 2, y - 12, w, 16); }
      ctx.fillStyle = n === foco ? COL.textHi : destaque ? "#d6d6d6" : COL.text;
      ctx.fillText(n.title, p.x, y);
    }
  }

  function frame() {
    if (arrasto && arrasto.no || !layout.pronto()) {
      layout.passo(arrasto && arrasto.no); layout.passo(arrasto && arrasto.no);
      if (!mexeu) enquadrar();
      sujo = true;
    }
    if (sujo) { draw(); sujo = false; }
    requestAnimationFrame(frame);
  }
  if (reduce) for (let i = 0; i < 320; i++) layout.passo(null); // sem animação: já começa assentado
  enquadrar();
  requestAnimationFrame(frame);

  /* ---------- legenda: uma entrada por pasta presente no grafo; clicar destaca a pasta ---------- */
  if (legEl) {
    const contagem = new Map();
    for (const n of nodes) contagem.set(grupo(n), (contagem.get(grupo(n)) || 0) + 1);
    const itens = [...contagem].sort((a, b) => (a[0] === OUTRAS) - (b[0] === OUTRAS) || b[1] - a[1] || a[0].localeCompare(b[0], "pt"));
    legEl.replaceChildren(...itens.map(([g, q]) => {
      const b = document.createElement("button"); b.type = "button"; b.dataset.pasta = g; b.setAttribute("aria-pressed", "false");
      const sw = document.createElement("span"); sw.className = "sw sw-" + (g === OUTRAS ? "outras" : g.toLowerCase().replace(/[^a-z]+/g, "-"));
      const nome = document.createElement("span"); nome.textContent = g;
      const qt = document.createElement("span"); qt.className = "teia-q"; qt.textContent = q;
      b.append(sw, nome, qt); return b;
    }));
    legEl.hidden = false;
    legEl.addEventListener("click", ev => {
      const b = ev.target.closest("button[data-pasta]"); if (!b) return;
      pastaSel = pastaSel === b.dataset.pasta ? null : b.dataset.pasta;
      for (const x of legEl.querySelectorAll("button")) x.setAttribute("aria-pressed", String(x.dataset.pasta === pastaSel));
      selecionar(null);
    });
  }

  /* ---------- cartão da nota selecionada ---------- */
  function selecionar(n) {
    sel = n; sujo = true;
    if (!cardEl) return;
    if (!n) { cardEl.hidden = true; return; }
    const pasta = document.createElement("span"); pasta.className = "k"; pasta.textContent = n.pasta || "Nota";
    const h = document.createElement("b"); h.textContent = n.title;
    const p = document.createElement("p"); p.textContent = n.resumo || "";
    const a = document.createElement("a"); a.href = n.url; a.className = "go"; a.textContent = "Abrir nota →";
    const x = document.createElement("button"); x.type = "button"; x.className = "teia-x"; x.setAttribute("aria-label", "Fechar"); x.textContent = "×";
    x.addEventListener("click", () => selecionar(null));
    cardEl.replaceChildren(x, pasta, h, p, a);
    cardEl.hidden = false;
  }
  const abrir = n => { if (n && n.url) location.href = n.url; };

  /* ---------- ponteiro: mouse, toque e caneta ---------- */
  function at(ev) {
    const r = canvas.getBoundingClientRect(), sx = ev.clientX - r.left, sy = ev.clientY - r.top;
    let best = null, bd = 1e9;
    for (const n of nodes) { const p = tela(n), d = Math.hypot(p.x - sx, p.y - sy); if (d < raio(n) + (ev.pointerType === "mouse" ? 6 : 14) && d < bd) { bd = d; best = n; } }
    return { sx, sy, node: best };
  }
  const ponteiros = new Map(); // pointerId -> {sx, sy}
  let arrasto = null;           // { no?, sx0, sy0, sx, sy, moveu }
  let pinca = null;             // { d, mx, my }
  let ativo = false;            // depois de clicar no quadro, a roda do mouse vira zoom (sem Ctrl)

  canvas.addEventListener("pointerdown", ev => {
    const h = at(ev);
    ponteiros.set(ev.pointerId, { sx: h.sx, sy: h.sy });
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ponteiro já foi embora */ }
    if (ev.pointerType === "mouse") ativo = true;
    if (ponteiros.size === 2) { // pinça
      const [a, b] = [...ponteiros.values()];
      pinca = { d: Math.hypot(a.sx - b.sx, a.sy - b.sy) || 1, mx: (a.sx + b.sx) / 2, my: (a.sy + b.sy) / 2 };
      arrasto = null; return;
    }
    // no toque, só arrasta ponto/mapa quando já tem zoom (senão o dedo é da rolagem da página)
    const podeArrastar = ev.pointerType === "mouse" || k > kFit * 1.05;
    arrasto = { no: podeArrastar ? h.node : null, alvo: h.node, mapa: podeArrastar && !h.node, sx0: h.sx, sy0: h.sy, sx: h.sx, sy: h.sy, moveu: false };
  });

  canvas.addEventListener("pointermove", ev => {
    const h = at(ev);
    if (ponteiros.has(ev.pointerId)) ponteiros.set(ev.pointerId, { sx: h.sx, sy: h.sy });
    if (pinca && ponteiros.size >= 2) {
      const [a, b] = [...ponteiros.values()];
      const d = Math.hypot(a.sx - b.sx, a.sy - b.sy) || 1, mx = (a.sx + b.sx) / 2, my = (a.sy + b.sy) / 2;
      ox += mx - pinca.mx; oy += my - pinca.my;
      zoomEm(mx, my, d / pinca.d);
      pinca = { d, mx, my }; return;
    }
    if (arrasto) {
      if (Math.hypot(h.sx - arrasto.sx0, h.sy - arrasto.sy0) > 5) arrasto.moveu = true;
      if (arrasto.moveu && arrasto.no) {
        const w = mundo(h.sx, h.sy);
        arrasto.no.x = w.x; arrasto.no.y = w.y;
        layout.esquentar(Math.min(WW, WH) / 14); mexeu = true;
      } else if (arrasto.moveu && arrasto.mapa) {
        ox += h.sx - arrasto.sx; oy += h.sy - arrasto.sy; mexeu = true; sujo = true;
      }
      arrasto.sx = h.sx; arrasto.sy = h.sy;
      return;
    }
    if (ev.pointerType === "mouse") {
      const prev = hover; hover = h.node; canvas.style.cursor = hover ? "pointer" : "grab";
      if (hover !== prev) sujo = true;
    }
  });

  function soltar(ev, cancelado) {
    ponteiros.delete(ev.pointerId);
    if (pinca) { if (ponteiros.size < 2) pinca = null; arrasto = null; return; }
    const a = arrasto; arrasto = null;
    if (!a || cancelado) return;
    if (!a.moveu) { // foi um clique/toque
      const n = a.alvo;
      if (!n) selecionar(null);
      else if (n === sel) abrir(n); // segundo clique/toque no mesmo ponto abre
      else selecionar(n);
    }
    sujo = true;
  }
  canvas.addEventListener("pointerup", ev => soltar(ev, false));
  canvas.addEventListener("pointercancel", ev => soltar(ev, true)); // o navegador assumiu a rolagem
  canvas.addEventListener("pointerleave", ev => { if (ev.pointerType === "mouse") { ativo = false; if (hover) { hover = null; sujo = true; } } });
  canvas.addEventListener("dblclick", ev => { const h = at(ev); if (h.node) abrir(h.node); });

  // roda do mouse: com Ctrl (ou pinça do trackpad, que chega como Ctrl) sempre dá zoom; sem Ctrl, só depois de clicar no quadro
  canvas.addEventListener("wheel", ev => {
    if (!ev.ctrlKey && !ativo) return; // deixa a página rolar
    ev.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomEm(ev.clientX - r.left, ev.clientY - r.top, Math.exp(-ev.deltaY * (ev.deltaMode === 1 ? 0.05 : 0.0018)));
  }, { passive: false });

  if (ctrlEl) ctrlEl.addEventListener("click", ev => {
    const b = ev.target.closest("button[data-z]"); if (!b) return;
    if (b.dataset.z === "in") zoomEm(W / 2, H / 2, 1.4);
    else if (b.dataset.z === "out") zoomEm(W / 2, H / 2, 1 / 1.4);
    else { mexeu = false; enquadrar(); sujo = true; }
  });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && sel) selecionar(null); });

  window.addEventListener("resize", () => {
    const w0 = W, h0 = H; medir();
    if (W === w0 && H === h0) return; // celular: a barra do navegador some ao rolar e dispara resize sem mudar o quadro
    if (!mexeu) enquadrar(); else { ox += (W - w0) / 2; oy += (H - h0) / 2; }
    sujo = true;
  });
})();
