// Gera a segunda tela do Radar (radar-casos.html: casos citados e KEV) a partir da API Vexday (threat intel).
// Foco v1: Brasil (vítimas de ransomware) + grandes fornecedores (KEV).
// Uso no GitHub Action: CHAVE_VEXDAY=<secret> node tools/build-radar.mjs
// Sem chave: gera um aviso de "sendo configurado". Com chave, mas API sem dados (limite de requisições, HTTP 429, ou erro):
// NÃO escreve nada e mantém a página anterior (o aviso só vale para quem ainda não configurou a chave).
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { criarCliente, LIMITE_REQ_PADRAO, MAX_DETALHES } from './vexday-lib.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const KEY = process.env.CHAVE_VEXDAY || process.env.VEXDAY_API_KEY || '';
const BASE = 'https://api.vexday.io';
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const asDate = v => { if (!v) return ''; const d = new Date(v); return isNaN(+d) ? String(v).slice(0, 10) : d.toISOString().slice(0, 10); };
const pick = (o, ks) => { for (const k of ks) { const v = o && o[k]; if (v != null && v !== '') return v; } return ''; };
const list = j => Array.isArray(j) ? j : ((j && (j.data || j.results || j.items || j.victims || j.incidents || j.kev || j.cves || j.list)) || []);

const cliente = criarCliente({ key: KEY, base: BASE, limite: Number(process.env.VEXDAY_MAX_REQ) || LIMITE_REQ_PADRAO });
const api = cliente.api; // respeita a cota da conta (50/dia e 10/min): ver tools/vexday-lib.mjs

const BIG = ['microsoft', 'cisco', 'fortinet', 'fortiguard', 'vmware', 'ivanti', 'citrix', 'palo alto', 'paloalto', 'apache',
  'oracle', 'google', 'adobe', 'atlassian', 'sonicwall', 'zoho', 'manageengine', 'progress', 'moveit', 'f5', 'juniper',
  'veeam', 'jetbrains', 'gitlab', 'confluence', 'sap', 'ibm', 'dell', 'hpe', 'mikrotik', 'zyxel', 'wordpress', 'linux'];

function victimCard(v) {
  const name = esc(pick(v, ['victim', 'name', 'company', 'organization', 'org', 'title', 'domain']) || '(organização não nomeada)');
  const group = esc(pick(v, ['group', 'actor', 'gang', 'ransomware', 'group_name', 'actor_name']));
  const sector = esc(pick(v, ['sector', 'industry', 'activity']));
  const date = esc(asDate(pick(v, ['date', 'published', 'discovered', 'attack_date', 'claim_date', 'first_seen', 'published_at', 'announced', 'created_at'])));
  const meta = [group && ('Grupo: ' + group), sector, date].filter(Boolean).join(' · ');
  return `      <div class="card"><span class="k">Ransomware · Brasil</span><h3>${name}</h3><p>${meta || '&nbsp;'}</p></div>`;
}
const affList = c => { const a = c.affected || c.affected_products || c.vendors || []; return Array.isArray(a) ? a : []; };
const vendorHay = c => affList(c).map(a => (pick(a, ['vendor', 'vendor_name']) + ' ' + pick(a, ['product', 'product_name']))).join(' ').toLowerCase()
  || (pick(c, ['vendor', 'product']) + '').toLowerCase();
function kevCard(c) {
  const id = esc(pick(c, ['cve_id', 'cve', 'id', 'cveID']) || 'CVE');
  const a0 = affList(c)[0] || {};
  const vendor = esc(pick(a0, ['vendor', 'vendor_name']) || pick(c, ['vendor', 'vendorProject']));
  const product = esc(pick(a0, ['product', 'product_name']) || pick(c, ['product']));
  const sev = esc(pick(c, ['cvss_severity', 'severity', 'cvssSeverity'])).toUpperCase();
  const score = esc(pick(c, ['cvss_score', 'cvss', 'score']));
  const sevCls = /CRIT/.test(sev) ? 'crit' : /HIGH|ALT/.test(sev) ? 'high' : '';
  const vp = [vendor, product].filter(Boolean).join(' ');
  return `      <a class="card" href="https://nvd.nist.gov/vuln/detail/${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer"><span class="k">KEV${vp ? ' · ' + esc(vp) : ''}</span><h3>${id}${sev ? ` <span class="pill sev-${sevCls}">${sev}</span>` : ''}</h3><p>Em exploração ativa.${score ? ` CVSS ${score}.` : ''}</p></a>`;
}

/* ---- coleta: 1 (vítimas) + 1 (lista KEV) + até MAX_DETALHES (10) detalhes. A cota é da conta: 50/dia e 10/min. ---- */
let victims = list(await api('/api/v1/victims?country=BR&page_size=30')).slice(0, 24).map(victimCard);
let kevList = list(await api('/api/v1/cve?in_kev=true&page_size=24'));
if (!kevList.length) kevList = list(await api('/api/v1/kev?page_size=24')); // fallback: só se a 1ª lista vier vazia
const kevIds = kevList.map(c => pick(c, ['cve_id', 'cve', 'id', 'cveID'])).filter(Boolean);
// enriquece com /cve/{id} (traz affected[].vendor/product); sequencial, e para sozinho se a cota acabar
const details = [];
for (const id of kevIds.slice(0, MAX_DETALHES)) {
  const d = await api('/api/v1/cve/' + encodeURIComponent(id));
  if (d) details.push(d.cve || d.data || d.item || d);
}
{ const e = cliente.estado(); console.log(`Vexday: ${e.usadas}/${e.limite} requisições neste run${e.bloqueado ? ' (limite atingido)' : ''}`); }
let cveBig = details.filter(c => BIG.some(bg => vendorHay(c).includes(bg)));
if (cveBig.length < 5) cveBig = details; // sem vendor reconhecido? mostra o topo por risco
const kev = cveBig.slice(0, 14).map(kevCard);

// Com chave, mas dados incompletos (ex.: HTTP 429): mantém a página anterior em vez de publicar uma versão pela metade.
if (KEY && (!victims.length || details.length < 5)) {
  console.warn(`::warning title=Radar (Vexday)::A API não devolveu dados suficientes (vítimas: ${victims.length}, CVEs detalhados: ${details.length}), provavelmente limite de requisições (HTTP 429; cota da conta: 50/dia e 10/min). A página anterior foi mantida.`);
  process.exit(0);
}
const temDados = KEY && victims.length && kev.length;
const hoje = new Date().toISOString().slice(0, 10);

const CSSV = createHash('sha1').update(readFileSync(join(ROOT, 'styles.css'), 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8); // cache-busting do CSS (ver tools/bump-css.mjs)
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
        <a href="plataformas.html">Plataformas</a>

        <a href="eventos.html">Eventos</a>
        <a href="radar.html" aria-current="page">Radar</a>
        <a href="noticias.html">Notícias</a>
      </div>
    </details>
    <a href="sugestoes.html">Sugestões</a>
  </nav>`;

const painelVic = victims.length
  ? `    <h2 class="rm-h2">Ransomware no Brasil</h2>
    <p class="sec-intro">Organizações brasileiras citadas em leak sites. É <b>menção</b> feita pelo criminoso, não confirmação de ataque.</p>
    <div class="cards">\n${victims.join('\n')}\n    </div>`
  : '';
const painelKev = kev.length
  ? `    <h2 class="rm-h2">Em exploração ativa (KEV) — grandes fornecedores</h2>
    <p class="sec-intro">Vulnerabilidades do catálogo KEV com exploração confirmada, em produtos de fornecedores de grande porte. Priorize a correção.</p>
    <div class="cards">\n${kev.join('\n')}\n    </div>`
  : '';
const placeholder = `    <p class="wip"><span class="wip-dot"></span><b>Radar sendo configurado</b> — adicione o secret <code>CHAVE_VEXDAY</code> no repositório e rode o workflow "Radar".</p>
    <p class="sec-intro">Quando a chave estiver no lugar, esta página passa a mostrar, atualizada automaticamente: <b>ransomware no Brasil</b> e <b>vulnerabilidades em exploração ativa</b> de grandes fornecedores.</p>`;

const CRUMB = `  <p class="crumb"><a href="radar.html">← Radar</a></p>`;

const PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data:; connect-src https://cloudflareinsights.com; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="description" content="Casos de ransomware citados em sites de vazamento no Brasil e vulnerabilidades em exploração ativa (KEV) de grandes fornecedores, via API Vexday.">
<title>Casos e vulnerabilidades · Radar · Cyber Expert Guide</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230a0a0a'/%3E%3Ctext x='16' y='23' font-family='Georgia,serif' font-size='17' font-weight='700' text-anchor='middle' fill='%23cf6a24'%3EJC%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="styles.css?v=${CSSV}">
</head>
<body>
<header class="site">
  <a class="wordmark" href="./">CYBER<span>/</span>EXPERT GUIDE</a>
${NAV}
</header>
<main class="wrap">
${CRUMB}
  <section class="sec-g">
    <p class="eyebrow">Threat intel · segunda tela</p>
    <h1>Casos e vulnerabilidades</h1>
    <p class="sec-intro">O que está acontecendo agora, com foco em <b>Brasil</b> e <b>grandes fornecedores</b>.${temDados ? ` Atualizado automaticamente &middot; última atualização: ${hoje}.` : ' Atualizado automaticamente.'}</p>
${temDados ? painelVic + (painelVic && painelKev ? '\n\n' : '') + painelKev : placeholder}
  </section>
</main>
<footer class="site-foot"><div class="wrap"><p>&copy; 2026 Julio Cataldo. <span class="foot-quote">&ldquo;Dedicated to safeguarding digital frontiers, navigating the cyber realms with resilience, and championing cybersecurity as a cornerstone of our digital future.&rdquo;</span> · <span class="foot-src">Threat intel por <a href="https://vexday.io/" target="_blank" rel="noopener noreferrer">Vexday</a>.</span></p></div></footer>
</body>
</html>
`;
writeFileSync(join(ROOT, 'radar-casos.html'), PAGE);
console.log(`radar-casos.html gerado | chave: ${KEY ? 'sim' : 'NÃO'} | vítimas BR: ${victims.length} | KEV: ${kev.length}`);
