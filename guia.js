"use strict";
/* Guia: seção "Entenda a área" interativa (abas) e teste rápido de afinidade.
   Sem JS, todos os painéis ficam visíveis e o teste fica oculto: nada se perde. */
(function () {
  const area = document.getElementById('areaMap');
  if (!area) return;
  const tabs = [...area.querySelectorAll('[role=tab]')];
  const NOMES = { fund: 'Fundamentos', ofe: 'Ofensivo', def: 'Defensivo', cti: 'CTI e Forense', grc: 'Governança', cld: 'Cloud e DevSecOps' };

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
})();

/* Blocos de ferramentas ([data-tf]): filtro por categoria + busca (sem acento, sem maiúscula).
   Sem JS, os controles ficam ocultos e todas as ferramentas aparecem. */
document.querySelectorAll('[data-tf]').forEach(box => {
  const cards = [...box.querySelectorAll('.tool')];
  const chips = [...box.querySelectorAll('.chip-f')];
  const q = box.querySelector('input[type=search]');
  const count = box.querySelector('.tf-count');
  const empty = box.querySelector('.tf-empty');
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const text = new Map(cards.map(c => [c, norm(c.textContent)]));
  let cat = '';
  function apply() {
    const term = norm(q.value.trim());
    let n = 0;
    cards.forEach(c => {
      const show = (!cat || c.dataset.cat === cat) && (!term || text.get(c).includes(term));
      c.hidden = !show; if (show) n++;
    });
    count.textContent = `${n} de ${cards.length} ${box.dataset.noun || 'ferramentas'}`;
    empty.hidden = n > 0;
  }
  chips.forEach(b => b.addEventListener('click', () => {
    cat = b.dataset.f;
    chips.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    apply();
  }));
  q.addEventListener('input', apply);
  box.querySelector('.tools-ctl').hidden = false;
  apply();
});
