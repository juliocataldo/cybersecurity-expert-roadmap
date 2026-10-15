// Valida a integridade de trilha.js. Uso: node tests/validar-trilha.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../trilha.js', import.meta.url), 'utf8');
const ctx = {}; vm.createContext(ctx); vm.runInContext(src + '\nglobalThis.T = TRILHA;', ctx);
const T = ctx.T;
const erros = [];
const ok = (cond, msg) => { if (!cond) erros.push(msg); };

const ids = new Set();
const unico = id => { ok(!ids.has(id), `id duplicado: ${id}`); ids.add(id); };
const dist = [0, 0, 0, 0];
const HTTP_OK = new Set(['http://flaws.cloud/', 'http://scanme.nmap.org/']); // sites que só existem em http

T.fases.forEach((f, i) => {
  unico(f.id);
  ok(f.id === `F${String(i).padStart(2, '0')}`, `${f.id}: ids de fase devem seguir a ordem (esperado F${String(i).padStart(2, '0')})`);
  for (const k of ['icone', 'titulo', 'subtitulo', 'objetivo']) ok(typeof f[k] === 'string' && f[k], `${f.id}: falta ${k}`);
  ok(f.badge && f.badge.icone && f.badge.nome, `${f.id}: falta badge`);
  ok(f.missoes.length >= 3, `${f.id}: poucas missões`);
  f.missoes.forEach(m => {
    unico(m.id); ok(m.id.startsWith(f.id + '-M'), `${m.id}: prefixo errado`);
    ok(['estudo', 'pratica', 'chefao'].includes(m.tipo), `${m.id}: tipo inválido`);
    ok(m.titulo && m.descricao, `${m.id}: falta título/descrição`);
    m.links.forEach(([n, u]) => { ok(n, `${m.id}: link sem nome`); ok(u.startsWith('https://') || HTTP_OK.has(u), `${m.id}: link não-https ${u}`); });
  });
  ok(f.checkpoint.length === 3, `${f.id}: checkpoint deve ter 3 questões`);
  f.checkpoint.forEach(q => {
    unico(q.id); ok(q.id.startsWith(f.id + '-Q'), `${q.id}: prefixo errado`);
    ok(q.o.length === 4, `${q.id}: precisa de 4 alternativas`);
    ok(Number.isInteger(q.c) && q.c >= 0 && q.c < q.o.length, `${q.id}: gabarito fora do intervalo`);
    ok(new Set(q.o).size === q.o.length, `${q.id}: alternativas repetidas`);
    ok(q.e && q.p, `${q.id}: falta enunciado/explicação`);
    dist[q.c]++;
    // viés de tamanho: a certa não deve ser sempre a mais longa
    const lens = q.o.map(s => s.length); const max = Math.max(...lens);
    if (lens[q.c] === max && lens.filter(l => l === max).length === 1 && max - [...lens].sort((a, b) => b - a)[1] > 12) erros.push(`${q.id}: alternativa certa é bem mais longa que as outras (viés)`);
  });
});
const n = dist.reduce((a, b) => a + b, 0);
ok(Math.max(...dist) - Math.min(...dist) <= 2, `distribuição do gabarito desequilibrada: A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
ok(T.niveis.every((l, i) => i === 0 || l.xp > T.niveis[i - 1].xp), 'níveis devem ter XP crescente');

const missoes = T.fases.reduce((s, f) => s + f.missoes.length, 0);
console.log(`${T.fases.length} fases, ${missoes} missões, ${n} questões | gabarito A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log('OK');
