// Gera busca-data.js (o índice da busca do site) e atualiza a versão dele nas páginas que o carregam.
// Rode depois de mudar páginas, o glossário, a trilha ou as notas (o Action das notas roda sozinho):
//   node tools/build-busca.mjs      (tests/validar-busca.mjs avisa se o índice estiver desatualizado)
import { readFileSync, writeFileSync } from 'node:fs';
import { montarIndice, conteudoIndice } from './busca-lib.mjs';
import { versionar } from './bump-css.mjs';

const indice = montarIndice();
writeFileSync(new URL('../busca-data.js', import.meta.url), conteudoIndice(indice));
for (const p of ['busca.html']) {
  const u = new URL('../' + p, import.meta.url);
  const h = readFileSync(u, 'utf8'); const n = versionar(h); if (n !== h) writeFileSync(u, n);
}
const tipos = indice.reduce((a, e) => (a[e.k] = (a[e.k] || 0) + 1, a), {});
console.log(`busca-data.js: ${indice.length} entradas | ${Object.entries(tipos).map(([k, v]) => `${k}: ${v}`).join(' | ')}`);
