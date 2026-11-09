// Gera a "Teia" (notas do Obsidian) a partir de um vault de markdown.
// Zero dependências. Uso: node tools/build-notas.mjs
//   Lê de ./vault (ou de tools/sample-vault se ./vault não existir).
//   Só publica notas com frontmatter "publish: true".
//   Saída: teia-data.js, notas/<slug>.html (no estilo do site), e a lista para teia.html.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, basename, relative, sep } from 'node:path';
import { esc, slug, walk, parseFront, mdToHtml, resumoTexto } from './markdown-lib.mjs';
import { acharSegredos } from './segredos-lib.mjs';
import { createHash } from 'node:crypto';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUTDIR = join(ROOT, 'notas');
const CSSV = createHash('sha1').update(readFileSync(join(ROOT, 'styles.css'), 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8); // cache-busting do CSS (ver tools/bump-css.mjs)

const NAV = `  <nav aria-label="Seções">
    <a href="../">Home</a>
    <a href="../guia.html">Guia</a>
    <a href="../roadmap.html">Roadmaps</a>
    <a href="../trilhas.html">Trilhas</a>
    <a href="../artigos.html" aria-current="page">Artigos</a>
    <details class="nav-group">
      <summary>Recursos</summary>
      <div class="nav-menu">
        <a href="../canivete.html">Canivete suíço</a>
        <a href="../solucoes.html">HUB Sec</a>
        <a href="../checklist.html">Checklist</a>
        <a href="../plataformas.html">Plataformas</a>

        <a href="../eventos.html">Eventos</a>
        <a href="../radar.html">Radar</a>
        <a href="../noticias.html">Notícias</a>
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
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data:; connect-src https://cloudflareinsights.com; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="description" content="${esc(note.title)} — nota do Cyber Expert Guide.">
<title>${esc(note.title)} · Teia</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230a0a0a'/%3E%3Ctext x='16' y='23' font-family='Georgia,serif' font-size='17' font-weight='700' text-anchor='middle' fill='%23cf6a24'%3EJC%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="../styles.css?v=${CSSV}">
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
<footer class="site-foot"><div class="wrap"><p>&copy; 2026 Julio Cataldo. <span class="foot-quote">&ldquo;Dedicated to safeguarding digital frontiers, navigating the cyber realms with resilience, and championing cybersecurity as a cornerstone of our digital future.&rdquo;</span></p></div></footer>
</body>
</html>
`;
}

/* ================= build ================= */
// Escolhe o vault real só se ele existir E tiver ao menos um .md.
// Senão cai para as notas de exemplo — assim um vault vazio NUNCA apaga as notas.
const VDIR = join(ROOT, 'vault');
const VAULT = (existsSync(VDIR) && walk(VDIR).length) ? VDIR : join(ROOT, 'tools', 'sample-vault');
const files = walk(VAULT).sort((a, b) => a.localeCompare(b, 'en')); // ordem estável (Windows e Linux listam em ordens diferentes)
const pastaDe = f => { const partes = relative(VAULT, f).split(sep); return partes.length > 1 ? partes[0].normalize('NFC').replace(/^[^\p{L}\p{N}]+/u, '').trim() || 'Geral' : 'Geral'; }; // tira emoji/símbolos do começo do nome
let notes = [];
let semPublicar = 0;
const retidas = [];
for (const f of files) {
  const bruto = readFileSync(f, 'utf8');
  const { meta, body } = parseFront(bruto);
  const pub = meta.publish === 'true' || meta.publish === true;
  if (!pub) { semPublicar++; continue; }
  const title = (meta.title || basename(f, '.md')).trim();
  // segunda barreira (a primeira é o push protection do GitHub): nota com possível segredo NÃO é publicada
  const achados = acharSegredos(bruto);
  if (achados.length) { retidas.push({ title, achados }); continue; }
  notes.push({ file: f, title, slug: slug(title), tags: Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []), body });
}
console.log(`vault: ${files.length} arquivo(s) .md | ${notes.length} publicáveis | ${semPublicar} privados (ficam fora do site) | ${retidas.length} retidos por possível segredo`);
for (const r of retidas) {
  const resumo = [...new Set(r.achados.map(a => `${a.tipo} (linha ${a.linha})`))].join('; ');
  console.warn(`::warning title=Teia: nota retida::"${r.title}" não foi publicada: possível segredo no texto: ${resumo}. Remova ou oculte o valor (e revogue a credencial se for real) e envie de novo.`);
}

// uma nota que o renderizador não consegue processar é pulada com aviso, em vez de derrubar a Teia inteira
notes = notes.filter((n, idx) => {
  try { mdToHtml(n.body, n.title, () => null); return true; }
  catch (e) { console.warn(`::warning title=Teia::A nota "${n.title}" não foi publicada: ${e.message}`); return false; }
});
// títulos que viram o mesmo endereço (ex.: "Cloud Architecture" em duas pastas) ganham sufixo, para uma não sobrescrever a outra
{
  const usados = new Set();
  for (const n of notes) { const base = n.slug; let s = base, k = 2; while (usados.has(s)) s = `${base}-${k++}`; n.slug = s; usados.add(s); }
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
  fonte: VAULT === VDIR ? 'vault' : 'exemplo', // 'exemplo' = notas de tools/sample-vault (o vault real está vazio)
  nodes: notes.map(n => ({
    id: n.slug, title: n.title, url: `notas/${n.slug}.html`, tags: n.tags, deg: deg.get(n.slug),
    pasta: pastaDe(n.file),      // pasta de 1º nível do vault (ex.: "Offsec"); notas na raiz = "Geral"
    resumo: resumoTexto(n.body), // texto puro, para o cartão da nota em artigos.html
  })),
  links: edges.map(e => ({ s: e.s, t: e.t }))
};
writeFileSync(join(ROOT, 'teia-data.js'), `/* gerado por tools/build-notas.mjs */\nwindow.TEIA=${JSON.stringify(data)};\n`);

console.log(`notas publicadas: ${notes.length} | links: ${edges.length} | fonte: ${VAULT}`);
