// Versiona o CSS nos links de todas as páginas: href="styles.css?v=<hash do arquivo>".
// Por quê: o servidor deixa o styles.css em cache por horas; sem versão, quem já visitou vê a página nova
// com o CSS antigo (mapas pretos, abas empilhadas). Rode depois de mexer em styles.css:
//   node tools/bump-css.mjs        (idempotente; o teste tests/validar-css-versao.mjs avisa se esquecer)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const versaoCss = () => createHash('sha1').update(readFileSync(new URL('../styles.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8);
export const RE_LINK = /href="((?:\.\.\/)?)styles\.css(?:\?v=[0-9a-f]+)?"/g;

export function paginas() {
  const raiz = new URL('..', import.meta.url);
  const lista = readdirSync(raiz).filter(f => f.endsWith('.html')).map(f => new URL(f, raiz));
  return lista.concat(readdirSync(new URL('notas/', raiz)).filter(f => f.endsWith('.html')).map(f => new URL('notas/' + f, raiz)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const v = versaoCss();
  let n = 0;
  for (const u of paginas()) {
    const s = readFileSync(u, 'utf8');
    const novo = s.replace(RE_LINK, (_, up) => `href="${up}styles.css?v=${v}"`);
    if (novo !== s) { writeFileSync(u, novo); n++; }
  }
  console.log(`styles.css v=${v}: ${n} página(s) atualizada(s)`);
}
