// Valida o núcleo do Radar Brasil: anonimização (K), trava de publicação, ANPD e mapa.
// Uso: node tests/validar-radar-brasil.mjs
import { readFileSync } from 'node:fs';
import { K, agregar, normalizar, travaSaida, validarAnpd, validarFonte } from '../tools/radar-brasil-lib.mjs';

const erros = [];
const ok = (c, m) => { if (!c) erros.push(m); };
const lanca = (fn, m) => { try { fn(); erros.push('deveria barrar: ' + m); } catch { /* esperado */ } };

const GRUPOS = ['Qilin', 'akira', 'lockbit5'];
const vit = (g, setor, data, extra = {}) => ({ country: 'BR', group_name: g, activity: setor, discovered: data, post_title: 'EMPRESA-SECRETA-' + Math.random(), website: 'secreta.com.br', ...extra });
const base = [
  ...Array.from({ length: 5 }, (_, i) => vit('Qilin', 'Healthcare', `2026-10-0${i + 1}T10:00:00+00:00`)),
  ...Array.from({ length: 4 }, () => vit('akira', 'Manufacturing', '2026-09-10T10:00:00+00:00')),
  vit('lockbit5', 'Education', '2026-09-11T10:00:00+00:00'),          // grupo e setor com 1 caso
  vit('grupo-fora-da-lista', 'Technology', '2026-09-12T10:00:00+00:00'), // grupo desconhecido
  { country: 'US', group_name: 'qilin', activity: 'Healthcare', discovered: '2026-10-01T00:00:00+00:00', post_title: 'x' }, // não é BR
];
const reg = normalizar(base, GRUPOS);
ok(reg.length === 11, `normalizar deveria manter só o Brasil (achei ${reg.length})`);
ok(reg.every(r => Object.keys(r).sort().join() === 'ano,grupo,mes,setor'), 'registro normalizado só pode ter ano, grupo, mes e setor');
ok(!JSON.stringify(reg).includes('SECRETA') && !JSON.stringify(reg).includes('secreta.com.br'), 'nome/site de vítima vazou para o registro normalizado');
ok(reg.find(r => r.grupo === 'qilin') === undefined && reg.find(r => r.grupo === 'Qilin'), 'grupo deve usar a grafia canônica do groups.json');

const ag = agregar(reg, { hoje: new Date('2026-11-09T00:00:00Z') });
ok(ag.total === 11, 'total');
ok(ag.meses.length === 24 && ag.meses.at(-1).mes === '2026-11', 'série mensal deve ser contínua e terminar no mês corrente');
ok(ag.porSetor.every(s => s.n >= K), `setor com menos de ${K} casos na saída`);
ok(ag.porGrupo.every(g => g.n >= K), `grupo com menos de ${K} casos na saída`);
ok(!ag.porGrupo.some(g => g.nome === 'lockbit5' || g.nome === 'grupo-fora-da-lista'), 'grupo pequeno ou desconhecido não pode aparecer nominalmente');
ok(ag.porSetor.some(s => s.nome === 'Saúde' && s.n === 5), 'tradução de setor (Healthcare → Saúde)');
const permitidos = ['Qilin', 'akira', 'lockbit5'];
travaSaida(ag, { gruposPermitidos: permitidos }); // não deve lançar

// a trava precisa barrar texto fora da lista e recorte pequeno
lanca(() => travaSaida({ ...ag, porGrupo: [...ag.porGrupo, { nome: 'EMPRESA-SECRETA', n: 9 }] }, { gruposPermitidos: permitidos }), 'nome de vítima em grupos');
lanca(() => travaSaida({ ...ag, porSetor: [...ag.porSetor, { nome: 'Hospital X', n: 9 }] }, { gruposPermitidos: permitidos }), 'texto fora da lista em setores');
lanca(() => travaSaida({ ...ag, porGrupo: [{ nome: 'Qilin', n: 2 }] }, { gruposPermitidos: permitidos }), 'grupo com 2 casos');
lanca(() => travaSaida({ ...ag, meses: [{ mes: 'Hospital X', n: 1 }] }, { gruposPermitidos: permitidos }), 'mês fora do formato');

// fonte cortada deve ser rejeitada
lanca(() => validarFonte(new Array(100), reg, 0), 'fonte com poucos registros');
lanca(() => validarFonte(new Array(30000), new Array(300).fill(0), 1000), 'queda de mais de 10% no total');

// ANPD e mapa
const anpd = JSON.parse(readFileSync(new URL('../tools/data/anpd.json', import.meta.url), 'utf8'));
const e = validarAnpd(anpd); ok(e.length === 0, 'anpd.json inconsistente: ' + e.join('; '));
lanca(() => { const x = validarAnpd({ ...anpd, total: anpd.total + 1 }); if (x.length) throw new Error('x'); }, 'ANPD com total que não fecha');
const mapa = JSON.parse(readFileSync(new URL('../tools/data/mapa-uf.json', import.meta.url), 'utf8'));
ok(Object.keys(mapa.ufs).length === 27, 'mapa deve ter 27 UFs');
ok(anpd.estados.every(s => mapa.ufs[s.uf]), 'toda UF da ANPD deve existir no mapa');

// a página gerada não pode ter script nem estilo inline (CSP do site)
const html = readFileSync(new URL('../radar-brasil.html', import.meta.url), 'utf8');
ok(!/<script/i.test(html), 'radar-brasil.html não deve ter <script>');
ok(!/ style=/i.test(html), 'radar-brasil.html não deve ter style inline (a CSP bloqueia)');
ok(/Fonte: Ransomware\.live/.test(html), 'atribuição ao Ransomware.live obrigatória');

if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log(`Radar Brasil: ${reg.length} registros de teste, K=${K}, ANPD ${anpd.total}, ${Object.keys(mapa.ufs).length} UFs`);
console.log('OK');
