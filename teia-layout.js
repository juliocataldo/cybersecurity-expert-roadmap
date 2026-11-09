"use strict";
/* Layout do grafo da Teia (Fruchterman-Reingold): a distância ideal entre notas e a altura do quadro
   escalam com o número de notas, então 7 ou 300 notas ficam espalhadas e legíveis.
   Notas SEM ligações não entram na física: ficam numa grade organizada, numa faixa embaixo do grafo.
   Sem dependências. Roda no navegador (window.TeiaLayout) e no Node (tests/validar-teia-layout.mjs). */
(function (raiz) {
  /** Altura do quadro: cresce com o número de notas (mínimo igual ao do CSS). */
  function alturaIdeal(n, largura) {
    const estreito = largura < 640;
    const base = estreito ? 420 : 540, porNota = estreito ? 6 : 5;
    return Math.round(Math.min(900, Math.max(base, (estreito ? 300 : 340) + n * porNota)));
  }

  /**
   * nodes: [{ id, deg }] (recebem x, y); links: [{ s, t }] com s e t sendo os próprios nós.
   * opcoes (opcional): { semBorda, gravidade }. Sem opções, o comportamento é o de sempre (notas presas no quadro W x H).
   * Devolve { iniciar, passo, esquentar, pronto, faixa }.
   */
  function criar(nodes, links, W, H, opcoes) {
    const margem = 18, espaco = 26;
    const ligados = nodes.filter(n => n.deg > 0);
    const soltos = nodes.filter(n => !(n.deg > 0)).sort((a, b) => String(a.title || a.id).localeCompare(String(b.title || b.id), "pt"));
    // faixa das notas sem ligações (grade na parte de baixo)
    const porLinha = Math.max(1, Math.floor((W - 2 * margem) / espaco) + 1);
    const linhas = Math.ceil(soltos.length / porLinha);
    const alturaFaixa = soltos.length ? Math.min(H, linhas * espaco + 34) : 0;
    const H1 = H - alturaFaixa;                                  // altura da área do grafo
    const N = ligados.length;
    const k = Math.sqrt((W * H1) / Math.max(N, 1)) * 0.72;      // distância ideal entre notas
    const k2 = k * k;
    const livre = !!(opcoes && opcoes.semBorda);               // semBorda: a câmera enquadra o grafo, então a física não precisa de parede
    const gravidade = (opcoes && opcoes.gravidade) || 0.045;  // puxa para o centro (componentes soltos não fogem)
    // sem parede, a gravidade segue a proporção do quadro (celular em pé: puxa mais nas laterais), para o grafo caber no formato da tela
    const gx = livre ? gravidade * Math.max(1, H / W) : gravidade, gy = livre ? gravidade * Math.max(1, W / H) : gravidade;
    let t = Math.min(W, H1) / 5;                                // "temperatura": deslocamento máximo por passo
    const resfria = 0.965, piso = 0.35;

    function iniciar() {
      ligados.forEach((n, i) => { // círculo com raios alternados: determinístico e sem nós empilhados
        const a = (i / Math.max(N, 1)) * Math.PI * 2, r = Math.min(W, H1) * (i % 2 ? 0.28 : 0.4);
        n.x = W / 2 + Math.cos(a) * r * (W / Math.min(W, H1)) * 0.85;
        n.y = H1 / 2 + Math.sin(a) * r;
        n.vx = 0; n.vy = 0;
      });
      soltos.forEach((n, i) => { // grade, da esquerda para a direita
        const linha = Math.floor(i / porLinha), col = i % porLinha;
        const naLinha = Math.min(porLinha, soltos.length - linha * porLinha);
        n.x = Math.max(margem, Math.min(W - margem, W / 2 + (col - (naLinha - 1) / 2) * espaco));
        n.y = H1 + 26 + linha * espaco;
        n.vx = 0; n.vy = 0;
      });
    }

    function passo(fixo) {
      const dx = new Float64Array(N), dy = new Float64Array(N);
      for (let i = 0; i < N; i++) {                              // repulsão entre todos os pares: k²/d
        const a = ligados[i];
        for (let j = i + 1; j < N; j++) {
          const b = ligados[j];
          let ex = a.x - b.x, ey = a.y - b.y, d2 = ex * ex + ey * ey;
          if (d2 < 0.01) { ex = (i % 7) - 3 || 1; ey = (j % 5) - 2 || 1; d2 = ex * ex + ey * ey; } // mesmo ponto: separa
          const d = Math.sqrt(d2), f = k2 / d / d;
          dx[i] += ex * f; dy[i] += ey * f; dx[j] -= ex * f; dy[j] -= ey * f;
        }
      }
      const idx = new Map(ligados.map((n, i) => [n, i]));
      for (const l of links) {                                   // atração nas ligações: d²/k
        const i = idx.get(l.s), j = idx.get(l.t); if (i === undefined || j === undefined) continue;
        const ex = ligados[i].x - ligados[j].x, ey = ligados[i].y - ligados[j].y, d = Math.sqrt(ex * ex + ey * ey) || 0.01, f = d / k;
        dx[i] -= ex * f; dy[i] -= ey * f; dx[j] += ex * f; dy[j] += ey * f;
      }
      for (let i = 0; i < N; i++) {
        const n = ligados[i];
        if (n === fixo) continue;
        dx[i] += (W / 2 - n.x) * gx; dy[i] += (H1 / 2 - n.y) * gy;
        const len = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]) || 0.01, m = Math.min(len, t);
        n.x += dx[i] / len * m; n.y += dy[i] / len * m;
        if (!livre) { n.x = Math.max(margem, Math.min(W - margem, n.x)); n.y = Math.max(margem, Math.min(H1 - margem, n.y)); }
      }
      t = Math.max(piso, t * resfria);
      return t > piso * 1.6;                                     // false = assentou
    }
    return {
      iniciar, passo, esquentar: v => { t = Math.max(t, v); }, pronto: () => t <= piso * 1.6,
      faixa: { y: H1, soltos: soltos.length },                   // onde começa a faixa das notas sem ligações (y = H quando não há)
    };
  }

  raiz.TeiaLayout = { criar, alturaIdeal };
})(typeof window !== "undefined" ? window : globalThis);
