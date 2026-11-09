// Valida os Artigos (artigos/*.md → artigo-*.html), o renderizador de Markdown e a lista de notas da Teia em artigos.html.
// Uso: node tests/validar-artigos.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { mdToHtml, mdInline, parseFront, esc, resumoTexto } from '../tools/markdown-lib.mjs';
import { lerArtigos, validarArtigo, lerTeia, notasParaLista, renderNotas } from '../tools/artigos-lib.mjs';

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

// ---- robustez: entradas que travavam o renderizador (laço infinito e crash do Node) ----
const tricky = ['```a``` texto depois', 'texto ```a``` texto', '```js\nx\n``` fim', '```js\nx\n```', '   ---', '> [!note] Título', '- item\n   - sub', '1. a\n2. b', '| a | b |\n|---|---|', '#semespaco', '```', '``````', '\u0000F0\u0000 texto', 'a\u0000b', '# \n- \n> \n1. '];
for (const t of tricky) {
  let r; try { r = mdToHtml(t, 't', () => null); } catch (e) { r = null; erros.push('renderizador falhou com ' + JSON.stringify(t) + ': ' + e.message); }
  ok(r === null || typeof r === 'string', 'saída deve ser texto');
}
ok(/<code>a<\/code> texto depois/.test(mdToHtml('```a``` texto depois', 't', () => null)), 'bloco de código seguido de texto vira código em linha');
// fuzz determinístico: combinações de peças difíceis nunca podem travar nem lançar
{
  const pecas = ['```', '`', '\n', '\n\n', '- ', '* ', '1. ', '> ', '# ', '## ', '---', '   ', 'texto', '[[Nota]]', '[x](https://a.com)', '[y](pagina.html#a)', '**b**', '_i_', '|', '\r\n', '\u0000', '<b>', '&', 'é☁️'];
  let seed = 12345; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
  let falhas = 0;
  for (let k = 0; k < 4000 && falhas < 3; k++) {
    let txt = ''; const n = 1 + rnd(14); for (let j = 0; j < n; j++) txt += pecas[rnd(pecas.length)];
    try { mdToHtml(txt, 't', t => (t === 'Nota' ? 'nota.html' : null)); } catch (e) { falhas++; erros.push('fuzz: renderizador falhou com ' + JSON.stringify(txt) + ': ' + e.message); }
  }
}
// embeds do Obsidian: imagem some (sem texto quebrado) e incorporar nota vira link
{
  const img = mdToHtml('Antes ![[Pasted image 20240101.png]] depois ![[foto.JPG|300]] fim', 't', () => null);
  ok(img === '<p>Antes  depois  fim</p>', 'embed de imagem deve ser omitido, achei: ' + img);
  ok(!/wl-missing|Pasted/.test(img), 'nome do arquivo de imagem não pode aparecer no texto');
  const emb = mdToHtml('Veja ![[Outra nota]]', 't', t => (t === 'Outra nota' ? 'outra-nota.html' : null));
  ok(/<a href="outra-nota\.html" class="wl">Outra nota<\/a>/.test(emb) && !/!/.test(emb), 'incorporar nota deve virar link comum');
}
ok(parseFront('---\r\ntitle: Nota\r\npublish: true\r\n---\r\ncorpo').meta.publish === 'true', 'frontmatter com CRLF (arquivos do Windows)');
// resumo do cartão da nota: texto puro e limpo
{
  ok(resumoTexto('# Título\n\n**JWT** é um token assinado, ligado a [[Autenticação|login]] e [x](https://a.com).\n\n```js\ncodigo()\n```\n![[foto.png]]') === 'JWT é um token assinado, ligado a login e x.', 'resumo sem marcação, código, imagens e links: ' + resumoTexto('**JWT** é [[A|b]]'));
  ok(resumoTexto('Type: Cyber\nSkills: Network\n\nTexto de verdade da nota.') === 'Texto de verdade da nota.', 'linhas de metadado do começo não entram no resumo');
  ok(resumoTexto('Status: ativo no meio\n\nParágrafo.').startsWith('Status: ativo no meio') === false, 'metadado só é pulado no começo — aqui é o começo, então some');
  ok(resumoTexto('Parágrafo inicial.\n\nStatus: continua valendo aqui.').includes('Status: continua'), 'depois do primeiro texto, "Status:" é conteúdo e fica');
  ok(resumoTexto('Type:Hacking Skills: Cyber\n\nTexto real da nota.') === 'Texto real da nota.', 'metadado sem espaço depois do ":" também é pulado');
  ok(resumoTexto('Type/Skills: Net Cyber\n\nTexto real.') === 'Texto real.', 'metadado "Type/Skills:" é pulado');
  ok(resumoTexto('Types of malware são vários.') === 'Types of malware são vários.', 'texto que só começa com "Type..." (sem ":") não é metadado');
  ok(!/==/.test(resumoTexto('Use ==destaque== do Obsidian')), 'marcador de destaque == removido');
  ok(!/[<>]/.test(resumoTexto('<b>negrito</b> e <script>alert(1)</script> texto')) , 'tags HTML removidas do resumo');
  ok(resumoTexto('| a | b |\n|---|---|\n\n## Só título') === '', 'nota só com tabela/título gera resumo vazio (o cartão omite)');
  const longo = resumoTexto('palavra '.repeat(80), 60); ok(longo.length <= 62 && longo.endsWith('…') && !/palavr…/.test(longo), 'corta em palavra inteira com reticências: ' + longo);
  ok(resumoTexto('\u0000\r\n texto') === 'texto', 'NUL e CRLF não atrapalham');
}

// tags em todos os formatos que o Obsidian usa (o padrão é a lista em linhas)
{
  const t = (fm) => parseFront('---\n' + fm + '\n---\ncorpo').meta;
  const lista = t('title: A\ntags:\n  - api\n  - api-security\npublish: true');
  ok(JSON.stringify(lista.tags) === '["api","api-security"]', 'tags em lista de linhas: ' + JSON.stringify(lista.tags));
  ok(lista.publish === 'true' && lista.title === 'A', 'chaves depois da lista de tags devem continuar sendo lidas');
  ok(JSON.stringify(t('tags: [web, "xss"]').tags) === '["web","xss"]', 'tags inline []');
  ok(JSON.stringify(t('tags: web').tags) === '["web"]', 'tag única');
  ok(JSON.stringify(t('tags: web, xss, #idor').tags) === '["web","xss","idor"]', 'tags separadas por vírgula e com #');
  ok(JSON.stringify(t('tags:\n  - "#a b"\n  - c').tags) === '["a b","c"]', 'tags com aspas e #');
  ok(JSON.stringify(t('title: A\ntags:\npublish: true').tags) === '[]' && t('title: A\ntags:\npublish: true').publish === 'true', 'tags vazias não engolem a chave seguinte');
  ok(t('title: A').tags === undefined, 'sem tags: a chave não existe');
  ok(JSON.stringify(t('aliases:\n  - x\n  - y\npublish: true').aliases) === '["x","y"]', 'qualquer chave aceita lista em linhas');
}
ok(parseFront('\uFEFF---\ntitle: Nota\npublish: true\n---\ncorpo').meta.publish === 'true', 'frontmatter com BOM');

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
ok(!/<script(?![^>]*\ssrc="guia\.js"><\/script>)/i.test(pagina) && !/ style=/i.test(pagina), 'artigos.html não pode ter script inline (só o guia.js externo) nem estilo inline');
ok((pagina.match(/class="card" href="artigo-/g) || []).length === artigos.filter(a => a.listar).length, 'um card por artigo publicado e listado em artigos.html');
ok(artigos.some(a => a.listar) || !/Estudos de caso e textos/.test(pagina), 'sem artigo listado, a seção "Estudos de caso e textos" não deve aparecer');
const teia = lerTeia(ler('teia-data.js'));
const notas = notasParaLista(teia);
ok((pagina.match(/class="card tool nota"/g) || []).length === notas.length, 'artigos.html deve ter um cartão para cada nota da Teia');
ok(/data-tf data-noun="notas"/.test(pagina) && /type="search"[^>]*aria-label="Buscar nas notas"/.test(pagina) && /class="mut small tf-count"/.test(pagina) && /class="mut small tf-empty" hidden/.test(pagina), 'filtro de busca (data-tf, campo, contador e mensagem vazia) ausente em artigos.html');
ok(/<script src="guia\.js"><\/script>/.test(pagina), 'artigos.html precisa carregar o guia.js (é ele que faz o filtro)');
ok(!(pagina.match(/<input[^>]*type="search"/g) || []).length || (pagina.match(/<input/g) || []).length === 1, 'só deve haver um campo de busca');
{ const cartoes = [...pagina.matchAll(/<a class="card tool nota" data-pasta="([^"]*)" data-tags="([^"]*)" href="([^"]+)">/g)]; ok(cartoes.length === notas.length, 'cada cartão de nota precisa de data-pasta, data-tags e href');
  const botoesPasta = [...pagina.matchAll(/data-attr="pasta">(.*?)<\/div>/g)][0]; if (botoesPasta) { const valores = new Set([...botoesPasta[1].matchAll(/data-f="([^"]*)"/g)].map(m => m[1]).filter(Boolean)); ok(cartoes.every(c => valores.has(c[1])), 'todo data-pasta de um cartão deve ter um botão de filtro correspondente'); const soma = [...botoesPasta[1].matchAll(/chip-n">(\d+)</g)].reduce((a, m) => a + +m[1], 0); ok(soma === notas.length, `a soma das contagens por pasta (${soma}) deve ser o total de notas (${notas.length})`); } }
for (const n of notas) ok(existsSync(new URL(n.url, raiz)), `nota listada sem página: ${n.url}`);
ok(pagina.includes('href="teia.html"'), 'artigos.html deve levar à Teia');
ok(teia.fonte !== 'exemplo' || pagina.includes('Notas de exemplo'), 'com notas de exemplo, artigos.html deve avisar');
ok(teia.fonte === 'exemplo' || !pagina.includes('Notas de exemplo'), 'com o vault real, o aviso de exemplo não deve aparecer');
const nomesMalucos = lerTeia('window.TEIA={"nodes":[{"title":"<b>x</b>","url":"javascript:alert(1)"},{"title":"ok","url":"notas/ok.html"}],"links":[]};');
ok(notasParaLista(nomesMalucos).length === 1, 'notasParaLista deve descartar URL fora de notas/*.html');

// ---- cartões das notas: escape e regras do filtro ----
{
  const hostis = notasParaLista({ nodes: [
    { title: '<img src=x onerror=alert(1)>Título', url: 'notas/a.html', tags: ['<script>x</script>', 'web'], pasta: '"><b>Pasta', resumo: '<b>negrito</b> & "aspas"', deg: 3 },
    { title: 'Outra', url: 'notas/b.html', tags: ['web'], pasta: 'Normal', resumo: '', deg: 0 },
    { title: 'Outra 2', url: 'notas/c.html', tags: ['web'], pasta: 'Normal', resumo: 'x', deg: 1 },
    { title: 'Proibida', url: 'javascript:alert(1)', tags: [], pasta: 'x', resumo: 'x', deg: 0 },
  ], links: [] });
  ok(hostis.length === 3, 'nota com URL fora de notas/ deve ser descartada, achei ' + hostis.length);
  const h = renderNotas(hostis);
  ok(!/<img|<script|<b>/i.test(h), 'HTML hostil em título, tag, pasta ou resumo precisa sair escapado');
  ok(!/ onerror=|javascript:/i.test(h.replace(/&lt;[^&]*&gt;/g, '')), 'nenhum atributo de evento ou javascript: pode sobrar');
  ok(/data-attr="pasta"/.test(h), 'com 2 ou mais pastas, deve haver filtro por pasta');
  ok(/data-attr="tags"/.test(h) === false, 'um filtro com menos de 2 opções não deve aparecer');
  ok(!/ style=/i.test(h), 'o filtro não pode ter style inline');
  const um = renderNotas(notasParaLista({ nodes: [{ title: 'Só', url: 'notas/s.html', tags: [], pasta: 'Geral', resumo: '', deg: 0 }], links: [] }));
  ok(!/chips-f/.test(um) && /class="card tool nota"/.test(um), 'com uma pasta só, não há botões de filtro, mas o cartão aparece');
  ok(/1 conexão|<span class="nota-conn">3 conexões/.test(h), 'contagem de conexões no cartão');
}

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
