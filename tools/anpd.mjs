// Confere tools/data/anpd.json: os números transcritos dos painéis da ANPD têm que fechar entre si.
// Uso: node tools/anpd.mjs        (guia de atualização: tools/ANPD-ATUALIZAR.md)
import { readFileSync } from 'node:fs';
import { validarAnpd } from './radar-brasil-lib.mjs';

const arq = new URL('./data/anpd.json', import.meta.url);
const a = JSON.parse(readFileSync(arq, 'utf8'));
const erros = validarAnpd(a);
if (erros.length) { console.error('anpd.json NÃO fecha:\n- ' + erros.join('\n- ')); process.exit(1); }
const dias = Math.round((Date.now() - new Date(a.atualizado + 'T00:00:00Z')) / 864e5);
console.log(`anpd.json OK | total ${a.total} (ransomware ${a.ransomware}) | ${a.estados.length} UFs | atualizado em ${a.atualizado} (${dias} dias atrás)`);
if (dias > 45) console.log('Aviso: transcrição com mais de 45 dias. Veja tools/ANPD-ATUALIZAR.md.');
