// Gera radar-brasil.html: panorama estatístico do ransomware no Brasil + comunicações da ANPD por estado.
// Uso: node tools/build-radar-brasil.mjs        (baixa as fontes, agrega, aplica a trava e grava a página)
//      node tools/build-radar-brasil.mjs --local <victims.json> <groups.json>   (teste offline)
//
// Princípios (inspirados no Panthera Census, com código próprio):
//  - O dado bruto vive só na memória do processo: nunca é gravado no repositório nem na página.
//  - Só números agregados são publicados; recortes com menos de K casos são somados ou omitidos.
//  - Alegação de criminoso em site de vazamento NÃO é incidente confirmado. A ANPD é mostrada à parte.
//  - Se a fonte vier cortada ou a trava falhar, o build aborta e a página anterior continua no ar.
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { agregar, normalizar, travaSaida, validarFonte, validarAnpd, K, OUTROS_GRUPOS } from './radar-brasil-lib.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DATA = join(ROOT, 'tools', 'data');
const HISTORICO = join(DATA, 'historico-radar-brasil.csv');
const UA = 'cyber-expert-guide radar-brasil (github.com/juliocataldo/cybersecurity-expert-roadmap)';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = n => n.toLocaleString('pt-BR');
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const rotuloMes = m => `${MESES[+m.slice(5) - 1]}/${m.slice(2, 4)}`;
const dataBR = iso => iso.split('-').reverse().join('/');

async function baixar(url) {
  let ultimo = 'sem resposta';
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(120000) });
      if (r.ok) return await r.json();
      ultimo = 'HTTP ' + r.status;
    } catch (e) { ultimo = e.cause?.code || e.name; }
    await new Promise(r => setTimeout(r, t * 3000));
  }
  throw new Error(`falha ao baixar ${new URL(url).host}: ${ultimo}`);
}

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
const registros = normalizar(victims, nomesGrupos);
validarFonte(victims, registros, ultimoTotal());
victims = null; groups = null; // descarta o bruto

const hoje = new Date();
const ag = agregar(registros, { hoje });
travaSaida(ag, { gruposPermitidos: nomesGrupos });

const anpd = JSON.parse(readFileSync(join(DATA, 'anpd.json'), 'utf8'));
const errosAnpd = validarAnpd(anpd);
if (errosAnpd.length) throw new Error('ANPD inconsistente:\n- ' + errosAnpd.join('\n- '));
const mapa = JSON.parse(readFileSync(join(DATA, 'mapa-uf.json'), 'utf8'));

/* ---------- componentes de página (HTML/SVG estático, sem JS e sem style inline) ---------- */
const metros = (itens, max) => `<ul class="hb">\n${itens.map(i =>
  `        <li><span class="hb-l">${esc(i.nome)}</span>${i.nome === OUTROS_GRUPOS ? '<span></span>' : `<meter class="hb-m" min="0" max="${max}" value="${i.n}" aria-label="${esc(i.nome)}: ${i.n}"></meter>`}<span class="hb-v">${fmt(i.n)}</span></li>`).join('\n')}\n      </ul>`;
const tabela = (cab, linhas) => `<div class="table-scroll"><table class="cert"><thead><tr>${cab.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const detalhes = (titulo, html) => `<details class="dados"><summary>${titulo}</summary>${html}</details>`;

function colunasMes(meses) {
  const W = 480, H = 190, base = 150, topo = 14, esq = 6;
  const max = Math.max(1, ...meses.map(m => m.n));
  const passo = (W - esq * 2) / meses.length, larg = passo * 0.68;
  const barras = meses.map((m, i) => {
    const h = Math.max(m.n ? 2 : 0, (m.n / max) * (base - topo - 14));
    const x = esq + i * passo + (passo - larg) / 2;
    const rot = i % 3 === (meses.length - 1) % 3 ? `<text class="ch-t" x="${(x + larg / 2).toFixed(1)}" y="${base + 20}" text-anchor="${i === meses.length - 1 ? 'end' : 'middle'}">${rotuloMes(m.mes)}</text>` : '';
    const val = m.n ? `<text class="ch-v" x="${(x + larg / 2).toFixed(1)}" y="${(base - h - 5).toFixed(1)}" text-anchor="middle">${m.n}</text>` : '';
    return `<g><title>${rotuloMes(m.mes)}: ${m.n} alegações</title><rect class="ch-b" x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${larg.toFixed(1)}" height="${h.toFixed(1)}" rx="2"/>${val}${rot}</g>`;
  }).join('');
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Alegações por mês no Brasil, últimos ${meses.length} meses"><line class="ch-ax" x1="${esq}" y1="${base}" x2="${W - esq}" y2="${base}"/>${barras}</svg>`;
}

const faixa = n => n >= 100 ? 4 : n >= 30 ? 3 : n >= 10 ? 2 : n >= 1 ? 1 : 0;
function centro(d) {
  const aneis = d.split('M').filter(Boolean).map(r => r.replace(/Z$/, '').split('L').map(p => p.split(' ').map(Number)));
  const maior = aneis.sort((a, b) => b.length - a.length)[0];
  return [maior.reduce((s, p) => s + p[0], 0) / maior.length, maior.reduce((s, p) => s + p[1], 0) / maior.length];
}
function mapaUF() {
  const porUF = new Map(anpd.estados.map(e => [e.uf, e]));
  const paths = Object.entries(mapa.ufs).map(([uf, d]) => {
    const e = porUF.get(uf) || { total: 0, ransomware: 0 };
    return `<path class="uf m${faixa(e.total)}" d="${d}"><title>${uf}: ${e.total} comunicações (${e.ransomware} de ransomware)</title></path>`;
  }).join('');
  const rotulos = Object.entries(mapa.ufs).map(([uf, d]) => {
    const [x, y] = centro(d); return `<text class="uf-t" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${uf}</text>`;
  }).join('');
  return `<svg class="mapa" viewBox="0 0 ${mapa.largura} ${mapa.altura}" role="img" aria-label="Mapa do Brasil com comunicações de incidente à ANPD por estado">${paths}${rotulos}</svg>`;
}
const legenda = `<ul class="leg" aria-label="Legenda do mapa"><li><i class="m0"></i>0</li><li><i class="m1"></i>1–9</li><li><i class="m2"></i>10–29</li><li><i class="m3"></i>30–99</li><li><i class="m4"></i>100+</li></ul>`;

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
        <a href="solucoes.html">Soluções de Sec</a>
        <a href="checklist.html">Checklist</a>
        <a href="teia.html">Teia</a>
        <a href="plataformas.html">Plataformas</a>
        <a href="eventos.html">Eventos</a>
        <a href="radar.html" aria-current="page">Radar</a>
      </div>
    </details>
    <a href="sugestoes.html">Sugestões</a>
  </nav>`;
const ICON = readFileSync(join(ROOT, 'canivete.html'), 'utf8').split(/\r?\n/)[9];
const FOOT = readFileSync(join(ROOT, 'canivete.html'), 'utf8').split(/\r?\n/).find(l => l.startsWith('<footer'));

const maxSetor = Math.max(...ag.porSetor.map(s => s.n));
const maxGrupo = Math.max(...ag.porGrupo.filter(s => s.nome !== OUTROS_GRUPOS).map(s => s.n));
const anosLista = [...ag.porAno]; if (ag.antesDe) anosLista.unshift({ nome: `Até ${+ag.antesDe.ate - 1}`, n: ag.antesDe.n });
const maxAno = Math.max(...anosLista.map(s => s.n));
const tiposTop = anpd.tipos.slice(0, 8); const maxTipo = Math.max(...tiposTop.map(s => s.n));
const maxAnpdAno = Math.max(...anpd.anos.map(a => a.incidentes));
const estadosOrd = [...anpd.estados].sort((a, b) => b.total - a.total);
const hojeISO = hoje.toISOString().slice(0, 10);

const PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="description" content="Radar Brasil: panorama estatístico do ransomware no Brasil (alegações em sites de vazamento, por mês, setor e grupo) e comunicações de incidente à ANPD por estado.">
<title>Radar Brasil · Cyber Expert Guide</title>
${ICON}
<link rel="stylesheet" href="styles.css">
</head>
<body>
<header class="site">
  <a class="wordmark" href="./">CYBER<span>/</span>EXPERT GUIDE</a>
${NAV}
</header>
<main class="wrap">
  <p class="crumb"><a href="radar.html">← Radar</a></p>
  <section class="sec-g">
    <p class="eyebrow">Threat intel · estatística</p>
    <h1>Radar Brasil</h1>
    <p class="sec-intro">O ransomware no Brasil em números agregados: quantas alegações aparecem em sites de vazamento, em que setores e por quais grupos, e quantas comunicações de incidente chegam à ANPD por estado. Desenho inspirado no <a href="https://marianabsctba.github.io/Panthera_Census/" target="_blank" rel="noopener noreferrer">Panthera Census</a>, com código próprio. Atualizado em ${dataBR(hojeISO)}.</p>

    <div class="warn-box">
      <b>Como ler estes números</b>
      <ul>
        <li><b>Alegação não é incidente confirmado.</b> É o que o criminoso publica no seu site de vazamento, e pode haver exagero, repetição ou erro de país e setor.</li>
        <li><b>É só uma parte dos ataques.</b> Quem paga o resgate tende a não aparecer, e muitos ataques nunca são publicados.</li>
        <li><b>Esta página não identifica vítimas.</b> Só números agregados; recortes com menos de ${K} casos são somados em "Outros".</li>
        <li><b>ANPD é outra coisa:</b> são comunicações oficiais feitas por organizações. Nunca são somadas às alegações.</li>
      </ul>
    </div>

    <div class="kpis">
      <div class="kpi"><b>${fmt(ag.total)}</b><span>alegações com país Brasil, desde o início da série</span></div>
      <div class="kpi"><b>${fmt(ag.ultimos12)}</b><span>nos últimos 12 meses</span></div>
      <div class="kpi"><b>${fmt(ag.gruposDistintos)}</b><span>grupos com ${K} ou mais casos no Brasil</span></div>
      <div class="kpi"><b>${fmt(anpd.total)}</b><span>comunicações à ANPD (${fmt(anpd.ransomware)} de ransomware)</span></div>
    </div>

    <h2 class="rm-h2">Alegações por mês</h2>
    <p class="sec-intro">Últimos ${ag.meses.length} meses, pela data em que a alegação foi detectada no site de vazamento. O mês corrente ainda está incompleto.</p>
    ${colunasMes(ag.meses)}
    ${detalhes('Ver dados do gráfico', tabela(['Mês', 'Alegações'], ag.meses.map(m => [rotuloMes(m.mes), String(m.n)])))}

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
    <p class="note">O setor vem classificado pela fonte, em inglês, e foi traduzido aqui. Casos sem classificação ficam em "${esc(ag.porSetor.find(s => /Outros/.test(s.nome))?.nome || 'Outros / não classificado')}".</p>

    <h2 class="rm-h2">Alegações por ano</h2>
    ${metros(anosLista, maxAno)}

    <h2 class="rm-h2">Comunicações de incidente à ANPD, por estado</h2>
    <p class="sec-intro">Total de comunicações de incidente de segurança recebidas pela ANPD de 2021 a ${dataBR(anpd.atualizado)}, por estado da organização que comunicou. Inclui todos os tipos de incidente, não só ransomware. Passe o mouse (ou toque) para ver o valor de cada estado.</p>
    <div class="mapa-box">
      ${mapaUF()}
      ${legenda}
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

    <h2 class="rm-h2">Fontes, método e limites</h2>
    <ul class="train srcs">
      <li><b>Alegações:</b> <a href="https://www.ransomware.live" target="_blank" rel="noopener noreferrer">Ransomware.live</a>, de Julien Mousqueton (uso não comercial, com atribuição). Fonte: Ransomware.live. Os dados brutos não são republicados aqui, como pedem os <a href="https://www.ransomware.live/t&amp;c" target="_blank" rel="noopener noreferrer">termos</a>. Só entram casos cuja fonte marca o país como Brasil, sem revisão manual: país e setor podem estar errados.</li>
      <li><b>ANPD:</b> painéis públicos de <a href="https://www.gov.br/anpd/pt-br/assuntos/incidente-de-seguranca" target="_blank" rel="noopener noreferrer">comunicação de incidente de segurança</a>. Os valores são transcritos dos painéis para um arquivo versionado e <b>não se atualizam sozinhos</b>; a data da última transcrição está no texto acima. Seed conferido com o levantamento do Panthera Census.</li>
      <li><b>Mapa:</b> malha dos estados do <a href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" target="_blank" rel="noopener noreferrer">IBGE</a>.</li>
      <li><b>Processo:</b> um GitHub Action diário baixa a fonte, soma tudo em memória e publica só os totais. Uma trava barra a publicação se aparecer texto fora de uma lista autorizada ou recorte com menos de ${K} casos; nesse caso a página fica com os números do dia anterior.</li>
    </ul>
  </section>
</main>
${FOOT}
</body>
</html>
`;

writeFileSync(join(ROOT, 'radar-brasil.html'), PAGE);
// histórico: só o total do dia (sem nenhum dado de caso)
if (!existsSync(HISTORICO)) writeFileSync(HISTORICO, 'data,total_br\n');
const linhas = readFileSync(HISTORICO, 'utf8').trim().split('\n');
if (!linhas.at(-1).startsWith(hojeISO)) appendFileSync(HISTORICO, `${hojeISO},${ag.total}\n`);
console.log(`radar-brasil.html gerado | BR: ${ag.total} (12m: ${ag.ultimos12}) | grupos≥${K}: ${ag.gruposDistintos} | ANPD: ${anpd.total}`);
