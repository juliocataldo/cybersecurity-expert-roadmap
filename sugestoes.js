"use strict";
/* Sugestões: monta uma issue do GitHub pré-preenchida a partir do formulário.
   O site é estático e não tem servidor: nada é enviado daqui. */
(function () {
  const REPO = "https://github.com/juliocataldo/cybersecurity-expert-roadmap/issues/new";
  const $ = id => document.getElementById(id);
  const form = $("sugForm");
  if (!form) return;

  // contadores de caracteres
  const bind = (inp, out) => {
    const el = $(inp), o = $(out), max = el.getAttribute("maxlength");
    const upd = () => { o.textContent = `${el.value.length}/${max}`; };
    el.addEventListener("input", upd); upd();
  };
  bind("sugTitle", "sugTitleCount");
  bind("sugDesc", "sugDescCount");

  const err = $("sugErr");
  const fail = msg => { err.textContent = msg; err.hidden = false; };

  $("sugSend").addEventListener("click", () => {
    err.hidden = true;
    const cat = $("sugCat").value;
    const title = $("sugTitle").value.trim();
    const desc = $("sugDesc").value.trim();
    const name = $("sugName").value.trim();
    if (title.length < 5) { fail("Dê um título com pelo menos 5 caracteres."); $("sugTitle").focus(); return; }
    if (desc.length < 10) { fail("Descreva um pouco mais (pelo menos 10 caracteres)."); $("sugDesc").focus(); return; }

    const body =
      `**Categoria:** ${cat}\n\n` +
      `${desc}\n\n` +
      (name ? `— ${name}\n\n` : "") +
      `_Enviado pela página de sugestões do Cyber Expert Guide._`;
    const url = REPO +
      `?title=${encodeURIComponent("[" + cat + "] " + title)}` +
      `&labels=${encodeURIComponent("sugestao")}` +
      `&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener");
  });
})();
