// Garante que o detector de segredos pega os formatos conhecidos, não gera alarme falso em texto comum
// e nunca devolve o valor encontrado. Os "segredos" de teste são montados em tempo de execução (nada com cara de
// credencial fica gravado no arquivo, para não disparar o push protection do GitHub).
// Uso: node tests/validar-segredos.mjs
import { readFileSync } from 'node:fs';
import { acharSegredos } from '../tools/segredos-lib.mjs';

const erros = [];
const ok = (c, m) => { if (!c) erros.push(m); };
const rep = (c, n) => c.repeat(n);

const casos = {
  'Google OAuth access token': 'token: ya29' + '.' + rep('a1B', 14),
  'Google API key': 'key=AIza' + rep('Sy', 17) + 'x',
  'AWS access key ID': 'id AKIA' + rep('Q7', 8),
  'AWS secret access key': 'aws_secret_access_key = ' + rep('aB3/', 10),
  'Azure AD application secret': 'secret: abc8' + 'Q~' + rep('Z9_.', 8),
  'Azure storage account key': 'AccountKey=' + rep('Ab+/', 16) + '==',
  'GitHub token': 'ghp' + '_' + rep('a1', 20),
  'Slack token': 'xoxb' + '-' + rep('1234567890', 2) + '-abc',
  'Chave privada (PEM)': '-----BEGIN ' + 'RSA PRIVATE KEY-----',
  'JWT': 'eyJ' + rep('a', 12) + '.eyJ' + rep('b', 12) + '.' + rep('c', 12),
  'Stripe live key': 'sk' + '_live_' + rep('a1', 12),
  'OpenAI/Anthropic-style API key': 'sk' + '-proj-' + rep('Ab1_', 10),
};
for (const [tipo, texto] of Object.entries(casos)) {
  const r = acharSegredos(`linha comum\n${texto}\noutra linha`);
  ok(r.some(a => a.tipo === tipo && a.linha === 2), `deveria detectar "${tipo}" na linha 2 (achou ${JSON.stringify(r)})`);
  ok(!JSON.stringify(r).includes(texto.slice(-12)), `o resultado de "${tipo}" não pode conter o valor`);
}

// sem alarme falso em texto comum de estudo
const comum = [
  'Use um cofre de segredos e rotacione a senha periodicamente.',
  '`export AWS_SECRET_ACCESS_KEY=<sua-chave>` (substitua pelo seu valor)',
  'aws_access_key_id = ' + 'AKIA' + 'IOSFODNN7' + 'EXAMPLE',            // chave de exemplo oficial da AWS
  'password: <senha>', 'token: seu-token-aqui', 'https://exemplo.com/a?b=1&c=2',
  'eyJ não é um JWT sozinho', 'sk-curto', 'Q~ é só um til', 'ya29 sem ponto',
  '# Segurança\n\n- IAM\n- **Least privilege**\n\n```bash\ngcloud auth login\n```',
];
for (const t of comum) ok(acharSegredos(t).length === 0, `alarme falso em: ${JSON.stringify(t.slice(0, 50))}`);

// CRLF e linhas gigantes não quebram nem travam
ok(acharSegredos('a\r\nb ya29' + '.' + rep('x', 30) + '\r\nc').some(a => a.linha === 2), 'linha correta com CRLF');
ok(acharSegredos('x'.repeat(50000)).length === 0, 'linha gigante deve ser ignorada sem travar');

// o gerador da Teia usa o detector e não publica a nota retida
const gerador = readFileSync(new URL('../tools/build-notas.mjs', import.meta.url), 'utf8');
ok(/acharSegredos\(bruto\)/.test(gerador) && /retidas\.push/.test(gerador), 'build-notas deve reter notas com possível segredo');

if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log(`Segredos: ${Object.keys(casos).length} formatos detectados, ${comum.length} textos comuns sem alarme falso`);
console.log('OK');
