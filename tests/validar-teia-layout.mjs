// Garante que o layout do grafo da Teia espalha as notas (sem o "bolo" no centro) em qualquer tamanho de vault.
// Uso: node tests/validar-teia-layout.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { Math, Float64Array, Map }; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../teia-layout.js', import.meta.url), 'utf8') + '\nglobalThis.TL = TeiaLayout;', ctx);
const TL = ctx.TL;

const erros = [];
const ok = (c, m) => { if (!c) erros.push(m); };

// grafo determinístico: anel + algumas ligações, com bastante nota solta (como num vault real)
function grafo(n, ligacoes) {
  let seed = 7; const rnd = m => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % m; };
  const nodes = Array.from({ length: n }, (_, i) => ({ id: 'n' + i, deg: 0 }));
  const links = [];
  for (let i = 0; i < ligacoes; i++) { const a = rnd(n), b = rnd(n); if (a !== b) { links.push({ s: nodes[a], t: nodes[b] }); nodes[a].deg++; nodes[b].deg++; } }
  return { nodes, links };
}
function simula(n, ligacoes, W, H, passos = 320) {
  const { nodes, links } = grafo(n, ligacoes);
  const L = TL.criar(nodes, links, W, H); L.iniciar();
  for (let i = 0; i < passos; i++) L.passo(null);
  return { nodes, L };
}
function metricas(nodes, W, H) {
  const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
  const larg = (Math.max(...xs) - Math.min(...xs)) / W, alt = (Math.max(...ys) - Math.min(...ys)) / H;
  let pares = 0, colados = 0, minimo = 1e9;
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y); pares++; if (d < 14) colados++; minimo = Math.min(minimo, d);
  }
  const dentro = nodes.every(n => n.x >= 0 && n.x <= W && n.y >= 0 && n.y <= H && Number.isFinite(n.x) && Number.isFinite(n.y));
  return { larg, alt, fracColados: colados / pares, minimo, dentro };
}

// o caso real: 85 notas e 95 conexões num quadro de 1030 px de largura
{
  const W = 1030, H = TL.alturaIdeal(85, W);
  const { nodes, L } = simula(85, 95, W, H);
  const m = metricas(nodes, W, H);
  ok(H > 540 && H <= 900, 'a altura deve crescer com o número de notas: ' + H);
  ok(m.dentro, '85 notas: todas devem ficar dentro do quadro');
  ok(m.larg >= 0.75 && m.alt >= 0.7, `85 notas: devem ocupar o quadro (largura ${(m.larg * 100).toFixed(0)}%, altura ${(m.alt * 100).toFixed(0)}%)`);
  ok(m.fracColados < 0.002, `85 notas: pontos colados demais (${(m.fracColados * 100).toFixed(2)}% dos pares a menos de 14 px)`);
  ok(L.pronto(), 'o layout deve assentar em ~320 passos');
}
// vault pequeno (as 7 notas de exemplo) e grande
for (const [n, lig, W] of [[7, 18, 1030], [30, 40, 1030], [85, 95, 360], [300, 380, 1030]]) {
  const H = TL.alturaIdeal(n, W); const { nodes } = simula(n, lig, W, H, n >= 300 ? 260 : 320); const m = metricas(nodes, W, H);
  ok(m.dentro, `${n} notas em ${W}px: todas devem ficar dentro do quadro`);
  const minimo = n < 15 ? 0.4 : n < 60 ? 0.5 : 0.6; // poucas notas muito ligadas formam um grupo naturalmente compacto
  ok(m.larg >= minimo && m.alt >= minimo - 0.05, `${n} notas em ${W}px: espalhamento insuficiente (largura ${(m.larg * 100).toFixed(0)}%, altura ${(m.alt * 100).toFixed(0)}%)`);
  ok(m.fracColados < (W < 640 ? 0.02 : 0.01), `${n} notas em ${W}px: pontos colados demais (${(m.fracColados * 100).toFixed(2)}%)`);
}
// determinístico: duas execuções iguais dão o mesmo desenho
{
  const a = simula(40, 50, 900, 600).nodes, b = simula(40, 50, 900, 600).nodes;
  ok(a.every((n, i) => n.x === b[i].x && n.y === b[i].y), 'o layout deve ser determinístico');
}
// robustez: sem notas, uma nota, ligação para nó inexistente, nós no mesmo ponto
{
  const L0 = TL.criar([], [], 500, 400); L0.iniciar(); L0.passo(null);
  const um = [{ id: 'a', deg: 0 }]; const L1 = TL.criar(um, [], 500, 400); L1.iniciar(); for (let i = 0; i < 50; i++) L1.passo(null);
  ok(Number.isFinite(um[0].x) && um[0].x >= 0 && um[0].x <= 500, 'uma nota só: posição válida');
  // duas notas ligadas no mesmo ponto (e uma ligação para nó que não existe): a física as separa, sem NaN
  const dois = [{ id: 'a', deg: 1, x: 100, y: 100 }, { id: 'b', deg: 1, x: 100, y: 100 }];
  const L2 = TL.criar(dois, [{ s: dois[0], t: { id: 'fantasma' } }, { s: dois[0], t: dois[1] }], 500, 400); for (let i = 0; i < 60; i++) L2.passo(null);
  ok(dois.every(n => Number.isFinite(n.x) && Number.isFinite(n.y)) && Math.hypot(dois[0].x - dois[1].x, dois[0].y - dois[1].y) > 5, 'nós no mesmo ponto devem se separar sem gerar NaN');
  // notas sem ligação: grade embaixo, sem sobreposição e sem sair do quadro
  const soltas = Array.from({ length: 40 }, (_, i) => ({ id: 's' + i, title: 'Nota ' + i, deg: 0 }));
  const L3 = TL.criar(soltas, [], 800, 500); L3.iniciar();
  let colados = 0; for (let i = 0; i < soltas.length; i++) for (let j = i + 1; j < soltas.length; j++) if (Math.hypot(soltas[i].x - soltas[j].x, soltas[i].y - soltas[j].y) < 20) colados++;
  ok(colados === 0, 'notas sem ligação não podem se sobrepor na grade');
  ok(soltas.every(n => n.x >= 0 && n.x <= 800 && n.y >= 0 && n.y <= 500), 'a grade das notas sem ligação fica dentro do quadro');
  ok(L3.faixa.soltos === 40 && L3.faixa.y < 500, 'a faixa informa quantas notas sem ligação existem e onde começa');
  const mix = grafo(30, 20); const L4 = TL.criar(mix.nodes, mix.links, 900, 600); L4.iniciar(); for (let i = 0; i < 200; i++) L4.passo(null);
  const soltasMix = mix.nodes.filter(n => !n.deg), ligadasMix = mix.nodes.filter(n => n.deg);
  ok(soltasMix.length > 0 && soltasMix.every(n => n.y >= L4.faixa.y) && ligadasMix.every(n => n.y <= L4.faixa.y), 'notas sem ligação ficam na faixa de baixo; as ligadas, acima dela');
  const sem = TL.criar([{ id: 'a', deg: 1 }, { id: 'b', deg: 1 }], [], 500, 400);
  ok(sem.faixa.soltos === 0 && sem.faixa.y === 400, 'sem notas soltas, não há faixa');
}
// o nó arrastado fica parado
{
  const { nodes, links } = grafo(10, 12); const L = TL.criar(nodes, links, 800, 500); L.iniciar();
  const fixo = nodes[3]; const x0 = fixo.x, y0 = fixo.y; for (let i = 0; i < 40; i++) L.passo(fixo);
  ok(fixo.x === x0 && fixo.y === y0, 'o nó arrastado não pode se mover durante o passo');
}

if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log('Teia: layout espalha 7, 30, 85 e 300 notas (também em 360 px), determinístico e sem NaN');
console.log('OK');
