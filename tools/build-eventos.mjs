// Gera eventos.html a partir de tools/eventos-data.mjs. Uso: node tools/build-eventos.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { EVENTOS } from './eventos-data.mjs';

const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LBL = { t: 'Técnico', e: 'Executivo', te: 'Técnico + Executivo' };
const CAT = { t: 'tec', e: 'exe', te: 'tec exe' };
const nT = EVENTOS.filter(e => e[3] !== 'e').length;
const nE = EVENTOS.filter(e => e[3] !== 't').length;

// Região derivada do campo "local". Um evento pode cair em mais de uma (circuitos itinerantes).
const REG = { sp: 'Brasil · SP', br: 'Brasil · Outros estados', us: 'EUA', eu: 'Europa', as: 'Ásia', out: 'Outros países' };
const CIDADES_SP = /São Paulo|Guarujá|Campinas/;
function regioes(local, nome) {
  const r = new Set();
  if (/· BR$/.test(local)) {
    const cidades = local.replace(/ · BR$/, '').split(/, | e /);
    for (const c of cidades) {
      if (/outras|várias/i.test(c)) { r.add('sp'); r.add('br'); }
      else r.add(CIDADES_SP.test(c) ? 'sp' : 'br');
    }
  } else if (/EUA/.test(local)) r.add('us');
  else if (/Europa|Reino Unido/.test(local)) r.add('eu');
  else if (/Singapura/.test(local)) r.add('as');
  else if (/Canadá|Arábia Saudita/.test(local)) r.add('out');
  if (!r.size) throw new Error(`Região não classificada: ${nome} (${local})`);
  return [...r];
}
const regs = EVENTOS.map(e => regioes(e[1], e[0]));
const nReg = k => regs.filter(r => r.includes(k)).length;

const cards = EVENTOS.map(([nome, local, fmt, pub, desc, url], i) => {
  if (!/^https?:\/\//.test(url) || !CAT[pub]) throw new Error('Entrada inválida: ' + nome);
  return `        <a class="card tool" data-cat="${CAT[pub]}" data-reg="${regs[i].join(' ')}" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span class="k">${LBL[pub]} · ${fmt}</span><h3>${esc(nome)}</h3><p>${esc(desc)} <b>Onde:</b> ${esc(local)}.</p></a>`;
}).join('\n');

// Reaproveita o cabeçalho e o rodapé de plataformas.html para manter o layout idêntico.
const base = readFileSync('plataformas.html', 'utf8').replace(/\r\n/g, '\n');
const head = base.slice(0, base.indexOf('<main class="wrap">'))
  .replace(/<meta name="description"[^>]*>/, '<meta name="description" content="Eventos de cibersegurança no Brasil e no mundo, separados por público técnico e executivo, com local e descrição. Confira as datas no site oficial.">')
  .replace(/<title>.*<\/title>/, '<title>Eventos · Cyber Expert Guide</title>')
  .replace(/ aria-current="page"/, '')
  .replace('<a href="eventos.html">Eventos</a>', '<a href="eventos.html" aria-current="page">Eventos</a>');
const foot = base.slice(base.indexOf('</main>'));

const main = `<main class="wrap">
  <section class="sec-g">
    <p class="eyebrow">Onde se conectar</p>
    <h1>Eventos</h1>
    <p class="sec-intro">Conferências, comunidades e encontros de cibersegurança. As <b>datas ficam em aberto de propósito</b>: calendários mudam, edições são remarcadas e algumas só abrem inscrição perto da hora. Use a lista para descobrir o que combina com você e confirme data, preço e programação no site oficial. Escolha o público: <b>técnico</b> (hands-on, pesquisa, comunidade) ou <b>executivo</b> (gestão, risco, governança, mercado). Dá para combinar com a região: Brasil (SP ou outros estados), EUA, Europa, Ásia e demais países.</p>
    <div class="tf" data-tf data-noun="eventos">
      <div class="tools-ctl" hidden>
        <input type="search" placeholder="Buscar (ex.: SOC, Recife, CISO, CTF)" aria-label="Buscar evento" autocomplete="off">
        <div class="chips-f" role="group" aria-label="Filtrar por público">
          <button type="button" class="chip-f" data-f="" aria-pressed="true">Todos (${EVENTOS.length})</button>
          <button type="button" class="chip-f" data-f="tec" aria-pressed="false">Técnico (${nT})</button>
          <button type="button" class="chip-f" data-f="exe" aria-pressed="false">Executivo (${nE})</button>
        </div>
        <div class="chips-f" data-attr="reg" role="group" aria-label="Filtrar por região">
          <button type="button" class="chip-f" data-f="" aria-pressed="true">Todas as regiões</button>
${Object.entries(REG).filter(([k]) => nReg(k)).map(([k, l]) => `          <button type="button" class="chip-f" data-f="${k}" aria-pressed="false">${l} (${nReg(k)})</button>`).join('\n')}
        </div>
        <p class="mut small tf-count" role="status"></p>
      </div>
      <div class="cards tools">
${cards}
      </div>
      <p class="mut small tf-empty" hidden>Nada encontrado. Tente outra palavra ou o público "Todos".</p>
    </div>
    <p class="note">Lista inspirada no <a href="https://github.com/marianabsctba/Mapa_Eventos_Ciber" target="_blank" rel="noopener noreferrer">Mapa de Eventos de Cyber</a>, reescrita e classificada por público. Faltou algum? Sugira em <a href="sugestoes.html">Sugestões</a>. Os links levam a sites externos; confira o endereço antes de comprar ingresso.</p>
  </section>
`;
writeFileSync('eventos.html', head + main + foot);
console.log(`eventos.html: ${EVENTOS.length} eventos (${nT} técnico, ${nE} executivo)`);
console.log('regiões: ' + Object.entries(REG).map(([k, l]) => `${l} ${nReg(k)}`).join(' · '));
