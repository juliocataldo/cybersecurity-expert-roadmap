// Valida a integridade de checklist.js. Uso: node tests/validar-checklist.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../checklist.js', import.meta.url), 'utf8');
// isola só o objeto de dados (ignora a IIFE da página, que usa document/localStorage)
const dataEnd = src.indexOf('/* ===================== LÓGICA');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(src.slice(0, dataEnd) + '\nglobalThis.C = CHECKLIST;', ctx);
const C = ctx.C;

const erros = [];
const ok = (cond, msg) => { if (!cond) erros.push(msg); };
const NIVEIS = new Set(['essencial', 'opcional', 'avancado']);
const ids = new Set();
const unico = id => { ok(!ids.has(id), `id duplicado: ${id}`); ids.add(id); };

ok(Array.isArray(C.categorias) && C.categorias.length === 18, `esperadas 18 categorias, achei ${C.categorias?.length}`);

let totalItens = 0;
const distNivel = { essencial: 0, opcional: 0, avancado: 0 };
C.categorias.forEach(cat => {
  unico(cat.id);
  for (const k of ['titulo', 'intro']) ok(typeof cat[k] === 'string' && cat[k].trim(), `${cat.id}: falta ${k}`);
  ok(Array.isArray(cat.itens) && cat.itens.length >= 3, `${cat.id}: poucos itens`);
  cat.itens.forEach(it => {
    unico(it.id);
    ok(it.id.startsWith(cat.id + '-'), `${it.id}: prefixo errado (esperado ${cat.id}-)`);
    ok(NIVEIS.has(it.nivel), `${it.id}: nível inválido "${it.nivel}"`);
    ok(typeof it.t === 'string' && it.t.trim(), `${it.id}: falta título`);
    ok(typeof it.d === 'string' && it.d.trim(), `${it.id}: falta descrição`);
    if (NIVEIS.has(it.nivel)) distNivel[it.nivel]++;
    totalItens++;
  });
});

console.log(`${C.categorias.length} categorias, ${totalItens} itens | Essencial=${distNivel.essencial} Opcional=${distNivel.opcional} Avançado=${distNivel.avancado}`);
if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log('OK');
