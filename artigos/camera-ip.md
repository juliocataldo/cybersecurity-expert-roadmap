---
title: Como uma câmera IP barata vira porta de entrada
publish: true
date: 2026-10-20
eyebrow: Artigo · estudo de caso
categoria: Estudo de caso · IoT
resumo: Backdoor, command injection e credenciais em texto puro num dispositivo de prateleira — e as lições de segurança por design que ficam do caso.
listar: false
pagina: Câmera IP: porta de entrada
descricao: Estudo de caso: como uma câmera IP barata vira porta de entrada. Vulnerabilidades de IoT (backdoor, command injection, texto puro) e as lições de segurança por design.
meta: Leitura de ~6 min · tema: segurança em IoT, por design. Inspirado no estudo de [Zoltan Balazs (2015)](https://jumpespjump.blogspot.com/2015/09/how-i-hacked-my-ip-camera-and-found.html); texto escrito do zero, com foco nas lições de defesa.
credito: Crédito: a pesquisa original é de [Zoltan Balazs — "How I hacked my IP camera, and found this backdoor account"](https://jumpespjump.blogspot.com/2015/09/how-i-hacked-my-ip-camera-and-found.html). Este texto é um resumo educacional escrito do zero, com foco em defesa; não reproduz o passo a passo de exploração.
---

Uma câmera IP de poucos reais parece inofensiva. Mas, em 2015, o pesquisador Zoltan Balazs comprou uma dessas câmeras, abriu a tampa (de software) e encontrou quase todos os erros de segurança que um dispositivo pode cometer. O modelo provável era uma Eminent EM6220, mas o ponto importante é outro: o firmware usava um SDK (baseado no servidor web GoAhead) compartilhado por **dezenas de fabricantes**. Ou seja, a mesma falha se repetia em muitos produtos com marcas diferentes. Dois anos depois, esse conjunto de problemas virou o **CVE-2017-5674** e combustível para botnets de câmeras como a Persirai.

Não é um manual de ataque. É o contrário: um mapa dos erros para você **não** repetir quando for construir, comprar ou defender um dispositivo conectado.

# O que estava errado

A câmera acumulava falhas em todas as camadas — exatamente o tipo de coisa que um threat model simples ("o que pode dar errado?") teria pego:

- **Senha fraca de fábrica.** O acesso web era protegido por um PIN de 4 dígitos numéricos: dez mil combinações, trivial de adivinhar.
- **Credenciais em texto puro.** O aplicativo mandava usuário e senha em **cada** requisição HTTP (porta 81), sem TLS. Quem estivesse na mesma rede lia tudo.
- **Segredos mal guardados.** O app de desktop salvava a senha em texto puro num arquivo local.
- **Serviço escondido.** Um `nmap` revelou um telnet (BusyBox) na porta 23 que o manual nem mencionava.
- **Conta backdoor.** Havia um usuário `root` com uma senha padrão fraca, não documentada e impossível de trocar de forma permanente pela interface. Reiniciar a câmera restaurava a senha de fábrica.
- **Command injection.** A função de "enviar foto por FTP" copiava o campo de senha, sem tratamento, para dentro de um script de shell. Caracteres especiais no campo viravam comandos executados pelo sistema.
- **Nuvem sem criptografia.** Para funcionar sem configurar o roteador, a câmera falava com servidores externos por UDP, em texto puro, identificada por um ID — acessível de fora.
- **Tudo como root.** Os serviços rodavam com privilégio máximo, então qualquer falha virava controle total.
- **Exposição automática.** Via UPnP, a porta web podia ser aberta para a internet sem o dono perceber.

# Como os erros se encadeiam

Nenhuma dessas falhas precisa de mágica. Em alto nível, a história é sempre a mesma: observar o tráfego mostra as credenciais e as portas; uma varredura revela o serviço que não deveria existir; um campo que aceita qualquer texto e cai num shell dá execução de comandos; e, porque tudo roda como root, esse comando lê as senhas de Wi-Fi, e-mail e FTP guardadas no aparelho. O `/etc/passwd` ainda por cima guardava um hash de uma senha comum, dessas que qualquer lista pública quebra em segundos.

O resultado prático: um aparelho dentro da sua casa que um estranho controla, enxerga a sua rede e serve de trampolim para o resto dela.

# Por que isso ainda importa

Esse caso é de 2015, mas o roteiro não envelheceu. Botnets como Mirai e Persirai cresceram justamente varrendo a internet atrás de telnet aberto e **senhas padrão** — pares como `root:xc3511` e `root:vizxv` que vêm de fábrica em milhares de dispositivos. Câmera, babá eletrônica, DVR, roteador: o que não é atualizado e usa credencial de fábrica continua sendo recrutado para ataques até hoje.

# As lições (que valem para quem cria e para quem usa)

## Se você constrói o produto

- **Nada de credencial hardcoded ou backdoor.** Cada aparelho nasce com uma senha única, gerada na primeira configuração, e o dono precisa conseguir trocá-la de verdade.
- **Nunca monte comando de shell com entrada do usuário.** Use APIs que não passam por shell, valide no servidor e trabalhe com allowlist. Todo input é hostil.
- **Criptografe tudo** com TLS e não mande senha em URL, header ou texto puro. Proteja os segredos em repouso num cofre, não num arquivo aberto.
- **Menor privilégio:** serviço nenhum deveria rodar como root. Desligue o que não é usado (telnet, UPnP).
- **Tenha um canal de atualização** confiável e assine o firmware. E faça **threat modeling** antes de lançar: pergunte o que um input malicioso ou um acesso remoto poderiam causar.

## Se você só usa o aparelho

- Troque a senha de fábrica no primeiro uso e, se der, desligue acesso remoto e UPnP.
- Coloque câmeras e dispositivos IoT numa **rede separada** (ou na rede de convidados), longe do computador e do celular.
- Mantenha o firmware atualizado e desconfie de aparelhos que nunca recebem atualização.

# Para ir além

Os mesmos princípios aparecem em padrões que valem como baseline: [OWASP IoT Top 10](https://owasp.org/www-project-internet-of-things/), [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) e o [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework). E, na trilha, o tema conecta com a [Fase 05 (princípios e criptografia)](trilha.html#F05) e a ideia de **defense in depth**.
