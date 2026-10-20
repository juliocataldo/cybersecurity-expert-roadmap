# Cybersecurity Roadmap

Guia de estudos e trilha gamificada para quem está começando em Cyber Security.

**Acesse:** https://juliocataldo.github.io/cybersecurity-expert-roadmap/

O site tem quatro partes:

| Página | Para quê |
|---|---|
| **Guia** (`index.html`, página principal) | Para **ler**: entender a área, por onde começar (fundamentos → OWASP Top 10 → PortSwigger → TryHackMe → roadmap.sh), onde praticar, como montar um laboratório isolado, cursos, podcasts e canais, certificações e combinados. As coletâneas de ferramentas viraram páginas próprias, reunidas na seção **Recursos**. |
| **Recursos** (`ferramentas.html`, `osint.html`, `ia.html`, `ransomware.html`) | Coletâneas de consulta: ferramentas de análise (SOC/threat intel), OSINT, IA e segurança, e simuladores de ransomware (Blue Team, avançado). Linkadas na seção **Recursos** do guia. |
| **Checklist** (`checklist.html` + `checklist.js`) | **Checklist de Privacidade** interativo: 18 temas, 233 hábitos em 3 níveis (Essencial/Opcional/Avançado), progresso salvo no navegador e export em PDF. Adaptação PT-BR do projeto open source de Alicia Sykes ([personal-security-checklist](https://github.com/Lissy93/personal-security-checklist)), conteúdo sob **CC BY-NC-SA 4.0**. |
| **Trilha** (`trilha.html`) | Para **ir fazendo**: 12 fases, 65 missões, 36 questões de checkpoint, XP, níveis, dias seguidos e conquistas. Progresso salvo só no navegador. |

> Atividade formativa, **sem nota**.

## Como usar a trilha
1. Abra a **Trilha** e comece pela fase **00. Base de lançamento**.
2. Cada fase tem **missões** (estudo, prática e chefões, que são os labs da disciplina) e um **checkpoint** de 3 questões.
3. Marque as missões que concluir e responda o checkpoint. Cada questão só pode ser respondida **uma vez**, então leia a explicação.
4. Conclua **60%** das missões de uma fase para **desbloquear a próxima**.
5. Use **Progresso → Exportar .json** de vez em quando. Se trocar de computador, use **Importar** para continuar de onde parou.

| Ação | XP |
|---|---|
| Missão de estudo | +10 |
| Missão prática | +20 |
| Chefão (lab da disciplina) | +50 |
| Acerto no checkpoint | +10 |
| Fase concluída | +30 de bônus |

Níveis: Recruta → Aprendiz → Sentinela → Analista Jr. → Analista → Especialista → Referência → **Lenda da Cyber**.

## As fases
| # | Fase | Chefões |
|---|---|---|
| 00 | Base de lançamento: ética, lei e laboratório | |
| 01 | Fundamentos de computação | |
| 02 | Redes | |
| 03 | Linux e terminal | |
| 04 | Python para segurança | |
| 05 | Princípios e criptografia | |
| 06 | Segurança de aplicações web | [Threat Modeling Lab](https://github.com/juliocataldo/threat-modeling-lab), [Supply Chain Lab](https://github.com/juliocataldo/supply-chain-lab) |
| 07 | Blue Team e SOC | [SOC Lab 1 e 2](https://github.com/juliocataldo/soc-lab) |
| 08 | Red Team: introdução | |
| 09 | Segurança em nuvem | |
| 10 | Governança, risco e compliance | |
| 11 | Carreira | |

## Ética (leia antes de começar)
Pratique **só** no que é seu ou em plataformas feitas para isso: VMs, labs, CTFs, PortSwigger Academy, TryHackMe, OverTheWire, picoCTF, Juice Shop local e `scanme.nmap.org`.
Invadir dispositivo alheio sem autorização é crime no Brasil (Lei 12.737/2012, art. 154-A do Código Penal).

## Privacidade
O site é estático: não tem servidor, login, cookies nem rastreamento. O progresso fica no `localStorage` do navegador. O nome/RM é opcional e só vai no arquivo que o próprio aluno exportar.

---

## Para o professor

### Editar o guia
O guia é HTML estático em **`index.html`**: cada seção está marcada com um comentário (`<!-- 01 -->`, `<!-- 02 -->`...). Para incluir uma plataforma, copie um `<a class="card">` e troque os textos. As coletâneas com filtro (ferramentas e OSINT) agora são páginas próprias — **`ferramentas.html`** e **`osint.html`** —; para incluir uma ferramenta, copie um `<a class="card tool" data-cat="...">` dentro do bloco certo, com `data-cat` igual a uma das categorias dos botões de filtro (o `guia.js` cuida da busca e do filtro). Na seção 01, cada área tem um botão (`role="tab"`) e um painel (`role="tabpanel"`); o `guia.js` só alterna entre eles e roda o teste rápido. Sem JavaScript, todos os painéis aparecem abertos.

### Editar o checklist
Todo o conteúdo do **Checklist de Privacidade** está no objeto `CHECKLIST` em **`checklist.js`** (18 categorias → itens com `nivel` e descrição). Não renomeie ids já publicados (o progresso é salvo por id). Depois de editar, rode o validador (confere 18 categorias, ids únicos e níveis válidos):
```
node tests/validar-checklist.mjs
```
O conteúdo é adaptado do projeto open source de Alicia Sykes sob **CC BY-NC-SA 4.0**: ao republicar, mantenha o crédito e a mesma licença (uso não comercial).

### Editar a trilha
Todo o conteúdo da trilha está em **`trilha.js`**. Dá para mudar textos, links, XP, níveis, a regra de desbloqueio (`desbloqueioPct`) e acrescentar fases ou missões sem mexer no código.

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
