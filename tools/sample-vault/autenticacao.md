---
title: Autenticação
publish: true
tags: [web, identidade]
---

**Autenticação** é provar quem você é; autorização é o que você pode fazer depois. Falhas aqui estão no [[OWASP Top 10]] e costumam ser as mais caras.

## Pontos de atenção

- Senhas guardadas com hash forte (bcrypt/argon2), nunca em texto puro.
- **MFA** nas contas que importam.
- Tokens de sessão com expiração e rotação — veja [[JWT]].

## Erros comuns

Deixar o controle de acesso só no cliente, não invalidar a sessão no logout, e confiar em "segurança por obscuridade". Autorização de verdade é sempre no servidor.
