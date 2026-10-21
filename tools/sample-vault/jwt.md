---
title: JWT
publish: true
tags: [web, identidade]
---

**JWT (JSON Web Token)** é um token assinado que carrega informações da sessão. Usado em APIs e logins modernos, ligado a [[Autenticação]].

## Boas práticas

- Fixe o algoritmo de assinatura no servidor (evite `alg: none` e confusão de algoritmo).
- Valide **expiração**, **issuer** e **audience**.
- Não guarde dado sensível no payload — ele é apenas codificado, não criptografado.

## Pegadinha

JWT não é "mais seguro" por padrão; é só um formato. A segurança vem de como você assina, valida e expira. Guardar o token com cuidado também conta.
