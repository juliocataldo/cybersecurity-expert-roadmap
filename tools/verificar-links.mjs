// Verifica os links externos do site (páginas, trilha e checklist). Roda toda semana pelo Action links.yml.
// Por quê: são centenas de links para ferramentas, cursos e labs, e eles quebram sem aviso.
// Classifica cada link em: ok, bloqueado (o site recusa robôs: 401/403/429/999, não é falha nossa) e quebrado
// (404/410, ou o nome não tem mais endereço no DNS). Só "quebrado" faz o Action falhar (e o GitHub avisa por e-mail).
// Erro de rede ou 5xx ganha uma segunda tentativa e, se persistir, vira "instável" (aviso, não falha).
// Ficam de fora as notas da Teia (são o caderno de estudos, com muitos links de terceiros).
// Uso: node tools/verificar-links.mjs   (escreve o resumo em $GITHUB_STEP_SUMMARY quando roda no Action)
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { paginas } from './bump-css.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const IGNORAR = /^https?:\/\/(?:[^/]*\.)?(?:example\.(?:com|org|net)|exemplo\.com(?:\.br)?|localhost|127\.0\.0\.1)(?:[/:?#]|$)/i;

// url -> páginas onde aparece
const onde = new Map();
const anotar = (url, fonte) => { if (IGNORAR.test(url)) return; if (!onde.has(url)) onde.set(url, new Set()); onde.get(url).add(fonte); };
for (const u of paginas()) {
  const nome = relative(RAIZ, fileURLToPath(u)).replace(/\\/g, '/');
  if (nome.startsWith('notas/')) continue;
  const html = readFileSync(u, 'utf8').replace(/<!-- seo -->[\s\S]*?<!-- \/seo -->/, '');
  for (const [, href] of html.matchAll(/\shref="(https?:\/\/[^"]+)"/g)) anotar(href.replace(/&amp;/g, '&'), nome);
}
for (const js of ['trilha.js', 'checklist.js']) {
  if (!existsSync(RAIZ + js)) continue;
  for (const [, url] of readFileSync(RAIZ + js, 'utf8').matchAll(/['"](https?:\/\/[^'"\s]+)['"]/g)) anotar(url, js);
}

const UA = 'Mozilla/5.0 (compatible; juliocataldo.dev link-check; +https://www.juliocataldo.dev)';
async function testar(url) {
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
      r.body?.cancel().catch(() => {});
      if (r.status < 400) return { estado: 'ok', status: r.status };
      if ([401, 403, 429, 999].includes(r.status)) return { estado: 'bloqueado', status: r.status };
      if ([404, 410].includes(r.status)) return { estado: 'quebrado', status: r.status };
      if (tentativa === 2) return { estado: 'instável', status: r.status };
    } catch (e) {
      const causa = e.cause?.code || e.name;
      if (causa === 'ENOTFOUND') return { estado: 'quebrado', status: 'sem endereço no DNS' };
      if (tentativa === 2) return { estado: 'instável', status: causa };
    } finally { clearTimeout(t); }
    await new Promise(r => setTimeout(r, 3000));
  }
}

// poucas conexões por vez, para não parecer ataque a nenhum site
const urls = [...onde.keys()].sort();
const res = new Map();
let i = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (i < urls.length) { const u = urls[i++]; res.set(u, await testar(u)); } }));

const por = estado => urls.filter(u => res.get(u).estado === estado);
const linha = u => `- ${u} (${res.get(u).status}) em ${[...onde.get(u)].sort().join(', ')}`;
const quebrados = por('quebrado'), instaveis = por('instável'), bloqueados = por('bloqueado');
const resumo = [
  `## Links externos: ${urls.length} verificados`,
  `ok: ${por('ok').length} · bloqueiam robôs: ${bloqueados.length} · instáveis: ${instaveis.length} · **quebrados: ${quebrados.length}**`,
  quebrados.length ? `\n### Quebrados (corrigir ou remover)\n${quebrados.map(linha).join('\n')}` : '',
  instaveis.length ? `\n### Instáveis (erro de rede ou 5xx duas vezes; conferir à mão)\n${instaveis.map(linha).join('\n')}` : '',
].filter(Boolean).join('\n') + '\n';
console.log(resumo);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumo);
process.exit(quebrados.length ? 1 : 0);
