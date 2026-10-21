---
title: Threat Modeling
publish: true
tags: [design, defensivo]
---

**Threat modeling** é parar antes de construir e perguntar: *o que pode dar errado aqui?* É segurança por design, não remendo depois.

## Um roteiro simples

1. O que estamos construindo? (desenhe o fluxo de dados)
2. O que pode dar errado? (entrada hostil, acesso indevido, abuso)
3. O que vamos fazer a respeito? (controles, [[Validação de input]], menor privilégio)
4. Fizemos um bom trabalho? (revisão)

## Por que importa

Quase toda falha do [[OWASP Top 10]] seria barata de evitar se tivesse sido pensada no design. Modelos como STRIDE ajudam, mas a pergunta "o que pode dar errado?" já leva longe.
