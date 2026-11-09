// Cliente da API Vexday que respeita a cota do plano gratuito, que é da CONTA (soma de todas as chaves):
//   50 requisições por dia e 10 por minuto.
// Regras: orçamento fixo de requisições por execução, intervalo mínimo entre chamadas, e parar de chamar
// assim que a API indicar o limite. Sem dependências; fetch, relógio e espera são injetáveis (testes).

export const LIMITE_DIARIO_CONTA = 50;     // plano gratuito, somando as chaves
export const LIMITE_POR_MINUTO = 10;
export const LIMITE_REQ_PADRAO = 14;       // por execução: 1 (vítimas) + 1 (lista KEV) + até 10 detalhes + 2 de folga para repetição
export const MAX_DETALHES = 10;
export const INTERVALO_MS = 7000;          // 10/min = 1 a cada 6 s; 7 s dá folga
export const EXECUCOES_POR_DIA = 2;        // deve bater com o cron de .github/workflows/radar.yml (testado)

export function criarCliente({
  key, base, fetchFn = fetch, dormir = ms => new Promise(r => setTimeout(r, ms)), agora = Date.now,
  limite = LIMITE_REQ_PADRAO, intervaloMs = INTERVALO_MS, esperaMaxMs = 60000, log = console.error,
}) {
  let usadas = 0, bloqueado = false, ultima = -Infinity;

  async function api(path) {
    if (!key || bloqueado) return null;
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      if (usadas >= limite) { log(`Vexday: orçamento de ${limite} requisições deste run esgotado`); return null; }
      const falta = ultima + intervaloMs - agora();
      if (falta > 0) await dormir(falta);                       // nunca mais de 1 chamada por intervalo
      usadas++; ultima = agora();
      let res;
      try { res = await fetchFn(base + path, { headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' } }); }
      catch (e) { log('Vexday erro', path, e.message); return null; }

      if (res.status === 429) {
        const ra = Number(res.headers.get('retry-after'));
        const temRa = Number.isFinite(ra) && ra > 0;
        log('Vexday', path, '-> 429');
        // limite por minuto: espera uma vez e repete. Retry-After longo (ou 2º 429) = limite diário: para tudo.
        if (tentativa === 1 && (!temRa || ra * 1000 <= esperaMaxMs)) { await dormir((temRa ? ra * 1000 : 65000) + 500); continue; }
        bloqueado = true;
        log('Vexday: limite de requisições atingido (provavelmente o diário); sem mais chamadas neste run');
        return null;
      }
      if (res.status >= 500) { if (tentativa === 1) { await dormir(10000); continue; } return null; }
      if (!res.ok) { log('Vexday', path, '->', res.status); return null; }
      try { return await res.json(); } catch { return null; }
    }
    return null;
  }
  return { api, estado: () => ({ usadas, bloqueado, limite }) };
}
