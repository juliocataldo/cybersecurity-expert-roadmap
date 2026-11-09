# Cyber Expert Guide

Guia de estudos e trilha gamificada para quem está começando em Cyber Security.

**Acesse:** https://juliocataldo.github.io/cybersecurity-expert-roadmap/

O site tem estas partes:

| Página | Para quê |
|---|---|
| **Guia** (`index.html`, página principal) | Para **ler**: entender a área, por onde começar (fundamentos → OWASP Top 10 → PortSwigger → TryHackMe → roadmap.sh), onde praticar, como montar um laboratório isolado, cursos, podcasts e canais, certificações e combinados. Canivete suíço e Checklist aparecem como entradas curtas que levam às páginas próprias. |
| **Canivete suíço** (`canivete.html` → `utilidades.html`, `osint.html`, `ransomware.html`) | Página que reúne as coletâneas de consulta: **Ferramentas online** (113 utilidades com filtro em 11 categorias — análise de IOCs, threat intel, malware, OSINT, DNS, redes, SSL, **senhas e credenciais**, **ofensivo/OffSec**, referência e dev), OSINT e simuladores de ransomware (Blue Team, avançado). |
| **HUB Sec** (`solucoes.html` → `solucoes-containers.html`, `solucoes-secrets.html`, `solucoes-ia.html`, `solucoes-pentest-ia.html`) | Ferramentas **open source** de segurança que se instala e opera, por tema e camada de defesa, cada tema com **labs para praticar** (diferente do Canivete, que é consulta rápida). Temas: **containers e Kubernetes** (Trivy, Kubescape, kube-bench, Falco, Tetragon, Tracee, Kubernetes Goat), **gestão de segredos** (OpenBao, WrongSecrets), **IA e segurança** (antes em `ia.html`, que redireciona) e **pentest com IA** (agentes e frameworks, com aviso de dual-use). |
| **Checklist** (`checklist.html` + `checklist.js`) | **Checklist de Privacidade** interativo: 18 temas, 233 hábitos em 3 níveis (Essencial/Opcional/Avançado), progresso salvo no navegador e export em PDF. Adaptação PT-BR do projeto open source de Alicia Sykes ([personal-security-checklist](https://github.com/Lissy93/personal-security-checklist)), conteúdo sob **CC BY-NC-SA 4.0**. |
| **Trilhas** (`trilhas.html` → `trilha.html`) | Hub de caminhos: um **box destacado "Trilha gamificada"** (abre `trilha.html`: 12 fases, 65 missões, checkpoints, XP, níveis e conquistas, progresso no navegador) e as **trilhas por função** (SOC, Pentester, GRC, Cloud, DFIR) com tempo, certs, onde aprender e vídeos do YouTube. |
| **Artigos** (`artigos.html` + `artigo-*.html`) | Estudos de caso de segurança escritos em português, do zero. Primeiro texto: *Como uma câmera IP barata vira porta de entrada* (IoT), inspirado no estudo de Zoltan Balazs, com crédito à fonte. |
| **Roadmaps** (`roadmap.html`) | O **fluxo de Ethical Hacking** (caixas e setas, estilo roadmap.sh): 12 estágios do fundamento ao pentester, cada um com seus temas. SVG inline (cores embutidas, à prova de cache) gerado por `gen_roadmap.py`; conteúdo próprio. (As trilhas por função ficam na aba **Trilhas**.) |
| **Radar** (`radar.html`, gerado por `tools/build-radar-brasil.mjs`; segunda tela `radar-casos.html`, gerada por `tools/build-radar.mjs` via Vexday, com os casos citados e as KEV; `radar-brasil.html` só redireciona) | Primeira tela: **ransomware no mundo, com o Brasil em destaque**, **sem identificar vítimas**. **Mapa-múndi** de menções por país (globo com grade, sem filtros), ranking de países (com menções por milhão de habitantes), Brasil x mundo por setor, grupos mais ativos, **ferramentas e CVEs usados por grupos** (matrizes do BushidoUK), foco no Brasil (mês, setor, grupo, ano) e **mapa do Brasil** com comunicações à ANPD por estado. Fontes: [Ransomware.live](https://www.ransomware.live) (uso não comercial, com atribuição), Banco Mundial (população, CC BY 4.0), Natural Earth (domínio público), BushidoUK (CC BY 4.0), ANPD e IBGE. Código próprio e sem dependências; um GitHub Action diário (`radar-brasil.yml`) atualiza, e uma trava aborta a publicação se aparecer texto fora da lista autorizada, país ou recorte com menos de 3 casos. Dados de apoio versionados em `tools/data/` (`node tools/gen-mapa-mundo.mjs` e `node tools/referencias.mjs` regeneram o mapa e as referências; ANPD é transcrita à mão: veja `tools/ANPD-ATUALIZAR.md` e rode `node tools/anpd.mjs`). |
| **Notícias** (`noticias.html`, gerada por `tools/build-noticias.mjs`) | Terceira tela do Radar. **Destaques comentados** (`tools/data/noticias.json`): o que aconteceu, vetor, impacto de negócio, o que aprender e selo de status (confirmado, relatado pela empresa, alegado, em apuração), sempre com link para a fonte; primeiro destaque: o roubo da Binance (entrevista falsa e IA interna abusada). **Manchetes** do [The Hacker News](https://thehackernews.com), pelo RSS público, atualizadas **1x por dia** pelo Action `noticias.yml`: só título, link e data (nunca o texto da matéria), com histórico de 150 itens em `tools/data/noticias-historico.json`. A trava barra link fora de `thehackernews.com`, texto com marcação e feed cortado. Para adicionar um destaque, edite `noticias.json` (campos validados por `tests/validar-noticias.mjs`). |
| **Teia** (`teia.html` + `teia.js` + `notas/`) | **Segundo cérebro**: grafo interativo das minhas notas (Obsidian) e páginas por nota com backlinks. Gerado por `tools/build-notas.mjs` a partir de um vault de markdown (`publish: true`). Veja "Teia" em *Para o professor*. |
| **Sugestões** (`sugestoes.html` + `sugestoes.js`) | Community board: formulário que gera uma **issue pré-preenchida no GitHub** (o site é estático, sem servidor), onde a comunidade comenta e vota. |

> Atividade formativa, **sem nota**.

**Manutenção do CSS:** os links apontam para `styles.css?v=<hash>` para o navegador não usar um CSS antigo em cache (o servidor guarda por horas). Depois de mexer em `styles.css`, rode `node tools/bump-css.mjs`; `node tests/validar-css-versao.mjs` avisa se esquecer. Os geradores (`build-radar*.mjs`, `build-notas.mjs`) calculam a versão sozinhos.

**CSP:** todas as páginas usam a mesma política (`script-src 'self'` mais o host do Cloudflare Web Analytics, e `connect-src` só para o destino dele), sem `unsafe-inline`. `node tests/validar-csp.mjs` falha se alguma página ou gerador divergir. O script inline que o Cloudflare injeta para detecção de bots (JavaScript Detections) continua bloqueado de propósito: ele muda a cada requisição e só liberaria com `unsafe-inline`.

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
O site é estático: não tem servidor, login, cookies nem rastreamento. O progresso fica no `localStorage` do navegador. O nome é opcional e só vai no arquivo que a própria pessoa exportar.

---

## Para o professor

### Editar o guia
O guia é HTML estático em **`index.html`**: cada seção está marcada com um comentário (`<!-- 01 -->`, `<!-- 02 -->`...). Para incluir uma plataforma, copie um `<a class="card">` e troque os textos. As coletâneas com filtro agora são páginas próprias — **`utilidades.html`** (Ferramentas online) e **`osint.html`** —; para incluir uma ferramenta, copie um `<a class="card tool" data-cat="...">` dentro do bloco certo, com `data-cat` igual a uma das categorias dos botões de filtro (o `guia.js` cuida da busca e do filtro). A `utilidades.html` é gerada pelo script `gen.py` (no scratchpad da sessão) a partir de uma lista curada; dá para editar o HTML direto ou regerar. Na seção 01, cada área tem um botão (`role="tab"`) e um painel (`role="tabpanel"`); o `guia.js` só alterna entre eles e roda o teste rápido. Sem JavaScript, todos os painéis aparecem abertos.

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

### Teia (notas do Obsidian → site)
A página **Teia** (`teia.html`) é um grafo das minhas notas, ligado às páginas em `notas/`. Tudo é gerado por `tools/build-notas.mjs` (Node, zero dependências) a partir de um vault de markdown.

**Rodar local:** `node tools/build-notas.mjs` — lê de `./vault/` (ignorado no git) ou, se não existir, de `tools/sample-vault/` (notas de exemplo). Gera `teia-data.js` e `notas/*.html`. Só entram notas com `publish: true` no frontmatter. Suporta `# títulos`, listas, `**negrito**`/`*itálico*`/`` `código` ``, blocos ```` ``` ````, citações, links e **`[[wikilinks]]`** (e `[[Nota|texto]]`); as tags vêm do frontmatter.

**Publicar do Obsidian (sem terminal):**
1. Crie um repositório **`notas-cyber`** no GitHub (público; se privado, veja abaixo).
2. No Obsidian: **Community plugins → Obsidian Git**; aponte o remote para esse repo e ligue o backup automático (ou use "Backup now"). Publicar = salvar.
3. Marque as notas públicas com frontmatter:
   ```
   ---
   title: Minha nota
   publish: true
   tags: [web, defensivo]
   ---
   ```
4. O Action `/.github/workflows/notas.yml` puxa o `notas-cyber` para `vault/`, roda o gerador e commita `teia-data.js` + `notas/`. Ele dispara manualmente, a cada 6h e quando o repo de notas avisar.
5. **(opcional) Atualização instantânea:** no `notas-cyber`, adicione um workflow que chama o `repository_dispatch` do site ao dar push (precisa de um PAT no secret `SITE_DISPATCH_TOKEN`):
   ```yaml
   on: { push: { branches: [main] } }
   jobs:
     ping:
       runs-on: ubuntu-latest
       steps:
         - run: |
             curl -X POST -H "Authorization: token ${{ secrets.SITE_DISPATCH_TOKEN }}" \
               -H "Accept: application/vnd.github+json" \
               https://api.github.com/repos/juliocataldo/cybersecurity-expert-roadmap/dispatches \
               -d '{"event_type":"notas-update"}'
   ```
6. **Repo de notas privado:** no `notas.yml`, descomente a linha `token: ${{ secrets.NOTAS_TOKEN }}` e crie o secret `NOTAS_TOKEN` (PAT com leitura do repo de notas).

> Só as notas `publish: true` saem. O resto do vault (privado) nunca é publicado — o `vault/` fica no `.gitignore`.

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
Conteúdo original, em português. A estrutura de fases foi inspirada em:
- [Cybersecurity Mastery Roadmap](https://github.com/Hamed233/Cybersecurity-Mastery-Roadmap), de Hamed233
- [CyberSecurity RoadMap](https://jansen-moreira.notion.site/CyberSecurity-RoadMap-1123f61008cd806e9ae8d6c57bc5d2d9), de Jansen Moreira

Os links de estudo apontam para os sites oficiais de cada projeto, plataforma ou norma.
