---
title: SQL Injection
publish: true
tags: [web, ofensivo]
---

**SQL Injection (SQLi)** acontece quando uma entrada do usuário é concatenada direto numa query SQL. O atacante fecha a string e injeta seu próprio SQL. É um dos itens mais antigos do [[OWASP Top 10]].

## Exemplo mental

Uma busca que monta `... WHERE nome = '` + input + `'` deixa o input virar lógica: `' OR '1'='1` transforma a condição em sempre verdadeira.

## Defesa

A correção real não é "filtrar aspas", é usar **queries parametrizadas** (prepared statements): o banco trata o input como dado, nunca como código. Isso se liga diretamente a [[Validação de input]] — valide no servidor, sempre.
