// Índice da busca do site (busca.html): páginas, seções com âncora, termos do glossário, missões da trilha e notas.
// Tudo sai dos próprios arquivos do site (uma única fonte de verdade); o navegador só filtra o índice pronto.
// Formato de cada entrada: { k: tipo, t: título, u: url relativa, d: resumo exibido, s: texto extra para a busca }.
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { paginas } from './bump-css.mjs';
import { foraDoIndice } from './seo-lib.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
// páginas atualizadas por outros Actions (Notícias, Radar, Eventos): entram só com título e descrição, para o
// índice não ficar desatualizado a cada rodada deles
const DINAMICAS = new Set(['noticias.html', 'radar.html', 'radar-casos.html', 'eventos.html']);
// páginas cujo conteúdo entra por outro caminho (termos do glossário, missões, notas) ou que não têm o que buscar
const SEM_SECOES = new Set(['glossario.html', 'trilha.html', 'teia.html', 'busca.html', 'artigos.html']);

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ', middot: '·', rarr: '→', larr: '←', ldquo: '“', rdquo: '”', copy: '©', mdash: '—', ndash: '–' };
export const texto = html => String(html)
  .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&(#\d+|#x[0-9a-f]+|[a-z0-9]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e] ?? m))
  .replace(/\s+/g, ' ').trim();
const corta = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n) > n * 0.6 ? s.lastIndexOf(' ', n) : n) + '…');
const tituloLimpo = t => texto(t).replace(/\s·\s(?:Cyber Expert Guide|Teia)$/, ''); // "Casos · Radar · Cyber Expert Guide" -> "Casos · Radar"

function deHtml(caminho, html, entradas) {
  const titulo = tituloLimpo((html.match(/<title>([^<]*)<\/title>/) || [])[1] || caminho);
  const descricao = texto((html.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '');
  const main = (html.match(/<main[\s\S]*<\/main>/) || [html])[0];
  const cabecalhos = DINAMICAS.has(caminho) ? '' : [...main.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g)].map(m => texto(m[1])).join(' · ');
  // texto corrido da página entra só para a busca (não é exibido), com limite para o índice não pesar
  const corpo = DINAMICAS.has(caminho) || SEM_SECOES.has(caminho) ? '' : texto(main.replace(/<(nav|header|footer)[\s\S]*?<\/\1>/g, ' '));
  entradas.push({ k: 'Página', t: titulo, u: caminho, d: corta(descricao, 180), s: corta(`${cabecalhos} ${corpo}`, 2500) });
  if (DINAMICAS.has(caminho) || SEM_SECOES.has(caminho)) return;
  // seção = elemento com id seguido do primeiro h2/h3 (ex.: <section id="owasp"> ... <h2>OWASP Top 10 para LLM</h2>)
  for (const m of main.matchAll(/<(section|article|div)\b[^>]*\sid="([a-z][\w-]*)"[^>]*>/g)) {
    const resto = main.slice(m.index + m[0].length, m.index + m[0].length + 600);
    const h = resto.match(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/);
    if (!h || /<(section|article)\b[^>]*\sid=/.test(resto.slice(0, h.index))) continue; // título pertence a outra seção
    const nome = texto(h[2].replace(/<span[^>]*>\s*\d+\s*<\/span>/, ''));
    const p = resto.slice(h.index).match(/<p[^>]*>([\s\S]*?)<\/p>/);
    // texto da seção: do início dela até a próxima seção com id (só para a busca)
    const fim = main.slice(m.index + m[0].length).search(/<(section|article)\b[^>]*\sid="/);
    const corpoSecao = texto(main.slice(m.index + m[0].length, fim < 0 ? undefined : m.index + m[0].length + fim));
    if (nome) entradas.push({ k: 'Seção', t: nome, u: `${caminho}#${m[2]}`, d: corta(`${titulo}${p ? ': ' + texto(p[1]) : ''}`, 180), s: corta(`${titulo} ${corpoSecao}`, 1200) });
  }
}

function deGlossario(entradas) {
  const html = readFileSync(RAIZ + 'glossario.html', 'utf8');
  for (const m of html.matchAll(/<article class="card tool" id="(g-[\w-]+)"[^>]*><span class="k">([^<]*)<\/span><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p>/g)) {
    entradas.push({ k: 'Glossário', t: texto(m[3]), u: `glossario.html#${m[1]}`, d: corta(texto(m[4]), 180), s: texto(m[2]) });
  }
}

function deTrilha(entradas) {
  const ctx = {}; vm.createContext(ctx); vm.runInContext(readFileSync(RAIZ + 'trilha.js', 'utf8') + '\nglobalThis.T = TRILHA;', ctx);
  ctx.T.fases.forEach((f, i) => {
    entradas.push({ k: 'Fase da trilha', t: `Fase ${String(i).padStart(2, '0')}: ${f.titulo}`, u: `trilha.html#${f.id}`, d: corta(f.objetivo, 180), s: `${f.subtitulo} ${f.carreiras.join(' ')}` });
    for (const m of f.missoes) entradas.push({ k: 'Missão', t: m.titulo, u: `trilha.html#${f.id}`, d: corta(m.descricao, 180), s: `${f.titulo} ${m.links.map(l => l[0]).join(' ')}` });
  });
}

function deNotas(entradas) {
  if (!existsSync(RAIZ + 'teia-data.js')) return;
  const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(readFileSync(RAIZ + 'teia-data.js', 'utf8'), ctx);
  for (const n of ctx.window.TEIA.nodes) entradas.push({ k: 'Nota', t: n.title, u: n.url, d: corta(n.resumo || '', 180), s: `${(n.tags || []).join(' ')} ${n.pasta || ''}` });
}

/** Monta o índice completo, em ordem estável. */
export function montarIndice() {
  const entradas = [];
  for (const u of paginas()) {
    const caminho = relative(RAIZ, fileURLToPath(u)).replace(/\\/g, '/');
    if (caminho.startsWith('notas/')) continue; // notas entram pelo teia-data.js (com tags)
    const html = readFileSync(u, 'utf8');
    if (foraDoIndice(html, caminho)) continue;
    deHtml(caminho, html, entradas);
  }
  deGlossario(entradas);
  deTrilha(entradas);
  deNotas(entradas);
  const ordem = ['Página', 'Seção', 'Glossário', 'Fase da trilha', 'Missão', 'Nota'];
  return entradas.sort((a, b) => ordem.indexOf(a.k) - ordem.indexOf(b.k) || a.u.localeCompare(b.u, 'en') || a.t.localeCompare(b.t, 'pt'));
}

export const conteudoIndice = indice => `/* gerado por tools/build-busca.mjs */\nwindow.BUSCA=${JSON.stringify(indice)};\n`;
