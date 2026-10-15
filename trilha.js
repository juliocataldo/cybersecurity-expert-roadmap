/* =====================================================================
   Cybersecurity Expert Roadmap - CONTEÚDO DA TRILHA
   Este é o único arquivo que o professor precisa editar para mudar a trilha.

   Regras (o teste em tests/validar-trilha.mjs confere tudo isso):
   - ids são estáveis: NÃO renomeie o id de uma missão/questão já publicada,
     senão o progresso salvo dos alunos para aquele item se perde.
   - tipo da missão: 'estudo' | 'pratica' | 'chefao'
   - checkpoint: 3 questões por fase; "c" é o índice (0-3) da alternativa certa.
     Mantenha as respostas certas espalhadas entre A, B, C e D.
   - links: apenas https (exceto sites que só existem em http, marcados).
   ===================================================================== */
const TRILHA = {
  versao: 1,
  titulo: 'Cybersecurity Expert Roadmap',
  /* % de missões de uma fase necessárias para desbloquear a próxima */
  desbloqueioPct: 60,
  xp: { estudo: 10, pratica: 20, chefao: 50, questao: 10, bonusFase: 30 },
  niveis: [
    { xp: 0,    nome: 'Recruta' },
    { xp: 100,  nome: 'Aprendiz' },
    { xp: 250,  nome: 'Sentinela' },
    { xp: 450,  nome: 'Analista Jr.' },
    { xp: 700,  nome: 'Analista' },
    { xp: 1000, nome: 'Especialista' },
    { xp: 1400, nome: 'Referência' },
    { xp: 1900, nome: 'Lenda da Cyber' }
  ],

  fases: [
  /* ------------------------------------------------------------------ */
  { id: 'F00', titulo: 'Base de lançamento',
    subtitulo: 'Ética, lei e o seu laboratório',
    objetivo: 'Entender os limites legais e éticos da profissão e montar um ambiente seguro para praticar.',
    carreiras: ['Todas: ética é pré-requisito de qualquer área'],
    badge: { nome: 'Código de conduta' },
    missoes: [
      { id: 'F00-M1', tipo: 'estudo', titulo: 'Leia a Lei 12.737/2012 (Lei Carolina Dieckmann)',
        descricao: 'Ela criou o art. 154-A do Código Penal: invadir dispositivo alheio sem autorização é crime. Anote o que caracteriza a conduta.',
        links: [['Lei 12.737/2012 (Planalto)', 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12737.htm']] },
      { id: 'F00-M2', tipo: 'estudo', titulo: 'LGPD em 15 minutos',
        descricao: 'Leia o art. 5º da LGPD e diferencie dado pessoal de dado pessoal sensível. Você vai lidar com isso em todo incidente.',
        links: [['LGPD - Lei 13.709/2018 (Planalto)', 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm']] },
      { id: 'F00-M3', tipo: 'pratica', titulo: 'Monte seu laboratório com uma máquina virtual',
        descricao: 'Instale o VirtualBox e crie uma VM Linux (Ubuntu ou Kali). Tire um snapshot limpo: é o seu botão de "desfazer".',
        links: [['VirtualBox', 'https://www.virtualbox.org/'], ['Ubuntu Desktop', 'https://ubuntu.com/download/desktop'], ['Kali Linux', 'https://www.kali.org/get-kali/']] },
      { id: 'F00-M4', tipo: 'pratica', titulo: 'Crie sua conta de prática',
        descricao: 'Crie uma conta gratuita no TryHackMe e explore o caminho "Pre Security". Use um e-mail pessoal, não o institucional.',
        links: [['TryHackMe', 'https://tryhackme.com/']] },
      { id: 'F00-M5', tipo: 'estudo', titulo: 'Monte seu caderno de estudos',
        descricao: 'Crie um repositório no GitHub ou um cofre no Obsidian para registrar o que aprender. Ele vira seu portfólio na fase de carreira.',
        links: [['GitHub', 'https://github.com/'], ['Obsidian', 'https://obsidian.md/']] }
    ],
    checkpoint: [
      { id: 'F00-Q1', p: 'O que torna um teste de invasão legítimo?',
        o: ['Usar só ferramentas gratuitas e conhecidas', 'Não causar nenhum dano ao sistema testado', 'Autorização expressa do responsável, com escopo definido', 'Avisar o administrador depois de terminar o teste'],
        c: 2, e: 'Sem autorização prévia e escopo combinado, o teste é invasão. Ferramenta, ausência de dano ou aviso posterior não mudam isso.' },
      { id: 'F00-Q2', p: 'Pela LGPD, qual destes é um dado pessoal SENSÍVEL?',
        o: ['A impressão digital de uma pessoa', 'O nome completo de uma pessoa', 'O e-mail pessoal de uma pessoa', 'O CNPJ de uma empresa'],
        c: 0, e: 'Dado biométrico é sensível (art. 5º, II). Nome e e-mail são dados pessoais comuns; CNPJ identifica empresa, não pessoa.' },
      { id: 'F00-Q3', p: 'Por que praticar dentro de uma máquina virtual?',
        o: ['Porque a VM deixa o computador mais rápido', 'Porque as ferramentas de segurança só rodam em VM', 'Porque a VM dispensa a autorização para testar', 'Porque isola o laboratório e permite voltar a um snapshot'],
        c: 3, e: 'A VM separa o laboratório do seu sistema principal e o snapshot permite desfazer qualquer estrago. Ela não dispensa autorização.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F01', titulo: 'Fundamentos de computação',
    subtitulo: 'Hardware, sistema operacional e privilégios',
    objetivo: 'Saber o que é um processo, um serviço e uma conta, e por que privilégio demais é risco.',
    carreiras: ['Suporte e infraestrutura', 'Base para SOC e forense'],
    badge: { nome: 'Peça por peça' },
    missoes: [
      { id: 'F01-M1', tipo: 'estudo', titulo: 'Como um computador funciona',
        descricao: 'Assista às primeiras aulas do CS50 (legendas em português): bits, memória e como o software conversa com o hardware.',
        links: [['CS50 - Harvard (gratuito)', 'https://cs50.harvard.edu/x/']] },
      { id: 'F01-M2', tipo: 'estudo', titulo: 'Binário e hexadecimal',
        descricao: 'Converta à mão 10, 255 e 4096 para binário e hexadecimal e confira no CyberChef. Redes e cripto usam isso o tempo todo.',
        links: [['CyberChef', 'https://gchq.github.io/CyberChef/']] },
      { id: 'F01-M3', tipo: 'pratica', titulo: 'Investigue os processos do Windows',
        descricao: 'Abra o Process Explorer, escolha 5 processos e descubra o que cada um faz, quem o iniciou e de qual pasta ele roda.',
        links: [['Process Explorer (Sysinternals)', 'https://learn.microsoft.com/sysinternals/downloads/process-explorer']] },
      { id: 'F01-M4', tipo: 'pratica', titulo: 'Menor privilégio na prática',
        descricao: 'Na sua VM, crie um usuário comum e tente instalar um programa e ler arquivos de outro usuário. Anote o que foi bloqueado e por quê.',
        links: [] },
      { id: 'F01-M5', tipo: 'estudo', titulo: 'Fundamentos de Windows no TryHackMe',
        descricao: 'Faça as salas gratuitas "Windows Fundamentals" (1 a 3): contas, permissões NTFS, serviços e o Windows Defender.',
        links: [['TryHackMe', 'https://tryhackme.com/']] }
    ],
    checkpoint: [
      { id: 'F01-Q1', p: 'O que diz o princípio do menor privilégio?',
        o: ['Toda conta deve ter permissão de administrador', 'Cada conta recebe só as permissões de que precisa', 'Os privilégios devem ser revisados uma vez por ano', 'Somente o time de TI pode ter qualquer permissão'],
        c: 1, e: 'Cada usuário, serviço ou processo recebe apenas o mínimo necessário. Assim, se for comprometido, o estrago é menor.' },
      { id: 'F01-Q2', p: 'Qual a diferença entre programa e processo?',
        o: ['Não há diferença: são dois nomes para a mesma coisa', 'Programa roda na memória; processo fica no disco', 'Processo é sempre malicioso; programa é legítimo', 'Programa é o arquivo; processo é ele em execução'],
        c: 3, e: 'O programa é o arquivo no disco. Ao ser executado, vira um processo na memória, com PID, usuário dono e processo pai.' },
      { id: 'F01-Q3', p: 'Quanto vale o hexadecimal FF em decimal?',
        o: ['255', '256', '15', '100'],
        c: 0, e: 'F vale 15. FF = 15 × 16 + 15 = 255, o maior valor que cabe em 1 byte.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F02', titulo: 'Redes',
    subtitulo: 'Como os dados viajam',
    objetivo: 'Ler um tráfego de rede e entender IP, portas, DNS e HTTP, a base de quase todo alerta de segurança.',
    carreiras: ['Analista de redes', 'SOC', 'Pentest'],
    badge: { nome: 'Farejador de pacotes' },
    missoes: [
      { id: 'F02-M1', tipo: 'estudo', titulo: 'Modelos OSI e TCP/IP',
        descricao: 'Faça o curso gratuito de fundamentos de redes da Cisco Networking Academy e desenhe as camadas com um exemplo de cada.',
        links: [['Cisco Networking Academy', 'https://www.netacad.com/'], ['Professor Messer (vídeos gratuitos)', 'https://www.professormesser.com/']] },
      { id: 'F02-M2', tipo: 'estudo', titulo: 'Endereçamento IP e sub-redes',
        descricao: 'Entenda máscara, CIDR (/24, /16) e as faixas privadas da RFC 1918. Calcule à mão quantos hosts cabem em um /26.',
        links: [['RFC 1918 - endereços privados', 'https://www.rfc-editor.org/rfc/rfc1918']] },
      { id: 'F02-M3', tipo: 'estudo', titulo: 'DNS, HTTP e as portas mais comuns',
        descricao: 'Estude o que acontece quando você digita um endereço no navegador. Decore as portas 22, 53, 80, 443 e 3389 e o que roda nelas.',
        links: [['Cloudflare Learning: o que é DNS', 'https://www.cloudflare.com/learning/dns/what-is-dns/']] },
      { id: 'F02-M4', tipo: 'pratica', titulo: 'Capture tráfego com o Wireshark',
        descricao: 'Capture o tráfego ao abrir um site e encontre a consulta DNS e o three-way handshake do TCP. Capture só a sua própria rede.',
        links: [['Wireshark', 'https://www.wireshark.org/'], ['Capturas de exemplo', 'https://wiki.wireshark.org/SampleCaptures']] },
      { id: 'F02-M5', tipo: 'pratica', titulo: 'Monte uma rede no Packet Tracer',
        descricao: 'Crie duas sub-redes ligadas por um roteador e faça um ping de uma para a outra. O Packet Tracer é gratuito pela NetAcad.',
        links: [['Cisco Packet Tracer', 'https://www.netacad.com/cisco-packet-tracer']] }
    ],
    checkpoint: [
      { id: 'F02-Q1', p: 'Em qual camada do modelo OSI fica o protocolo IP?',
        o: ['Camada 2 - Enlace', 'Camada 4 - Transporte', 'Camada 3 - Rede', 'Camada 7 - Aplicação'],
        c: 2, e: 'O IP faz o endereçamento e o roteamento entre redes: camada 3. TCP e UDP ficam na 4; Ethernet na 2.' },
      { id: 'F02-Q2', p: 'Qual destes endereços é PRIVADO (RFC 1918)?',
        o: ['8.8.8.8', '192.168.0.10', '200.147.3.157', '1.1.1.1'],
        c: 1, e: 'As faixas privadas são 10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16. Elas não são roteadas na internet.' },
      { id: 'F02-Q3', p: 'Qual a sequência do three-way handshake do TCP?',
        o: ['SYN, SYN-ACK, ACK', 'ACK, SYN, FIN', 'SYN, ACK, RST', 'HELLO, KEY, DONE'],
        c: 0, e: 'O cliente envia SYN, o servidor responde SYN-ACK e o cliente confirma com ACK. Só então os dados começam a trafegar.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F03', titulo: 'Linux e terminal',
    subtitulo: 'A linha de comando é sua ferramenta principal',
    objetivo: 'Navegar, buscar e investigar um sistema Linux pelo terminal, incluindo permissões e logs.',
    carreiras: ['SOC', 'Pentest', 'Cloud', 'DevSecOps'],
    badge: { nome: 'Pinguim' },
    missoes: [
      { id: 'F03-M1', tipo: 'estudo', titulo: 'Linux Journey',
        descricao: 'Siga o módulo inicial do Linux Journey: sistema de arquivos, comandos básicos, usuários e permissões.',
        links: [['Linux Journey', 'https://linuxjourney.com/']] },
      { id: 'F03-M2', tipo: 'pratica', titulo: 'OverTheWire Bandit (níveis 0 a 10)',
        descricao: 'Wargame legal e feito para isso: cada nível ensina um comando. Anote no seu caderno o comando que resolveu cada nível.',
        links: [['OverTheWire - Bandit', 'https://overthewire.org/wargames/bandit/']] },
      { id: 'F03-M3', tipo: 'estudo', titulo: 'Permissões, sudo e o perigo do root',
        descricao: 'Entenda rwx, chmod em octal, dono e grupo. Explique por que rodar tudo como root é má prática.',
        links: [] },
      { id: 'F03-M4', tipo: 'pratica', titulo: 'Caça em logs de autenticação',
        descricao: 'Na sua VM, erre a senha de propósito algumas vezes e encontre essas falhas em /var/log/auth.log ou com journalctl.',
        links: [] },
      { id: 'F03-M5', tipo: 'pratica', titulo: 'Seu primeiro script bash',
        descricao: 'Escreva um script que liste os usuários do /etc/passwd que têm shell de login. Um analista faz esse tipo de checagem toda semana.',
        links: [] }
    ],
    checkpoint: [
      { id: 'F03-Q1', p: 'O que significa chmod 640 em um arquivo?',
        o: ['Todos podem ler, gravar e executar', 'Só o grupo pode ler o arquivo', 'Dono executa; grupo e outros leem', 'Dono lê e grava; grupo lê; outros nada'],
        c: 3, e: '6 = leitura + gravação (dono), 4 = leitura (grupo), 0 = nenhuma permissão (outros).' },
      { id: 'F03-Q2', p: 'Qual comando lista os processos em execução?',
        o: ['ls -la', 'cat /etc/passwd', 'ps aux', 'chmod +x'],
        c: 2, e: 'ps aux mostra todos os processos com dono, PID e comando. ls lista arquivos; chmod muda permissões.' },
      { id: 'F03-Q3', p: 'Em qual arquivo ficam os hashes das senhas no Linux?',
        o: ['/etc/passwd', '/etc/shadow', '/var/log/auth.log', '/home/root/senhas'],
        c: 1, e: 'Os hashes ficam em /etc/shadow, legível só pelo root. O /etc/passwd é público e não guarda mais as senhas.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F04', titulo: 'Python para segurança',
    subtitulo: 'Automatize o que é repetitivo',
    objetivo: 'Escrever pequenos scripts úteis em segurança e aprender, desde o início, a programar de forma segura.',
    carreiras: ['AppSec', 'Automação de SOC', 'Pentest'],
    badge: { nome: 'Encantador de serpentes' },
    missoes: [
      { id: 'F04-M1', tipo: 'estudo', titulo: 'Python básico',
        descricao: 'Variáveis, laços, funções, listas e dicionários. O tutorial oficial está em português, e o Curso em Vídeo também é gratuito.',
        links: [['Tutorial oficial do Python (pt-BR)', 'https://docs.python.org/pt-br/3/tutorial/'], ['Curso em Vídeo', 'https://www.cursoemvideo.com/']] },
      { id: 'F04-M2', tipo: 'pratica', titulo: 'Gerador de senhas seguro',
        descricao: 'Crie um gerador de senhas usando o módulo secrets (nunca o random, que é previsível). Explique a diferença no seu caderno.',
        links: [['Módulo secrets', 'https://docs.python.org/pt-br/3/library/secrets.html']] },
      { id: 'F04-M3', tipo: 'pratica', titulo: 'Verificador de integridade',
        descricao: 'Use hashlib para calcular o SHA-256 de um arquivo e comparar com o valor publicado pelo site oficial do download.',
        links: [['Módulo hashlib', 'https://docs.python.org/pt-br/3/library/hashlib.html']] },
      { id: 'F04-M4', tipo: 'pratica', titulo: 'Port scanner didático',
        descricao: 'Com o módulo socket, teste se as portas 1 a 1024 estão abertas. Rode APENAS contra 127.0.0.1 ou a sua própria VM.',
        links: [['Módulo socket', 'https://docs.python.org/pt-br/3/library/socket.html']] },
      { id: 'F04-M5', tipo: 'estudo', titulo: 'Nunca coloque segredos no código',
        descricao: 'Leia a cheat sheet da OWASP e mude seus scripts para ler chaves de variáveis de ambiente, nunca do código-fonte.',
        links: [['OWASP Secrets Management Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html']] }
    ],
    checkpoint: [
      { id: 'F04-Q1', p: 'Por que usar o módulo secrets, e não o random, para gerar senhas?',
        o: ['Porque o secrets é criptograficamente seguro', 'Porque o secrets gera senhas mais longas', 'Porque o random só gera números inteiros', 'Porque o random não existe no Python 3'],
        c: 0, e: 'O random é feito para simulação e é previsível. O secrets usa a fonte aleatória segura do sistema operacional.' },
      { id: 'F04-Q2', p: 'Para que serve comparar o SHA-256 de um download?',
        o: ['Para descompactar o arquivo baixado', 'Para deixar o download mais rápido', 'Para criptografar o arquivo baixado', 'Para confirmar que o arquivo não foi alterado'],
        c: 3, e: 'Se o hash calculado bate com o publicado, o arquivo é íntegro. Hash garante integridade, não sigilo.' },
      { id: 'F04-Q3', p: 'Onde guardar a chave de API usada por um script?',
        o: ['Numa constante no início do código', 'Num comentário dentro do script', 'Numa variável de ambiente ou cofre de segredos', 'No README do repositório no GitHub'],
        c: 2, e: 'Segredo no código vaza junto com o repositório. Variável de ambiente ou cofre (Key Vault, Secret Manager) mantém a chave fora do código.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F05', titulo: 'Princípios e criptografia',
    subtitulo: 'CID, hash, chaves e certificados',
    objetivo: 'Explicar a tríade CID e escolher entre hash, criptografia simétrica e assimétrica para cada problema.',
    carreiras: ['Todas as áreas', 'Arquitetura de segurança'],
    badge: { nome: 'Guardião das chaves' },
    missoes: [
      { id: 'F05-M1', tipo: 'estudo', titulo: 'Tríade CID',
        descricao: 'Confidencialidade, Integridade e Disponibilidade. Para cada uma, descreva um ataque que a quebra e um controle que a protege.',
        links: [['Glossário do NIST', 'https://csrc.nist.gov/glossary']] },
      { id: 'F05-M2', tipo: 'estudo', titulo: 'Hash, simétrica e assimétrica',
        descricao: 'Entenda quando usar cada uma e como o TLS combina as três para proteger o HTTPS.',
        links: [['Cloudflare Learning: o que é TLS', 'https://www.cloudflare.com/learning/ssl/transport-layer-security-tls/']] },
      { id: 'F05-M3', tipo: 'pratica', titulo: 'Efeito avalanche no CyberChef',
        descricao: 'Calcule o SHA-256 de uma frase, troque uma única letra e compare. Depois codifique a frase em Base64 e decodifique de volta.',
        links: [['CyberChef', 'https://gchq.github.io/CyberChef/']] },
      { id: 'F05-M4', tipo: 'pratica', titulo: 'Desafios introdutórios do CryptoHack',
        descricao: 'Resolva os desafios da trilha introdutória. Eles ensinam XOR, codificações e aritmética modular jogando.',
        links: [['CryptoHack', 'https://cryptohack.org/']] },
      { id: 'F05-M5', tipo: 'estudo', titulo: 'Senhas e MFA',
        descricao: 'Verifique se o SEU e-mail aparece em vazamentos e ative MFA nas suas contas principais. Prefira app autenticador a SMS.',
        links: [['Have I Been Pwned', 'https://haveibeenpwned.com/']] }
    ],
    checkpoint: [
      { id: 'F05-Q1', p: 'Uma senha "protegida" com Base64 está segura?',
        o: ['Sim, porque Base64 é um tipo de criptografia', 'Não: Base64 é codificação e qualquer um reverte', 'Sim, desde que a senha tenha mais de 12 letras', 'Não, porque Base64 só funciona com números'],
        c: 1, e: 'Base64 só muda a representação dos dados, sem chave nenhuma. Qualquer pessoa decodifica em segundos.' },
      { id: 'F05-Q2', p: 'Um ransomware que cifra os servidores ataca principalmente qual pilar?',
        o: ['Disponibilidade', 'Autenticidade', 'Não repúdio', 'Integridade'],
        c: 0, e: 'Os dados ficam inacessíveis: é um ataque à disponibilidade. Hoje muitos grupos também vazam os dados, o que afeta a confidencialidade.' },
      { id: 'F05-Q3', p: 'Na criptografia assimétrica, para enviar algo sigiloso a Ana, você cifra com:',
        o: ['A sua chave privada', 'A chave privada da Ana', 'Uma senha combinada por e-mail', 'A chave pública da Ana'],
        c: 3, e: 'Qualquer um pode cifrar com a chave pública da Ana, mas só ela decifra, com a chave privada dela.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F06', titulo: 'Segurança de aplicações web',
    subtitulo: 'OWASP Top 10 na prática',
    objetivo: 'Reconhecer as falhas mais comuns em aplicações web, explorá-las em ambiente autorizado e saber como corrigi-las.',
    carreiras: ['AppSec', 'Pentest web', 'Desenvolvimento seguro'],
    badge: { nome: 'Caçador de bugs' },
    missoes: [
      { id: 'F06-M1', tipo: 'estudo', titulo: 'OWASP Top 10',
        descricao: 'Leia a lista atual e, para cada item, escreva em uma linha o que é e como se previne.',
        links: [['OWASP Top 10', 'https://owasp.org/www-project-top-ten/']] },
      { id: 'F06-M2', tipo: 'pratica', titulo: 'SQL Injection na Web Security Academy',
        descricao: 'Faça os laboratórios de nível Apprentice de SQL injection. São gratuitos, legais e feitos para isso.',
        links: [['PortSwigger Web Security Academy', 'https://portswigger.net/web-security']] },
      { id: 'F06-M3', tipo: 'pratica', titulo: 'OWASP Juice Shop local',
        descricao: 'Suba o Juice Shop no Docker da sua máquina e resolva 5 desafios de 1 estrela. Nunca o exponha na internet.',
        links: [['OWASP Juice Shop', 'https://owasp.org/www-project-juice-shop/']] },
      { id: 'F06-M4', tipo: 'estudo', titulo: 'Proxy de interceptação',
        descricao: 'Instale o ZAP ou o Burp Suite Community e intercepte uma requisição do Juice Shop. Veja e altere parâmetros antes de enviar.',
        links: [['ZAP', 'https://www.zaproxy.org/'], ['Burp Suite Community', 'https://portswigger.net/burp/communitydownload']] },
      { id: 'F06-M5', tipo: 'chefao', titulo: 'Chefão: Threat Modeling Lab',
        descricao: 'Modele as ameaças do app fictício OrbitaPay com STRIDE e priorize com DREAD. Lab da disciplina, sem nota.',
        links: [['threat-modeling-lab', 'https://github.com/juliocataldo/threat-modeling-lab']] },
      { id: 'F06-M6', tipo: 'chefao', titulo: 'Chefão: Supply Chain Lab',
        descricao: 'Revise 7 pull requests de dependências e decida o que aceitar, rejeitar ou investigar. Lab da disciplina, sem nota.',
        links: [['supply-chain-lab', 'https://github.com/juliocataldo/supply-chain-lab']] }
    ],
    checkpoint: [
      { id: 'F06-Q1', p: 'Qual a forma correta de prevenir SQL Injection?',
        o: ['Bloquear o caractere aspas no front-end', 'Esconder as mensagens de erro do banco', 'Usar queries parametrizadas no servidor', 'Colocar um WAF na frente da aplicação'],
        c: 2, e: 'Com query parametrizada, o dado nunca vira comando SQL. Validar no front e usar WAF ajudam, mas não substituem essa correção.' },
      { id: 'F06-Q2', p: 'Trocar /pedidos/1001 por /pedidos/1002 e ver o pedido de outra pessoa é:',
        o: ['XSS, um tipo de injeção de script no navegador', 'IDOR, um tipo de quebra de controle de acesso', 'SQL Injection, um tipo de injeção no banco', 'Falha criptográfica no transporte dos dados'],
        c: 1, e: 'É IDOR (Insecure Direct Object Reference): o servidor não confere se o objeto pertence a quem pediu.' },
      { id: 'F06-Q3', p: 'Onde a validação de entrada PRECISA acontecer?',
        o: ['Só no navegador, para ser mais rápido', 'Só no banco de dados, nas constraints', 'Só no WAF, antes da aplicação', 'No servidor, mesmo que exista no navegador'],
        c: 3, e: 'O atacante controla o navegador e pode pular qualquer validação de lá. Validação no servidor é obrigatória; a do front é só usabilidade.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F07', titulo: 'Blue Team e SOC',
    subtitulo: 'Detectar, triar e responder',
    objetivo: 'Triar alertas com contexto, correlacionar eventos em uma cadeia de ataque e conduzir a resposta a incidentes.',
    carreiras: ['Analista de SOC', 'Resposta a incidentes', 'Threat hunting'],
    badge: { nome: 'Turno completo' },
    missoes: [
      { id: 'F07-M1', tipo: 'estudo', titulo: 'O ciclo de resposta a incidentes',
        descricao: 'Resuma o ciclo clássico (preparar; detectar e analisar; conter, erradicar e recuperar; lições aprendidas) e veja como a Rev. 3 do NIST o encaixa nas funções do CSF 2.0.',
        links: [['NIST SP 800-61 Rev. 3', 'https://csrc.nist.gov/pubs/sp/800/61/r3/final']] },
      { id: 'F07-M2', tipo: 'estudo', titulo: 'MITRE ATT&CK',
        descricao: 'Navegue pela matriz Enterprise e entenda a diferença entre tática (o objetivo) e técnica (o como). Abra 3 técnicas e leia as detecções.',
        links: [['MITRE ATT&CK', 'https://attack.mitre.org/']] },
      { id: 'F07-M3', tipo: 'estudo', titulo: 'A Pirâmide da Dor',
        descricao: 'Entenda por que bloquear hash e IP incomoda pouco o atacante, e detectar TTPs incomoda muito.',
        links: [['The Pyramid of Pain (David Bianco)', 'https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html']] },
      { id: 'F07-M4', tipo: 'chefao', titulo: 'Chefão: SOC Lab 1 - Triagem de alertas',
        descricao: 'Assuma o plantão da OrbitaPay e trie 12 alertas, separando verdadeiros e falsos positivos e encontrando a cadeia de ataque.',
        links: [['soc-lab', 'https://github.com/juliocataldo/soc-lab']] },
      { id: 'F07-M5', tipo: 'chefao', titulo: 'Chefão: SOC Lab 2 - Mini-SIEM',
        descricao: 'Cace o ataque em 1.523 eventos, escreva regras de detecção e conduza a resposta. Fica na pasta lab2-siem do soc-lab.',
        links: [['soc-lab / lab2-siem', 'https://github.com/juliocataldo/soc-lab/tree/main/lab2-siem']] },
      { id: 'F07-M6', tipo: 'pratica', titulo: 'Desafios de Blue Team',
        descricao: 'Resolva um desafio gratuito de investigação no CyberDefenders ou no LetsDefend e escreva um mini-relatório.',
        links: [['CyberDefenders', 'https://cyberdefenders.org/'], ['LetsDefend', 'https://letsdefend.io/']] }
    ],
    checkpoint: [
      { id: 'F07-Q1', p: 'Um alerta dispara, mas a atividade é legítima e documentada. Ele é um:',
        o: ['Falso positivo', 'Verdadeiro positivo', 'Falso negativo', 'Verdadeiro negativo'],
        c: 0, e: 'O alerta disparou (positivo), mas não havia ataque (falso). Falso negativo é o ataque que não gerou alerta, o pior caso.' },
      { id: 'F07-Q2', p: 'Um host está com C2 ativo e exfiltrando dados. A primeira ação é:',
        o: ['Formatar o host imediatamente', 'Escrever o relatório final do incidente', 'Isolar o host para conter o ataque', 'Esperar para observar o atacante'],
        c: 2, e: 'Com o ataque em andamento, contenção vem primeiro. Formatar destrói evidências; o relatório vem no fim.' },
      { id: 'F07-Q3', p: 'Na Pirâmide da Dor, qual indicador é mais caro para o atacante trocar?',
        o: ['O hash do arquivo malicioso usado', 'As TTPs: táticas, técnicas e procedimentos', 'O endereço IP do servidor de comando', 'O nome de domínio usado no phishing'],
        c: 1, e: 'Trocar hash, IP ou domínio é barato. Mudar o modo de operar (TTP) obriga o atacante a reaprender e refazer ferramentas.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F08', titulo: 'Red Team: introdução',
    subtitulo: 'Pense como atacante, aja com autorização',
    objetivo: 'Conhecer as fases de um teste de intrusão e praticar reconhecimento em ambientes autorizados.',
    carreiras: ['Pentest', 'Red Team', 'Bug bounty'],
    badge: { nome: 'Hacker ético' },
    missoes: [
      { id: 'F08-M1', tipo: 'estudo', titulo: 'Metodologia e regras de engajamento',
        descricao: 'Estude as fases de um teste (escopo, reconhecimento, exploração, relatório) no guia de testes da OWASP. Sem escopo assinado não há teste.',
        links: [['OWASP Web Security Testing Guide', 'https://owasp.org/www-project-web-security-testing-guide/']] },
      { id: 'F08-M2', tipo: 'pratica', titulo: 'Nmap em alvo autorizado',
        descricao: 'Faça varreduras na sua VM e no scanme.nmap.org, que o próprio projeto Nmap autoriza. Compare -sS, -sV e -O.',
        links: [['Livro oficial do Nmap', 'https://nmap.org/book/'], ['scanme.nmap.org (alvo autorizado; só http)', 'http://scanme.nmap.org/']] },
      { id: 'F08-M3', tipo: 'pratica', titulo: 'picoCTF - General Skills',
        descricao: 'Resolva 5 desafios da categoria General Skills. O picoCTF é gratuito e feito para estudantes.',
        links: [['picoCTF', 'https://picoctf.org/']] },
      { id: 'F08-M4', tipo: 'pratica', titulo: 'Sua primeira máquina guiada',
        descricao: 'No TryHackMe, faça uma sala gratuita de nível Easy do início ao fim: reconhecimento, acesso inicial e escalação.',
        links: [['TryHackMe', 'https://tryhackme.com/']] },
      { id: 'F08-M5', tipo: 'estudo', titulo: 'Engenharia social e phishing',
        descricao: 'Faça o quiz de phishing do Google e anote os sinais que você deixou passar. Engenharia social é o vetor mais comum de acesso inicial.',
        links: [['Phishing Quiz (Google)', 'https://phishingquiz.withgoogle.com/']] }
    ],
    checkpoint: [
      { id: 'F08-Q1', p: 'Qual alvo você pode escanear com o Nmap sem pedir permissão a ninguém?',
        o: ['O site da sua faculdade', 'O roteador da cafeteria', 'Qualquer IP que esteja aberto na internet', 'A sua própria VM e o scanme.nmap.org'],
        c: 3, e: 'Só é permitido o que é seu ou explicitamente autorizado. O projeto Nmap autoriza varreduras no scanme.nmap.org.' },
      { id: 'F08-Q2', p: 'Consultar WHOIS, DNS e certificados públicos de um alvo é reconhecimento:',
        o: ['Passivo: você não interage com o alvo', 'Ativo: você toca nos servidores do alvo', 'Ofensivo: equivale a uma exploração', 'Ilegal: exige mandado judicial'],
        c: 0, e: 'São fontes públicas consultadas sem tocar no alvo: reconhecimento passivo. Uma varredura de portas já é reconhecimento ativo.' },
      { id: 'F08-Q3', p: 'Qual é a entrega mais importante de um pentest?',
        o: ['A lista de ferramentas usadas', 'O acesso de administrador obtido', 'O relatório com riscos e correções', 'A captura de tela da invasão'],
        c: 2, e: 'O cliente paga para saber o que corrigir. Sem relatório claro, com impacto e recomendação, o teste não gera valor.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F09', titulo: 'Segurança em nuvem',
    subtitulo: 'Responsabilidade compartilhada e identidade',
    objetivo: 'Entender o que é responsabilidade do provedor e o que é sua, e evitar as falhas de configuração mais comuns.',
    carreiras: ['Cloud Security', 'DevSecOps', 'Arquitetura'],
    badge: { nome: 'Acima das nuvens' },
    missoes: [
      { id: 'F09-M1', tipo: 'estudo', titulo: 'Modelo de responsabilidade compartilhada',
        descricao: 'Leia como a AWS divide as responsabilidades e faça uma tabela "provedor x cliente" para IaaS, PaaS e SaaS.',
        links: [['AWS - Shared Responsibility Model', 'https://aws.amazon.com/compliance/shared-responsibility-model/']] },
      { id: 'F09-M2', tipo: 'estudo', titulo: 'Identidade é o novo perímetro',
        descricao: 'Estude IAM, menor privilégio e MFA na conta raiz com a trilha gratuita de fundamentos SC-900 da Microsoft.',
        links: [['Microsoft Learn - SC-900', 'https://learn.microsoft.com/pt-br/credentials/certifications/security-compliance-and-identity-fundamentals/']] },
      { id: 'F09-M3', tipo: 'pratica', titulo: 'flAWS: erros de configuração na AWS',
        descricao: 'Desafio gratuito e autorizado que ensina, nível a nível, como buckets e permissões mal configurados vazam dados. (O site só funciona em http.)',
        links: [['flAWS.cloud', 'http://flaws.cloud/']] },
      { id: 'F09-M4', tipo: 'pratica', titulo: 'Escaneie uma imagem de container',
        descricao: 'Use o Trivy para listar as vulnerabilidades de uma imagem Docker pública e compare uma imagem completa com uma versão slim.',
        links: [['Trivy', 'https://trivy.dev/']] },
      { id: 'F09-M5', tipo: 'estudo', titulo: 'Os vazamentos mais comuns em nuvem',
        descricao: 'Pesquise um caso real de bucket público ou chave vazada no GitHub e descreva a causa e qual controle teria evitado o problema.',
        links: [] }
    ],
    checkpoint: [
      { id: 'F09-Q1', p: 'Num serviço IaaS, quem configura as permissões de acesso (IAM) dos seus recursos?',
        o: ['O provedor de nuvem', 'O cliente', 'Ninguém: é automático', 'O fabricante do hardware'],
        c: 1, e: 'O provedor protege a infraestrutura física e virtual. Configurar identidade, permissões e dados é sempre responsabilidade do cliente.' },
      { id: 'F09-Q2', p: 'Qual é a medida mais urgente para a conta raiz (root) de uma nuvem?',
        o: ['Usar a conta raiz no dia a dia', 'Compartilhar a senha com o time', 'Desativar todos os logs da conta', 'Ativar MFA e não usá-la no dia a dia'],
        c: 3, e: 'A conta raiz pode tudo. Proteja com MFA forte e use contas com menor privilégio para o trabalho diário.' },
      { id: 'F09-Q3', p: 'Um bucket com dump de clientes ficou com leitura pública. Isso é:',
        o: ['Uma falha de configuração do cliente', 'Uma falha do provedor de nuvem', 'Um comportamento normal e seguro', 'Um problema só se houver senha no arquivo'],
        c: 0, e: 'A permissão pública foi configurada pelo cliente. Com dados pessoais expostos, ainda pode haver obrigação de comunicar o incidente (LGPD).' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F10', titulo: 'Governança, risco e compliance',
    subtitulo: 'Segurança como decisão de negócio',
    objetivo: 'Usar frameworks (NIST CSF, ISO 27001, CIS) e gestão de riscos para priorizar a segurança de uma organização.',
    carreiras: ['GRC', 'Auditoria', 'Privacidade e proteção de dados'],
    badge: { nome: 'Balança do risco' },
    missoes: [
      { id: 'F10-M1', tipo: 'estudo', titulo: 'NIST Cybersecurity Framework 2.0',
        descricao: 'Conheça as 6 funções (Governar, Identificar, Proteger, Detectar, Responder, Recuperar) e dê um exemplo de controle para cada.',
        links: [['NIST CSF', 'https://www.nist.gov/cyberframework']] },
      { id: 'F10-M2', tipo: 'estudo', titulo: 'ISO/IEC 27001 em visão geral',
        descricao: 'Entenda o que é um SGSI (Sistema de Gestão de Segurança da Informação) e por que empresas buscam essa certificação.',
        links: [['ISO/IEC 27001', 'https://www.iso.org/standard/27001']] },
      { id: 'F10-M3', tipo: 'estudo', titulo: 'CIS Controls',
        descricao: 'Leia os controles do grupo de implementação 1 (IG1): o básico que toda organização deveria ter.',
        links: [['CIS Critical Security Controls', 'https://www.cisecurity.org/controls']] },
      { id: 'F10-M4', tipo: 'pratica', titulo: 'Sua primeira matriz de risco',
        descricao: 'Para uma startup fictícia, liste 5 riscos, dê nota de probabilidade e impacto (1 a 5) e escolha o tratamento de cada um.',
        links: [] },
      { id: 'F10-M5', tipo: 'estudo', titulo: 'Papéis da LGPD',
        descricao: 'Diferencie controlador, operador e encarregado (DPO) e descubra quem é o encarregado de uma empresa que você usa.',
        links: [['ANPD', 'https://www.gov.br/anpd/']] }
    ],
    checkpoint: [
      { id: 'F10-Q1', p: 'Qual função foi ADICIONADA na versão 2.0 do NIST CSF?',
        o: ['Detectar', 'Recuperar', 'Governar', 'Proteger'],
        c: 2, e: 'A versão 2.0 (2024) incluiu Governar, que trata de estratégia, papéis e gestão de riscos de cibersegurança.' },
      { id: 'F10-Q2', p: 'Contratar um seguro cibernético é qual tratamento de risco?',
        o: ['Mitigar', 'Transferir', 'Aceitar', 'Evitar'],
        c: 1, e: 'O impacto financeiro passa para a seguradora. A responsabilidade sobre o incidente e os dados continua sendo da empresa.' },
      { id: 'F10-Q3', p: 'Pela LGPD, quem decide sobre o tratamento dos dados pessoais?',
        o: ['O operador', 'O encarregado (DPO)', 'O titular dos dados', 'O controlador'],
        c: 3, e: 'O controlador toma as decisões. O operador trata os dados em nome dele; o encarregado faz a ponte com titulares e ANPD.' }
    ] },

  /* ------------------------------------------------------------------ */
  { id: 'F11', titulo: 'Carreira',
    subtitulo: 'Do estudo ao primeiro emprego',
    objetivo: 'Escolher uma área para aprofundar, montar um portfólio público e planejar as primeiras certificações.',
    carreiras: ['Todas'],
    badge: { nome: 'Pronto para o mercado' },
    missoes: [
      { id: 'F11-M1', tipo: 'estudo', titulo: 'Mapa das áreas',
        descricao: 'Use o NICE Framework para comparar SOC, AppSec, Pentest, GRC, Cloud e Forense. Escolha 2 áreas e justifique a escolha.',
        links: [['NICE Framework (CISA)', 'https://niccs.cisa.gov/workforce-development/nice-framework']] },
      { id: 'F11-M2', tipo: 'estudo', titulo: 'Certificações de entrada',
        descricao: 'Compare ISC2 CC, CompTIA Security+ e Microsoft SC-900: custo, idioma, conteúdo e reconhecimento. Monte um plano de 12 meses.',
        links: [['ISC2 Certified in Cybersecurity', 'https://www.isc2.org/certifications/cc'], ['CompTIA Security+', 'https://www.comptia.org/certifications/security']] },
      { id: 'F11-M3', tipo: 'pratica', titulo: 'Portfólio público',
        descricao: 'Publique no GitHub um write-up de algo que você resolveu na trilha. Não publique soluções de CTF que ainda estão ativos.',
        links: [['GitHub', 'https://github.com/']] },
      { id: 'F11-M4', tipo: 'pratica', titulo: 'Entre para uma comunidade',
        descricao: 'Participe de um CTF ou de um encontro de um capítulo da OWASP. Rede de contatos abre mais portas que currículo.',
        links: [['Capítulos da OWASP', 'https://owasp.org/chapters/'], ['picoCTF', 'https://picoctf.org/']] },
      { id: 'F11-M5', tipo: 'estudo', titulo: 'Rotina de atualização',
        descricao: 'Escolha 2 fontes de notícias e acompanhe o catálogo KEV da CISA por uma semana. Resuma uma vulnerabilidade que entrou nele.',
        links: [['CISA KEV', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog'], ['The Hacker News', 'https://thehackernews.com/'], ['BleepingComputer', 'https://www.bleepingcomputer.com/']] }
    ],
    checkpoint: [
      { id: 'F11-Q1', p: 'O que é o catálogo KEV da CISA?',
        o: ['Uma lista de vulnerabilidades exploradas de verdade', 'Uma lista de todas as CVEs já publicadas', 'Um ranking de empresas mais atacadas', 'Uma certificação para analistas de SOC'],
        c: 0, e: 'KEV = Known Exploited Vulnerabilities: CVEs com exploração confirmada. É um ótimo critério para priorizar correções.' },
      { id: 'F11-Q2', p: 'Qual destes cuidados vale para um write-up no seu portfólio?',
        o: ['Incluir as credenciais que você encontrou', 'Publicar soluções de CTFs ainda em andamento', 'Não expor soluções ativas nem dados de terceiros', 'Mostrar falhas de sites reais sem autorização'],
        c: 2, e: 'Portfólio mostra método e raciocínio. Expor CTF ativo, credenciais ou falhas de terceiros é antiético e pode ser crime.' },
      { id: 'F11-Q3', p: 'Para quem está começando, o que costuma pesar mais numa vaga júnior?',
        o: ['Ter várias certificações avançadas', 'Prática demonstrável e base sólida', 'Conhecer o maior número de ferramentas', 'Ter experiência como Red Team'],
        c: 1, e: 'Para júnior, projetos práticos, write-ups e fundamentos bem explicados mostram mais que uma coleção de siglas.' }
    ] }
  ],

  /* Conquistas especiais (as de fase vêm do campo "badge" de cada fase). "marca" é o texto curto do selo. */
  conquistas: [
    { id: 'primeira', marca: '1º', nome: 'Primeiro passo', desc: 'Conclua sua primeira missão.' },
    { id: 'chefoes', marca: 'CF', nome: 'Matador de chefões', desc: 'Vença todos os chefões (labs da disciplina).' },
    { id: 'gabarito', marca: '3/3', nome: 'Mira certeira', desc: 'Acerte todas as questões de 3 checkpoints.' },
    { id: 'seq3', marca: '3d', nome: 'Em chamas', desc: 'Estude 3 dias seguidos.' },
    { id: 'seq7', marca: '7d', nome: 'Imparável', desc: 'Estude 7 dias seguidos.' },
    { id: 'metade', marca: '50%', nome: 'Metade do caminho', desc: 'Conclua 50% de todas as missões.' },
    { id: 'tudo', marca: '100%', nome: 'Cybersecurity Expert', desc: 'Conclua todas as missões e checkpoints.' }
  ],

  creditos: [
    ['Cybersecurity Mastery Roadmap (Hamed233)', 'https://github.com/Hamed233/Cybersecurity-Mastery-Roadmap'],
    ['CyberSecurity RoadMap (Jansen Moreira)', 'https://jansen-moreira.notion.site/CyberSecurity-RoadMap-1123f61008cd806e9ae8d6c57bc5d2d9']
  ]
};
