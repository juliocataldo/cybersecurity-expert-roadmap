"use strict";
/* Tema claro/escuro. Padrão: escuro (a identidade do site). O botão ☀/☾ entra no cabeçalho e a escolha fica
   guardada neste navegador (localStorage), só como conveniência: sem storage, o site abre no escuro e funciona igual.
   Carregado no <head>, antes de pintar a página, para não piscar escuro antes de ficar claro. Sem dependências. */
(function () {
  var CHAVE = "tema", raiz = document.documentElement;
  function ler() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem(CHAVE, v); } catch (e) { /* modo privado: só não lembra */ } }
  function claro() { return raiz.getAttribute("data-theme") === "light"; }
  function aplicar(t) { if (t === "claro") raiz.setAttribute("data-theme", "light"); else raiz.removeAttribute("data-theme"); }
  aplicar(ler());

  function montar() {
    var header = document.querySelector("header.site");
    if (!header || header.querySelector(".tema-btn")) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "tema-btn";
    function rotular() {
      var rotulo = claro() ? "Usar tema escuro" : "Usar tema claro";
      b.textContent = claro() ? "☾" : "☀"; // ☾ no claro (volta ao escuro), ☀ no escuro
      b.setAttribute("aria-label", rotulo); b.title = rotulo;
    }
    rotular();
    b.addEventListener("click", function () {
      var novo = claro() ? "escuro" : "claro";
      aplicar(novo); gravar(novo); rotular();
    });
    header.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar); else montar();
})();
