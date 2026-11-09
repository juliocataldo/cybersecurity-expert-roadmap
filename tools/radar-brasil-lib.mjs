// Núcleo do Radar Brasil: agrega alegações de ransomware e aplica a "trava" de publicação.
// Sem dependências. O dado bruto (nome de vítima, site) só existe em memória: daqui sai apenas número agregado.

export const K = 3; // recortes com menos de K casos são somados em "Outros" ou omitidos
export const OUTROS_SETOR = 'Outros / não classificado';
export const OUTROS_GRUPOS = 'Outros grupos';

const SETORES = {
  'Manufacturing': 'Indústria',
  'Healthcare': 'Saúde',
  'Government & Defense': 'Governo e defesa',
  'Technology': 'Tecnologia',
  'Financial Services': 'Serviços financeiros',
  'Retail & E-Commerce': 'Varejo e e-commerce',
  'Professional Services': 'Serviços profissionais',
  'Agriculture and Food Production': 'Agro e alimentos',
  'Education': 'Educação',
  'Transportation': 'Transporte e logística',
  'Energy & Utilities': 'Energia e utilidades',
  'Hospitality': 'Hotelaria e turismo',
};
export const SETORES_PT = new Set([...Object.values(SETORES), OUTROS_SETOR]);

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const FORMATO_ANO = /^\d{4}$/;

/** Reduz cada alegação do Brasil a {mes, ano, setor, grupo}. O resto (nome, site, descrição) é descartado aqui. */
export function normalizar(victims, gruposConhecidos) {
  const canon = new Map(gruposConhecidos.map(n => [String(n).toLowerCase(), n]));
  const out = [];
  for (const v of victims) {
    if (!v || v.country !== 'BR') continue;
    const data = String(v.discovered || v.published || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;
    out.push({
      mes: data.slice(0, 7),
      ano: data.slice(0, 4),
      setor: SETORES[v.activity] || OUTROS_SETOR,
      grupo: canon.get(String(v.group_name || '').toLowerCase()) || null, // grupo fora do groups.json não é publicado
    });
  }
  return out;
}

const contar = (arr, chave) => { const m = new Map(); for (const x of arr) { const k = chave(x); m.set(k, (m.get(k) || 0) + 1); } return m; };

/** Soma recortes pequenos em "outros" para respeitar K. */
function comOutros(mapa, rotuloOutros, k = K) {
  const itens = []; let outros = 0;
  for (const [nome, n] of mapa) { if (nome !== rotuloOutros && n >= k) itens.push({ nome, n }); else outros += n; }
  itens.sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome, 'pt'));
  if (outros >= k) itens.push({ nome: rotuloOutros, n: outros });
  return itens;
}

export function agregar(registros, { hoje = new Date(), janelaMeses = 24, topGrupos = 10, k = K } = {}) {
  const total = registros.length;
  // série mensal contínua (meses sem caso aparecem com 0)
  const porMesMap = contar(registros, r => r.mes);
  const meses = [];
  const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
  for (let i = janelaMeses - 1; i >= 0; i--) {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    const mes = `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}`;
    meses.push({ mes, n: porMesMap.get(mes) || 0 });
  }
  const ultimos12 = meses.slice(-12).reduce((a, m) => a + m.n, 0);

  // por ano: anos com poucos casos entram em "Antes de <primeiro ano com volume>"
  const porAnoMap = contar(registros, r => r.ano);
  const anos = [...porAnoMap.keys()].sort();
  const porAno = []; let antes = 0; let corte = null;
  for (const a of anos) {
    const n = porAnoMap.get(a);
    if (n < k * 10 && corte === null) { antes += n; continue; }
    if (corte === null) corte = a;
    porAno.push({ nome: a, n });
  }
  const antesDe = corte;

  const porSetor = comOutros(contar(registros, r => r.setor), OUTROS_SETOR, k);
  const comGrupo = registros.filter(r => r.grupo);
  const grupoMap = contar(comGrupo, r => r.grupo);
  const gruposOrd = [...grupoMap].filter(([, n]) => n >= k).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = gruposOrd.slice(0, topGrupos).map(([nome, n]) => ({ nome, n }));
  const restante = total - top.reduce((a, g) => a + g.n, 0);
  if (restante >= k) top.push({ nome: OUTROS_GRUPOS, n: restante });

  return {
    total, ultimos12,
    gruposDistintos: gruposOrd.length,
    meses, porAno, antesDe: antes >= k ? { ate: antesDe, n: antes } : null,
    porSetor, porGrupo: top,
  };
}

/** A trava: só sai texto autorizado e recorte com K casos ou mais. Lança erro (e o build aborta) se algo escapar. */
export function travaSaida(ag, { gruposPermitidos, k = K }) {
  const erros = [];
  const grupos = new Set([...gruposPermitidos, OUTROS_GRUPOS]);
  for (const m of ag.meses) if (!FORMATO_MES.test(m.mes)) erros.push('mês fora do formato');
  for (const a of ag.porAno) if (!FORMATO_ANO.test(a.nome)) erros.push('ano fora do formato');
  for (const s of ag.porSetor) {
    if (!SETORES_PT.has(s.nome)) erros.push('setor desconhecido na saída');
    if (s.n < k) erros.push('setor com menos de K casos');
  }
  for (const g of ag.porGrupo) {
    if (!grupos.has(g.nome)) erros.push('grupo desconhecido na saída');
    if (g.n < k) erros.push('grupo com menos de K casos');
  }
  if (ag.antesDe && ag.antesDe.n < k) erros.push('recorte "antes de" com menos de K casos');
  const soma = ag.porSetor.reduce((a, s) => a + s.n, 0);
  if (soma > ag.total) erros.push('soma dos setores maior que o total');
  if (erros.length) throw new Error('Publicação barrada pela trava:\n- ' + [...new Set(erros)].join('\n- '));
}

/** Confere se a fonte veio inteira antes de publicar. */
export function validarFonte(victims, registros, totalAnterior = 0) {
  const erros = [];
  if (!Array.isArray(victims) || victims.length < 20000) erros.push('fonte cortada: poucos registros no total');
  if (registros.length < 300) erros.push('fonte cortada: poucos registros do Brasil');
  if (totalAnterior && registros.length < totalAnterior * 0.9) erros.push('total do Brasil caiu mais de 10% em relação ao dia anterior');
  if (erros.length) throw new Error('Fonte rejeitada:\n- ' + erros.join('\n- '));
}

/** ANPD: confere se os números transcritos fecham entre si. */
export function validarAnpd(a) {
  const erros = [];
  const somaUF = a.estados.reduce((s, e) => s + e.total, 0) + a.foraDasUF.reduce((s, e) => s + e.total, 0);
  const somaAnos = a.anos.reduce((s, x) => s + x.incidentes, 0);
  const rswUF = a.estados.reduce((s, e) => s + e.ransomware, 0) + a.foraDasUF.reduce((s, e) => s + e.ransomware, 0);
  const rswAnos = a.anos.reduce((s, x) => s + x.ransomware, 0);
  if (somaUF !== a.total) erros.push(`soma por estado (${somaUF}) ≠ total (${a.total})`);
  if (somaAnos !== a.total) erros.push(`soma por ano (${somaAnos}) ≠ total (${a.total})`);
  if (rswUF !== a.ransomware) erros.push(`ransomware por estado (${rswUF}) ≠ total (${a.ransomware})`);
  if (rswAnos !== a.ransomware) erros.push(`ransomware por ano (${rswAnos}) ≠ total (${a.ransomware})`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.atualizado)) erros.push('campo "atualizado" deve ser AAAA-MM-DD');
  const ufs = new Set(); for (const e of a.estados) { if (ufs.has(e.uf)) erros.push('UF repetida: ' + e.uf); ufs.add(e.uf); if (e.ransomware > e.total) erros.push(`${e.uf}: ransomware maior que o total`); }
  return erros;
}

/* ======================= Mundo ======================= */
export const MIN_TAXA = 10; // taxa por habitante/PIB só com 10+ casos (país pequeno com 3 casos distorce)

/** Como normalizar(), mas para todos os países: {pais, mes, ano, setor, grupo}. */
export function normalizarMundo(victims, gruposConhecidos) {
  const canon = new Map(gruposConhecidos.map(n => [String(n).toLowerCase(), n]));
  const out = [];
  for (const v of victims) {
    const pais = String((v && v.country) || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(pais)) continue;
    const data = String(v.discovered || v.published || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;
    out.push({
      pais, mes: data.slice(0, 7), ano: data.slice(0, 4),
      setor: SETORES[v.activity] || OUTROS_SETOR,
      grupo: canon.get(String(v.group_name || '').toLowerCase()) || null,
    });
  }
  return out;
}

/** Contagem por país (total e últimos 12 meses). País com menos de K casos é somado em "outros". */
export function agregarPaises(regs, { hoje = new Date(), k = K, paisesPermitidos = null } = {}) {
  const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 11, 1));
  const corte = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  const todos = new Map(), m12 = new Map();
  for (const r of regs) { todos.set(r.pais, (todos.get(r.pais) || 0) + 1); if (r.mes >= corte) m12.set(r.pais, (m12.get(r.pais) || 0) + 1); }
  const paises = []; let outrosPaises = 0, outrosCasos = 0;
  for (const [pais, n] of todos) {
    if (paisesPermitidos && !paisesPermitidos.has(pais)) { outrosPaises++; outrosCasos += n; continue; } // território fora da lista: não é publicado
    if (n >= k) paises.push({ pais, todos: n, m12: (m12.get(pais) || 0) >= k ? m12.get(pais) : null });
    else { outrosPaises++; outrosCasos += n; }
  }
  paises.sort((a, b) => b.todos - a.todos || a.pais.localeCompare(b.pais));
  return { paises, outrosPaises, outrosCasos, total: regs.length };
}

export function travaPaises(ap, { paisesPermitidos, k = K }) {
  const ok = paisesPermitidos instanceof Set ? paisesPermitidos : new Set(paisesPermitidos);
  const erros = [];
  for (const p of ap.paises) {
    if (!/^[A-Z]{2}$/.test(p.pais) || !ok.has(p.pais)) erros.push('país desconhecido na saída');
    if (p.todos < k) erros.push('país com menos de K casos');
    if (p.m12 !== null && p.m12 < k) erros.push('país (12 meses) com menos de K casos');
  }
  const soma = ap.paises.reduce((a, p) => a + p.todos, 0) + ap.outrosCasos;
  if (soma !== ap.total) erros.push('soma dos países não fecha com o total');
  if (erros.length) throw new Error('Publicação barrada pela trava (países):\n- ' + [...new Set(erros)].join('\n- '));
}

/** Taxa por base (habitantes/PIB). null quando faltam dados ou há menos de MIN_TAXA casos. */
export function taxa(casos, base, fator = 1) {
  if (!casos || casos < MIN_TAXA || !base || base <= 0) return null;
  return casos / base * fator;
}

/** Limites dos 5 intervalos do mapa (quintis dos valores positivos), arredondados. */
export function limitesQuintis(valores) {
  const v = valores.filter(x => x > 0).sort((a, b) => a - b);
  if (v.length < 5) return [];
  const q = p => v[Math.min(v.length - 1, Math.floor(p * v.length))];
  const arred = x => { const e = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / e) * e; };
  const lim = [q(.2), q(.4), q(.6), q(.8)].map(arred);
  return [...new Set(lim)].sort((a, b) => a - b);
}
export const faixaDe = (valor, limites) => { let i = 0; while (i < limites.length && valor >= limites[i]) i++; return i + 1; }; // 1..limites.length+1

/* ---------- Matrizes BushidoUK (CC BY 4.0): ferramentas e CVEs usados por grupos ---------- */
const limpaGrupo = g => g.replace(/[*+]/g, '').replace(/\[\.\]/g, '.').trim();
const celulas = l => l.split('|').slice(1, -1).map(c => c.trim());
export function lerMatrizFerramentas(md) {
  const out = [];
  for (const l of md.split('\n')) {
    if (!l.startsWith('|')) continue;
    const c = celulas(l); if (c.length < 2 || /^-+$/.test(c[0]) || /^Tool Name$/i.test(c[0])) continue;
    const grupos = [...new Set(c[1].split(/[,/]/).map(limpaGrupo).filter(Boolean))];
    out.push({ nome: c[0].replace(/\[\.\]/g, '.').replace(/[*`]/g, '').trim(), grupos });
  }
  return out;
}
export function lerMatrizCves(md) {
  const out = [];
  for (const l of md.split('\n')) {
    if (!l.startsWith('|')) continue;
    const c = celulas(l); if (c.length < 3 || /^-+$/.test(c[0]) || /^Product$/i.test(c[0])) continue;
    const cves = c[1].match(/CVE-\d{4}-\d{4,7}/g) || [];
    const grupos = [...new Set(c[2].split(/[,/]/).map(limpaGrupo).filter(Boolean))];
    for (const cve of cves) out.push({ cve, produto: c[0].replace(/[*`]/g, '').trim(), grupos });
  }
  return out;
}
/** Ranking por número de grupos distintos que usam o item (itens repetidos entre arquivos são unidos). */
export function topMatriz(itens, chave, n = 12) {
  const m = new Map();
  for (const it of itens) { const k = it[chave]; const e = m.get(k) || { nome: k, produto: it.produto, grupos: new Set() }; it.grupos.forEach(g => e.grupos.add(g.toLowerCase())); m.set(k, e); }
  return [...m.values()].map(e => ({ nome: e.nome, produto: e.produto, n: e.grupos.size })).filter(e => e.n >= 2)
    .sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome)).slice(0, n);
}
const TEXTO_OK = /^[\p{L}\p{N} .\-_/()&+@:#,']{1,60}$/u;
export function travaMatriz(ferramentas, cves) {
  const erros = [];
  for (const f of ferramentas) { if (!TEXTO_OK.test(f.nome)) erros.push('nome de ferramenta fora do padrão'); if (!(f.n >= 2)) erros.push('ferramenta com menos de 2 grupos'); }
  for (const c of cves) { if (!/^CVE-\d{4}-\d{4,7}$/.test(c.nome)) erros.push('CVE fora do formato'); if (c.produto && !TEXTO_OK.test(c.produto)) erros.push('produto fora do padrão'); }
  if (erros.length) throw new Error('Publicação barrada pela trava (matrizes):\n- ' + [...new Set(erros)].join('\n- '));
}

/** Quantas alegações vêm sem país informado (ficam fora dos mapas e rankings). */
export const contarSemPais = victims => victims.reduce((a, v) => a + (/^[A-Za-z]{2}$/.test(String((v && v.country) || '')) ? 0 : 1), 0);
