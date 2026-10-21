---
title: Validação de input
publish: true
tags: [web, defensivo]
---

Regra de ouro: **todo input é hostil**. [[SQL Injection]], [[XSS]] e boa parte do [[OWASP Top 10]] nascem de confiar em dado que veio de fora.

## Como fazer certo

- Valide no **servidor** (o cliente é só conveniência, não defesa).
- Prefira **allowlist** (o que é permitido) a blocklist (o que é proibido).
- Trate cada saída no contexto dela: query parametrizada para banco, encoding para HTML.

Isso conversa direto com [[Threat Modeling]]: se você mapeia de onde vem cada dado, fica óbvio onde validar.
