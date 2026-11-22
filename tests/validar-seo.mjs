// Garante canonical e Open Graph corretos em todas as páginas, o sitemap.xml em dia, o robots.txt, a 404 e que os
// geradores aplicam o bloco de SEO (senão o próximo build do Action apagaria o preview da página).
// Uso: node tests/validar-seo.mjs   (se falhar depois de mexer numa página: node tools/seo.mjs)
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { paginas } from '../tools/bump-css.mjs';
import { blocoSeo, foraDoIndice, gerarSitemap, urlDe, OG_IMAGEM } from '../tools/seo-lib.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const erros = [];
const ok = (c, m) => { if (!c) erros.push(m); };

const indexaveis = [];
for (const u of paginas()) {
  const caminho = relative(RAIZ, fileURLToPath(u)).replace(/\\/g, '/');
  const s = readFileSync(u, 'utf8');
  const blocos = s.match(/<!-- seo -->[\s\S]*?<!-- \/seo -->\n/g) || [];
  if (foraDoIndice(s, caminho)) { ok(!blocos.length, `${caminho}: redirecionamento/404 não deve ter canonical nem Open Graph`); continue; }
  indexaveis.push(caminho);
  ok(blocos.length === 1, `${caminho}: deveria ter exatamente 1 bloco de SEO (tem ${blocos.length}); rode node tools/seo.mjs`);
  if (blocos.length === 1) ok(blocos[0] === blocoSeo(s, caminho), `${caminho}: bloco de SEO desatualizado (título, descrição ou URL mudou); rode node tools/seo.mjs`);
  ok(s.includes(`<link rel="canonical" href="${urlDe(caminho)}">`), `${caminho}: canonical errado`);
}
ok(indexaveis.includes('index.html') && indexaveis.length > 50, `poucas páginas indexáveis (${indexaveis.length})`);

// sitemap igual ao que o gerador produziria hoje
const sitemap = existsSync(RAIZ + 'sitemap.xml') ? readFileSync(RAIZ + 'sitemap.xml', 'utf8') : '';
ok(sitemap === gerarSitemap(indexaveis), 'sitemap.xml desatualizado: rode node tools/seo.mjs');
ok(/^Sitemap: https:\/\/www\.juliocataldo\.dev\/sitemap\.xml$/m.test(readFileSync(RAIZ + 'robots.txt', 'utf8')), 'robots.txt deve apontar o sitemap');

// imagem de compartilhamento: existe, é PNG 1200x630 e cabe no limite das redes (< 5 MB)
const og = RAIZ + OG_IMAGEM.replace(/^https:\/\/[^/]+\//, '');
if (existsSync(og)) {
  const b = readFileSync(og);
  ok(b.subarray(1, 4).toString() === 'PNG' && b.readUInt32BE(16) === 1200 && b.readUInt32BE(20) === 630, 'assets/og.png deve ser PNG 1200x630');
  ok(statSync(og).size < 5e6, 'assets/og.png grande demais');
} else erros.push('falta assets/og.png');

// 404: noindex, caminhos absolutos (é servida em qualquer pasta) e redirecionamento só para páginas que existem
const p404 = readFileSync(RAIZ + '404.html', 'utf8');
ok(p404.includes('<meta name="robots" content="noindex">'), '404.html: falta noindex');
ok(!/(?:href|src)="(?!https?:|data:|#|\/)/.test(p404), '404.html: todo link precisa ser absoluto (começar com /)');
for (const [, de, para] of readFileSync(RAIZ + '404.js', 'utf8').matchAll(/'(\/[^']+)':\s*'(\/[^']+)'/g)) {
  ok(existsSync(RAIZ + para.slice(1)), `404.js: destino inexistente ${para}`);
  ok(!existsSync(RAIZ + de.slice(1)), `404.js: ${de} ainda existe, não precisa de redirecionamento`);
}

// geradores precisam aplicar o bloco, senão o Action apaga o preview na próxima rodada
for (const g of ['build-notas', 'build-artigos', 'build-noticias', 'build-radar', 'build-radar-brasil', 'build-eventos']) {
  ok(/aplicarSeo\(/.test(readFileSync(`${RAIZ}tools/${g}.mjs`, 'utf8')), `tools/${g}.mjs não chama aplicarSeo()`);
}

if (erros.length) { console.error(erros.join('\n')); process.exit(1); }
console.log(`SEO: ${indexaveis.length} páginas com canonical e Open Graph, sitemap e robots em dia, 404 e imagem de compartilhamento ok`);
console.log('OK');
