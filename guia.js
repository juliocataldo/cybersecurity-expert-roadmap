"use strict";
/* Guia: seção "Entenda a área" interativa (abas) e teste rápido de afinidade.
   Sem JS, todos os painéis ficam visíveis e o teste fica oculto: nada se perde. */
(function () {
  const area = document.getElementById('areaMap');
  if (!area) return;
  const tabs = [...area.querySelectorAll('[role=tab]')];
  const NOMES = { fund: 'Fundamentos', ofe: 'Ofensivo', def: 'Defensivo', grc: 'Governança', cld: 'Cloud e DevSecOps' };

  function selectTab(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) { panel.classList.remove('in'); void panel.offsetWidth; panel.classList.add('in'); } // reinicia a animação
    });
    area.dataset.sel = tab.dataset.area;
    if (focus) tab.focus();
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      selectTab(t);
      // no celular o painel fica abaixo das 5 áreas: leva o aluno até ele
      if (matchMedia('(max-width: 800px)').matches) document.getElementById(t.getAttribute('aria-controls')).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length], true); }
      else if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
      else if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });
  area.classList.add('js');
  document.getElementById('areaHint').hidden = false;
  selectTab(tabs[0]);

  /* ---- teste rápido ---- */
  const quiz = document.getElementById('areaQuiz');
  const form = document.getElementById('aq');
  const out = document.getElementById('aqOut');
  quiz.hidden = false;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const vals = ['q1', 'q2', 'q3'].map(n => (form.querySelector(`input[name=${n}]:checked`) || {}).value);
    if (vals.some(v => !v)) { out.textContent = 'Responda as 3 perguntas para ver o resultado.'; return; }
    const cont = {}; vals.forEach(v => { cont[v] = (cont[v] || 0) + 1; });
    const max = Math.max(...Object.values(cont));
    const top = Object.keys(cont).filter(k => cont[k] === max);
    const pick = top.length === 1 ? top[0] : null;
    out.replaceChildren();
    const b = document.createElement('b');
    if (pick) {
      b.textContent = NOMES[pick];
      out.append('Seu perfil puxa para ', b, '. Abrimos essa área acima para você explorar. Lembre que todo mundo passa pelos Fundamentos primeiro.');
      selectTab(tabs.find(t => t.dataset.area === pick));
    } else {
      const ns = top.map(k => NOMES[k]); b.textContent = ns.slice(0, -1).join(', ') + ' e ' + ns[ns.length - 1];
      out.append('Deu empate entre ', b, '. Ótimo sinal: explore as áreas acima e veja qual desperta mais curiosidade.');
      selectTab(tabs.find(t => t.dataset.area === top[0]));
    }
    area.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  form.addEventListener('reset', () => { out.textContent = ''; });
})();
