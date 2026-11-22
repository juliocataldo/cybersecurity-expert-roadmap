// Detector de dados de ambiente real em notas antes de publicar (terceira barreira, ao lado de segredos e rascunhos).
// Por quê: nota de estudo costuma nascer de um terminal de trabalho e levar junto CPF, hostname interno, domínio de
// cliente e IP de terceiro. Nunca devolve o valor encontrado: só o tipo e o número da linha (igual a segredos-lib).
//
// Dois níveis:
//  - bloqueio (a nota NÃO é publicada): CPF válido e termos da lista de bloqueio (NOTAS_BLOQUEIO, um secret do
//    GitHub com domínios, hostnames e contas da empresa, separados por vírgula; fica fora do repositório público).
//  - aviso (a nota sai, mas o log do Action avisa): IP público fora das faixas de documentação. Exemplos de estudo
//    deveriam usar 192.0.2.x, 198.51.100.x ou 203.0.113.x (RFC 5737).

/** CPF com dígitos verificadores válidos (descarta sequências como 111.111.111-11). */
export function cpfValido(digitos) {
  if (!/^\d{11}$/.test(digitos) || /^(\d)\1{10}$/.test(digitos)) return false;
  const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += Number(digitos[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

// IP que pode aparecer em exemplo: privado, loopback, link-local, CGNAT, documentação, multicast/reservado e
// resolvedores públicos conhecidos (aparecem em todo tutorial de DNS)
const RESOLVEDORES = new Set(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1', '9.9.9.9', '149.112.112.112', '208.67.222.222', '208.67.220.220']);
export function ipPublico(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n > 255)) return false; // não é IP (ex.: versão 5.1.3.1)
  const [a, b, c] = p;
  if (RESOLVEDORES.has(ip)) return false;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 169 && b === 254) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) return false;
  return true;
}

/** Lista de bloqueio a partir do texto do secret: termos separados por vírgula ou quebra de linha, sem diferenciar maiúsculas. */
export const lerBloqueio = texto => String(texto || '').split(/[,\n]/).map(t => t.trim().toLowerCase()).filter(t => t.length >= 3);

/** Retorna { bloqueios: [{ tipo, linha }], avisos: [{ tipo, linha }] } (sem o valor). */
export function acharDadosProducao(texto, bloqueio = []) {
  const bloqueios = [], avisos = [];
  const linhas = String(texto).split(/\r?\n/);
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (l.length > 20000) continue;
    const baixa = l.toLowerCase();
    for (const m of l.matchAll(/(?<![\d.])(\d{3})\.(\d{3})\.(\d{3})-(\d{2})(?![\d])|(?<![\d])(\d{11})(?![\d])/g)) {
      const d = m[5] || m.slice(1, 5).join('');
      if (cpfValido(d)) { bloqueios.push({ tipo: 'CPF', linha: i + 1 }); break; }
    }
    if (bloqueio.some(t => baixa.includes(t))) bloqueios.push({ tipo: 'termo da lista de bloqueio', linha: i + 1 });
    for (const m of l.matchAll(/(?<![\d.])(\d{1,3}(?:\.\d{1,3}){3})(?![\d.])/g)) {
      if (ipPublico(m[1])) { avisos.push({ tipo: 'IP público (use 192.0.2.x, 198.51.100.x ou 203.0.113.x)', linha: i + 1 }); break; }
    }
  }
  return { bloqueios, avisos };
}
