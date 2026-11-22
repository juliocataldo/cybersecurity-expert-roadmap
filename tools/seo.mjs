// Aplica o bloco de SEO (canonical e Open Graph) em todas as páginas e gera o sitemap.xml.
// Rode depois de criar ou renomear uma página, ou de mudar um <title>/description:
//   node tools/seo.mjs        (idempotente; tests/validar-seo.mjs avisa se esquecer)
// O Action das notas roda este script a cada build, porque notas e artigos entram e saem do site.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { paginas } from './bump-css.mjs';
import { aplicarSeo, foraDoIndice, gerarSitemap } from './seo-lib.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
let n = 0;
const indexaveis = [];
for (const u of paginas()) {
  const caminho = relative(RAIZ, fileURLToPath(u)).replace(/\\/g, '/');
  const s = readFileSync(u, 'utf8');
  const novo = aplicarSeo(s, caminho);
  if (novo !== s) { writeFileSync(u, novo); n++; }
  if (!foraDoIndice(novo, caminho)) indexaveis.push(caminho);
}
writeFileSync(new URL('../sitemap.xml', import.meta.url), gerarSitemap(indexaveis));
console.log(`SEO: ${n} página(s) atualizada(s) | sitemap.xml com ${indexaveis.length} página(s)`);
