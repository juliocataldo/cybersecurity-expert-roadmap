// Decide se uma nota do vault é rascunho (fica fora da Teia pública). Usado por tools/build-notas.mjs.
// Texto "de verdade" da nota: sem frontmatter, URLs, wikilinks, código e marcação. Abaixo de MIN_TEXTO é rascunho.
const MIN_TEXTO = 120;
export function motivoRascunho(title, body) {
  if (/^(untitled|sem t[ií]tulo|nova nota|new note)(\s*\d+)?$/i.test(title)) return 'sem título';
  const texto = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[\[[^\]]*\]\]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^\s*(Type|Skills|Status|Created|Tags?)\s*:.*$/gim, ' ')
    .replace(/[#>*_`|=~\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  return texto.length < MIN_TEXTO ? `conteúdo curto (${texto.length} de ${MIN_TEXTO} caracteres de texto)` : null;
}
