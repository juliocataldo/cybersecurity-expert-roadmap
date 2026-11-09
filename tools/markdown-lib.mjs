// Markdown mínimo (títulos, listas, **negrito**, *itálico*, `código`, blocos, links http(s), [[wikilinks]]) para a Teia e para os Artigos.
// Tudo é escapado: HTML cru no Markdown vira texto, e só links http(s) viram <a>. Sem dependências.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'nota';

/* ---- coleta arquivos .md ---- */
export function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!name.startsWith('.')) out = out.concat(walk(p)); }
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

/* ---- frontmatter YAML simples (publish/title/tags) ---- */
export function parseFront(src) {
  src = String(src).replace(/^﻿/, '').replace(/\r\n?/g, '\n'); // arquivos do Windows: BOM e CRLF não podem esconder o cabeçalho
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {}; let body = src;
  if (m) {
    body = src.slice(m[0].length);
    for (const line of m[1].split('\n')) {
      const mm = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/); if (!mm) continue;
      let [, k, v] = mm; v = v.trim();
      if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      else v = v.replace(/^["']|["']$/g, '');
      meta[k.toLowerCase()] = v;
    }
  }
  return { meta, body };
}

/* ---- markdown -> html (mínimo, suficiente para notas) ---- */
export function mdToHtml(md, noteTitle, resolve) {
  md = String(md).replace(/\u0000/g, '').replace(/\r\n?/g, '\n'); // NUL é o marcador interno dos blocos de código; CRLF vem de arquivos do Windows
  // code fences primeiro (protege o conteúdo)
  const fences = [];
  md = md.replace(/```([\s\S]*?)```/g, (_, c) => { fences.push(c.replace(/^\w*\n/, '')); return `\u0000F${fences.length - 1}\u0000`; });
  const lines = md.split('\n');
  const out = []; let i = 0;
  const inline = t => {
    t = esc(t);
    t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
    // embeds de imagem do Obsidian (![[foto.png]]): ainda não publicamos imagens, então são omitidos (sem sobrar texto quebrado)
    t = t.replace(/!\[\[[^\]]+?\.(?:png|jpe?g|gif|webp|svg|bmp|avif)(?:\|[^\]]*)?\]\]/gi, '');
    t = t.replace(/!(\[\[[^\]]+\]\])/g, '$1'); // ![[Outra nota]] (incorporar nota): vira um link comum
    // wikilinks [[Nota]] ou [[Nota|texto]]
    t = t.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
      const r = resolve(target.trim());
      const label = esc((alias || target).trim());
      return r ? `<a href="${r}" class="wl">${label}</a>` : `<span class="wl-missing">${label}</span>`;
    });
    // link interno do próprio site: só caminho relativo .html, com âncora opcional (nada de esquema, // ou ..)
    t = t.replace(/\[([^\]]+)\]\(([a-z0-9][a-z0-9_/-]*\.html(?:#[A-Za-z0-9_-]+)?)\)/g, (_, txt, url) => `<a href="${url}">${txt}</a>`);
    t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (_, txt, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${txt}</a>`); // url já veio escapada (esc(t) acima): escapar de novo viraria &amp;amp;
    t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    t = t.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<i>$2</i>');
    t = t.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<i>$2</i>');
    // bloco de código no meio de uma linha (ex.: "```x``` texto"): vira código em linha
    t = t.replace(/\u0000F(\d+)\u0000/g, (_, n) => `<code>${esc(String(fences[+n] ?? '')).trim().replace(/\n+/g, ' ')}</code>`);
    return t;
  };
  // início de bloco: precisa ser idêntico nos dois lugares que o usam (senão o parágrafo não consome a linha e o laço não avança)
  const ehBloco = l => /^(#{1,6}\s|>\s?|\s*[-*]\s|\s*\d+\.\s|---+\s*$)/.test(l) || /^\u0000F\d+\u0000$/.test(l.trim());
  let ultimo = -1;
  while (i < lines.length) {
    if (i === ultimo) throw new Error(`Markdown: o renderizador não avançou na linha ${i + 1}`); // erro claro em vez de laço infinito
    if (out.length > 100000) throw new Error('Markdown: saída grande demais');
    ultimo = i;
    let line = lines[i];
    if (/^\u0000F\d+\u0000$/.test(line.trim())) { const idx = +line.trim().slice(2, -1); out.push(`<pre><code>${esc(fences[idx])}</code></pre>`); i++; continue; }
    if (!line.trim()) { i++; continue; }
    if (/^#{1,6}\s/.test(line)) { const l = line.match(/^#+/)[0].length; const lvl = Math.min(l + 1, 4); out.push(`<h${lvl}>${inline(line.replace(/^#+\s/, ''))}</h${lvl}>`); i++; continue; }
    if (/^\s*([-*])\s/.test(line)) { const items = []; while (i < lines.length && /^\s*([-*])\s/.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s/, ''))}</li>`); i++; } out.push(`<ul>${items.join('')}</ul>`); continue; }
    if (/^\s*\d+\.\s/.test(line)) { const items = []; while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s/, ''))}</li>`); i++; } out.push(`<ol>${items.join('')}</ol>`); continue; }
    if (/^>\s?/.test(line)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(inline(lines[i].replace(/^>\s?/, ''))); i++; } out.push(`<blockquote>${buf.join('<br>')}</blockquote>`); continue; }
    if (/^---+\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    const buf = [inline(line)]; i++; // a primeira linha é sempre consumida: o laço sempre avança
    while (i < lines.length && lines[i].trim() && !ehBloco(lines[i])) { buf.push(inline(lines[i])); i++; }
    out.push(`<p>${buf.join('<br>')}</p>`);
  }
  return out.join('\n');
}

/** Uma linha de Markdown em HTML inline (sem o <p>): para campos curtos como a linha de crédito de um artigo. */
export const mdInline = texto => mdToHtml(String(texto), '', () => null).replace(/^<p>/, '').replace(/<\/p>$/, '');
