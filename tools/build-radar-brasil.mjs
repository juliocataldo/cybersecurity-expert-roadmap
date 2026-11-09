// Gera radar.html (primeira tela do Radar): ransomware no mundo, com o Brasil em destaque,
// comunicações da ANPD por estado e ferramentas/CVEs usados por grupos.
// Uso: node tools/build-radar-brasil.mjs        (baixa as fontes, agrega, aplica a trava e grava a página)
//      node tools/build-radar-brasil.mjs --local <victims.json> <groups.json>   (teste offline)
// Dados de apoio (versionados): tools/data/mapa-mundo.json (gen-mapa-mundo.mjs), referencias.json (referencias.mjs),
//   mapa-uf.json, anpd.json (ver tools/ANPD-ATUALIZAR.md).
//
// Princípios:
//  - O dado bruto vive só na memória do processo: nunca é gravado no repositório nem na página.
//  - Só números agregados são publicados; recortes com menos de K casos são somados ou omitidos.
//  - Menção em site de vazamento NÃO é incidente confirmado. A ANPD é mostrada à parte.
//  - Se a fonte vier cortada ou a trava falhar, o build aborta e a página anterior continua no ar.
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  agregar, normalizarMundo, contarSemPais, agregarPaises, travaSaida, travaPaises, validarFonte, validarAnpd, taxa, limitesQuintis, faixaDe,
  lerMatrizFerramentas, lerMatrizCves, topMatriz, travaMatriz, K, MIN_TAXA, OUTROS_GRUPOS, OUTROS_SETOR,
} from './radar-brasil-lib.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DATA = join(ROOT, 'tools', 'data');
const HISTORICO = join(DATA, 'historico-radar-brasil.csv');
const UA = 'cyber-expert-guide radar (github.com/juliocataldo/cybersecurity-expert-roadmap)';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n, d = 0) => n.toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const rotuloMes = m => `${MESES[+m.slice(5) - 1]}/${m.slice(2, 4)}`;
const dataBR = iso => iso.split('-').reverse().join('/');

async function baixar(url, como = 'json', tentativas = 3) {
  let ultimo = 'sem resposta';
  for (let t = 1; t <= tentativas; t++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(120000) });
      if (r.ok) return await r[como]();
      ultimo = 'HTTP ' + r.status;
    } catch (e) { ultimo = e.cause?.code || e.name; }
    await new Promise(r => setTimeout(r, t * 3000));
  }
  throw new Error(`falha ao baixar ${new URL(url).host}: ${ultimo}`);
}
const lerJson = f => { const p = join(DATA, f); if (!existsSync(p)) throw new Error(`falta tools/data/${f} (veja o cabeçalho deste script)`); return JSON.parse(readFileSync(p, 'utf8')); };

const ultimoTotal = () => {
  if (!existsSync(HISTORICO)) return 0;
  const l = readFileSync(HISTORICO, 'utf8').trim().split('\n');
  return l.length > 1 ? Number(l.at(-1).split(',')[1]) : 0;
};

/* ---------- coleta (o bruto só existe em memória) ---------- */
let victims, groups;
const local = process.argv.indexOf('--local');
if (local > 0) { victims = JSON.parse(readFileSync(process.argv[local + 1], 'utf8')); groups = JSON.parse(readFileSync(process.argv[local + 2], 'utf8')); }
else { victims = await baixar('https://data.ransomware.live/victims.json'); groups = await baixar('https://data.ransomware.live/groups.json'); }
const nomesGrupos = groups.map(g => g.name).filter(Boolean);
const regMundo = normalizarMundo(victims, nomesGrupos);
const semPais = contarSemPais(victims);
const totalFonte = victims.length;
const registros = regMundo.filter(r => r.pais === 'BR');
validarFonte(victims, registros, ultimoTotal());
victims = null; groups = null; // descarta o bruto

const hoje = new Date();
const ag = agregar(registros, { hoje });
travaSaida(ag, { gruposPermitidos: nomesGrupos });
const agMundo = agregar(regMundo, { hoje, topGrupos: 12 });
travaSaida(agMundo, { gruposPermitidos: nomesGrupos });

const refs = lerJson('referencias.json');
const mundo = lerJson('mapa-mundo.json');
const paisesOk = new Set(Object.keys(refs.paises));
const ap = agregarPaises(regMundo, { hoje, paisesPermitidos: paisesOk });
travaPaises(ap, { paisesPermitidos: paisesOk });

const anpd = lerJson('anpd.json');
const errosAnpd = validarAnpd(anpd);
if (errosAnpd.length) throw new Error('ANPD inconsistente:\n- ' + errosAnpd.join('\n- '));
const mapa = lerJson('mapa-uf.json');

/* ---- matrizes BushidoUK (opcional: se cair, a seção some naquele dia) ---- */
const RAW = 'https://raw.githubusercontent.com/BushidoUK/';
const ARQ_FERR = ['CredentialTheft', 'DefenseEvasion', 'DiscoveryEnum', 'Exfiltration', 'LOLBAS', 'Networking', 'Offsec', 'RMM-Tools'];
const ARQ_CVE = ['Applications', 'Drivers', 'FileTransferServers', 'Linux', 'Microsoft', 'NetworkEdge', 'RMM_Tools', 'Virtualization'];
let topFerr = [], topCve = [];
if (local < 0) {
  try {
    const ft = await Promise.all(ARQ_FERR.map(n => baixar(`${RAW}Ransomware-Tool-Matrix/main/Tools/${n}.md`, 'text', 2)));
    const ct = await Promise.all(ARQ_CVE.map(n => baixar(`${RAW}Ransomware-Vulnerability-Matrix/main/Vulnerabilities/${n}.md`, 'text', 2)));
    topFerr = topMatriz(ft.flatMap(lerMatrizFerramentas), 'nome', 12);
    topCve = topMatriz(ct.flatMap(lerMatrizCves), 'cve', 12).map(c => ({ nome: c.nome, produto: c.produto, n: c.n }));
    travaMatriz(topFerr, topCve);
  } catch (e) { console.warn('Sem matrizes BushidoUK hoje:', e.message); topFerr = []; topCve = []; }
}

/* ---------- componentes de página (HTML/SVG estático, sem JS e sem style inline) ---------- */
const metros = (itens, max, rotulo = i => i.nome) => `<ul class="hb">\n${itens.map(i =>
  `        <li><span class="hb-l">${esc(rotulo(i))}</span>${i.nome === OUTROS_GRUPOS ? '<span></span>' : `<meter class="hb-m" min="0" max="${max}" value="${i.n}" aria-label="${esc(rotulo(i))}: ${i.n}"></meter>`}<span class="hb-v">${fmt(i.n)}</span></li>`).join('\n')}\n      </ul>`;
const tabela = (cab, linhas) => `<div class="table-scroll"><table class="cert"><thead><tr>${cab.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const detalhes = (titulo, html) => `<details class="dados"><summary>${titulo}</summary>${html}</details>`;

/* colunas por mês: viewBox largo, um rótulo a cada 3 meses (sem sobreposição); em tela estreita o gráfico rola na horizontal */
function colunasMes(meses, rotulo) {
  const W = 960, H = 250, base = 200, topo = 24, esq = 10;
  const max = Math.max(1, ...meses.map(m => m.n));
  const passo = (W - esq * 2) / meses.length, larg = passo * 0.62;
  const barras = meses.map((m, i) => {
    const h = Math.max(m.n ? 2 : 0, (m.n / max) * (base - topo - 8));
    const x = esq + i * passo + (passo - larg) / 2, cx = x + larg / 2;
    const rot = (meses.length - 1 - i) % 3 === 0 ? `<text class="ch-t" x="${cx.toFixed(1)}" y="${base + 26}" text-anchor="${i === meses.length - 1 ? 'end' : 'middle'}">${rotuloMes(m.mes)}</text><line class="ch-tick" x1="${cx.toFixed(1)}" y1="${base}" x2="${cx.toFixed(1)}" y2="${base + 6}"/>` : '';
    const val = m.n ? `<text class="ch-v" x="${cx.toFixed(1)}" y="${(base - h - 6).toFixed(1)}" text-anchor="middle">${fmt(m.n)}</text>` : '';
    return `<g><title>${rotuloMes(m.mes)}: ${fmt(m.n)} menções</title><rect class="ch-b" x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${larg.toFixed(1)}" height="${h.toFixed(1)}" rx="3"/>${val}${rot}</g>`;
  }).join('');
  return `<div class="ch-scroll"><svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(rotulo)}, últimos ${meses.length} meses"><line class="ch-ax" x1="${esq}" y1="${base}" x2="${W - esq}" y2="${base}"/>${barras}</svg></div>`;
}

/* --- mapa do Brasil por UF (ANPD) --- */
const faixaUF = n => n >= 100 ? 4 : n >= 30 ? 3 : n >= 10 ? 2 : n >= 1 ? 1 : 0;
function centro(d) {
  const aneis = d.split('M').filter(Boolean).map(r => r.replace(/Z$/, '').split('L').map(p => p.split(' ').map(Number)));
  const maior = aneis.sort((a, b) => b.length - a.length)[0];
  return [maior.reduce((s, p) => s + p[0], 0) / maior.length, maior.reduce((s, p) => s + p[1], 0) / maior.length];
}
function mapaUF() {
  const porUF = new Map(anpd.estados.map(e => [e.uf, e]));
  const paths = Object.entries(mapa.ufs).map(([uf, d]) => {
    const e = porUF.get(uf) || { total: 0, ransomware: 0 };
    return `<path class="uf m${faixaUF(e.total)}" d="${d}"><title>${uf}: ${e.total} comunicações (${e.ransomware} de ransomware)</title></path>`;
  }).join('');
  const rotulos = Object.entries(mapa.ufs).map(([uf, d]) => {
    const [x, y] = centro(d); return `<text class="uf-t" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${uf}</text>`;
  }).join('');
  return `<svg class="mapa" viewBox="0 0 ${mapa.largura} ${mapa.altura}" role="img" aria-label="Mapa do Brasil com comunicações de incidente à ANPD por estado">${paths}${rotulos}</svg>`;
}
const legendaUF = `<ul class="leg" aria-label="Legenda do mapa"><li><i class="m0"></i>0</li><li><i class="m1"></i>1–9</li><li><i class="m2"></i>10–29</li><li><i class="m3"></i>30–99</li><li><i class="m4"></i>100+</li></ul>`;

/* --- mapa-múndi: menções por país (sem filtros) --- */
const nomePais = c => (refs.paises[c] && refs.paises[c].nome) || c;
const linhas = ap.paises.map(p => {
  const pop = refs.populacao[p.pais]?.v;
  return { ...p, nome: nomePais(p.pais), pop, porMilhao: taxa(p.todos, pop, 1e6) };
});
const porPais = new Map(linhas.map(l => [l.pais, l]));
function mapaMundo() {
  const lim = limitesQuintis(linhas.map(l => l.todos));
  const usos = Object.keys(mundo.paises).map(c => {
    const l = porPais.get(c);
    const classe = l && lim.length ? 'p' + faixaDe(l.todos, lim) : 'nd';
    const dica = l ? `${nomePais(c)}: ${fmt(l.todos)} menções` : `${nomePais(c)}: menos de ${K} menções`;
    return `<use href="#pais-${c}" class="pais ${classe}${c === 'BR' ? ' br' : ''}"><title>${esc(dica)}</title></use>`;
  }).join('');
  const faixas = lim.length ? [`menos de ${fmt(lim[0])}`, ...lim.slice(0, -1).map((x, i) => `${fmt(x)} a ${fmt(lim[i + 1] - 1)}`), `${fmt(lim.at(-1))} ou mais`] : [];
  const leg = `<ul class="leg leg-linha" aria-label="Legenda do mapa">${faixas.map((t, i) => `<li><i class="p${i + 1}"></i>${esc(t)}</li>`).join('')}<li><i class="nd"></i>menos de ${K}</li><li><i class="brsw"></i>Brasil</li></ul>`;
  return `<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>${Object.entries(mundo.paises).map(([c, p]) => `<path id="pais-${c}" d="${p.d}"/>`).join('')}</defs></svg>
    <div class="mapa-w">
      <svg class="mundo" viewBox="0 0 ${mundo.largura} ${mundo.altura}" role="img" aria-label="Mapa-múndi: menções em sites de vazamento por país"><path class="esfera" d="${mundo.esfera}"/><path class="grade" d="${mundo.grade}"/>${usos}</svg>
      ${leg}
    </div>`;
}

/* --- ranking de países, com o Brasil sempre visível --- */
const rankAbs = [...linhas].sort((a, b) => b.todos - a.todos);
const rankPop = linhas.filter(l => l.porMilhao != null).sort((a, b) => b.porMilhao - a.porMilhao);
const posAbs = c => rankAbs.findIndex(l => l.pais === c) + 1;
const posPop = c => rankPop.findIndex(l => l.pais === c) + 1;
const br = porPais.get('BR');
const TOP = 15;
function tabelaPaises() {
  const linha = (l, i) => `<tr${l.pais === 'BR' ? ' class="br-row"' : ''}><td>${i}</td><td>${esc(l.nome)}</td><td>${fmt(l.todos)}</td><td>${l.m12 != null ? fmt(l.m12) : '—'}</td><td>${l.porMilhao != null ? fmt(l.porMilhao, 1) : '—'}</td></tr>`;
  const top = rankAbs.slice(0, TOP).map((l, i) => linha(l, i + 1));
  if (br && posAbs('BR') > TOP) top.push(`<tr><td colspan="5" class="mut">…</td></tr>`, linha(br, posAbs('BR')));
  return `<div class="table-scroll"><table class="cert"><thead><tr><th>#</th><th>País</th><th>Menções</th><th>Últimos 12 meses</th><th>Por milhão de hab.</th></tr></thead><tbody>${top.join('')}</tbody></table></div>`;
}

/* --- Brasil x mundo por setor (% do total de cada um) --- */
function comparaSetores() {
  const pct = (a, nome) => { const s = a.porSetor.find(x => x.nome === nome); return s ? s.n / a.total * 100 : 0; };
  const nomes = [...new Set([...ag.porSetor, ...agMundo.porSetor].map(s => s.nome))].filter(n => n !== OUTROS_SETOR);
  nomes.sort((a, b) => pct(ag, b) - pct(ag, a));
  nomes.push(OUTROS_SETOR);
  const max = Math.max(...nomes.flatMap(n => [pct(ag, n), pct(agMundo, n)]));
  const cel = (v, nome, quem) => `<td><div class="cmp"><meter class="hb-m" min="0" max="${max.toFixed(1)}" value="${v.toFixed(1)}" aria-label="${esc(nome)} (${quem}): ${fmt(v, 1)}%"></meter><span class="hb-v">${fmt(v, 1)}%</span></div></td>`;
  return `<div class="table-scroll"><table class="cert"><thead><tr><th>Setor</th><th>Brasil</th><th>Mundo</th></tr></thead><tbody>${nomes.map(n => `<tr><td>${esc(n)}</td>${cel(pct(ag, n), n, 'Brasil')}${cel(pct(agMundo, n), n, 'Mundo')}</tr>`).join('')}</tbody></table></div>`;
}

const NAV = `  <nav aria-label="Seções">
    <a href="./">Home</a>
    <a href="guia.html">Guia</a>
    <a href="trilhas.html">Trilhas</a>
    <a href="artigos.html">Artigos</a>
    <details class="nav-group">
      <summary class="cur">Recursos</summary>
      <div class="nav-menu">
        <span class="nav-sub">Ferramentas</span>
        <a href="canivete.html">Canivete suíço</a>
        <a href="solucoes.html">HUB Sec</a>
        <a href="plataformas.html">Plataformas</a>
        <a href="checklist.html">Checklist</a>
        <span class="nav-sub">Atualização</span>
        <a href="radar.html" aria-current="page">Radar</a>
        <a href="noticias.html">Notícias</a>
        <a href="eventos.html">Eventos</a>
      </div>
    </details>
    <a href="sugestoes.html">Sugestões</a>
  </nav>`;
const CSSV = createHash('sha1').update(readFileSync(join(ROOT, 'styles.css'), 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8); // cache-busting do CSS (ver tools/bump-css.mjs)
const ICON = readFileSync(join(ROOT, 'canivete.html'), 'utf8').split(/\r?\n/)[9];
const FOOT = readFileSync(join(ROOT, 'canivete.html'), 'utf8').split(/\r?\n/).find(l => l.startsWith('<footer'));

const maxSetor = Math.max(...ag.porSetor.map(s => s.n));
const maxGrupo = Math.max(...ag.porGrupo.filter(s => s.nome !== OUTROS_GRUPOS).map(s => s.n));
const maxGrupoMundo = Math.max(...agMundo.porGrupo.filter(s => s.nome !== OUTROS_GRUPOS).map(s => s.n));
const anosLista = [...ag.porAno]; if (ag.antesDe) anosLista.unshift({ nome: `Até ${+ag.antesDe.ate - 1}`, n: ag.antesDe.n });
const maxAno = Math.max(...anosLista.map(s => s.n));
const tiposTop = anpd.tipos.slice(0, 8); const maxTipo = Math.max(...tiposTop.map(s => s.n));
const maxAnpdAno = Math.max(...anpd.anos.map(a => a.incidentes));
const estadosOrd = [...anpd.estados].sort((a, b) => b.total - a.total);
const hojeISO = hoje.toISOString().slice(0, 10);
const parteMundo = br ? ag.total / agMundo.total * 100 : 0;
const secaoMatrizes = topFerr.length && topCve.length ? `
    <h2 class="rm-h2" id="como-atacam">Como atacam: ferramentas e CVEs</h2>
    <p class="sec-intro">O que relatórios públicos associam a grupos de ransomware: quantos grupos distintos usam cada ferramenta ou exploram cada vulnerabilidade. Não é frequência de ataques; serve para priorizar o que monitorar e corrigir.</p>
    <div class="osint-top">
      <div class="osint-box">
        <span class="k mono small">Ferramentas · nº de grupos</span>
        ${metros(topFerr, Math.max(...topFerr.map(x => x.n)))}
      </div>
      <div class="osint-box">
        <span class="k mono small">CVEs · nº de grupos</span>
        ${metros(topCve, Math.max(...topCve.map(x => x.n)), c => c.produto ? `${c.nome} · ${c.produto}`.slice(0, 56) : c.nome)}
      </div>
    </div>
    <p class="note">Fonte: matrizes públicas de ferramentas e de vulnerabilidades de ransomware, do BushidoUK (CC BY 4.0). Os nomes dos grupos não são listados aqui.</p>
` : '';

const PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="description" content="Radar: ransomware no mundo, com o Brasil em destaque. Mapa-múndi de menções em sites de vazamento, setores, grupos, comunicações de incidente à ANPD por estado e ferramentas e CVEs usados por grupos.">
<title>Radar · Cyber Expert Guide</title>
${ICON}
<link rel="stylesheet" href="styles.css?v=${CSSV}">
</head>
<body>
<header class="site">
  <a class="wordmark" href="./">CYBER<span>/</span>EXPERT GUIDE</a>
${NAV}
</header>
<main class="wrap">
  <section class="sec-g radar-pg">
    <p class="eyebrow">Threat intel · estatística</p>
    <h1>Radar</h1>
    <p class="sec-intro">O ransomware no mundo em números agregados, com o <b>Brasil em destaque</b>: onde caem as menções em sites de vazamento, em que setores e por quais grupos, o que se sabe sobre como atacam e quantas comunicações de incidente chegam à ANPD por estado. Atualizado em ${dataBR(hojeISO)}.</p>

    <nav class="ancoras" aria-label="Nesta página"><a href="#mundo">Mundo</a><a href="#brasil">Brasil</a><a href="#anpd">ANPD</a>${secaoMatrizes ? '<a href="#como-atacam">Como atacam</a>' : ''}<a href="#observacoes">Observações</a><a href="#fontes">Fontes</a></nav>

    <h2 class="rm-h2" id="mundo">Mundo: onde caem as menções</h2>
    <div class="kpis">
      <div class="kpi"><b>${fmt(agMundo.total)}</b><span>menções no mundo, desde o início da série</span></div>
      <div class="kpi"><b>${fmt(agMundo.ultimos12)}</b><span>nos últimos 12 meses</span></div>
      <div class="kpi"><b>${fmt(ap.paises.length)}</b><span>países com ${K} ou mais menções</span></div>
      <div class="kpi kpi-br"><b>${br ? posAbs('BR') + 'º' : '—'}</b><span>posição do Brasil em menções (${fmt(parteMundo, 1)}% do total)${posPop('BR') ? `; ${posPop('BR')}º por milhão de habitantes` : ''}</span></div>
    </div>
    <p class="sec-intro">Passe o mouse (ou toque) em um país para ver o valor. O Brasil tem contorno claro.</p>
    ${mapaMundo()}

    <h3 class="rm-h3">Países com mais menções</h3>
    ${tabelaPaises()}
    <p class="note">Por milhão de habitantes só aparece para países com ${MIN_TAXA} ou mais menções, para não distorcer. Não é um ranking de risco: o número depende do tamanho da economia, da quantidade de organizações expostas e de quem os criminosos escolhem divulgar.</p>

    <h3 class="rm-h3">Brasil e mundo, por setor</h3>
    <p class="sec-intro">Parcela de cada setor no total de menções do Brasil e do mundo.</p>
    ${comparaSetores()}

    <h3 class="rm-h3">Mundo: menções por mês</h3>
    ${colunasMes(agMundo.meses, 'Menções por mês no mundo')}

    <h3 class="rm-h3">Mundo: grupos mais ativos</h3>
    <div class="osint-box">
      ${metros(agMundo.porGrupo, maxGrupoMundo)}
    </div>
${secaoMatrizes}
    <h2 class="rm-h2" id="brasil">Foco no Brasil</h2>
    <div class="kpis">
      <div class="kpi"><b>${fmt(ag.total)}</b><span>menções com país Brasil, desde o início da série</span></div>
      <div class="kpi"><b>${fmt(ag.ultimos12)}</b><span>nos últimos 12 meses</span></div>
      <div class="kpi"><b>${fmt(ag.gruposDistintos)}</b><span>grupos com ${K} ou mais casos no Brasil</span></div>
      <div class="kpi"><b>${fmt(anpd.total)}</b><span>comunicações à ANPD (${fmt(anpd.ransomware)} de ransomware)</span></div>
    </div>

    <h3 class="rm-h3">Menções por mês</h3>
    <p class="sec-intro">Últimos ${ag.meses.length} meses, pela data em que a menção foi detectada no site de vazamento. O mês corrente ainda está incompleto.</p>
    ${colunasMes(ag.meses, 'Menções por mês no Brasil')}
    ${detalhes('Ver dados do gráfico', tabela(['Mês', 'Menções'], ag.meses.map(m => [rotuloMes(m.mes), String(m.n)])))}

    <div class="osint-top">
      <div class="osint-box">
        <span class="k mono small">Por setor</span>
        ${metros(ag.porSetor, maxSetor)}
      </div>
      <div class="osint-box">
        <span class="k mono small">Grupos mais ativos</span>
        ${metros(ag.porGrupo, maxGrupo)}
      </div>
    </div>
    <p class="note">O setor vem classificado pela fonte, em inglês, e foi traduzido aqui. Casos sem classificação ficam em "${esc(ag.porSetor.find(s => /Outros/.test(s.nome))?.nome || OUTROS_SETOR)}".</p>

    <h3 class="rm-h3">Menções por ano</h3>
    ${metros(anosLista, maxAno)}

    <h2 class="rm-h2" id="anpd">Comunicações de incidente à ANPD, por estado</h2>
    <p class="sec-intro">Total de comunicações de incidente de segurança recebidas pela ANPD de 2021 a ${dataBR(anpd.atualizado)}, por estado da organização que comunicou. Inclui todos os tipos de incidente, não só ransomware. Passe o mouse (ou toque) para ver o valor de cada estado.</p>
    <div class="mapa-box">
      ${mapaUF()}
      ${legendaUF}
    </div>
    ${detalhes('Ver tabela por estado', tabela(['Estado', 'Comunicações', 'Das quais ransomware'], [...estadosOrd.map(e => [`${e.nome} (${e.uf})`, fmt(e.total), fmt(e.ransomware)]), ...anpd.foraDasUF.map(e => [e.nome, fmt(e.total), fmt(e.ransomware)])]))}
    <p class="note">São Paulo e Distrito Federal concentram muitas comunicações, mas o número também reflete onde ficam as sedes das organizações e quem tem o hábito de comunicar. Não é um ranking de risco.</p>

    <div class="osint-top">
      <div class="osint-box">
        <span class="k mono small">ANPD · por ano (todos os tipos)</span>
        <ul class="hb">
${anpd.anos.map(a => `        <li><span class="hb-l">${a.ano}</span><meter class="hb-m" min="0" max="${maxAnpdAno}" value="${a.incidentes}" aria-label="${a.ano}: ${a.incidentes}"></meter><span class="hb-v">${fmt(a.incidentes)}</span></li>`).join('\n')}
        </ul>
        <p class="mut small">${esc('Ransomware dentro de cada ano: ' + anpd.anos.map(a => `${a.ano}: ${a.ransomware}`).join(' · '))}. Em 2026 o ano ainda está em andamento.</p>
      </div>
      <div class="osint-box">
        <span class="k mono small">ANPD · tipos de incidente mais comunicados</span>
        ${metros(tiposTop, maxTipo)}
      </div>
    </div>

    <div class="cards cards-one">
    <a class="card" href="radar-casos.html"><span class="k">Segunda tela</span><h3>Casos e vulnerabilidades</h3><p>Quer ver os nomes das organizações citadas em sites de vazamento e as vulnerabilidades em exploração ativa (KEV)? Estão na segunda tela. Lembre: citada não quer dizer atacada de fato.</p><span class="go">Abrir →</span></a>
    </div>

    <h2 class="rm-h2" id="observacoes">Observações</h2>
    <div class="warn-box">
      <ul>
        <li><b>Menção não é incidente confirmado.</b> É o que o criminoso publica no seu site de vazamento, e pode haver exagero, repetição ou erro de país e setor.</li>
        <li><b>É só uma parte dos ataques.</b> Quem paga o resgate tende a não aparecer, e países com mais mídia e mais sites monitorados aparecem mais.</li>
        <li><b>${fmt(semPais / totalFonte * 100, 0)}% das menções da fonte não informam o país</b> (${fmt(semPais)}) e ficam fora dos mapas e rankings por país.</li>
        <li><b>A ANPD é outra coisa:</b> são comunicações oficiais feitas por organizações e nunca são somadas às menções.</li>
      </ul>
    </div>

    <h2 class="rm-h2" id="fontes">Fontes, método e limites</h2>
    <ul class="train srcs">
      <li><b>Menções:</b> <a href="https://www.ransomware.live" target="_blank" rel="noopener noreferrer">Ransomware.live</a>, de Julien Mousqueton (uso não comercial, com atribuição). Fonte: Ransomware.live. Os dados brutos não são republicados aqui, como pedem os <a href="https://www.ransomware.live/t&amp;c" target="_blank" rel="noopener noreferrer">termos</a>. País e setor são os que a fonte marca, sem revisão manual.</li>
      <li><b>População:</b> <a href="https://data.worldbank.org" target="_blank" rel="noopener noreferrer">Banco Mundial</a> (CC BY 4.0), último valor disponível de cada país (população em ${esc(refs.populacao.BR?.ano || '')} para o Brasil; o ano varia por país). Atualizado em ${dataBR(refs.atualizado)}.</li>
      <li><b>Mapa-múndi:</b> contornos do <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a> (domínio público), em projeção Equal Earth.</li>${secaoMatrizes ? `
      <li><b>Ferramentas e CVEs:</b> <a href="https://github.com/BushidoUK/Ransomware-Tool-Matrix" target="_blank" rel="noopener noreferrer">Ransomware Tool Matrix</a> e <a href="https://github.com/BushidoUK/Ransomware-Vulnerability-Matrix" target="_blank" rel="noopener noreferrer">Ransomware Vulnerability Matrix</a>, do BushidoUK (CC BY 4.0).</li>` : ''}
      <li><b>ANPD:</b> painéis públicos de <a href="https://www.gov.br/anpd/pt-br/assuntos/incidente-de-seguranca" target="_blank" rel="noopener noreferrer">comunicação de incidente de segurança</a>. Os valores ficam num arquivo versionado, conferidos contra o total do painel oficial, e <b>não se atualizam sozinhos</b>; a data da última atualização está no texto acima.</li>
      <li><b>Mapa do Brasil:</b> malha dos estados do <a href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" target="_blank" rel="noopener noreferrer">IBGE</a>.</li>
      <li><b>Processo:</b> um GitHub Action diário baixa a fonte, soma tudo em memória e publica só os totais, sem identificar vítimas. Uma trava barra a publicação se aparecer texto fora de uma lista autorizada ou recorte com menos de ${K} casos; nesse caso a página fica com os números do dia anterior.</li>
    </ul>
  </section>
</main>
${FOOT}
</body>
</html>
`;

writeFileSync(join(ROOT, 'radar.html'), PAGE);
// histórico: só o total do Brasil do dia (sem nenhum dado de caso)
if (!existsSync(HISTORICO)) writeFileSync(HISTORICO, 'data,total_br\n');
const linhasH = readFileSync(HISTORICO, 'utf8').trim().split('\n');
if (!linhasH.at(-1).startsWith(hojeISO)) appendFileSync(HISTORICO, `${hojeISO},${ag.total}\n`);
console.log(`radar.html gerado | mundo: ${agMundo.total} (${ap.paises.length} países ≥${K}) | BR: ${ag.total} (12m: ${ag.ultimos12}, #${posAbs('BR')}) | ANPD: ${anpd.total} | matrizes: ${topFerr.length} ferramentas, ${topCve.length} CVEs`);
