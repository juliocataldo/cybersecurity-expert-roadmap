// Núcleo dos Artigos: leitura dos .md, validação e leitura da lista de notas da Teia. Sem dependências.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseFront, esc, slug } from './markdown-lib.mjs';

const SLUG = /^[a-z0-9-]{3,60}$/;
const sem = t => !/[<>]/.test(t);
const texto = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.length <= max && sem(v);

/** Valida um artigo já lido. Retorna a lista de erros (vazia = ok). */
export function validarArtigo(a) {
  const e = []; const p = `artigos/${a.slug}.md`;
  if (!SLUG.test(a.slug || '')) e.push(`${p}: nome do arquivo deve ser minúsculo, com letras, números e hífens (3 a 60)`);
  if (!texto(a.titulo, 5, 200)) e.push(`${p}: title`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date || '') || isNaN(Date.parse(a.date))) e.push(`${p}: date deve ser AAAA-MM-DD`);
  if (!texto(a.eyebrow, 3, 60)) e.push(`${p}: eyebrow (3 a 60 caracteres)`);
  if (!texto(a.categoria, 3, 60)) e.push(`${p}: categoria (3 a 60 caracteres)`);
  if (!texto(a.resumo, 20, 400)) e.push(`${p}: resumo (20 a 400 caracteres, sem < ou >)`);
  if (!texto(a.meta, 5, 700)) e.push(`${p}: meta (linha de contexto, até 700 caracteres)`);
  if (a.credito !== undefined && a.credito !== '' && !texto(a.credito, 5, 900)) e.push(`${p}: credito (até 900 caracteres)`);
  if (a.pagina && !texto(a.pagina, 3, 80)) e.push(`${p}: pagina (título curto da aba, até 80 caracteres)`);
  if (a.descricao && !texto(a.descricao, 20, 300)) e.push(`${p}: descricao (SEO, 20 a 300 caracteres)`);
  if (typeof a.body !== 'string' || a.body.trim().length < 200) e.push(`${p}: corpo do artigo muito curto`);
  return e;
}

/** Lê artigos/*.md. Só entra quem tem publish: true. Mais recentes primeiro. */
export function lerArtigos(dir) {
  if (!existsSync(dir)) return [];
  const itens = [];
  for (const nome of readdirSync(dir).filter(n => n.endsWith('.md')).sort()) {
    const { meta, body } = parseFront(readFileSync(join(dir, nome), 'utf8').replace(/\r\n/g, '\n'));
    if (!(meta.publish === 'true' || meta.publish === true)) continue;
    itens.push({
      slug: basename(nome, '.md'), titulo: (meta.title || '').trim(), date: meta.date || '', eyebrow: meta.eyebrow || '',
      categoria: meta.categoria || '', resumo: meta.resumo || '', meta: meta.meta || '', credito: meta.credito || '',
      pagina: meta.pagina || '', descricao: meta.descricao || '', listar: String(meta.listar ?? 'true') !== 'false', body,
    });
  }
  return itens.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

/** Lê o teia-data.js gerado pela Teia: notas, ligações e a origem (vault real ou notas de exemplo). */
export function lerTeia(js) {
  const m = String(js).match(/window\.TEIA=(\{[\s\S]*\});?\s*$/);
  if (!m) return { nodes: [], links: [], fonte: 'vault' };
  const d = JSON.parse(m[1]);
  return { nodes: Array.isArray(d.nodes) ? d.nodes : [], links: Array.isArray(d.links) ? d.links : [], fonte: d.fonte === 'exemplo' ? 'exemplo' : 'vault' };
}

const limpa = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Notas para a lista: só o que o cartão usa, saneado (vem de arquivo gerado, mas não confiamos às cegas). */
export function notasParaLista(teia) {
  return teia.nodes
    .filter(n => typeof n.title === 'string' && typeof n.url === 'string' && /^notas\/[a-z0-9-]+\.html$/.test(n.url))
    .map(n => ({
      titulo: limpa(n.title, 160), url: n.url, pasta: limpa(n.pasta, 60) || 'Geral', resumo: limpa(n.resumo, 300),
      tags: (Array.isArray(n.tags) ? n.tags : []).map(t => limpa(String(t), 40)).filter(Boolean).slice(0, 8),
      deg: Number.isFinite(n.deg) && n.deg > 0 ? Math.floor(n.deg) : 0,
    }))
    .filter(n => n.titulo)
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt'));
}

/** Contagem por valor, do mais frequente para o menos (empate: ordem alfabética). */
const contar = valores => [...valores.reduce((m, v) => m.set(v, (m.get(v) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt'));

/**
 * Filtro + cartões das notas, no formato que o guia.js já entende ([data-tf]): busca sem acento, botões por pasta e
 * por assunto (combináveis) e contador. Sem JavaScript os controles ficam ocultos e todas as notas aparecem.
 * Tudo é escapado. Retorna HTML.
 */
export function renderNotas(lista, { maxTags = 14 } = {}) {
  const pastas = contar(lista.map(n => n.pasta));
  const tags = contar(lista.flatMap(n => [...new Set(n.tags)])).filter(([, c]) => c >= 2).slice(0, maxTags);
  const botoes = (itens, todos) => [`<button type="button" class="chip-f" data-f="" aria-pressed="true">${esc(todos)}</button>`,
    ...itens.map(([nome, c]) => `<button type="button" class="chip-f" data-f="${esc(slug(nome))}" aria-pressed="false">${esc(nome)} <span class="chip-n">${c}</span></button>`)].join('');
  const grupo = (itens, rotulo, attr, todos) => itens.length >= 2
    ? `\n      <div class="chips-f" role="group" aria-label="${esc(rotulo)}" data-attr="${attr}">${botoes(itens, todos)}</div>` : '';
  const cartao = n => {
    const dataTags = [...new Set(n.tags.map(slug))].join(' ');
    return `        <a class="card tool nota" data-pasta="${esc(slug(n.pasta))}" data-tags="${esc(dataTags)}" href="${esc(n.url)}">` +
      `<span class="k">${esc(n.pasta)}</span><h3>${esc(n.titulo)}</h3>` +
      (n.resumo ? `<p>${esc(n.resumo)}</p>` : '') +
      (n.tags.length ? `<div class="pills">${n.tags.map(t => `<span class="pill">#${esc(t)}</span>`).join('')}</div>` : '') +
      (n.deg ? `<span class="nota-conn">${n.deg} ${n.deg === 1 ? 'conexão' : 'conexões'}</span>` : '') + '</a>';
  };
  return `<div class="tf" data-tf data-noun="notas">
      <div class="tools-ctl" hidden>
      <input type="search" placeholder="Buscar nas notas (ex.: jwt, kerberos, nmap)" aria-label="Buscar nas notas" autocomplete="off">${grupo(pastas, 'Filtrar por pasta', 'pasta', 'Todas as pastas')}${grupo(tags, 'Filtrar por assunto', 'tags', 'Todos os assuntos')}
      <p class="mut small tf-count" role="status"></p>
      </div>
      <div class="cards tools notas">
${lista.map(cartao).join('\n')}
      </div>
      <p class="mut small tf-empty" hidden>Nenhuma nota encontrada. Tente outra palavra ou volte para "Todas as pastas".</p>
    </div>`;
}
