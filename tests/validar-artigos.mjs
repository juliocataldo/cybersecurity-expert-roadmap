// Valida os Artigos (artigos/*.md → artigo-*.html), o renderizador de Markdown e a lista de notas da Teia em artigos.html.
// Uso: node tests/validar-artigos.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { mdToHtml, mdInline, parseFront, esc } from '../tools/markdown-lib.mjs';
import { lerArtigos, validarArtigo, lerTeia, notasParaLista } from '../tools/artigos-lib.mjs';

const raiz = new URL('../', import.meta.url);
const ler = f => readFileSync(new URL(f, raiz), 'utf8').replace(/\r\n/g, '\n');
const erros = [];
const ok = (c, m) => { if (!c) erros.push(m); };

// ---- renderizador: tudo escapado, só links seguros ----
const hostil = mdToHtml('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[clique](javascript:alert(1))\n\n[x](data:text/html,<b>)\n\n[ok](https://exemplo.com/a?b=1&c=2)\n\n[interno](trilha.html#F05)\n\n[fuga](../../etc/passwd.html)\n\n[proto](//evil.example.com/x.html)', 't', () => null);
ok(!/<script|<img/i.test(hostil), 'HTML cru no Markdown deve virar texto');
ok(!/href="javascript:|href="data:/i.test(hostil), 'links javascript:/data: não podem virar <a>');
ok(/<a href="https:\/\/exemplo\.com\/a\?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">ok<\/a>/.test(hostil), 'link https deve abrir em nova aba com noopener');
ok(/<a href="trilha\.html#F05">interno<\/a>/.test(hostil), 'link interno .html com âncora deve funcionar');
ok(!/href="\.\.|href="\/\//.test(hostil), 'links com .. ou // não podem virar <a>');
ok(mdToHtml('# A\n\n## B\n\n### C', 't', () => null) === '<h2>A</h2>\n<h3>B</h3>\n<h4>C</h4>', '"#" = h2, "##" = h3 (o h1 vem do título)');
ok(mdInline('**negrito** e `código` e [x](https://a.com)').startsWith('<b>negrito</b> e <code>código</code>'), 'mdInline');
ok(parseFront('---\ntitle: Oi: tudo\npublish: true\n---\ncorpo').meta.title === 'Oi: tudo', 'frontmatter com dois-pontos no valor');
ok(esc('<>&"') === '&lt;&gt;&amp;&quot;', 'esc');

// ---- validação de artigos ----
const valido = { slug: 'meu-artigo', titulo: 'Um título razoável', date: '2026-11-09', eyebrow: 'Artigo · teste', categoria: 'Teste', resumo: 'Um resumo com mais de vinte caracteres.', meta: 'Linha de contexto.', credito: '', pagina: '', descricao: '', body: 'x'.repeat(250) };
ok(validarArtigo(valido).length === 0, 'artigo válido deveria passar: ' + validarArtigo(valido).join('; '));
ok(validarArtigo({ ...valido, slug: 'Meu Artigo!' }).length > 0, 'slug inválido deve falhar');
ok(validarArtigo({ ...valido, titulo: '<b>x</b> título' }).length > 0, 'título com HTML deve falhar');
ok(validarArtigo({ ...valido, date: '09/11/2026' }).length > 0, 'data fora do formato deve falhar');
ok(validarArtigo({ ...valido, resumo: 'curto' }).length > 0, 'resumo curto deve falhar');
ok(validarArtigo({ ...valido, body: 'curto' }).length > 0, 'corpo curto deve falhar');
ok(validarArtigo({ ...valido, descricao: '<i>x</i> descrição longa o bastante' }).length > 0, 'descricao com HTML deve falhar');

// ---- artigos reais ----
const artigos = lerArtigos(new URL('artigos/', raiz).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
ok(artigos.length >= 1, 'deve haver ao menos um artigo publicado em artigos/');
for (const a of artigos) {
  const e = validarArtigo(a); ok(e.length === 0, e.join('; '));
  ok(existsSync(new URL(`artigo-${a.slug}.html`, raiz)), `falta artigo-${a.slug}.html (rode node tools/build-artigos.mjs)`);
  if (existsSync(new URL(`artigo-${a.slug}.html`, raiz))) {
    const h = ler(`artigo-${a.slug}.html`);
    ok(h.includes(`<h1>${esc(a.titulo)}</h1>`), `artigo-${a.slug}.html fora de sincronia com o .md (rode node tools/build-artigos.mjs)`);
    ok(!/<script/i.test(h) && !/ style=/i.test(h), `artigo-${a.slug}.html não pode ter script nem estilo inline`);
  }
}
const publicados = new Set(artigos.map(a => `artigo-${a.slug}.html`));
const orfaos = readdirSync(raiz).filter(n => /^artigo-.+\.html$/.test(n) && !publicados.has(n));
ok(orfaos.length === 0, 'página de artigo sem .md publicado: ' + orfaos.join(', '));

// ---- artigos.html: cards e lista de notas ----
const pagina = ler('artigos.html');
ok(!/<script/i.test(pagina) && !/ style=/i.test(pagina), 'artigos.html não pode ter script nem estilo inline');
ok((pagina.match(/class="card" href="artigo-/g) || []).length === artigos.length, 'um card por artigo publicado em artigos.html');
const teia = lerTeia(ler('teia-data.js'));
const notas = notasParaLista(teia);
ok((pagina.match(/class="teia-chip"/g) || []).length === notas.length, 'artigos.html deve listar todas as notas da Teia');
for (const n of notas) ok(existsSync(new URL(n.url, raiz)), `nota listada sem página: ${n.url}`);
ok(pagina.includes('href="teia.html"'), 'artigos.html deve levar à Teia');
ok(teia.fonte !== 'exemplo' || pagina.includes('Notas de exemplo'), 'com notas de exemplo, artigos.html deve avisar');
ok(teia.fonte === 'exemplo' || !pagina.includes('Notas de exemplo'), 'com o vault real, o aviso de exemplo não deve aparecer');
const nomesMalucos = lerTeia('window.TEIA={"nodes":[{"title":"<b>x</b>","url":"javascript:alert(1)"},{"title":"ok","url":"notas/ok.html"}],"links":[]};');
ok(notasParaLista(nomesMalucos).length === 1, 'notasParaLista deve descartar URL fora de notas/*.html');

// ---- a Teia saiu do menu e vive dentro de Artigos ----
const paginas = [...readdirSync(raiz).filter(n => n.endsWith('.html')), ...readdirSync(new URL('notas/', raiz)).map(n => 'notas/' + n)];
const comTeiaNoMenu = paginas.filter(p => /<a href="(\.\.\/)?teia\.html"[^>]*>Teia<\/a>/.test(ler(p)));
ok(comTeiaNoMenu.length === 0, 'a Teia não deve estar no menu: ' + comTeiaNoMenu.join(', '));
ok(/artigos\.html" aria-current="page">Artigos/.test(ler('teia.html')), 'na Teia o menu deve marcar Artigos como ativo');
ok(/<a href="artigos\.html">&larr; Artigos<\/a>/.test(ler('teia.html')), 'a Teia deve voltar para Artigos');
ok(/hidden/.test(ler('teia.html').match(/id="teiaExemplo"[^>]*>/)?.[0] || ''), 'o aviso de exemplo da Teia deve começar escondido (o teia.js mostra)');

if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log(`Artigos: ${artigos.length} artigo(s), ${notas.length} nota(s) listada(s) (${teia.fonte}), renderizador e menu conferidos`);
console.log('OK');
