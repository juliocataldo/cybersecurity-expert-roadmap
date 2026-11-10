// Gera artigos.html e artigo-<slug>.html a partir de artigos/*.md, e lista na mesma página as notas da Teia.
// Uso: node tools/build-artigos.mjs
//   Artigos: um .md por artigo em artigos/ (frontmatter: title, publish, date, eyebrow, categoria, resumo, meta, credito).
//            No corpo, "# " é uma seção (h2) e "## " uma subseção (h3); o título (h1) vem do frontmatter.
//   Notas:   lidas de teia-data.js (gerado por tools/build-notas.mjs a partir do vault notas-cyber).
// Tudo é escapado na saída; as páginas não têm script nem estilo inline (CSP).
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { esc, mdToHtml, mdInline } from './markdown-lib.mjs';
import { hash } from './bump-css.mjs';
import { lerArtigos, validarArtigo, lerTeia, notasParaLista, renderNotas } from './artigos-lib.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CSSV = createHash('sha1').update(readFileSync(join(ROOT, 'styles.css'), 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8); // cache-busting do CSS (ver tools/bump-css.mjs)
const TEMAV = createHash('sha1').update(readFileSync(join(ROOT, 'tema.js'), 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8); // versão do tema.js (claro/escuro)
const base = readFileSync(join(ROOT, 'canivete.html'), 'utf8').split(/\r?\n/);
const ICON = base[9];
const FOOT = base.find(l => l.startsWith('<footer'));
const CSP = "default-src 'none'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; base-uri 'none'; form-action 'none'";

const artigos = lerArtigos(join(ROOT, 'artigos'));
const erros = artigos.flatMap(validarArtigo);
if (erros.length) throw new Error('Artigos inválidos:\n- ' + erros.join('\n- '));
if (new Set(artigos.map(a => a.slug)).size !== artigos.length) throw new Error('slug de artigo repetido');

const teiaJs = existsSync(join(ROOT, 'teia-data.js')) ? readFileSync(join(ROOT, 'teia-data.js'), 'utf8') : '';
const teia = lerTeia(teiaJs);
const notas = notasParaLista(teia);

const NAV = `  <nav aria-label="Seções">
    <a href="./">Home</a>
    <a href="guia.html">Guia</a>
    <a href="trilhas.html">Trilhas</a>
    <a href="artigos.html" aria-current="page">Notas</a>
    <details class="nav-group">
      <summary>Recursos</summary>
      <div class="nav-menu">
        <span class="nav-sub">Ferramentas</span>
        <a href="canivete.html">Canivete suíço</a>
        <a href="solucoes.html">HUB Sec</a>
        <a href="plataformas.html">Plataformas</a>
        <a href="checklist.html">Checklist</a>
        <span class="nav-sub">Atualização</span>
        <a href="radar.html">Radar</a>
        <a href="noticias.html">Notícias</a>
        <a href="eventos.html">Eventos</a>
      </div>
    </details>
    <a href="sobre.html">Sobre</a>
    <a href="sugestoes.html">Sugestões</a>
  </nav>`;

const cabeca = (titulo, descricao) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="no-referrer">
<meta name="description" content="${esc(descricao)}">
<title>${esc(titulo)} · Cyber Expert Guide</title>
${ICON}
<link rel="stylesheet" href="styles.css?v=${CSSV}">
<script src="tema.js?v=${TEMAV}"></script>
</head>
<body>
<header class="site">
  <a class="wordmark" href="./">CYBER<span>/</span>EXPERT GUIDE</a>
${NAV}
</header>
`;
const rodape = `${FOOT}
</body>
</html>
`;

/* ---------- uma página por artigo ---------- */
const paginaArtigo = a => cabeca(a.pagina || a.titulo, a.descricao || a.resumo) + `<main class="wrap">
  <p class="crumb"><a href="artigos.html">&larr; Notas</a></p>
  <article class="sec-g prose">
    <p class="eyebrow">${esc(a.eyebrow)}</p>
    <h1>${esc(a.titulo)}</h1>
    <p class="art-meta">${mdInline(a.meta)}</p>

${mdToHtml(a.body, a.titulo, () => null).split('\n').map(l => '    ' + l).join('\n')}

    ${a.credito ? `<p class="art-meta art-foot">${mdInline(a.credito)}</p>` : ''}
  </article>
</main>
` + rodape;

const atuais = new Set(artigos.map(a => `artigo-${a.slug}.html`));
for (const f of readdirSync(ROOT).filter(n => /^artigo-.+\.html$/.test(n) && !atuais.has(n))) unlinkSync(join(ROOT, f)); // artigo despublicado some
for (const a of artigos) writeFileSync(join(ROOT, `artigo-${a.slug}.html`), paginaArtigo(a));

/* ---------- artigos.html: estudos de caso + notas da Teia ---------- */
// artigo com "listar: false" continua publicado (a página existe), mas não entra na lista; sem nenhum listado, a seção some
const listados = artigos.filter(a => a.listar);
const cards = listados.map(a => `      <a class="card" href="artigo-${esc(a.slug)}.html"><span class="k">${esc(a.categoria)}</span><h3>${esc(a.titulo)}</h3><p>${esc(a.resumo)}</p><span class="go">Ler →</span></a>`).join('\n');
const aviso = teia.fonte === 'exemplo'
  ? `\n    <p class="wip"><span class="wip-dot"></span><b>Notas de exemplo</b> — ainda não publiquei as minhas; estas servem para mostrar como a seção funciona.</p>` : '';

const secaoArtigos = listados.length ? `
    <h2 class="rm-h2" id="estudos">Estudos de caso e textos</h2>
    <div class="cards">
${cards}
    </div>
` : '';
const intro = listados.length
  ? 'Estudos de caso e textos de segurança, escritos em português e do zero. A ideia é aprender com exemplos reais — o que deu errado e, principalmente, como evitar — sem virar manual de ataque. Mais abaixo, as notas curtas do meu segundo cérebro.'
  : 'Notas curtas de segurança do meu segundo cérebro (Obsidian), ligadas entre si num grafo. Só entram as que marquei como públicas. Use a busca e os filtros para achar um tema, ou abra a Teia para ver como tudo se conecta.';
const ancoras = listados.length ? '\n    <nav class="ancoras" aria-label="Nesta página"><a href="#estudos">Estudos de caso</a><a href="#notas">Notas e a Teia</a></nav>\n' : '';
const descricao = listados.length
  ? 'Estudos de caso de segurança escritos em português, e as notas do meu segundo cérebro, ligadas num grafo (a Teia).'
  : 'Notas de segurança do meu segundo cérebro, com busca e filtros por pasta e assunto, ligadas num grafo (a Teia).';

const PAGINA = cabeca('Notas', descricao) + `<main class="wrap">
  <section class="sec-g">
    <p class="eyebrow">Segundo cérebro</p>
    <h1>Notas</h1>
    <p class="sec-intro">${intro}</p>${ancoras}${secaoArtigos}
${listados.length ? `
    <h2 class="rm-h2" id="notas">Notas e a Teia</h2>` : ''}${aviso}
    <div class="cards cards-one">
      <a class="card" href="teia.html"><span class="k">Grafo interativo</span><h3>Teia de conhecimento</h3><p>${notas.length} ${notas.length === 1 ? 'nota' : 'notas'} e ${teia.links.length} ${teia.links.length === 1 ? 'conexão' : 'conexões'}. Veja como os temas se ligam e clique num ponto para abrir a nota.</p><span class="go">Abrir a Teia →</span></a>
    </div>
    ${notas.length ? renderNotas(notas) : '<p class="mut">Ainda não há notas publicadas.</p>'}
  </section>
</main>
` + rodape.replace('</body>', `<script src="guia.js?v=${hash(join(ROOT, 'guia.js'))}"></script>\n</body>`); // guia.js traz o filtro de busca ([data-tf])
writeFileSync(join(ROOT, 'artigos.html'), PAGINA);
console.log(`artigos.html gerado | ${listados.length} artigo(s) listado(s) de ${artigos.length} publicado(s) | ${notas.length} nota(s) (${teia.fonte})`);
