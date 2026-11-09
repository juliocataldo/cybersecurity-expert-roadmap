// Gera noticias.html: destaques comentados (tools/data/noticias.json) + manchetes do The Hacker News (RSS, 1x por dia).
// Uso: node tools/build-noticias.mjs            (baixa o RSS, mescla no histórico, aplica a trava e grava a página)
//      node tools/build-noticias.mjs --local <feed.xml>   (teste offline)
//
// Princípios:
//  - Do feed entram só título, link e data. Nada de descrição, imagem ou texto da matéria.
//  - Só links https de thehackernews.com com caminho de matéria; texto passa por limpeza de HTML.
//  - Se a fonte vier cortada ou a trava falhar, o build aborta e a página anterior continua no ar.
//  - Tudo é escapado na saída; a página não tem script nem estilo inline (CSP).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { FONTE, STATUS, parseRss, filtrarItens, mesclarHistorico, travaNoticias, tagsDe, validarCuradas } from './noticias-lib.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DATA = join(ROOT, 'tools', 'data');
const HISTORICO = join(DATA, 'noticias-historico.json');
const UA = 'cyber-expert-guide noticias (github.com/juliocataldo/cybersecurity-expert-roadmap)';
const MAX_HISTORICO = 150, MAX_NA_PAGINA = 60;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dataBR = iso => iso.split('-').reverse().join('/');
const diaBR = ts => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(ts)); // AAAA-MM-DD em Brasília

async function baixar(url, tentativas = 3) {
  let ultimo = 'sem resposta';
  for (let t = 1; t <= tentativas; t++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(60000) });
      if (r.ok) return await r.text();
      ultimo = 'HTTP ' + r.status;
    } catch (e) { ultimo = e.cause?.code || e.name; }
    await new Promise(r => setTimeout(r, t * 3000));
  }
  throw new Error(`falha ao baixar ${new URL(url).host}: ${ultimo}`);
}

/* ---------- coleta ---------- */
const local = process.argv.indexOf('--local');
const xml = local > 0 ? readFileSync(process.argv[local + 1], 'utf8') : await baixar(FONTE.rss);
const { bons, descartados } = filtrarItens(parseRss(xml));
if (descartados.length) console.warn(`${descartados.length} item(ns) descartado(s) pela validação: ${[...new Set(descartados)].join('; ')}`);
const antigo = existsSync(HISTORICO) ? JSON.parse(readFileSync(HISTORICO, 'utf8')) : [];
const historico = mesclarHistorico(antigo, bons, MAX_HISTORICO);
travaNoticias(historico);
if (bons.length < 10) throw new Error(`o feed trouxe só ${bons.length} item(ns) válido(s); a página anterior foi mantida`);

const curadas = JSON.parse(readFileSync(join(DATA, 'noticias.json'), 'utf8'));
const errosCuradas = validarCuradas(curadas);
if (errosCuradas.length) throw new Error('noticias.json inválido:\n- ' + errosCuradas.join('\n- '));
curadas.sort((a, b) => b.data.localeCompare(a.data));

/* ---------- página ---------- */
const lista = (itens) => `<ul>${itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
const ficha = d => `    <article class="ficha" id="${esc(d.id)}">
      <header>
        <p class="ficha-meta"><time datetime="${d.data}">${dataBR(d.data)}</time><span class="pill a">${esc(STATUS[d.status])}</span></p>
        <h3>${esc(d.titulo)}</h3>
      </header>
      <h4>O que aconteceu</h4>
      ${lista(d.resumo)}
      <h4>Vetor</h4>
      <p>${esc(d.vetor)}</p>
      <h4>Impacto de negócio</h4>
      <p>${esc(d.impacto)}</p>
      <h4>O que aprender</h4>
      ${lista(d.aprender)}
      ${d.nota ? `<p class="note">${esc(d.nota)}</p>` : ''}
      <p class="ficha-fontes"><b>Fonte${d.fontes.length > 1 ? 's' : ''}:</b> ${d.fontes.map(f => `<a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.nome)}</a>`).join(' · ')}</p>
    </article>`;

const pagina = historico.slice(0, MAX_NA_PAGINA);
const porDia = new Map();
for (const it of pagina) { const d = diaBR(it.ts); if (!porDia.has(d)) porDia.set(d, []); porDia.get(d).push(it); }
const feed = [...porDia].map(([dia, itens]) => `    <h3 class="rm-h3 dia">${dataBR(dia)}</h3>
    <ul class="feed">
${itens.map(it => `      <li>${tagsDe(it.titulo).map(t => `<span class="pill">${esc(t)}</span>`).join('')}<a href="${esc(it.link)}" target="_blank" rel="noopener noreferrer">${esc(it.titulo)}</a></li>`).join('\n')}
    </ul>`).join('\n');

const NAV = `  <nav aria-label="Seções">
    <a href="./">Home</a>
    <a href="guia.html">Guia</a>
    <a href="roadmap.html">Roadmaps</a>
    <a href="trilhas.html">Trilhas</a>
    <a href="artigos.html">Artigos</a>
    <details class="nav-group">
      <summary class="cur">Recursos</summary>
      <div class="nav-menu">
        <a href="canivete.html">Canivete suíço</a>
        <a href="solucoes.html">HUB Sec</a>
        <a href="checklist.html">Checklist</a>
        <a href="teia.html">Teia</a>
        <a href="plataformas.html">Plataformas</a>
        <a href="eventos.html">Eventos</a>
        <a href="radar.html" aria-current="page">Radar</a>
      </div>
    </details>
    <a href="sugestoes.html">Sugestões</a>
  </nav>`;
const CSSV = createHash('sha1').update(readFileSync(join(ROOT, 'styles.css'))).digest('hex').slice(0, 8); // cache-busting do CSS (ver tools/bump-css.mjs)
const ICON = readFileSync(join(ROOT, 'canivete.html'), 'utf8').split(/\r?\n/)[9];
const FOOT = readFileSync(join(ROOT, 'canivete.html'), 'utf8').split(/\r?\n/).find(l => l.startsWith('<footer'));
const ultimaAtualizacao = diaBR(Date.now());

const PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data:; connect-src https://cloudflareinsights.com; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="description" content="Notícias de segurança: destaques comentados, com vetor, impacto e o que aprender, e as manchetes mais recentes do The Hacker News, atualizadas uma vez por dia.">
<title>Notícias · Cyber Expert Guide</title>
${ICON}
<link rel="stylesheet" href="styles.css?v=${CSSV}">
</head>
<body>
<header class="site">
  <a class="wordmark" href="./">CYBER<span>/</span>EXPERT GUIDE</a>
${NAV}
</header>
<main class="wrap">
  <p class="crumb"><a href="radar.html">← Radar</a></p>
  <section class="sec-g radar-pg">
    <p class="eyebrow">Threat intel · notícias</p>
    <h1>Notícias</h1>
    <p class="sec-intro">Os incidentes que estão em pauta, em dois níveis: <b>destaques comentados</b>, com o que aconteceu, o vetor, o impacto de negócio e o que dá para aprender, e as <b>manchetes mais recentes</b> de segurança, com link para a fonte. Os destaques são escritos por mim; a lista de manchetes se atualiza uma vez por dia. Última atualização: ${dataBR(ultimaAtualizacao)}.</p>
    <nav class="ancoras" aria-label="Nesta página"><a href="#destaques">Destaques</a><a href="#manchetes">Manchetes</a><a href="#fontes">Fontes</a></nav>

    <h2 class="rm-h2" id="destaques">Destaques</h2>
${curadas.map(ficha).join('\n')}

    <h2 class="rm-h2" id="manchetes">Manchetes recentes</h2>
    <p class="sec-intro">Do <a href="${FONTE.site}" target="_blank" rel="noopener noreferrer">${FONTE.nome}</a>, no idioma original. Os marcadores por assunto são classificação minha a partir do título. Clique para ler a matéria completa na fonte.</p>
${feed}
    <p class="note">Manchete não é fato confirmado: no primeiro dia de um incidente, boa parte ainda é alegação ou análise preliminar. Confira a fonte e, quando existir, o comunicado da empresa envolvida.</p>

    <h2 class="rm-h2" id="fontes">Fontes e método</h2>
    <ul class="train srcs">
      <li><b>Manchetes:</b> <a href="${FONTE.site}" target="_blank" rel="noopener noreferrer">${FONTE.nome}</a>, pelo feed RSS público. A página guarda só título, link e data, e leva você à matéria original. Fonte: ${FONTE.nome}.</li>
      <li><b>Destaques:</b> escritos por mim a partir de matérias e comunicados, sempre com link para a fonte e um selo de status (<i>confirmado</i>, <i>relatado pela empresa</i>, <i>alegado</i> ou <i>em apuração</i>).</li>
      <li><b>Processo:</b> um GitHub Action diário baixa o feed e publica só links https da própria fonte, com o texto limpo de HTML. Uma trava barra a publicação se aparecer link ou texto fora do padrão, ou se o feed vier cortado; nesse caso a página fica com a versão anterior.</li>
    </ul>
  </section>
</main>
${FOOT}
</body>
</html>
`;

writeFileSync(join(ROOT, 'noticias.html'), PAGE);
writeFileSync(HISTORICO, JSON.stringify(historico) + '\n'); // só título, link e data (já validados)
console.log(`noticias.html gerado | ${bons.length} do feed, ${historico.length} no histórico, ${pagina.length} na página | ${curadas.length} destaque(s)`);
