---
title: XSS
publish: true
tags: [web, ofensivo]
---

**Cross-Site Scripting (XSS)** é quando a aplicação devolve input do usuário sem tratar, e o navegador executa isso como HTML/JavaScript. Está no [[OWASP Top 10]] desde sempre.

## Tipos

- **Refletido** — o payload vem na requisição e volta na resposta.
- **Armazenado** — o payload fica salvo (num comentário, por exemplo) e atinge todo mundo que abre a página.
- **DOM** — acontece no próprio JavaScript do cliente.

## Defesa

Faça **output encoding** no contexto certo (HTML, atributo, JS) e aplique uma Content Security Policy. Como quase tudo em web, começa em [[Validação de input]] e termina em tratar toda saída como potencialmente perigosa.
