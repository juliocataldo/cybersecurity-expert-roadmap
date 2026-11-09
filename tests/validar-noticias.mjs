// Valida a página Notícias: leitura do RSS, trava de publicação, destaques e a página gerada.
// Uso: node tests/validar-noticias.mjs
import { readFileSync } from 'node:fs';
import { parseRss, limparTexto, filtrarItens, mesclarHistorico, travaNoticias, tagsDe, validarCuradas, erroDoItem, STATUS } from '../tools/noticias-lib.mjs';

const erros = [];
const ok = (c, m) => { if (!c) erros.push(m); };
const lanca = (fn, m) => { try { fn(); erros.push('deveria barrar: ' + m); } catch { /* esperado */ } };

// ---- limpeza de texto e leitura do RSS ----
ok(limparTexto('<![CDATA[Ataque &amp; defesa &#8211; <b>teste</b>]]>') === 'Ataque & defesa – teste', 'CDATA, entidades e tags');
ok(!/[<>]/.test(limparTexto('&lt;script&gt;alert(1)&lt;/script&gt; Título comprido de teste')), 'tag escondida em entidade deve ser removida');
ok(limparTexto('a‮b\u0000c   d') === 'a b c d', 'caracteres de controle e bidi');

const BOM = 'https://thehackernews.com/2026/11/exemplo-de-materia.html';
const item = (t, l, d) => `<item><title>${t}</title><description><![CDATA[<img src=x onerror=alert(1)> texto que NÃO pode ser publicado]]></description><link>${l}</link><pubDate>${d}</pubDate><enclosure url="https://exemplo.com/i.jpg"/></item>`;
const xml = `<rss><channel>${[
  item('Ransomware group hits Brazilian hospital network', BOM, 'Mon, 09 Nov 2026 10:00:00 +0000'),
  item('<![CDATA[Malicious <script>alert(1)</script> title with tags]]>', 'https://thehackernews.com/2026/11/outra-materia.html', 'Mon, 09 Nov 2026 09:00:00 +0000'),
  item('Link de outro domínio deve ser descartado', 'https://evil.example.com/2026/11/x.html', 'Mon, 09 Nov 2026 08:00:00 +0000'),
  item('Link com javascript deve ser descartado', 'javascript:alert(1)', 'Mon, 09 Nov 2026 08:00:00 +0000'),
  item('Domínio parecido deve ser descartado', 'https://thehackernews.com.evil.io/2026/11/x.html', 'Mon, 09 Nov 2026 08:00:00 +0000'),
  item('Com credencial no link deve ser descartado', 'https://user:pw@thehackernews.com/2026/11/x.html', 'Mon, 09 Nov 2026 08:00:00 +0000'),
  item('Data inválida deve ser descartada', 'https://thehackernews.com/2026/11/data-ruim.html', 'ontem'),
  item('Curto', 'https://thehackernews.com/2026/11/curto.html', 'Mon, 09 Nov 2026 08:00:00 +0000'),
].join('')}</channel></rss>`;
const itens = parseRss(xml);
ok(itens.length === 8, `parseRss deveria achar 8 itens, achei ${itens.length}`);
ok(itens.every(i => Object.keys(i).sort().join() === 'link,titulo,ts'), 'item só pode ter título, link e data (descrição e imagem descartadas)');
ok(!JSON.stringify(itens).includes('NÃO pode ser publicado') && !JSON.stringify(itens).includes('exemplo.com/i.jpg'), 'descrição ou imagem vazou para o item');
const { bons, descartados } = filtrarItens(itens);
ok(bons.length === 2, `só 2 itens válidos esperados, achei ${bons.length}`);
ok(descartados.length === 6, `6 descartados esperados, achei ${descartados.length}`);
ok(bons.every(b => !/[<>]/.test(b.titulo)), 'título com marcação não pode passar');
ok(erroDoItem({ titulo: 'Título válido de teste', link: BOM, ts: Date.UTC(2026, 10, 9) }) === null, 'item válido deve passar');

// ---- histórico e trava ----
const mk = (n, extra = {}) => ({ titulo: `Manchete de teste número ${n}`, link: `https://thehackernews.com/2026/11/materia-${n}.html`, ts: Date.UTC(2026, 10, 1) + n * 6e4, ...extra });
const antigo = Array.from({ length: 12 }, (_, i) => mk(i));
const novos = [mk(11), mk(99)];
const h = mesclarHistorico(antigo, novos, 10);
ok(h.length === 10, 'histórico deve respeitar o limite');
ok(new Set(h.map(x => x.link)).size === h.length, 'histórico não pode repetir link');
ok(h[0].link.endsWith('materia-99.html') && h.every((x, i) => i === 0 || h[i - 1].ts >= x.ts), 'histórico mais recente primeiro');
travaNoticias(Array.from({ length: 12 }, (_, i) => mk(i)));
lanca(() => travaNoticias(Array.from({ length: 3 }, (_, i) => mk(i))), 'feed cortado (poucos itens)');
lanca(() => travaNoticias([...Array.from({ length: 11 }, (_, i) => mk(i)), mk(50, { link: 'https://evil.example.com/2026/11/x.html' })]), 'link fora da fonte');
lanca(() => travaNoticias([...Array.from({ length: 11 }, (_, i) => mk(i)), mk(51, { titulo: '<img src=x onerror=alert(1)> título' })]), 'título com marcação');
lanca(() => travaNoticias([...Array.from({ length: 11 }, (_, i) => mk(i)), mk(5)]), 'link repetido');

// ---- marcadores ----
ok(tagsDe('New ransomware exploits CVE-2026-1234 in Brazil').join() === 'Ransomware,Vulnerabilidade,Brasil', 'tags por assunto: ' + tagsDe('New ransomware exploits CVE-2026-1234 in Brazil'));
ok(tagsDe('Conferência sem palavras-chave').length === 0, 'sem palavras-chave não marca');

// ---- destaques ----
const curadas = JSON.parse(readFileSync(new URL('../tools/data/noticias.json', import.meta.url), 'utf8'));
const e = validarCuradas(curadas); ok(e.length === 0, 'noticias.json inválido: ' + e.join('; '));
const base = curadas[0];
ok(validarCuradas([{ ...base, status: 'confirmadíssimo' }]).length > 0, 'status fora da lista deve falhar');
ok(validarCuradas([{ ...base, fontes: [{ nome: 'x', url: 'http://inseguro.example.com' }] }]).length > 0, 'fonte http (sem TLS) deve falhar');
ok(validarCuradas([{ ...base, fontes: [{ nome: 'x', url: 'javascript:alert(1)' }] }]).length > 0, 'fonte javascript: deve falhar');
ok(validarCuradas([{ ...base, titulo: '<b>oi</b>' }]).length > 0, 'título com HTML deve falhar');
ok(validarCuradas([{ ...base, data: '03/11/2026' }]).length > 0, 'data fora do formato deve falhar');
ok(validarCuradas([base, base]).length > 0, 'id repetido deve falhar');
ok(Object.keys(STATUS).includes(base.status), 'status do destaque deve existir');

// ---- página gerada ----
const html = readFileSync(new URL('../noticias.html', import.meta.url), 'utf8');
ok(!/<script/i.test(html), 'noticias.html não deve ter <script>');
ok(!/ style=/i.test(html), 'noticias.html não deve ter style inline (a CSP bloqueia)');
ok(/Fonte: The Hacker News/.test(html), 'atribuição ao The Hacker News obrigatória');
ok(/id="destaques"/.test(html) && /id="manchetes"/.test(html), 'seções Destaques e Manchetes');
ok(!/NÃO pode ser publicado/.test(html), 'texto de descrição do feed não pode aparecer na página');
const links = [...html.matchAll(/<a href="(https?:\/\/[^"]+)"/g)].map(m => new URL(m[1].replace(/&amp;/g, '&')));
ok(links.every(u => u.protocol === 'https:'), 'todo link externo deve ser https');
ok(links.every(u => u.host === 'thehackernews.com' || curadas.some(c => c.fontes.some(f => new URL(f.url).host === u.host))), 'link externo fora das fontes conhecidas');
ok(links.filter(u => u.host === 'thehackernews.com' && /^\/\d{4}\/\d{2}\//.test(u.pathname)).length >= 10, 'a página deve listar ao menos 10 manchetes');
ok(html.includes('rel="noopener noreferrer"'), 'links externos com rel noopener noreferrer');

if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log(`Notícias: ${itens.length} itens de teste, ${curadas.length} destaque(s), ${links.length} links externos conferidos`);
console.log('OK');
