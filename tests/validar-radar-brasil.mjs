// Valida o núcleo do Radar Brasil: anonimização (K), trava de publicação, ANPD e mapa.
// Uso: node tests/validar-radar-brasil.mjs
import { readFileSync } from 'node:fs';
import { K, MIN_TAXA, agregar, normalizar, normalizarMundo, agregarPaises, travaPaises, taxa, limitesQuintis, faixaDe, lerMatrizFerramentas, lerMatrizCves, topMatriz, travaMatriz, contarSemPais, travaSaida, validarAnpd, validarFonte } from '../tools/radar-brasil-lib.mjs';

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

// ---- Mundo ----
const mundoBase = [
  ...base,
  ...Array.from({ length: 4 }, () => ({ country: 'US', group_name: 'akira', activity: 'Technology', discovered: '2026-10-20T00:00:00+00:00', post_title: 'VITIMA-US' })),
  { country: 'FR', group_name: 'akira', activity: 'Technology', discovered: '2026-10-21T00:00:00+00:00', post_title: 'VITIMA-FR' }, // 1 caso: não pode aparecer
  { country: '', group_name: 'akira', activity: 'Technology', discovered: '2026-10-21T00:00:00+00:00', post_title: 'SEM-PAIS' },  // sem país
  ...Array.from({ length: 3 }, () => ({ country: 'ZZ', group_name: 'akira', activity: 'Technology', discovered: '2026-10-22T00:00:00+00:00', post_title: 'x' })), // código fora da lista
];
const rm = normalizarMundo(mundoBase, GRUPOS);
ok(rm.every(r => Object.keys(r).sort().join() === 'ano,grupo,mes,pais,setor'), 'registro do mundo só pode ter ano, grupo, mes, pais e setor');
ok(!JSON.stringify(rm).includes('VITIMA') && !JSON.stringify(rm).includes('secreta'), 'nome/site de vítima vazou no registro do mundo');
ok(contarSemPais(mundoBase) === 1, 'contarSemPais');
const paisesOk = new Set(['BR', 'US', 'FR']);
const ap = agregarPaises(rm, { hoje: new Date('2026-11-09T00:00:00Z'), paisesPermitidos: paisesOk });
ok(ap.paises.every(p => p.todos >= K), 'país com menos de K casos na saída');
ok(!ap.paises.some(p => p.pais === 'FR' || p.pais === 'ZZ'), 'país com 1 caso ou fora da lista não pode ser publicado');
ok(ap.outrosCasos === 4 && ap.outrosPaises === 2, 'outros países: esperado 4 casos em 2 países, achei ' + ap.outrosCasos + ' em ' + ap.outrosPaises);
ok(ap.paises[0].pais === 'BR' && ap.paises[0].todos === 11, 'ranking deve estar em ordem decrescente');
travaPaises(ap, { paisesPermitidos: paisesOk });
lanca(() => travaPaises({ ...ap, paises: [...ap.paises, { pais: 'ZZ', todos: 9, m12: null }] }, { paisesPermitidos: paisesOk }), 'país fora da lista');
lanca(() => travaPaises({ ...ap, paises: [{ pais: 'BR', todos: 2, m12: null }] }, { paisesPermitidos: paisesOk }), 'país com 2 casos');
lanca(() => travaPaises({ ...ap, paises: [{ pais: 'Brasil', todos: 9, m12: null }] }, { paisesPermitidos: paisesOk }), 'país com texto em vez de código');

// taxas só com MIN_TAXA casos; quintis e faixas
ok(taxa(MIN_TAXA - 1, 1e6, 1e6) === null, 'taxa com poucos casos deve ser null');
ok(taxa(10, 0, 1e6) === null && taxa(10, undefined, 1e6) === null, 'taxa sem base deve ser null');
ok(Math.abs(taxa(100, 50e6, 1e6) - 2) < 1e-9, 'taxa por milhão');
const lim = limitesQuintis([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
ok(lim.length === 4 && faixaDe(0.5, lim) === 1 && faixaDe(1e9, lim) === 5, 'quintis e faixas');
ok(limitesQuintis([1, 2]).length === 0, 'poucos valores não geram faixas');

// matrizes BushidoUK
const fer = lerMatrizFerramentas('| Tool Name | Threat Group Usage |\n|---|---|\n| AZCopy | Interlock, Storm-0501* |\n| FileZilla | Akira, LockBit, Scattered Spider* |\n| Catbox[.]moe | *Br0k3r |');
ok(fer.length === 3 && fer[1].grupos.length === 3 && fer[0].grupos.includes('Storm-0501'), 'leitura da matriz de ferramentas');
const cv = lerMatrizCves('| Product | CVE(s) | Ransomware Group(s) | Source(s) |\n|---|---|---|---|\n| Ivanti Connect Secure | CVE-2024-21887 | Pioneer Kitten+, DragonForce | [x](http://x) |\n| Ivanti Connect Secure | CVE-2024-21887 | Akira | [x](http://x) |');
const topCv = topMatriz(cv, 'cve');
ok(topCv.length === 1 && topCv[0].n === 3, 'CVE repetido deve somar grupos distintos, achei ' + JSON.stringify(topCv));
travaMatriz(topMatriz(fer, 'nome'), topCv);
lanca(() => travaMatriz([{ nome: '<script>x</script>', n: 5 }], []), 'ferramenta com HTML');
lanca(() => travaMatriz([], [{ nome: 'Hospital X', produto: 'x', n: 5 }]), 'CVE fora do formato');

// dados de apoio do mapa-múndi
const mm = JSON.parse(readFileSync(new URL('../tools/data/mapa-mundo.json', import.meta.url), 'utf8'));
const rf = JSON.parse(readFileSync(new URL('../tools/data/referencias.json', import.meta.url), 'utf8'));
ok(Object.keys(mm.paises).length >= 150 && mm.paises.BR && mm.paises.US, 'mapa-múndi com poucos países ou sem BR/US');
ok(Object.keys(mm.paises).every(c => rf.paises[c]), 'todo país do mapa deve existir em referencias.json');
ok(rf.populacao.BR.v > 2e8 && rf.pib.BR.v > 1e12, 'população/PIB do Brasil fora do esperado');

// a página gerada não pode ter script nem estilo inline (CSP do site)
const html = readFileSync(new URL('../radar.html', import.meta.url), 'utf8');
ok(!/<script/i.test(html), 'radar.html não deve ter <script>');
ok(!/ style=/i.test(html), 'radar.html não deve ter style inline (a CSP bloqueia)');
ok(/Fonte: Ransomware\.live/.test(html), 'atribuição ao Ransomware.live obrigatória');
ok(/Banco Mundial/.test(html) && /Natural Earth/.test(html), 'atribuição ao Banco Mundial e ao Natural Earth obrigatória');
ok(!/Panthera/i.test(html), 'a página não deve citar o Panthera Census');
ok((html.match(/<svg class="mundo"/g) || []).length === 1, 'deve existir um único mapa-múndi (sem filtros)');
ok(!/tabs-mapa|type="radio"/.test(html), 'o mapa-múndi não deve ter abas/filtros');
ok(!/alega[cç]/i.test(html), 'a página usa "menção", não "alegação"');
ok(/id="observacoes"/.test(html) && !/Como ler estes números/.test(html), 'observações no final e sem o bloco "Como ler estes números"');
ok(html.indexOf('href="radar-casos.html"') > html.indexOf('id="anpd"'), 'o card da segunda tela deve ficar no final, depois das seções');

if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log(`Radar Brasil: ${reg.length} registros de teste, K=${K}, ANPD ${anpd.total}, ${Object.keys(mapa.ufs).length} UFs`);
console.log('OK');
