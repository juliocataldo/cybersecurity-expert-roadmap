---
title: O backdoor no xz-utils: meio segundo que salvou a internet
publish: true
date: 2026-11-22
eyebrow: Artigo · estudo de caso
categoria: Estudo de caso · Supply chain
resumo: Dois anos de engenharia social para virar mantenedor de uma biblioteca que quase todo Linux usa, um backdoor escondido no pacote de release e um engenheiro que desconfiou de um login 500 ms mais lento.
pagina: Backdoor no xz-utils
descricao: Estudo de caso do CVE-2024-3094: como o backdoor no xz-utils foi plantado com engenharia social, escondido no tarball de release e descoberto por acaso, e o que ele ensina sobre supply chain.
meta: Leitura de ~8 min · tema: supply chain de software e open source. Baseado no aviso original de [Andres Freund (oss-security, 29/03/2024)](https://www.openwall.com/lists/oss-security/2024/03/29/4) e na [linha do tempo de Russ Cox](https://research.swtch.com/xz-timeline).
credito: Fontes: [aviso de Andres Freund na oss-security](https://www.openwall.com/lists/oss-security/2024/03/29/4), [CVE-2024-3094 no NVD](https://nvd.nist.gov/vuln/detail/CVE-2024-3094), [alerta da CISA](https://www.cisa.gov/news-events/alerts/2024/03/29/reported-supply-chain-compromise-affecting-xz-utils-data-compression-library-cve-2024-3094) e [linha do tempo de Russ Cox](https://research.swtch.com/xz-timeline). Texto escrito do zero, com foco em defesa; não reproduz o funcionamento do payload.
---

Em março de 2024, um engenheiro chamado Andres Freund percebeu que o login por SSH numa máquina de testes estava um pouco mais lento: cerca de meio segundo a mais, e com o processador trabalhando mais do que devia. Muita gente ignoraria. Ele foi atrás e encontrou um **backdoor** plantado no xz-utils, uma biblioteca de compressão que está em praticamente toda distribuição Linux. O caso virou o [CVE-2024-3094](https://nvd.nist.gov/vuln/detail/CVE-2024-3094), com nota máxima (10.0) no [CVSS](glossario.html#g-cvss).

O ataque não explorou um bug. Ele explorou **pessoas e processos**: levou mais de dois anos, mirou um projeto mantido por uma pessoa só e quase chegou às versões estáveis das principais distribuições. É o exemplo mais claro de ataque de [supply chain](glossario.html#g-supply-chain) em open source até hoje.

# Como foi descoberto

Freund trabalhava com PostgreSQL e fazia testes de desempenho no Debian *sid*, a versão de desenvolvimento do Debian. Ele notou três coisas que não fechavam:

- logins por SSH, mesmo com usuário inexistente, gastando CPU demais;
- um login que levava cerca de 0,3 segundo passando a levar 0,8 segundo;
- erros estranhos do `valgrind`, uma ferramenta que procura problemas de memória.

Ao rastrear a causa, ele chegou à `liblzma`, parte do xz-utils, nas versões **5.6.0** e **5.6.1**. Em 28 de março avisou o time de segurança do Debian e a lista privada das distribuições. No dia 29 publicou o aviso na lista [oss-security](https://www.openwall.com/lists/oss-security/2024/03/29/4), e a CISA emitiu um alerta no mesmo dia.

# Dois anos de engenharia social

O xz-utils era mantido praticamente por uma pessoa, Lasse Collin, como trabalho voluntário. É o cenário que o atacante procurou.

- **Outubro de 2021:** uma conta chamada **Jia Tan** manda a primeira contribuição, um arquivo de configuração inofensivo.
- **2022:** Jia Tan segue contribuindo com patches úteis. Ao mesmo tempo, outras contas (Jigar Kumar e Dennis Ens), sem histórico na comunidade e hoje tidas como parte da mesma operação, passam a cobrar o mantenedor em público: o projeto estaria parado, ele deveria passar a responsabilidade adiante. Uma das mensagens dizia que nada ia avançar "enquanto não houver um novo mantenedor".
- **Final de 2022:** Jia Tan ganha acesso de commit ao repositório.
- **2023:** Jia Tan passa a publicar releases.
- **Fevereiro e março de 2024:** saem as versões 5.6.0 e 5.6.1, já com o backdoor.

Repare no método: confiança construída devagar, com trabalho de verdade, e pressão sobre um voluntário cansado. É [engenharia social](glossario.html#g-engenharia-social) aplicada a um projeto inteiro, não a uma pessoa clicando num link.

# Como o backdoor se escondia

Sem entrar no funcionamento do payload, vale entender **onde** ele estava, porque é isso que muda a forma de defender:

- **Nos arquivos de teste.** O código malicioso foi guardado, disfarçado, dentro de dois arquivos binários de teste (`.xz` e `.lzma`) commitados no repositório. Arquivo de teste binário quase ninguém revisa.
- **Só no pacote de release.** A peça que ativava tudo era uma linha num script de build (`build-to-host.m4`) que existia **apenas no tarball** publicado como release, e não no código do repositório git. Quem revisasse o git não via; quem baixasse o pacote "oficial", recebia.
- **Num caminho indireto até o SSH.** O OpenSSH não usa a `liblzma`. Mas várias distribuições aplicam um patch no OpenSSH para integrá-lo ao systemd, e a `libsystemd` usa a `liblzma`. Por esse caminho, o código malicioso entrava no processo do `sshd` e interceptava a verificação de chaves RSA no login.
- **Só para o dono da chave.** Segundo as análises publicadas depois, o backdoor só obedecia a quem tivesse uma chave privada específica do atacante. Para qualquer outra pessoa, o SSH funcionava normalmente. Era um acesso remoto exclusivo, sem senha, a servidores do mundo todo.

# Quem foi afetado

Pouca gente, por sorte e por timing. As versões 5.6.0 e 5.6.1 tinham chegado principalmente a versões de teste e de desenvolvimento: Debian *sid* e *testing*, Fedora Rawhide e o beta do Fedora 40, openSUSE Tumbleweed e Kali, entre outras. As versões estáveis das grandes distribuições ainda não tinham recebido o pacote. A recomendação da CISA foi voltar para uma versão sem o código malicioso, como a 5.4.6.

Se o backdoor tivesse sobrevivido mais alguns meses, teria entrado nas versões estáveis e em milhões de servidores.

# O que aprender

**Se você mantém software:**

- **O que você publica precisa bater com o repositório.** Build reproduzível e geração do pacote de release pelo próprio pipeline, a partir do git, eliminam a diferença entre "o que foi revisado" e "o que foi entregue".
- **Binário no repositório é ponto cego.** Arquivos de teste binários merecem a mesma desconfiança que código.
- **Acesso de mantenedor é privilégio.** Conceder commit e publicação a alguém é decisão de segurança, não só de comunidade.

**Se você consome software (ou seja, todo mundo):**

- **Saiba o que você usa.** Um [SBOM](glossario.html#g-sbom) e uma ferramenta de [SCA](glossario.html#g-sca) mostram em minutos se a versão afetada está no seu ambiente. Foi a primeira pergunta de todo time de segurança naquela sexta-feira.
- **Não rode o mais novo em produção só por ser novo.** O atraso entre o lançamento e a chegada às versões estáveis foi o que salvou a maioria dos servidores.
- **Dependência indireta também é dependência.** O SSH foi atingido por uma biblioteca que ele nem usava diretamente.

**Se você defende ambientes:**

- **Desempenho é sinal de segurança.** O alerta foi meio segundo de atraso e CPU alta. Monitorar o comportamento normal dos serviços críticos é o que permite notar o anormal.
- **Curiosidade é uma ferramenta.** Freund não estava caçando ameaças. Ele só não aceitou uma explicação que não fechava.

**Para todos:** boa parte da internet depende de projetos mantidos por poucas pessoas, de graça. Financiar, contribuir e dividir a manutenção desses projetos também é segurança.

# Para ir além

- No glossário: [supply chain](glossario.html#g-supply-chain), [SBOM](glossario.html#g-sbom), [SCA](glossario.html#g-sca) e [DevSecOps](glossario.html#g-devsecops).
- No DevSecOps Expert Guide: as [ferramentas de supply chain](devsecops/ferramentas.html#f-supply) e os [gates do pipeline](devsecops/pipeline.html#dso-gates).
- Na trilha gamificada: o chefão de supply chain da [fase 06](trilha.html#F06).
