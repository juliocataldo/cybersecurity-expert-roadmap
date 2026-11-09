// Gera tools/data/mapa-mundo.json: contornos dos países (Natural Earth 110m, domínio público) em paths SVG,
// projeção Equal Earth. Roda uma vez (ou quando quiser atualizar): node tools/gen-mapa-mundo.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
const URL_NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
const geo = await (await fetch(URL_NE, { headers: { 'user-agent': 'cyber-expert-guide' } })).json();

const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
const rad = d => d * Math.PI / 180;
function equalEarth(lon, lat) {
  const th = Math.asin(Math.sqrt(3) / 2 * Math.sin(rad(lat))), t2 = th * th, t6 = t2 * t2 * t2;
  const x = (2 * Math.sqrt(3) * rad(lon) * Math.cos(th)) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1));
  const y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}
const feats = geo.features.filter(f => f.properties.ISO_A3_EH !== 'ATA' && /^[A-Z]{2}$/.test(f.properties.ISO_A2_EH));
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
const proj = new Map();
for (const f of feats) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const p = polys.map(poly => poly.map(ring => ring.map(([lo, la]) => { const [x, y] = equalEarth(lo, la); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); return [x, y]; })));
  proj.set(f, p);
}
const S = 1000 / (maxX - minX);
const out = { largura: 1000, altura: Math.ceil((maxY - minY) * S), projecao: 'Equal Earth', fonte: 'Natural Earth (domínio público)', paises: {} };
for (const f of feats) {
  const d = proj.get(f).map(poly => poly.map(ring => 'M' + ring.map(([x, y]) => ((x - minX) * S).toFixed(1) + ' ' + ((maxY - y) * S).toFixed(1)).join('L') + 'Z').join('')).join('');
  out.paises[f.properties.ISO_A2_EH] = { iso3: f.properties.ISO_A3_EH, nomeEn: f.properties.NAME, d };
}
mkdirSync(new URL('./data/', import.meta.url), { recursive: true });
writeFileSync(new URL('./data/mapa-mundo.json', import.meta.url), JSON.stringify(out) + '\n');
console.log('mapa-mundo.json:', Object.keys(out.paises).length, 'países,', out.largura + 'x' + out.altura, ',', (JSON.stringify(out).length / 1024).toFixed(0) + ' KB');
