// Todo link interno (href relativo) de todas as páginas precisa apontar para um arquivo que existe e, se tiver
// âncora, para um id que existe na página de destino. Offline e rápido: roda junto com os outros testes.
// Uso: node tests/validar-links-internos.mjs
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative, dirname, join, normalize } from 'node:path';
import { paginas } from '../tools/bump-css.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const erros = [];
const ids = new Map(); // arquivo -> Set de ids (lido sob demanda)
const idsDe = arq => {
  if (!ids.has(arq)) ids.set(arq, new Set([...readFileSync(arq, 'utf8').matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
  return ids.get(arq);
};

const FASES = new Set([...readFileSync(join(RAIZ, 'trilha.js'), 'utf8').matchAll(/\{ id: '(F\d{2})'/g)].map(m => m[1]));
let n = 0;
for (const u of paginas()) {
  const arq = fileURLToPath(u);
  const nome = relative(RAIZ, arq).replace(/\\/g, '/');
  if (nome === '404.html') continue; // links absolutos de propósito (ver tests/validar-seo.mjs)
  const html = readFileSync(arq, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  for (const [, href] of html.matchAll(/\shref="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|\/\/|data:)/i.test(href)) continue; // externo, mailto, data:
    n++;
    const [caminho, ancora] = href.split('#');
    let alvo = caminho ? normalize(join(dirname(arq), decodeURIComponent(caminho.split('?')[0]))) : arq;
    if (existsSync(alvo) && statSync(alvo).isDirectory()) alvo = join(alvo, 'index.html');
    if (!alvo.startsWith(RAIZ) || !existsSync(alvo)) { erros.push(`${nome}: link para arquivo inexistente "${href}"`); continue; }
    // trilha.html#F05 abre a fase pelo app.js (âncora dinâmica): vale se a fase existe no trilha.js
    if (ancora && alvo.endsWith('trilha.html') && /^F\d{2}$/.test(ancora)) { if (!FASES.has(ancora)) erros.push(`${nome}: fase inexistente "${href}"`); continue; }
    if (ancora && alvo.endsWith('.html') && !idsDe(alvo).has(ancora)) erros.push(`${nome}: âncora inexistente "${href}"`);
  }
}

if (erros.length) { console.error(`FALHOU (${erros.length}):\n- ` + erros.join('\n- ')); process.exit(1); }
console.log(`Links internos: ${n} links conferidos em todas as páginas, nenhum quebrado`);
console.log('OK');
