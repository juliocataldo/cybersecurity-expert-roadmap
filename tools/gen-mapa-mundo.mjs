// Gera tools/data/mapa-mundo.json: contornos dos países (Natural Earth 110m, domínio público) em paths SVG,
// projeção Equal Earth, com o contorno do globo (esfera) e uma grade de referência.
// Roda uma vez (ou quando quiser atualizar): node tools/gen-mapa-mundo.mjs
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
const passos = (a, b, s) => { const o = []; for (let v = a; s > 0 ? v <= b : v >= b; v += s) o.push(v); return o; };

// contorno da esfera: topo, direita, base, esquerda
const esfera = [
  ...passos(-180, 180, 5).map(lo => [lo, 90]),
  ...passos(90, -90, -5).map(la => [180, la]),
  ...passos(180, -180, -5).map(lo => [lo, -90]),
  ...passos(-90, 90, 5).map(la => [-180, la]),
];
// grade: meridianos e paralelos a cada 30 graus
const grade = [
  ...passos(-150, 150, 30).map(lo => passos(-90, 90, 5).map(la => [lo, la])),
  ...passos(-60, 60, 30).map(la => passos(-180, 180, 5).map(lo => [lo, la])),
];

const feats = geo.features.filter(f => /^[A-Z]{2}$/.test(f.properties.ISO_A2_EH)); // inclui a Antártida (AQ)
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
const ext = ([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); return [x, y]; };
const pesf = esfera.map(([lo, la]) => ext(equalEarth(lo, la)));
const proj = new Map();
for (const f of feats) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  proj.set(f, polys.map(poly => poly.map(ring => ring.map(([lo, la]) => ext(equalEarth(lo, la))))));
}
const MARGEM = 4;
const S = (1000 - MARGEM * 2) / (maxX - minX);
const X = x => ((x - minX) * S + MARGEM).toFixed(1), Y = y => ((maxY - y) * S + MARGEM).toFixed(1);
const caminho = pts => 'M' + pts.map(([x, y]) => X(x) + ' ' + Y(y)).join('L');

const out = {
  largura: 1000, altura: Math.ceil((maxY - minY) * S + MARGEM * 2), projecao: 'Equal Earth', fonte: 'Natural Earth (domínio público)',
  esfera: caminho(pesf) + 'Z',
  grade: grade.map(l => caminho(l.map(([lo, la]) => equalEarth(lo, la)))).join(''),
  paises: {},
};
for (const f of feats) {
  const d = proj.get(f).map(poly => poly.map(ring => caminho(ring) + 'Z').join('')).join('');
  out.paises[f.properties.ISO_A2_EH] = { iso3: f.properties.ISO_A3_EH, nomeEn: f.properties.NAME, d };
}
mkdirSync(new URL('./data/', import.meta.url), { recursive: true });
writeFileSync(new URL('./data/mapa-mundo.json', import.meta.url), JSON.stringify(out) + '\n');
console.log('mapa-mundo.json:', Object.keys(out.paises).length, 'países,', out.largura + 'x' + out.altura, '(razão ' + (out.largura / out.altura).toFixed(2) + '),', (JSON.stringify(out).length / 1024).toFixed(0) + ' KB');
