// Garante que o consumo da API Vexday cabe na cota do plano gratuito (50/dia e 10/min, somando as chaves da conta).
// Uso: node tests/validar-vexday.mjs
import { readFileSync } from 'node:fs';
import { criarCliente, LIMITE_DIARIO_CONTA, LIMITE_POR_MINUTO, LIMITE_REQ_PADRAO, MAX_DETALHES, INTERVALO_MS, EXECUCOES_POR_DIA } from '../tools/vexday-lib.mjs';

const erros = [];
const ok = (c, m) => { if (!c) erros.push(m); };

// ambiente falso: relógio virtual (a espera só avança o relógio) e respostas roteirizadas
function ambiente(respostas) {
  let t = 0; const chamadas = [];
  const fetchFn = async url => {
    chamadas.push({ url, t });
    const r = respostas.shift() ?? { status: 200, body: { ok: true } };
    return { status: r.status, ok: r.status >= 200 && r.status < 300, headers: { get: k => (r.headers || {})[k.toLowerCase()] ?? null }, json: async () => r.body ?? {} };
  };
  return { fetchFn, dormir: async ms => { t += ms; }, agora: () => t, chamadas, log: () => {} };
}
const cliente = (amb, extra = {}) => criarCliente({ key: 'k', base: 'https://api.exemplo', ...amb, ...extra });

// 1) nunca mais de 10 chamadas por minuto: intervalo mínimo entre elas
{
  const amb = ambiente([]); const c = cliente(amb);
  for (let i = 0; i < 12; i++) await c.api('/x' + i);
  const gaps = amb.chamadas.slice(1).map((x, i) => x.t - amb.chamadas[i].t);
  ok(gaps.every(g => g >= INTERVALO_MS), 'intervalo entre chamadas menor que ' + INTERVALO_MS + ' ms');
  ok(INTERVALO_MS >= 60000 / LIMITE_POR_MINUTO, 'o intervalo precisa respeitar ' + LIMITE_POR_MINUTO + ' requisições por minuto');
  // em qualquer janela de 60 s cabem no máximo LIMITE_POR_MINUTO chamadas
  const maxJanela = Math.max(...amb.chamadas.map(a => amb.chamadas.filter(b => b.t >= a.t && b.t < a.t + 60000).length));
  ok(maxJanela <= LIMITE_POR_MINUTO, `janela de 60 s com ${maxJanela} chamadas (limite ${LIMITE_POR_MINUTO})`);
}

// 2) orçamento por execução: nunca passa do limite
{
  const amb = ambiente([]); const c = cliente(amb, { limite: 3 });
  const rs = []; for (let i = 0; i < 6; i++) rs.push(await c.api('/x' + i));
  ok(amb.chamadas.length === 3, `com limite 3 deveria chamar 3 vezes, chamou ${amb.chamadas.length}`);
  ok(rs.slice(3).every(r => r === null), 'após o orçamento, as chamadas devem devolver null sem ir à rede');
}

// 3) 429 com Retry-After curto (limite por minuto): espera e repete uma vez
{
  const amb = ambiente([{ status: 429, headers: { 'retry-after': '30' } }, { status: 200, body: { v: 1 } }]); const c = cliente(amb);
  const r = await c.api('/a');
  ok(r && r.v === 1 && amb.chamadas.length === 2, '429 curto: deve repetir uma vez e ter sucesso');
  ok(amb.chamadas[1].t - amb.chamadas[0].t >= 30000, '429 curto: deve esperar o Retry-After');
}

// 4) 429 com Retry-After longo (limite diário): para tudo, sem insistir
{
  const amb = ambiente([{ status: 429, headers: { 'retry-after': '3600' } }]); const c = cliente(amb);
  await c.api('/a'); await c.api('/b'); await c.api('/c');
  ok(amb.chamadas.length === 1, `429 longo: só 1 chamada esperada, houve ${amb.chamadas.length}`);
  ok(c.estado().bloqueado, '429 longo: cliente deve ficar bloqueado');
}

// 5) 429 sem cabeçalho duas vezes: assume cota diária e bloqueia (no máximo 2 chamadas)
{
  const amb = ambiente([{ status: 429 }, { status: 429 }]); const c = cliente(amb);
  await c.api('/a'); await c.api('/b'); await c.api('/c');
  ok(amb.chamadas.length === 2 && c.estado().bloqueado, `2x 429: esperado 2 chamadas e bloqueio, houve ${amb.chamadas.length}`);
}

// 6) erro 5xx: uma repetição; sem chave: nenhuma chamada
{
  const amb = ambiente([{ status: 503 }, { status: 200, body: { v: 2 } }]); const c = cliente(amb);
  const r = await c.api('/a'); ok(r && r.v === 2 && amb.chamadas.length === 2, '5xx: deve repetir uma vez');
  const amb2 = ambiente([]); const c2 = criarCliente({ key: '', base: 'x', ...amb2 }); await c2.api('/a');
  ok(amb2.chamadas.length === 0, 'sem chave não pode chamar a API');
}

// 7) a conta fecha: execuções por dia x orçamento por execução cabe em 50/dia com folga para as outras chaves
const wf = readFileSync(new URL('../.github/workflows/radar.yml', import.meta.url), 'utf8');
const cron = [...wf.matchAll(/cron:\s*'([^']+)'/g)].map(m => m[1]);
ok(cron.length === 1, 'radar.yml deve ter um único agendamento');
if (cron.length === 1) {
  const [min, horas, ...resto] = cron[0].split(' ');
  const porDia = horas.split(',').length * (min.includes(',') ? min.split(',').length : 1);
  ok(resto.join(' ') === '* * *', 'o agendamento deve ser diário (* * *)');
  ok(porDia === EXECUCOES_POR_DIA, `EXECUCOES_POR_DIA (${EXECUCOES_POR_DIA}) não bate com o cron (${porDia}/dia)`);
  const pior = porDia * LIMITE_REQ_PADRAO;
  ok(pior <= LIMITE_DIARIO_CONTA - 15, `pior caso ${pior}/dia deixa menos de 15 requisições de folga para as outras chaves (cota ${LIMITE_DIARIO_CONTA})`);
}
ok(!/^\s*push:/m.test(wf), 'radar.yml não pode ter gatilho por push (cada push gastaria a cota diária)');
ok(1 + 1 + MAX_DETALHES <= LIMITE_REQ_PADRAO, 'o orçamento por run precisa cobrir listas + detalhes');
const gerador = readFileSync(new URL('../tools/build-radar.mjs', import.meta.url), 'utf8');
ok(/criarCliente\(/.test(gerador) && !/await fetch\(/.test(gerador), 'o gerador deve usar o cliente com cota, sem fetch direto');
ok(/details\.length < 5/.test(gerador), 'sem detalhes suficientes o gerador deve manter a página anterior');

if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log(`Vexday: ${LIMITE_REQ_PADRAO} req/run x ${EXECUCOES_POR_DIA} runs = ${LIMITE_REQ_PADRAO * EXECUCOES_POR_DIA}/dia (cota ${LIMITE_DIARIO_CONTA}), 1 chamada a cada ${INTERVALO_MS / 1000}s (limite ${LIMITE_POR_MINUTO}/min)`);
console.log('OK');
