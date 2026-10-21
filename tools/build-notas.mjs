// Gera a "Teia" (notas do Obsidian) a partir de um vault de markdown.
// Zero dependências. Uso: node tools/build-notas.mjs
//   Lê de ./vault (ou de tools/sample-vault se ./vault não existir).
//   Só publica notas com frontmatter "publish: true".
//   Saída: teia-data.js, notas/<slug>.html (no estilo do site), e a lista para teia.html.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUTDIR = join(ROOT, 'notas');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'nota';

/* ---- coleta arquivos .md ---- */
function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!name.startsWith('.')) out = out.concat(walk(p)); }
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

/* ---- frontmatter YAML simples (publish/title/tags) ---- */
function parseFront(src) {
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
function mdToHtml(md, noteTitle, resolve) {
  // code fences primeiro (protege o conteúdo)
  const fences = [];
  md = md.replace(/```([\s\S]*?)```/g, (_, c) => { fences.push(c.replace(/^\w*\n/, '')); return `\u0000F${fences.length - 1}\u0000`; });
  const lines = md.split('\n');
  const out = []; let i = 0;
  const inline = t => {
    t = esc(t);
    t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
    // wikilinks [[Nota]] ou [[Nota|texto]]
    t = t.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
      const r = resolve(target.trim());
      const label = esc((alias || target).trim());
      return r ? `<a href="${r}" class="wl">${label}</a>` : `<span class="wl-missing">${label}</span>`;
    });
    t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (_, txt, url) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${txt}</a>`);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    t = t.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<i>$2</i>');
    t = t.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<i>$2</i>');
    return t;
  };
  while (i < lines.length) {
    let line = lines[i];
    if (/^\u0000F\d+\u0000$/.test(line.trim())) { const idx = +line.trim().slice(2, -1); out.push(`<pre><code>${esc(fences[idx])}</code></pre>`); i++; continue; }
    if (!line.trim()) { i++; continue; }
    if (/^#{1,6}\s/.test(line)) { const l = line.match(/^#+/)[0].length; const lvl = Math.min(l + 1, 4); out.push(`<h${lvl}>${inline(line.replace(/^#+\s/, ''))}</h${lvl}>`); i++; continue; }
    if (/^\s*([-*])\s/.test(line)) { const items = []; while (i < lines.length && /^\s*([-*])\s/.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s/, ''))}</li>`); i++; } out.push(`<ul>${items.join('')}</ul>`); continue; }
    if (/^\s*\d+\.\s/.test(line)) { const items = []; while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s/, ''))}</li>`); i++; } out.push(`<ol>${items.join('')}</ol>`); continue; }
    if (/^>\s?/.test(line)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(inline(lines[i].replace(/^>\s?/, ''))); i++; } out.push(`<blockquote>${buf.join('<br>')}</blockquote>`); continue; }
    if (/^---+\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    const buf = []; while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>\s?|\s*[-*]\s|\s*\d+\.\s|---+\s*$|\u0000F\d+\u0000)/.test(lines[i])) { buf.push(inline(lines[i])); i++; }
    out.push(`<p>${buf.join('<br>')}</p>`);
  }
  return out.join('\n');
}

const NAV = `  <nav aria-label="Seções">
    <a href="../">Home</a>
    <a href="../guia.html">Guia</a>
    <a href="../roadmap.html">Roadmaps</a>
    <a href="../trilhas.html">Trilhas</a>
    <a href="../artigos.html">Artigos</a>
    <details class="nav-group">
      <summary class="cur">Recursos</summary>
      <div class="nav-menu">
        <a href="../canivete.html">Canivete suíço</a>
        <a href="../checklist.html">Checklist</a>
        <a href="../teia.html" aria-current="page">Teia</a>
        <a href="../plataformas.html">Plataformas</a>
        <a href="../radar.html">Radar</a>
      </div>
    </details>
    <a href="../sugestoes.html">Sugestões</a>
  </nav>`;

function notePage(note, backlinks) {
  const tags = (note.tags || []).map(t => `<span class="nota-tag">#${esc(t)}</span>`).join(' ');
  const bl = backlinks.length
    ? `<div class="nota-back"><p class="path-k">Mencionada em</p><ul>${backlinks.map(b => `<li><a href="${b.slug}.html">${esc(b.title)}</a></li>`).join('')}</ul></div>`
    : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="description" content="${esc(note.title)} — nota do Cyber Expert Guide.">
<title>${esc(note.title)} · Teia</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230a0a0a'/%3E%3Ctext x='16' y='23' font-family='Georgia,serif' font-size='17' font-weight='700' text-anchor='middle' fill='%23cf6a24'%3EJC%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="../styles.css">
</head>
<body>
<header class="site">
  <a class="wordmark" href="../index.html">CYBER<span>/</span>EXPERT GUIDE</a>
${NAV}
</header>
<main class="wrap">
  <p class="crumb"><a href="../teia.html">&larr; Teia</a></p>
  <article class="sec-g prose">
    <h1>${esc(note.title)}</h1>
    ${tags ? `<p class="nota-tags">${tags}</p>` : ''}
    ${note.html}
    ${bl}
    <p class="art-meta art-foot">Nota do meu segundo cérebro (Obsidian), publicada aqui. Conteúdo próprio.</p>
  </article>
</main>
<footer class="site-foot"><div class="wrap"><p>&copy; 2026 Julio Cataldo. <span class="foot-quote">&ldquo;Dedicated to safeguarding digital frontiers, navigating the cyber realms with resilience, and championing cybersecurity as a cornerstone of our digital future.&rdquo;</span> · <span class="foot-src">Threat intel por <a href="https://vexday.io/" target="_blank" rel="noopener noreferrer">Vexday</a>.</span></p></div></footer>
</body>
</html>
`;
}

/* ================= build ================= */
// Escolhe o vault real só se ele existir E tiver ao menos um .md.
// Senão cai para as notas de exemplo — assim um vault vazio NUNCA apaga as notas.
const VDIR = join(ROOT, 'vault');
const VAULT = (existsSync(VDIR) && walk(VDIR).length) ? VDIR : join(ROOT, 'tools', 'sample-vault');
const files = walk(VAULT);
const notes = [];
for (const f of files) {
  const { meta, body } = parseFront(readFileSync(f, 'utf8'));
  const pub = meta.publish === 'true' || meta.publish === true;
  if (!pub) continue;
  const title = (meta.title || basename(f, '.md')).trim();
  notes.push({ file: f, title, slug: slug(title), tags: Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []), body });
}
// índice de títulos -> slug (para resolver wikilinks)
const byTitle = new Map(notes.map(n => [n.title.toLowerCase(), n]));
const bySlug = new Map(notes.map(n => [n.slug, n]));
const resolve = target => { const n = byTitle.get(target.toLowerCase()) || bySlug.get(slug(target)); return n ? `${n.slug}.html` : null; };

// extrai links e renderiza html
const edges = [];
for (const n of notes) {
  const targets = new Set();
  n.body.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, (_, t) => { const r = byTitle.get(t.trim().toLowerCase()) || bySlug.get(slug(t.trim())); if (r && r.slug !== n.slug) targets.add(r.slug); return _; });
  n.links = [...targets];
  n.html = mdToHtml(n.body, n.title, resolve);
  for (const t of targets) edges.push({ s: n.slug, t });
}
// backlinks
const backlinks = new Map(notes.map(n => [n.slug, []]));
for (const e of edges) backlinks.get(e.t).push({ slug: e.s, title: bySlug.get(e.s).title });

// escreve páginas das notas
if (existsSync(OUTDIR)) rmSync(OUTDIR, { recursive: true, force: true });
mkdirSync(OUTDIR, { recursive: true });
for (const n of notes) writeFileSync(join(OUTDIR, `${n.slug}.html`), notePage(n, backlinks.get(n.slug)));

// grau (nº de conexões) para tamanho do nó
const deg = new Map(notes.map(n => [n.slug, 0]));
for (const e of edges) { deg.set(e.s, deg.get(e.s) + 1); deg.set(e.t, deg.get(e.t) + 1); }

const data = {
  nodes: notes.map(n => ({ id: n.slug, title: n.title, url: `notas/${n.slug}.html`, tags: n.tags, deg: deg.get(n.slug) })),
  links: edges.map(e => ({ s: e.s, t: e.t }))
};
writeFileSync(join(ROOT, 'teia-data.js'), `/* gerado por tools/build-notas.mjs */\nwindow.TEIA=${JSON.stringify(data)};\n`);

console.log(`notas publicadas: ${notes.length} | links: ${edges.length} | fonte: ${VAULT}`);
