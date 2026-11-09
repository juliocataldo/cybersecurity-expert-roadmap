// Garante que toda página aponta para a versão atual do CSS e dos scripts locais (inclusive teia-data.js).
// Sem isso o navegador usa por 4 horas um arquivo antigo em cache. Se falhar: node tools/bump-css.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { versaoCss, paginas, RE_LINK, RE_SCRIPT, hash } from '../tools/bump-css.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const v = versaoCss(); const erros = []; let n = 0, scripts = 0;
for (const u of paginas()) {
  const nome = u.pathname.split('/').slice(-2).join('/');
  const s = readFileSync(u, 'utf8'); n++;
  const links = [...s.matchAll(RE_LINK)];
  if (!links.length) erros.push(`${nome}: sem link para styles.css`);
  for (const l of links) if (!l[0].endsWith(`?v=${v}"`)) erros.push(`${nome}: CSS desatualizado (rode node tools/bump-css.mjs)`);
  // todo <script src> local precisa ter ?v=<hash do arquivo>
  for (const m of s.matchAll(/<script src="((?:\.\.\/)?)([a-z0-9-]+\.js)(\?v=([0-9a-f]+))?"/g)) {
    scripts++;
    const arq = raiz + m[2];
    if (!existsSync(arq)) { erros.push(`${nome}: script ${m[2]} não existe`); continue; }
    if (!m[4]) erros.push(`${nome}: ${m[2]} sem versão (?v=)`);
    else if (m[4] !== hash(arq)) erros.push(`${nome}: ${m[2]} com versão antiga (rode node tools/bump-css.mjs; para teia-data.js, o gerador da Teia faz isso)`);
  }
}
const teia = readFileSync(raiz + 'teia.html', 'utf8');
if (!/teia-data\.js\?v=[0-9a-f]+/.test(teia)) erros.push('teia.html precisa versionar o teia-data.js (é ele que muda a cada publicação de notas)');
if (!/teia-layout\.js/.test(teia)) erros.push('teia.html precisa carregar o teia-layout.js');
if (erros.length) { console.error('FALHOU:\n- ' + [...new Set(erros)].slice(0, 12).join('\n- ')); process.exit(1); }
console.log(`${n} páginas: CSS v=${v} e ${scripts} scripts locais com a versão atual`); console.log('OK');
