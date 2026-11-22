// SEO e preview de compartilhamento: canonical, Open Graph e Twitter card, iguais em todas as páginas.
// Por quê: sem og:title/og:image, um link do site no LinkedIn ou no WhatsApp sai sem imagem nem resumo.
// O bloco fica entre <!-- seo --> e <!-- /seo --> logo depois do <title>, montado a partir do próprio <title> e da
// meta description da página (uma única fonte de verdade). Idempotente: aplicar de novo só troca o bloco.
// Os geradores chamam aplicarSeo() antes de gravar; para as páginas estáticas, rode: node tools/seo.mjs

export const SITE = 'https://www.juliocataldo.dev';
export const OG_IMAGEM = `${SITE}/assets/og.png`;
const RE_BLOCO = /<!-- seo -->[\s\S]*?<!-- \/seo -->\n?/;

/** 'index.html' -> https://.../ ; 'devsecops/index.html' -> https://.../devsecops/ ; 'notas/x.html' -> https://.../notas/x.html */
export const urlDe = caminho => `${SITE}/${caminho.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1')}`;

/** Página que não entra no índice: redirecionamento (meta refresh) e a 404. */
export const foraDoIndice = (html, caminho) => /http-equiv="refresh"/.test(html) || caminho === '404.html';

/** Monta o bloco a partir do <title> e da description já escapados na página. */
export function blocoSeo(html, caminho) {
  const titulo = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const descricao = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1];
  if (!titulo || descricao == null) throw new Error(`${caminho}: falta <title> ou meta description`);
  const url = urlDe(caminho);
  const tituloAttr = titulo.replace(/"/g, '&quot;'); // texto do <title> já vem escapado, menos as aspas
  const tipo = /^(notas\/|artigo-)/.test(caminho) ? 'article' : 'website';
  return [
    '<!-- seo -->',
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="${tipo}">`,
    '<meta property="og:site_name" content="Cyber Expert Guide">',
    '<meta property="og:locale" content="pt_BR">',
    `<meta property="og:title" content="${tituloAttr}">`,
    `<meta property="og:description" content="${descricao}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${OG_IMAGEM}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Cyber Expert Guide: roadmap de cibersegurança em português, por Julio Cataldo">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<!-- /seo -->',
  ].join('\n') + '\n';
}

/** Insere (ou troca) o bloco de SEO. Redirecionamentos e a 404 ficam sem bloco. */
export function aplicarSeo(html, caminho) {
  const limpo = html.replace(RE_BLOCO, '');
  if (foraDoIndice(limpo, caminho)) return limpo;
  return limpo.replace(/(<title>[^<]*<\/title>\n)/, `$1${blocoSeo(limpo, caminho)}`);
}

/** sitemap.xml com as páginas indexáveis, em ordem estável. */
export function gerarSitemap(caminhos) {
  const urls = [...caminhos].sort((a, b) => a.localeCompare(b, 'en')).map(c => `  <url><loc>${urlDe(c)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
