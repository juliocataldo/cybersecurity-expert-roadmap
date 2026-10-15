"use strict";
/* Cybersecurity Expert Roadmap - lógica do jogo.
   Todo o progresso fica no localStorage do navegador; nada é enviado a servidor.
   O conteúdo vem de trilha.js (const TRILHA). */

const T = TRILHA;
const KEY = 'cyber-roadmap-v1';
const FASES = T.fases;
const MISSOES = new Map(); // id -> {m, fase}
const QUESTOES = new Map(); // id -> {q, fase}
FASES.forEach(f => { f.missoes.forEach(m => MISSOES.set(m.id, { m, fase: f })); f.checkpoint.forEach(q => QUESTOES.set(q.id, { q, fase: f })); });

/* ===== helpers ===== */
const $ = s => document.querySelector(s);
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k);
  return e;
}
const ext = (url, txt) => h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, txt);
const setW = (el, pct) => el.style.setProperty('--w', Math.max(0, Math.min(100, pct)) + '%'); // CSSOM: permitido pela CSP
function dayKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

/* ===== estado ===== */
const blank = () => ({ v: 1, who: '', done: {}, quiz: {}, days: [], open: { [FASES[0].id]: Date.now() }, badges: {} });
let S = load();
let selected = null;
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const o = sanitize(JSON.parse(raw)); if (o) return o; } } catch (e) { /* storage indisponível ou corrompido */ }
  return blank();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* modo privado: segue sem persistir */ } }

/* Valida qualquer estado vindo de fora (localStorage ou arquivo importado): entrada não confiável. */
function sanitize(o) {
  if (!o || typeof o !== 'object' || o.v !== 1) return null;
  const st = blank();
  if (typeof o.who === 'string') st.who = o.who.slice(0, 60);
  const ts = v => (Number.isFinite(v) && v > 0 ? v : Date.now());
  if (o.done && typeof o.done === 'object') for (const [id, v] of Object.entries(o.done)) if (MISSOES.has(id)) st.done[id] = ts(v);
  if (o.quiz && typeof o.quiz === 'object') for (const [id, v] of Object.entries(o.quiz)) {
    const q = QUESTOES.get(id); const a = v && v.a;
    if (q && Number.isInteger(a) && a >= 0 && a < q.q.o.length) st.quiz[id] = { a, ok: a === q.q.c }; // "ok" é recalculado, nunca confiado
  }
  if (Array.isArray(o.days)) st.days = [...new Set(o.days.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().slice(-730);
  // desbloqueio só vale em sequência: uma fase aberta exige a anterior aberta
  if (o.open && typeof o.open === 'object') for (let i = 1; i < FASES.length && Object.hasOwn(o.open, FASES[i].id) && st.open[FASES[i - 1].id]; i++) st.open[FASES[i].id] = ts(o.open[FASES[i].id]);
  // conquistas guardadas só servem para não repetir o aviso; a exibição é sempre recalculada (earnedBadges)
  if (o.badges && typeof o.badges === 'object') for (const [id, v] of Object.entries(o.badges)) if (typeof id === 'string' && id.length < 40) st.badges[id] = ts(v);
  return st;
}

/* ===== regras do jogo ===== */
const missDone = f => f.missoes.filter(m => S.done[m.id]).length;
const phasePct = f => Math.round(missDone(f) / f.missoes.length * 100);
const quizAnswered = f => f.checkpoint.filter(q => S.quiz[q.id]).length;
const quizRight = f => f.checkpoint.filter(q => S.quiz[q.id] && S.quiz[q.id].ok).length;
const isOpen = f => !!S.open[f.id];
const isDone = f => missDone(f) === f.missoes.length && quizAnswered(f) === f.checkpoint.length;

function xpTotal() {
  let xp = 0;
  for (const id of Object.keys(S.done)) xp += T.xp[MISSOES.get(id).m.tipo] || 0;
  for (const v of Object.values(S.quiz)) if (v.ok) xp += T.xp.questao;
  for (const f of FASES) if (isDone(f)) xp += T.xp.bonusFase;
  return xp;
}
function levelOf(xp) {
  let i = 0; T.niveis.forEach((n, k) => { if (xp >= n.xp) i = k; });
  const cur = T.niveis[i], nxt = T.niveis[i + 1];
  return { i, cur, nxt, pct: nxt ? (xp - cur.xp) / (nxt.xp - cur.xp) * 100 : 100 };
}
function streaks() {
  const set = new Set(S.days);
  let cur = 0; const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(dayKey(d))) { cur++; d.setDate(d.getDate() - 1); }
  let max = 0, run = 0, prev = null;
  for (const k of [...set].sort()) {
    const t = new Date(k + 'T12:00:00');
    run = prev && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1;
    max = Math.max(max, run); prev = t;
  }
  return { cur, max };
}
/* Fases são desbloqueadas em sequência e o desbloqueio é permanente (desmarcar não tranca de novo). */
function updateUnlocks() {
  FASES.forEach((f, i) => { if (i > 0 && !S.open[f.id] && isOpen(FASES[i - 1]) && phasePct(FASES[i - 1]) >= T.desbloqueioPct) { S.open[f.id] = Date.now(); toast(`Fase desbloqueada: ${f.titulo}`, 'lv'); } });
}
function earnedBadges() {
  const out = [];
  const total = MISSOES.size, done = Object.keys(S.done).length;
  FASES.forEach(f => { if (isDone(f)) out.push('fase:' + f.id); });
  if (done >= 1) out.push('primeira');
  const bosses = [...MISSOES.values()].filter(x => x.m.tipo === 'chefao');
  if (bosses.length && bosses.every(x => S.done[x.m.id])) out.push('chefoes');
  if (FASES.filter(f => quizRight(f) === f.checkpoint.length).length >= 3) out.push('gabarito');
  const { max } = streaks();
  if (max >= 3) out.push('seq3');
  if (max >= 7) out.push('seq7');
  if (done / total >= 0.5) out.push('metade');
  if (FASES.every(isDone)) out.push('tudo');
  return out;
}
function badgeInfo(id) {
  if (id.startsWith('fase:')) { const f = FASES.find(x => x.id === id.slice(5)); return f && { marca: f.id.slice(1), nome: f.badge.nome, desc: `Conclua a fase ${f.titulo}.` }; }
  const c = T.conquistas.find(c => c.id === id); return c && { ...c, marca: c.marca };
}

/* Chamado depois de toda ação do aluno: registra o dia, desbloqueia, premia e salva. */
function afterAction(prevXp, prevLevel) {
  const today = dayKey(); if (!S.days.includes(today)) S.days.push(today);
  updateUnlocks();
  const xp = xpTotal(); const lv = levelOf(xp);
  if (xp > prevXp) toast(`+${xp - prevXp} XP`);
  if (lv.i > prevLevel) toast(`Novo nível: ${lv.cur.nome}`, 'lv');
  for (const b of earnedBadges()) if (!S.badges[b]) { S.badges[b] = Date.now(); const i = badgeInfo(b); if (i) toast(`Conquista: ${i.nome}`); }
  save(); render();
}

/* ===== render ===== */
function render() { renderTop(); renderMap(); renderPhase(); }
function renderTop() {
  const xp = xpTotal(), lv = levelOf(xp);
  $('#lvNum').textContent = lv.i + 1; $('#lvName').textContent = lv.cur.nome;
  setW($('#xpFill'), lv.pct); $('#xpBar').setAttribute('aria-valuenow', Math.round(lv.pct));
  $('#xpTxt').textContent = lv.nxt ? `${xp} XP · faltam ${lv.nxt.xp - xp} para ${lv.nxt.nome}` : `${xp} XP · nível máximo!`;
  $('#streak').textContent = streaks().cur;
  $('#missCount').textContent = `${Object.keys(S.done).length}/${MISSOES.size}`;
}
function renderMap() {
  const ol = $('#map'); ol.replaceChildren();
  FASES.forEach((f, i) => {
    const open = isOpen(f), done = isDone(f), pct = phasePct(f);
    const orb = h('span', { class: 'orb', 'aria-hidden': 'true' }, h('i', null, String(i).padStart(2, '0')));
    orb.style.setProperty('--p', pct);
    const btn = h('button', { class: `node ${open ? 'open' : 'lock'}${done ? ' done' : ''}${selected === f.id ? ' sel' : ''}`, 'aria-current': selected === f.id ? 'step' : false,
      'aria-label': `Fase ${i}: ${f.titulo}. ${open ? (done ? 'concluída' : pct + '% das missões') : 'bloqueada'}`, onclick: () => select(f.id, true) },
      orb, h('span', { class: 'nt' }, h('b', null, f.titulo), h('span', null, open ? (done ? 'concluída' : `${missDone(f)}/${f.missoes.length} missões`) : 'bloqueada')));
    ol.append(h('li', null, btn));
  });
}
function renderPhase() {
  const box = $('#phase'); box.replaceChildren();
  const f = FASES.find(x => x.id === selected); if (!f) return;
  const i = FASES.indexOf(f), open = isOpen(f), pct = phasePct(f);
  const bar = h('span'); setW(bar, pct);
  box.append(
    h('div', { class: 'ph-head' }, h('span', { class: 'ph-icon', 'aria-hidden': 'true' }, String(i).padStart(2, '0')),
      h('div', null, h('p', { class: 'mut small' }, `Fase ${i} de ${FASES.length - 1}`), h('h2', null, f.titulo), h('p', { class: 'mut' }, f.subtitulo))),
    h('p', null, h('b', null, 'Objetivo: '), f.objetivo),
    h('div', { class: 'chips' }, ...f.carreiras.map(c => h('span', { class: 'chip' }, c))),
    h('div', { class: 'bar', 'aria-hidden': 'true' }, bar), h('p', { class: 'mut small' }, `${missDone(f)}/${f.missoes.length} missões · checkpoint ${quizAnswered(f)}/${f.checkpoint.length}`));
  if (!open) {
    const prev = FASES[i - 1];
    box.append(h('div', { class: 'lockmsg' }, `Fase bloqueada. Conclua ${T.desbloqueioPct}% das missões de "${prev.titulo}" para liberar. Você já pode ler o conteúdo para se planejar.`));
  }
  box.append(h('h3', null, 'Missões'));
  f.missoes.forEach(m => {
    const done = !!S.done[m.id];
    const cb = h('input', { type: 'checkbox', id: 'cb-' + m.id, checked: done, disabled: !open, 'aria-describedby': 'ds-' + m.id,
      onchange: e => { const px = xpTotal(), pl = levelOf(px).i; if (e.target.checked) S.done[m.id] = Date.now(); else delete S.done[m.id]; afterAction(px, pl); } });
    const tipo = { estudo: 'Estudo', pratica: 'Prática', chefao: 'Chefão' }[m.tipo];
    box.append(h('div', { class: `mis ${m.tipo}${done ? ' feita' : ''}` }, cb,
      h('div', null,
        h('label', { for: 'cb-' + m.id, class: 'mt' }, m.titulo), ' ',
        h('span', { class: 'chip ' + m.tipo }, tipo), ' ', h('span', { class: 'chip xp' }, `+${T.xp[m.tipo]} XP`),
        h('p', { id: 'ds-' + m.id }, m.descricao),
        m.links.length ? h('div', { class: 'links' }, ...m.links.map(([n, u]) => ext(u, n))) : null)));
  });
  box.append(h('h3', null, `Checkpoint (+${T.xp.questao} XP por acerto)`),
    h('p', { class: 'mut small' }, 'Cada questão pode ser respondida uma única vez. Leia a explicação: ela vale mais que o ponto.'));
  f.checkpoint.forEach((q, qi) => box.append(buildQuestion(q, qi, open)));
  const got = isDone(f);
  box.append(h('div', { class: `reward ${got ? 'got' : 'no'}` }, h('span', { class: 'big', 'aria-hidden': 'true' }, f.id.slice(1)),
    h('div', null, h('b', null, got ? `Conquista desbloqueada: ${f.badge.nome}` : `Recompensa da fase: ${f.badge.nome}`),
      h('div', { class: 'mut small' }, got ? `Fase concluída (+${T.xp.bonusFase} XP de bônus).` : `Conclua todas as missões e responda o checkpoint para ganhar a conquista e +${T.xp.bonusFase} XP.`))));
  box.append(h('div', { class: 'navrow' },
    i > 0 ? h('button', { class: 'sec', onclick: () => select(FASES[i - 1].id, true) }, '← ' + FASES[i - 1].titulo) : h('span'),
    i < FASES.length - 1 ? h('button', { class: 'sec', onclick: () => select(FASES[i + 1].id, true) }, FASES[i + 1].titulo + ' →') : h('span')));
}
function buildQuestion(q, qi, open) {
  const ans = S.quiz[q.id]; const name = 'q-' + q.id;
  const fs = h('fieldset', { disabled: !open || !!ans }, h('legend', null, `${qi + 1}. ${q.p}`));
  q.o.forEach((txt, k) => {
    const cls = ans ? (k === q.c ? 'right' : (k === ans.a ? 'wrong' : '')) : '';
    fs.append(h('label', { class: cls }, h('input', { type: 'radio', name, value: k, checked: ans && ans.a === k }), h('span', null, `${'ABCD'[k]}) ${txt}`)));
  });
  const box = h('div', { class: 'q' }, fs);
  if (ans) box.append(h('p', { class: 'exp' }, h('b', { class: ans.ok ? 'ok' : 'no' }, ans.ok ? 'Correto. ' : `Resposta certa: ${'ABCD'[q.c]}. `), q.e));
  else if (open) {
    const err = h('span', { class: 'mut small', role: 'alert' });
    box.append(h('div', { class: 'row' }, h('button', { onclick: () => {
      const sel = box.querySelector(`input[name="${name}"]:checked`);
      if (!sel) { err.textContent = ' Escolha uma alternativa.'; return; }
      const px = xpTotal(), pl = levelOf(px).i; const a = +sel.value;
      S.quiz[q.id] = { a, ok: a === q.c }; afterAction(px, pl);
    } }, 'Responder'), err));
  }
  return box;
}
function select(id, scroll) {
  selected = id; try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// em alguns navegadores */ }
  renderMap(); renderPhase();
  if (scroll && window.matchMedia('(max-width:860px)').matches) $('#phase').scrollIntoView({ block: 'start' });
}

/* ===== toasts ===== */
function toast(msg, kind) {
  const t = h('div', { class: 'toast ' + (kind || '') }, msg); $('#toasts').append(t);
  setTimeout(() => t.remove(), 3800);
}

/* ===== diálogos ===== */
function dialog(...kids) {
  const d = $('#dlg'); d.replaceChildren(...kids, h('div', { class: 'row' }, h('button', { class: 'sec', onclick: () => d.close() }, 'Fechar'))); d.showModal();
}
function openBadges() {
  const got = new Set(earnedBadges());
  const all = [...FASES.map(f => 'fase:' + f.id), ...T.conquistas.map(c => c.id)];
  const { cur, max } = streaks();
  dialog(h('h2', null, 'Conquistas'),
    h('p', { class: 'mut' }, `${all.filter(b => got.has(b)).length} de ${all.length} desbloqueadas · sequência atual ${cur} dia(s), recorde ${max}.`),
    h('div', { class: 'badges' }, ...all.map(b => { const i = badgeInfo(b); const y = got.has(b);
      return h('div', { class: 'bdg ' + (y ? 'yes' : 'no') }, h('span', { class: 'big', 'aria-hidden': 'true' }, i.marca), h('b', null, i.nome), h('small', null, y ? 'Desbloqueada' : i.desc)); })));
}
function openSave() {
  const who = h('input', { type: 'text', maxlength: '60', autocomplete: 'off', value: S.who, placeholder: 'Opcional: só aparece no arquivo exportado',
    oninput: e => { S.who = e.target.value.slice(0, 60); save(); } });
  dialog(h('h2', null, 'Seu progresso'),
    h('p', null, 'O progresso fica salvo ', h('b', null, 'só neste navegador'), '. Se trocar de computador, limpar os dados do navegador ou usar janela anônima, ele não vai junto. Exporte de vez em quando.'),
    h('label', null, 'Nome ou RM (opcional)'), who,
    h('div', { class: 'row' },
      h('button', { onclick: exportJson }, 'Exportar .json'),
      h('button', { class: 'sec', onclick: () => $('#fileIn').click() }, 'Importar .json'),
      h('button', { class: 'sec', onclick: resetAll }, 'Recomeçar do zero')),
    h('p', { class: 'mut small' }, 'O arquivo exportado serve para restaurar seu progresso em outro computador e, se o professor pedir, para ele ver quais conceitos a turma precisa reforçar. Não vale nota.'));
}
function openAbout() {
  const xr = (t, v) => h('tr', null, h('td', null, t), h('td', null, `+${v} XP`));
  dialog(h('h2', null, 'Como funciona'),
    h('p', null, `A trilha tem ${FASES.length} fases. Cada fase tem missões (estudo, prática e chefões, que são os labs da disciplina) e um checkpoint de 3 questões.`),
    h('table', null, h('tr', null, h('th', null, 'Ação'), h('th', null, 'Recompensa')),
      xr('Missão de estudo', T.xp.estudo), xr('Missão prática', T.xp.pratica), xr('Chefão (lab da disciplina)', T.xp.chefao),
      xr('Acerto no checkpoint', T.xp.questao), xr('Fase concluída (bônus)', T.xp.bonusFase)),
    h('p', null, `A próxima fase abre quando você conclui ${T.desbloqueioPct}% das missões da fase atual. Fases bloqueadas podem ser lidas, mas não marcadas.`),
    h('p', null, 'A sequência conta os dias seguidos em que você concluiu ao menos uma missão ou respondeu uma questão.'),
    h('div', { class: 'warn' }, h('b', null, 'Ética: '), 'pratique só no que é seu ou em plataformas feitas para isso (labs, CTFs, VMs). Testar sistemas de terceiros sem autorização é crime (Lei 12.737/2012).'),
    h('h3', null, 'Privacidade'),
    h('p', null, 'Este site não tem servidor, cookies nem rastreamento. Tudo fica no seu navegador; o nome/RM é opcional e só vai no arquivo que você mesmo exportar.'),
    h('h3', null, 'Créditos'),
    h('p', null, 'Conteúdo original, em português, escrito para a turma. A estrutura foi inspirada em: ', ...T.creditos.flatMap(([n, u], k) => [k ? ' e ' : '', ext(u, n)]), '.'));
}

/* ===== exportar / importar ===== */
function exportJson() {
  const xp = xpTotal();
  const items = [
    ...FASES.filter(isOpen).map(f => ({ id: `${f.id} ${f.titulo}`, m: { missoes: missDone(f) === f.missoes.length, checkpoint: quizAnswered(f) === f.checkpoint.length && quizRight(f) >= 2 } })),
    ...Object.entries(S.quiz).map(([id, v]) => ({ id, m: { acerto: v.ok } }))
  ].slice(0, 200);
  const o = { schema: 1, lab: 'roadmap', ts: new Date().toISOString(), mins: null, who: S.who.trim() || null, items,
    extra: { xp, nivel: levelOf(xp).i + 1, missoes: Object.keys(S.done).length, conquistas: earnedBadges().length, sequencia_recorde: streaks().max },
    state: S };
  const b = new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' }); const u = URL.createObjectURL(b);
  const a = h('a', { href: u, download: `roadmap-progresso-${dayKey()}.json` }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
async function importJson(file) {
  if (!file) return;
  if (file.size > 300000) { toast('Arquivo grande demais para ser um progresso válido.'); return; }
  let st = null;
  try { const o = JSON.parse(await file.text()); if (o && o.schema === 1 && o.lab === 'roadmap') st = sanitize(o.state); } catch (e) { /* JSON inválido */ }
  if (!st) { toast('Arquivo inválido: use um .json exportado por este site.'); return; }
  if (!confirm(`Substituir o progresso atual por este arquivo (${Object.keys(st.done).length} missões)?`)) return;
  S = st; for (const b of earnedBadges()) if (!S.badges[b]) S.badges[b] = Date.now(); // sem chuva de toasts
  save(); $('#dlg').close(); render(); toast('Progresso importado.');
}
function resetAll() {
  if (!confirm('Apagar TODO o progresso deste navegador? Exporte antes se quiser guardar.')) return;
  S = blank(); save(); $('#dlg').close(); select(FASES[0].id); renderTop(); toast('Progresso apagado. Boa jornada!');
}

/* ===== início ===== */
T.creditos.forEach(([n, u], k) => { const a = $(k ? '#credB' : '#credA'); if (a) { a.href = u; a.textContent = n; } });
$('#bBadges').addEventListener('click', openBadges);
$('#bSave').addEventListener('click', openSave);
$('#bAbout').addEventListener('click', openAbout);
$('#fileIn').addEventListener('change', e => { importJson(e.target.files[0]); e.target.value = ''; });
updateUnlocks();
{
  const fromHash = FASES.find(f => '#' + f.id === location.hash);
  const next = FASES.find(f => isOpen(f) && !isDone(f)) || FASES[0];
  selected = (fromHash || next).id;
}
render();
if (!Object.keys(S.done).length && !Object.keys(S.quiz).length) openAbout();
