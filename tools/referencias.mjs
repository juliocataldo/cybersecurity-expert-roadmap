// Gera tools/data/referencias.json: população e PIB por país (Banco Mundial, CC BY 4.0) + lista de países válidos.
// Roda uma vez por ano (ou quando quiser atualizar): node tools/referencias.mjs   (precisa de tools/data/mapa-mundo.json)
import { readFileSync, writeFileSync } from 'node:fs';
const H = { 'user-agent': 'cyber-expert-guide' };
const j = async u => (await fetch(u, { headers: H, signal: AbortSignal.timeout(60000) })).json();
const mapa = JSON.parse(readFileSync(new URL('./data/mapa-mundo.json', import.meta.url), 'utf8'));
const WB = 'https://api.worldbank.org/v2/';
const paises = (await j(WB + 'country?format=json&per_page=400'))[1].filter(c => c.region.id !== 'NA' && /^[A-Z]{2}$/.test(c.iso2Code)); // sem agregados regionais
const pop = (await j(WB + 'country/all/indicator/SP.POP.TOTL?format=json&per_page=400&mrnev=1'))[1];
const pib = (await j(WB + 'country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=400&mrnev=1'))[1];
const nomePt = (c, en) => { try { const n = new Intl.DisplayNames('pt-BR', { type: 'region' }).of(c); return n && n !== c ? n : en; } catch { return en; } };
const out = { atualizado: new Date().toISOString().slice(0, 10), fonte: 'Banco Mundial (CC BY 4.0): SP.POP.TOTL e NY.GDP.MKTP.CD, último valor disponível', paises: {}, populacao: {}, pib: {} };
for (const c of paises) out.paises[c.iso2Code] = { iso3: c.id, nome: nomePt(c.iso2Code, c.name) };
for (const [c, p] of Object.entries(mapa.paises)) if (!out.paises[c]) out.paises[c] = { iso3: p.iso3, nome: nomePt(c, p.nomeEn) }; // ex.: Kosovo
const porIso3 = new Map(Object.entries(out.paises).map(([k, v]) => [v.iso3, k]));
for (const r of pop) { const k = porIso3.get(r.countryiso3code); if (k && r.value) out.populacao[k] = { v: r.value, ano: r.date }; }
for (const r of pib) { const k = porIso3.get(r.countryiso3code); if (k && r.value) out.pib[k] = { v: Math.round(r.value), ano: r.date }; }
writeFileSync(new URL('./data/referencias.json', import.meta.url), JSON.stringify(out) + '\n');
console.log('referencias.json:', Object.keys(out.paises).length, 'países |', Object.keys(out.populacao).length, 'com população |', Object.keys(out.pib).length, 'com PIB | BR:', JSON.stringify(out.populacao.BR), out.paises.BR.nome);
