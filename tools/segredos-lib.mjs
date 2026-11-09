// Detector de possíveis segredos em notas antes de publicar. Segunda barreira: a primeira é o "push protection" do GitHub.
// Nunca devolve o valor encontrado: só o tipo e o número da linha (o valor não pode ir parar em log nem em página).
// Padrões conservadores (formatos conhecidos de credencial), para evitar alarme falso em texto comum.

const PADROES = [
  ['Google OAuth access token', /\bya29\.[0-9A-Za-z_-]{20,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['AWS access key ID', /\b(?:AKIA|ASIA|AGPA|AIDA|AROA|ANPA|ANVA)[0-9A-Z]{16}\b/],
  ['AWS secret access key', /aws_secret_access_key["'\s:=]{1,6}[A-Za-z0-9/+=]{40}/i],
  ['Azure AD application secret', /\b[A-Za-z0-9_~.]{3}\dQ~[A-Za-z0-9_~.-]{31,34}\b/],
  ['Azure storage account key', /AccountKey=[A-Za-z0-9+/]{60,}={0,2}/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['Chave privada (PEM)', /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['Stripe live key', /\b[sr]k_live_[0-9A-Za-z]{20,}/],
  ['SendGrid API key', /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/],
  ['npm token', /\bnpm_[A-Za-z0-9]{36}\b/],
  ['OpenAI/Anthropic-style API key', /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{32,}\b/],
];

// chaves de exemplo da documentação não contam (palavras como EXAMPLE/YOUR_KEY, sem diferenciar maiúsculas;
// sequências de X ou 0 só em formato de máscara, para não deixar passar um token real que tenha "xxxx" por acaso)
const EXEMPLO_PALAVRA = /EXAMPLE|YOUR[_-]?(?:KEY|TOKEN|SECRET)/i;
const EXEMPLO_MASCARA = /X{8,}|0{12,}/;
const ehExemplo = s => EXEMPLO_PALAVRA.test(s) || EXEMPLO_MASCARA.test(s);

/** Retorna [{ tipo, linha }] (sem o valor). Lista vazia = nada suspeito. */
export function acharSegredos(texto) {
  const achados = [];
  const linhas = String(texto).split(/\r?\n/);
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (l.length > 20000) continue; // linha gigante (dados embutidos): não vale o custo
    for (const [tipo, re] of PADROES) {
      const m = l.match(re);
      if (m && !ehExemplo(m[0])) achados.push({ tipo, linha: i + 1 });
    }
  }
  return achados;
}
