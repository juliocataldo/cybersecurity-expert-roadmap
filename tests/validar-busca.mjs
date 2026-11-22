// Garante que o índice da busca (busca-data.js) está em dia, aponta só para páginas e âncoras que existem,
// cobre todos os tipos de conteúdo e que busca.js monta o resultado sem HTML (o termo digitado não vira marcação).
// Uso: node tests/validar-busca.mjs   (se falhar por índice desatualizado: node tools/build-busca.mjs)
import { readFileSync, existsSync } from 'node:fs';
import { montarIndice, conteudoIndice } from '../tools/busca-lib.mjs';

const RAIZ = new URL('..', import.meta.url);
const ler = p => readFileSync(new URL(p, RAIZ), 'utf8');
const erros = [];
const ok = (c, m) => { if (!c) erros.push(m); };

const indice = montarIndice();
ok(existsSync(new URL('busca-data.js', RAIZ)) && ler('busca-data.js') === conteudoIndice(indice), 'busca-data.js desatualizado: rode node tools/build-busca.mjs');

const tipos = {};
const vistos = new Set();
const fases = new Set([...ler('trilha.js').matchAll(/\{ id: '(F\d{2})'/g)].map(m => m[1]));
const ids = new Map();
for (const e of indice) {
  tipos[e.k] = (tipos[e.k] || 0) + 1;
  ok(e.t && e.u && typeof e.d === 'string', `entrada incompleta: ${JSON.stringify(e).slice(0, 120)}`);
  ok(!vistos.has(e.k + e.u + e.t), `entrada duplicada: ${e.k} ${e.u} ${e.t}`); vistos.add(e.k + e.u + e.t);
  ok(!/<[a-z/]/i.test(e.t + e.d), `marcação HTML no texto do índice: ${e.u}`);
  const [arq, ancora] = e.u.split('#');
  if (!existsSync(new URL(arq, RAIZ))) { erros.push(`aponta para página inexistente: ${e.u}`); continue; }
  if (!ancora) continue;
  if (arq === 'trilha.html') { ok(fases.has(ancora), `fase inexistente: ${e.u}`); continue; }
  if (!ids.has(arq)) ids.set(arq, ler(arq));
  ok(ids.get(arq).includes(`id="${ancora}"`), `âncora inexistente: ${e.u}`);
}
for (const [k, min] of [['Página', 30], ['Seção', 50], ['Glossário', 100], ['Fase da trilha', 12], ['Missão', 65], ['Nota', 1]]) ok((tipos[k] || 0) >= min, `poucas entradas do tipo ${k}: ${tipos[k] || 0} (mínimo ${min})`);

// busca.js e home.js: nada de innerHTML/insertAdjacentHTML (resultado e painel montados com textContent)
for (const js of ['busca.js', 'home.js']) ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(ler(js)), `${js} não pode montar HTML a partir de texto`);
const pagina = ler('busca.html');
ok(/<script src="busca-data\.js\?v=[0-9a-f]+"><\/script>\s*<script src="busca\.js\?v=[0-9a-f]+"><\/script>/.test(pagina), 'busca.html deve carregar busca-data.js e depois busca.js (com versão)');
ok(/<script src="home\.js\?v=[0-9a-f]+" defer><\/script>/.test(ler('index.html')), 'index.html deve carregar home.js');

if (erros.length) { console.error(`FALHOU (${erros.length}):\n- ` + erros.slice(0, 30).join('\n- ')); process.exit(1); }
console.log(`Busca: ${indice.length} entradas (${Object.entries(tipos).map(([k, v]) => `${k} ${v}`).join(', ')}), todas apontando para páginas e âncoras que existem`);
console.log('OK');
