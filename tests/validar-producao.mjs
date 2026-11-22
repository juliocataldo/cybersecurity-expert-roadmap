// Garante que a trava de dados de ambiente real (tools/producao-lib.mjs) pega CPF e termos bloqueados, avisa IP
// público, não gera alarme falso em exemplo de estudo e nunca devolve o valor. O CPF de teste é calculado em tempo de
// execução (nenhum número com cara de documento fica gravado no arquivo).
// Uso: node tests/validar-producao.mjs
import { acharDadosProducao, cpfValido, ipPublico, lerBloqueio } from '../tools/producao-lib.mjs';

const erros = [];
const ok = (c, m) => { if (!c) erros.push(m); };

// monta um CPF válido a partir de 9 dígitos
const comDv = base => { let d = base; for (const n of [9, 10]) { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; d += r === 10 ? 0 : r; } return d; };
const cpf = comDv('52998224'.padEnd(9, '7'));
const fmt = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
ok(cpfValido(cpf), 'o CPF de teste deveria ser válido');
ok(!cpfValido('11111111111'), 'sequência repetida não é CPF');
ok(!cpfValido(cpf.slice(0, 10) + ((Number(cpf[10]) + 1) % 10)), 'dígito verificador errado não é CPF');

const bloq = lerBloqueio('Empresa-Teste.example, srv-interno01 ,\n  ab, CONTA-COFRE');
ok(bloq.length === 3 && !bloq.includes('ab'), `lista de bloqueio: termos curtos (< 3) são ignorados (veio ${JSON.stringify(bloq)})`);

const casos = [
  [`usuario ${cpf} pts/0`, 'CPF', 'bloqueios'],
  [`f${cpf}     pts/4`, 'CPF', 'bloqueios'],
  [`CPF: ${fmt}`, 'CPF', 'bloqueios'],
  ['curl https://app.EMPRESA-TESTE.example/login', 'termo da lista de bloqueio', 'bloqueios'],
  ['adm@srv-interno01 $ last', 'termo da lista de bloqueio', 'bloqueios'],
  ['nmap -sS 189.40.12.7', 'IP público', 'avisos'],
];
for (const [linha, tipo, nivel] of casos) {
  const r = acharDadosProducao(`texto comum\n${linha}\nfim`, bloq);
  ok(r[nivel].some(a => a.tipo.startsWith(tipo) && a.linha === 2), `deveria achar "${tipo}" em ${nivel} na linha 2: ${linha}`);
  ok(!JSON.stringify(r).includes(cpf) && !JSON.stringify(r).includes('189.40'), 'o resultado não pode conter o valor encontrado');
}
ok(acharDadosProducao(`nmap 189.40.12.7`, bloq).bloqueios.length === 0, 'IP público só avisa, não bloqueia');

// sem alarme falso em exemplo de estudo
const comum = [
  'nmap -sS 192.168.0.10 10.0.0.1 172.16.5.4 127.0.0.1', 'host 203.0.113.10 e 198.51.100.25 e 192.0.2.7',
  'dig @8.8.8.8 example.com', 'dig @1.1.1.1 example.com', 'versão 1.2.3.4.5', 'CGNAT usa 100.64.0.1',
  'multicast 224.0.0.251', 'telefone 4199812334', 'pedido 12345678901', 'conta 111.111.111-11',
  'https://empresa.example/a?b=1', 'o termo ab aparece muito',
];
for (const t of comum) {
  const r = acharDadosProducao(t, bloq);
  ok(!r.bloqueios.length && !r.avisos.length, `alarme falso em: ${t} (${JSON.stringify(r)})`);
}
for (const ip of ['203.0.113.1', '10.1.2.3', '8.8.4.4', '0.0.0.0', '255.255.255.255']) ok(!ipPublico(ip), `${ip} não é público para a trava`);
ok(ipPublico('37.59.174.229'), '37.59.174.229 é público');
// limite conhecido: um ID de requisito como "ASVS 5.1.3.1" tem formato de IP público e gera só aviso (nunca bloqueia)
ok(acharDadosProducao('ASVS 5.1.3.1', bloq).bloqueios.length === 0, 'ID do ASVS não pode bloquear a nota');

if (erros.length) { console.error(erros.join('\n')); process.exit(1); }
console.log(`Dados de ambiente real: CPF, lista de bloqueio e IP público detectados; ${comum.length} exemplos de estudo sem alarme falso`);
console.log('OK');
