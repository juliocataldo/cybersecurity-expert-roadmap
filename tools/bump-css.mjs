// Versiona o CSS e os scripts locais nos links de todas as páginas: styles.css?v=<hash>, guia.js?v=<hash>, teia-data.js?v=<hash>...
// Por quê: o servidor deixa esses arquivos em cache por 4 horas; sem versão, quem já visitou vê a página nova com o CSS,
// o script ou os DADOS antigos (mapas pretos; Teia com as notas de exemplo apontando para páginas que não existem mais).
// Rode depois de mexer em styles.css ou em qualquer .js:
//   node tools/bump-css.mjs        (idempotente; o teste tests/validar-css-versao.mjs avisa se esquecer)
// O gerador da Teia (build-notas.mjs) chama versionar() sozinho quando o teia-data.js muda.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

/** Hash do conteúdo com finais de linha normalizados (igual no Windows e no Linux). */
export const hash = arquivo => createHash('sha1').update(readFileSync(arquivo, 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8);
export const versaoCss = () => hash(RAIZ + 'styles.css');
export const RE_LINK = /href="((?:\.\.\/)?)styles\.css(?:\?v=[0-9a-f]+)?"/g;
export const RE_SCRIPT = /(<script src=")((?:\.\.\/)?)([a-z0-9-]+\.js)(?:\?v=[0-9a-f]+)?(")/g;

/** Reescreve os links de CSS e de scripts locais com o hash atual de cada arquivo. */
export function versionar(html, raiz = RAIZ) {
  return html
    .replace(RE_LINK, (_, up) => `href="${up}styles.css?v=${hash(raiz + 'styles.css')}"`)
    .replace(RE_SCRIPT, (m, a, up, nome, z) => (existsSync(raiz + nome) ? `${a}${up}${nome}?v=${hash(raiz + nome)}${z}` : m));
}

export function paginas() {
  const raiz = new URL('..', import.meta.url);
  const lista = readdirSync(raiz).filter(f => f.endsWith('.html')).map(f => new URL(f, raiz));
  return lista.concat(readdirSync(new URL('notas/', raiz)).filter(f => f.endsWith('.html')).map(f => new URL('notas/' + f, raiz)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let n = 0;
  for (const u of paginas()) {
    const s = readFileSync(u, 'utf8');
    const novo = versionar(s);
    if (novo !== s) { writeFileSync(u, novo); n++; }
  }
  console.log(`styles.css v=${versaoCss()}: ${n} página(s) atualizada(s) (CSS e scripts)`);
}
