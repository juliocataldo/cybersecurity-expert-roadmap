// Garante que toda página aponta para a versão atual do CSS (evita cache antigo no navegador).
// Uso: node tests/validar-css-versao.mjs   (se falhar: node tools/bump-css.mjs)
import { readFileSync } from 'node:fs';
import { versaoCss, paginas, RE_LINK } from '../tools/bump-css.mjs';
const v = versaoCss(); const erros = []; let n = 0;
for (const u of paginas()) {
  const s = readFileSync(u, 'utf8'); const links = [...s.matchAll(RE_LINK)]; n++;
  if (!links.length) { erros.push(`${u.pathname.split('/').pop()}: sem link para styles.css`); continue; }
  for (const l of links) if (!l[0].endsWith(`?v=${v}"`)) erros.push(`${u.pathname.split('/').pop()}: CSS desatualizado (rode node tools/bump-css.mjs)`);
}
if (erros.length) { console.error('FALHOU:\n- ' + [...new Set(erros)].slice(0, 12).join('\n- ')); process.exit(1); }
console.log(`${n} páginas apontam para styles.css?v=${v}`); console.log('OK');
