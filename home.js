"use strict";
/* Home: campo de busca (leva para busca.html) e painel "continue de onde parou" da trilha gamificada.
   O painel lê o resumo que a trilha grava no navegador (app.js, chave cyber-roadmap-v1-resumo). O conteúdo do
   storage é tratado como entrada não confiável: só campos conhecidos, com tipo e tamanho conferidos, e textContent. */
(function () {
  const box = document.getElementById('busca-home-box');
  const campo = document.getElementById('busca-home');
  if (box && campo) {
    box.hidden = false;
    campo.addEventListener('keydown', e => {
      if (e.key === 'Enter' && campo.value.trim()) location.href = 'busca.html?q=' + encodeURIComponent(campo.value.trim());
    });
  }

  const painel = document.getElementById('progresso');
  if (!painel) return;
  let r = null;
  try { r = JSON.parse(localStorage.getItem('cyber-roadmap-v1-resumo') || 'null'); } catch (e) { return; }
  const txt = (v, n) => typeof v === 'string' && v.length <= n;
  const num = v => Number.isInteger(v) && v >= 0 && v <= 999;
  if (!r || r.v !== 1 || !/^F\d{2}$/.test(r.fase) || !num(r.n) || !num(r.total) || !num(r.feitas) || !num(r.missoes) ||
      !txt(r.titulo, 120) || !txt(r.proxima, 200) || !txt(r.nivel, 60) || r.feitas === 0) return;
  const linha = (cls, t) => { const s = document.createElement('span'); s.className = cls; s.textContent = t; return s; };
  if (r.concluida) {
    painel.href = 'trilhas.html';
    painel.append(linha('k', 'Trilha concluída'), linha('t', 'Você fechou as 12 fases. Escolha uma trilha por função'), linha('d', `${r.feitas}/${r.missoes} missões · nível ${r.nivel}`));
  } else {
    painel.href = 'trilha.html#' + r.fase;
    painel.append(linha('k', 'Continue de onde parou'), linha('t', `Fase ${String(r.n).padStart(2, '0')} de ${r.total}: ${r.titulo}`),
      linha('d', `${r.proxima ? (r.proxima === 'checkpoint da fase' ? 'Próximo passo: checkpoint da fase' : 'Próxima missão: ' + r.proxima) + ' · ' : ''}${r.feitas}/${r.missoes} missões · nível ${r.nivel}`));
  }
  painel.hidden = false;
})();
