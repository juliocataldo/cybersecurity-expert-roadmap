// Núcleo da página Notícias: leitura do RSS do The Hacker News e a trava de publicação.
// Sem dependências. Do feed só entram título, link e data: descrição, imagem e autor são descartados.

export const FONTE = {
  nome: 'The Hacker News',
  host: 'thehackernews.com',
  site: 'https://thehackernews.com',
  rss: 'https://feeds.feedburner.com/TheHackersNews',
};

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Decodifica entidades HTML comuns (nomeadas e numéricas). */
export function decodificar(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 31 && n < 0x110000 ? String.fromCodePoint(n) : ' ';
    }
    return ENTIDADES[e.toLowerCase()] ?? m;
  });
}

/** Texto puro: sem CDATA, sem tags, sem caracteres de controle, espaços colapsados. */
export function limparTexto(s) {
  let t = String(s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  t = decodificar(t).replace(/<[^>]*>/g, ' ');           // tags (inclusive as que vieram em entidade)
  t = decodificar(t).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, ' '); // controle e bidi
  return t.replace(/\s+/g, ' ').trim();
}

const campo = (bloco, tag) => { const m = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')); return m ? m[1] : ''; };

/** Lê os <item> do RSS. Retorna [{titulo, link, ts}] (ts em ms; NaN se a data for inválida). */
export function parseRss(xml) {
  return String(xml).split(/<item[ >]/i).slice(1).map(bloco => ({
    titulo: limparTexto(campo(bloco, 'title')),
    link: limparTexto(campo(bloco, 'link')),
    ts: Date.parse(limparTexto(campo(bloco, 'pubDate'))),
  }));
}

/** Item válido: título razoável, link https da fonte (caminho /AAAA/MM/...), data válida. */
export function erroDoItem(it) {
  if (!it || typeof it.titulo !== 'string' || it.titulo.length < 10 || it.titulo.length > 220) return 'título fora do tamanho esperado';
  let u; try { u = new URL(it.link); } catch { return 'link inválido'; }
  if (u.protocol !== 'https:' || u.host !== FONTE.host || u.username || u.password || u.port) return 'link fora da fonte autorizada';
  if (!/^\/\d{4}\/\d{2}\/[a-z0-9\-_.]+\.html$/i.test(u.pathname)) return 'caminho do link fora do padrão';
  if (!Number.isFinite(it.ts) || it.ts < Date.UTC(2020, 0, 1) || it.ts > Date.now() + 36e5 * 36) return 'data inválida';
  return null;
}

/** Separa itens válidos dos descartados (sem derrubar o build por um item ruim). */
export function filtrarItens(itens) {
  const bons = [], descartados = [];
  for (const it of itens) { const e = erroDoItem(it); if (e) descartados.push(e); else bons.push({ titulo: it.titulo, link: new URL(it.link).href, ts: it.ts }); }
  return { bons, descartados };
}

/** Junta o histórico com os itens novos: sem repetição (pelo link), mais recentes primeiro, limitado a `max`. */
export function mesclarHistorico(antigo, novos, max = 150) {
  const m = new Map();
  for (const it of [...antigo, ...novos]) m.set(it.link, it);
  return [...m.values()].sort((a, b) => b.ts - a.ts || a.link.localeCompare(b.link)).slice(0, max);
}

/** A trava: nada fora do padrão chega à página. */
export function travaNoticias(itens, { minimo = 10 } = {}) {
  const erros = [];
  if (itens.length < minimo) erros.push(`poucos itens (${itens.length}); a fonte pode ter vindo cortada`);
  const links = new Set();
  for (const it of itens) {
    const e = erroDoItem(it); if (e) erros.push(e);
    if (links.has(it.link)) erros.push('link repetido'); links.add(it.link);
    if (/[<>]/.test(it.titulo)) erros.push('título com marcação');
  }
  if (erros.length) throw new Error('Publicação barrada pela trava (notícias):\n- ' + [...new Set(erros)].join('\n- '));
}

/** Marcadores por assunto, a partir do título (classificação nossa, não da fonte). */
const TAGS = [
  ['Ransomware', /ransomware|extortion|leak site/i],
  ['Vulnerabilidade', /\bCVE-\d|vulnerabilit|zero-day|0-day|exploit|patch|RCE\b|flaw/i],
  ['Malware', /malware|trojan|backdoor|botnet|\bRAT\b|stealer|loader|spyware|worm\b/i],
  ['Vazamento e roubo', /breach|leak|stolen|theft|exposed|heist|hack(?:ed|s)? /i],
  ['IA', /\bAI\b|LLM|agentic|copilot|chatgpt|claude|gemini|MCP\b/i],
  ['Brasil', /brazil|brasil|brazilian/i],
];
export const tagsDe = titulo => TAGS.filter(([, re]) => re.test(titulo)).map(([n]) => n).slice(0, 3);

/* ---------------- Destaques escritos à mão (tools/data/noticias.json) ---------------- */
export const STATUS = { confirmado: 'Confirmado', relatado: 'Relatado pela empresa', alegado: 'Alegado', apuracao: 'Em apuração' };
const texto = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[<>]/.test(v);

export function validarCuradas(lista) {
  const erros = []; const ids = new Set();
  if (!Array.isArray(lista)) return ['noticias.json deve ser uma lista'];
  lista.forEach((d, i) => {
    const p = `destaque ${i + 1}`;
    if (!/^[a-z0-9-]{3,80}$/.test(d.id || '')) erros.push(`${p}: id inválido`);
    if (ids.has(d.id)) erros.push(`${p}: id repetido`); ids.add(d.id);
    if (!texto(d.titulo, 200)) erros.push(`${p}: título`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.data || '') || isNaN(Date.parse(d.data))) erros.push(`${p}: data (AAAA-MM-DD)`);
    if (!STATUS[d.status]) erros.push(`${p}: status deve ser um de ${Object.keys(STATUS).join(', ')}`);
    for (const k of ['resumo', 'aprender']) if (!Array.isArray(d[k]) || !d[k].length || !d[k].every(x => texto(x, 700))) erros.push(`${p}: ${k} deve ser lista de textos`);
    for (const k of ['vetor', 'impacto']) if (!texto(d[k], 900)) erros.push(`${p}: ${k}`);
    if (d.nota !== undefined && !texto(d.nota, 900)) erros.push(`${p}: nota`);
    if (!Array.isArray(d.fontes) || !d.fontes.length) erros.push(`${p}: precisa de ao menos uma fonte`);
    else for (const f of d.fontes) {
      let u; try { u = new URL(f.url); } catch { u = null; }
      if (!u || u.protocol !== 'https:' || u.username || u.password) erros.push(`${p}: fonte com URL inválida (só https)`);
      if (!texto(f.nome, 120)) erros.push(`${p}: fonte sem nome`);
    }
  });
  return erros;
}
