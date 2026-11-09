// Garante que toda página tem a mesma CSP, sem 'unsafe-inline' nem 'unsafe-eval', e que só o Cloudflare Web Analytics foi liberado.
// Uso: node tests/validar-csp.mjs
import { readFileSync } from 'node:fs';
import { paginas } from '../tools/bump-css.mjs';

const ESPERADA = "default-src 'none'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data:; connect-src https://cloudflareinsights.com; base-uri 'none'; form-action 'none'";
const erros = []; let n = 0;
for (const u of paginas()) {
  const nome = u.pathname.split('/').slice(-2).join('/');
  const m = readFileSync(u, 'utf8').match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/);
  n++;
  if (!m) { erros.push(`${nome}: sem CSP`); continue; }
  if (/unsafe-(inline|eval)/.test(m[1])) erros.push(`${nome}: CSP com unsafe-inline/unsafe-eval`);
  if (m[1] !== ESPERADA) erros.push(`${nome}: CSP diferente da esperada`);
}
for (const g of ['tools/build-notas.mjs', 'tools/build-radar.mjs', 'tools/build-radar-brasil.mjs', 'tools/build-noticias.mjs']) {
  if (!readFileSync(new URL('../' + g, import.meta.url), 'utf8').includes(ESPERADA)) erros.push(`${g}: gerador com CSP diferente (as páginas geradas perderiam a liberação)`);
}
if (erros.length) { console.error('FALHOU:\n- ' + [...new Set(erros)].slice(0, 12).join('\n- ')); process.exit(1); }
console.log(`${n} páginas e 4 geradores com a mesma CSP, sem unsafe-*`);
console.log('OK');
