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
