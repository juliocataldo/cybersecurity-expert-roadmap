// Garante que notas vazias/rascunho ficam fora da Teia e que notas de verdade (inclusive as de exemplo) entram.
// Uso: node tests/validar-rascunho.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { motivoRascunho } from '../tools/rascunho-lib.mjs';
const erros = [];
const casos = [
  ['Untitled', 'qualquer coisa', true],
  ['Sem título 2', 'texto', true],
  ['BGP', '# BGP\n\nhttps://exemplo.com/bgp\n', true],
  ['Documents', 'Type: API\nSkills: Hacking\n\n[MindAPI](https://x.io) https://apisecurity.io/ [[API]]', true],
  ['Nmap', 'O Nmap descobre hosts e serviços numa rede. Use -sV para versões, -sC para scripts padrão e sempre com autorização por escrito do dono do alvo.', false],
];
for (const [t, b, esperado] of casos) if (!!motivoRascunho(t, b) !== esperado) erros.push(`"${t}": esperado ${esperado ? 'rascunho' : 'publicável'}`);
const dir = new URL('../tools/sample-vault/', import.meta.url);
for (const f of readdirSync(dir)) {
  const body = readFileSync(new URL(f, dir), 'utf8').replace(/^---[\s\S]*?---/, '');
  const m = motivoRascunho(f.replace(/\.md$/, ''), body);
  if (m) erros.push(`sample-vault/${f} viraria rascunho (${m})`);
}
if (erros.length) { console.error('FALHOU:\n- ' + erros.join('\n- ')); process.exit(1); }
console.log(`${casos.length} casos e notas de exemplo OK`);
console.log('OK');
