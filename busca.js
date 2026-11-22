"use strict";
/* Busca do site (busca.html). O índice vem pronto em busca-data.js (window.BUSCA, gerado por tools/build-busca.mjs).
   Sem acento e sem maiúscula; todas as palavras precisam aparecer (E lógico). Título vale mais que resumo.
   Monta o resultado com DOM (textContent), nunca com HTML: o termo digitado não vira marcação. */
(function () {
  const q = document.getElementById('q');
  const lista = document.getElementById('res');
  const total = document.getElementById('res-n');
  if (!q || !lista || !Array.isArray(window.BUSCA)) return;
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const idx = window.BUSCA.map(e => ({ e, t: norm(e.t), d: norm(e.d), s: norm(e.s || ''), u: norm(e.u) }));
  const LIMITE = 60;

  function pontuar(x, termos) {
    let p = 0;
    for (const w of termos) {
      const noTitulo = x.t.indexOf(w);
      if (noTitulo >= 0) p += 10 + (noTitulo === 0 || x.t[noTitulo - 1] === ' ' ? 5 : 0) + (x.t === w ? 20 : 0);
      else if (x.d.includes(w)) p += 3;
      else if (x.s.includes(w)) p += 2;
      else if (x.u.includes(w)) p += 1;
      else return 0; // todas as palavras precisam aparecer
    }
    return p + ({ 'Glossário': 2, 'Página': 1 }[x.e.k] || 0);
  }

  function render() {
    const termos = norm(q.value).split(/\s+/).filter(w => w.length > 1 || /\d/.test(w));
    lista.replaceChildren();
    if (!termos.length) { total.textContent = `${idx.length} itens no índice: páginas, seções, glossário, trilha e notas.`; return; }
    const achados = idx.map(x => ({ x, p: pontuar(x, termos) })).filter(r => r.p > 0).sort((a, b) => b.p - a.p);
    total.textContent = achados.length ? `${achados.length} resultado${achados.length > 1 ? 's' : ''}${achados.length > LIMITE ? ` (mostrando ${LIMITE})` : ''}` : 'Nada encontrado. Tente outra palavra ou a sigla (ex.: SIEM, IAM, LGPD).';
    for (const { x } of achados.slice(0, LIMITE)) {
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = x.e.u;
      const k = document.createElement('span'); k.className = 'k'; k.textContent = x.e.k;
      const h = document.createElement('b'); h.textContent = x.e.t;
      const d = document.createElement('span'); d.className = 'd'; d.textContent = x.e.d;
      a.append(k, h, d); li.append(a); lista.append(li);
    }
  }

  let timer;
  q.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      render();
      try { const u = new URL(location.href); if (q.value.trim()) u.searchParams.set('q', q.value.trim()); else u.searchParams.delete('q'); history.replaceState(null, '', u); } catch (e) { /* sem history: segue */ }
    }, 120);
  });
  q.value = new URLSearchParams(location.search).get('q') || '';
  render();
})();
