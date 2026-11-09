// Núcleo dos Artigos: leitura dos .md, validação e leitura da lista de notas da Teia. Sem dependências.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseFront } from './markdown-lib.mjs';

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
      pagina: meta.pagina || '', descricao: meta.descricao || '', body,
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

/** Nota da lista só com o que a página usa e valida o caminho (vem de arquivo gerado, mas não confiamos às cegas). */
export function notasParaLista(teia) {
  return teia.nodes
    .filter(n => typeof n.title === 'string' && typeof n.url === 'string' && /^notas\/[a-z0-9-]+\.html$/.test(n.url))
    .map(n => ({ titulo: n.title, url: n.url }))
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt'));
}
