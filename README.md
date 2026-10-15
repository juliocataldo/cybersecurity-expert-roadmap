# 🛡️ Cybersecurity Expert Roadmap

Trilha **gamificada** de Cyber Security para estudantes do 1º ano: 12 fases, 62 missões, 36 questões de checkpoint, XP, níveis, sequência de dias e conquistas.

**👉 Acesse:** https://juliocataldo.github.io/cybersecurity-expert-roadmap/

> Atividade formativa, **sem nota**. Seu progresso fica salvo **só no seu navegador**.

## Como jogar
1. Abra o site e comece pela fase **0. Base de lançamento**.
2. Cada fase tem **missões** (📖 estudo, 🛠️ prática e 👾 chefões, que são os labs da disciplina) e um **checkpoint** de 3 questões.
3. Marque as missões que concluir e responda o checkpoint. Cada questão só pode ser respondida **uma vez**, então leia a explicação.
4. Conclua **60%** das missões de uma fase para **desbloquear a próxima**.
5. Use **💾 Progresso → Exportar .json** de vez em quando. Se trocar de computador, use **Importar** para continuar de onde parou.

| Ação | XP |
|---|---|
| 📖 Missão de estudo | +10 |
| 🛠️ Missão prática | +20 |
| 👾 Chefão (lab da disciplina) | +50 |
| ✔ Acerto no checkpoint | +10 |
| 🏁 Fase concluída | +30 de bônus |

Níveis: Recruta → Aprendiz → Sentinela → Analista Jr. → Analista → Especialista → Referência → **Lenda da Cyber**.

## As fases
| # | Fase | Chefões |
|---|---|---|
| 0 | 🚀 Base de lançamento: ética, lei e laboratório | |
| 1 | 💻 Fundamentos de computação | |
| 2 | 🌐 Redes | |
| 3 | 🐧 Linux e terminal | |
| 4 | 🐍 Python para segurança | |
| 5 | 🔐 Princípios e criptografia | |
| 6 | 🕸️ Segurança de aplicações web | [Threat Modeling Lab](https://github.com/juliocataldo/threat-modeling-lab), [Supply Chain Lab](https://github.com/juliocataldo/supply-chain-lab) |
| 7 | 🛡️ Blue Team e SOC | [SOC Lab 1 e 2](https://github.com/juliocataldo/soc-lab) |
| 8 | 🗡️ Red Team: introdução | |
| 9 | ☁️ Segurança em nuvem | |
| 10 | 📋 Governança, risco e compliance | |
| 11 | 🎓 Carreira | |

## Ética (leia antes de começar)
Pratique **só** no que é seu ou em plataformas feitas para isso: VMs, labs, CTFs, PortSwigger Academy, TryHackMe, OverTheWire, picoCTF, Juice Shop local e `scanme.nmap.org`.
Invadir dispositivo alheio sem autorização é crime no Brasil (Lei 12.737/2012, art. 154-A do Código Penal).

## Privacidade
O site é estático: não tem servidor, login, cookies nem rastreamento. O progresso fica no `localStorage` do navegador. O nome/RM é opcional e só vai no arquivo que o próprio aluno exportar.

---

## Para o professor

### Editar a trilha
Todo o conteúdo está em **`trilha.js`**. Dá para mudar textos, links, XP, níveis, a regra de desbloqueio (`desbloqueioPct`) e acrescentar fases ou missões sem mexer no código.

- **Não renomeie ids já publicados** (`F03-M2`, `F03-Q1`...). O progresso dos alunos é salvo por id.
- Para incluir uma missão, use o próximo id livre da fase (ex.: `F03-M6`).
- Depois de editar, rode o validador. Ele confere ids, gabarito (equilíbrio entre A/B/C/D e viés de tamanho da alternativa certa) e links:
  ```
  node tests/validar-trilha.mjs
  ```

### Ver o progresso da turma
O arquivo exportado pelo aluno usa o mesmo formato (`schema: 1`, `lab: "roadmap"`) dos labs. No painel da turma, ele mostra quais fases foram concluídas e **quais questões a turma mais errou**.

O progresso é autodeclarado (o aluno marca as missões), então serve para diagnóstico, não para nota.

### Publicação
GitHub Pages servindo a branch `main`, pasta raiz. O arquivo `.nojekyll` desliga o processamento do Jekyll.

## Próximos passos (no radar)
- [ ] Fases avançadas: análise de malware, threat intelligence, forense digital, mobile, IoT/ICS
- [ ] Ramificações por especialização depois da fase 6 (Blue, Red, GRC, Cloud)
- [ ] Banco maior de questões, sorteadas por aluno
- [ ] Verificação automática de links quebrados (GitHub Actions)
- [ ] Ranking opcional da turma, com backend (Apps Script) e avaliação de LGPD
- [ ] Certificado de conclusão da trilha

## Créditos
Conteúdo original, em português, escrito para a turma de Cyber Security da FIAP. A estrutura de fases foi inspirada em:
- [Cybersecurity Mastery Roadmap](https://github.com/Hamed233/Cybersecurity-Mastery-Roadmap), de Hamed233
- [CyberSecurity RoadMap](https://jansen-moreira.notion.site/CyberSecurity-RoadMap-1123f61008cd806e9ae8d6c57bc5d2d9), de Jansen Moreira

Os links de estudo apontam para os sites oficiais de cada projeto, plataforma ou norma.
