"use strict";
/* =====================================================================
   Checklist de Privacidade - DADOS + LÓGICA
   Réplica (mecânica + conteúdo) do "Checklist de Privacidade"
   (checklist.wmartins.app), adaptação PT-BR do projeto open source
   personal-security-checklist, de Alicia Sykes (github.com/Lissy93).
   Conteúdo sob CC BY-NC-SA 4.0. Veja o rodapé de checklist.html.

   Para editar: mexa só no objeto CHECKLIST. IDs dos itens são estáveis
   (não renomeie um id já publicado, senão o progresso salvo some).
   nivel: 'essencial' | 'opcional' | 'avancado'.
   O teste em tests/validar-checklist.mjs confere a estrutura.
   ===================================================================== */
const CHECKLIST = {
  versao: 1,
  titulo: 'Checklist de Privacidade',
  niveis: [
    { id: 'essencial', nome: 'Essencial', desc: 'O básico que todo mundo deveria fazer.' },
    { id: 'opcional', nome: 'Opcional', desc: 'Um passo a mais de proteção.' },
    { id: 'avancado', nome: 'Avançado', desc: 'Para quem quer (ou precisa) ir além.' }
  ],
  categorias: [
    { id: 'golpes', titulo: 'Golpes e Fraudes',
      intro: 'Reconheça os golpes mais comuns no Brasil. Golpistas usam pressa, medo e notícias falsas para se passar por bancos, parentes ou órgãos públicos. A regra: pare, desligue e confirme por um canal oficial que você mesmo procurou.',
      itens: [
        { id: 'golpes-1', nivel: 'essencial', t: `Desconfie de qualquer pedido com pressa, medo ou urgência`, d: `Frases de urgência existem para impedir que você pense. Ao sentir pressão, interrompa a conversa.` },
        { id: 'golpes-2', nivel: 'essencial', t: `Nunca passe a ninguém um código que chegou no seu celular`, d: `Códigos de verificação provam que é você. Banco, loja e WhatsApp nunca pedem esses códigos.` },
        { id: 'golpes-3', nivel: 'essencial', t: `Se o banco ligar, desligue e ligue você para o número oficial`, d: `O número que aparece na tela pode ser falsificado. Ligue você mesmo para o número do cartão ou do app.` },
        { id: 'golpes-4', nivel: 'essencial', t: `Nunca instale um aplicativo a pedido de quem ligou para você`, d: `Apps de acesso remoto deixam o golpista ver sua tela e transferir dinheiro. Se instalou, tire o aparelho da internet e ligue ao banco por outro telefone.` },
        { id: 'golpes-5', nivel: 'essencial', t: `Antes de mandar dinheiro a parentes ou amigos, confirme por ligação`, d: `Golpes de "mudei de número" e falso sequestro usam o nome de alguém próximo. Confirme por ligação e combine uma palavra-código.` },
        { id: 'golpes-6', nivel: 'essencial', t: `Não clique em links de mensagens que você não estava esperando`, d: `Mensagens sobre encomenda, multa ou restituição levam a sites falsos. Acesse pelo app oficial ou digitando o endereço.` },
        { id: 'golpes-7', nivel: 'essencial', t: `Desconfie de lucro fácil e de trabalhos pela internet que pedem depósito`, d: `Golpes de "tarefas" e investimento garantido pedem depósito para liberar ganhos. Cheque se a empresa é autorizada pela CVM ou Banco Central.` },
        { id: 'golpes-8', nivel: 'opcional', t: `Desconfie de quem diz ser seu advogado e pede pagamento para liberar dinheiro`, d: `Golpistas cobram "custas" por PIX em nome de um advogado. Confirme com o escritório pelo contato que você já conhece.` },
        { id: 'golpes-9', nivel: 'opcional', t: `Nunca pague taxa antecipada para receber empréstimo, prêmio ou indenização`, d: `Instituição séria desconta a taxa do valor liberado ou não cobra nada. Pediu dinheiro adiantado, desista.` },
        { id: 'golpes-10', nivel: 'opcional', t: `Consulte dinheiro esquecido em bancos apenas no site do Banco Central`, d: `O serviço de valores a receber é gratuito e só funciona no site oficial. Mensagem oferecendo ajuda é golpe.` },
        { id: 'golpes-11', nivel: 'opcional', t: `Pesquise a loja antes de comprar em ofertas de redes sociais`, d: `Preço baixo demais pode levar a loja falsa. Veja reputação, CNPJ e endereço, e prefira cartão de crédito.` },
        { id: 'golpes-12', nivel: 'opcional', t: `Ao vender pela internet, entregue o produto só depois de ver o dinheiro no extrato`, d: `Comprovante de PIX por imagem pode ser falso. Confirme a entrada do valor no app do seu banco.` },
        { id: 'golpes-13', nivel: 'opcional', t: `Na maquininha, confira o valor na tela antes de pagar`, d: `Maquininha adulterada ou com visor quebrado pode cobrar mais. Confira o valor e não entregue o cartão a ninguém.` },
        { id: 'golpes-14', nivel: 'opcional', t: `Confira o nome de quem vai receber antes de pagar com QR Code`, d: `QR Code e "copia e cola" do PIX podem ser trocados. Confirme nome e valor no app antes de concluir.` },
        { id: 'golpes-15', nivel: 'opcional', t: `Nunca entregue seu cartão a um motoboy ou a quem diga que vai buscá-lo`, d: `O golpe do falso funcionário do banco diz que o cartão foi clonado e pega a senha. Corte o cartão e ligue à central oficial.` },
        { id: 'golpes-16', nivel: 'opcional', t: `Desconfie de perfis de amigos, famosos ou empresas que pedem dinheiro`, d: `Perfis copiados pedem PIX ou oferecem suporte falso. Confirme por outro canal com a pessoa ou empresa real.` },
        { id: 'golpes-17', nivel: 'opcional', t: `Redobre a atenção em datas especiais e grandes notícias`, d: `Black Friday e Imposto de Renda viram isca para ofertas e doações falsas. Use só sites e instituições oficiais.` },
        { id: 'golpes-18', nivel: 'opcional', t: `Denuncie golpes e tentativas de golpe`, d: `Denúncia derruba perfil falso e protege outras pessoas. Use o botão de denúncia, avise o banco, registre no consumidor.gov.br e, havendo prejuízo, faça B.O.` }
      ] },
    { id: 'senhas', titulo: 'Senhas e Acesso às Contas',
      intro: 'Proteja suas senhas e o acesso às suas contas mais importantes.',
      itens: [
        { id: 'senhas-1', nivel: 'essencial', t: `Use uma senha diferente em cada conta importante`, d: `Reusar senha faz um vazamento em um site abrir as suas outras contas.` },
        { id: 'senhas-2', nivel: 'essencial', t: `Crie senhas longas, como uma frase`, d: `Várias palavras aleatórias valem mais que uma senha curta e complexa. Evite dados pessoais.` },
        { id: 'senhas-3', nivel: 'essencial', t: `Use um gerenciador de senhas`, d: `Guarde senhas únicas e fortes num cofre protegido por uma senha mestra e 2FA.` },
        { id: 'senhas-4', nivel: 'essencial', t: `Ative a verificação em duas etapas nas contas principais`, d: `Exija um segundo fator além da senha em e-mail, gov.br, WhatsApp, redes sociais e banco.` },
        { id: 'senhas-5', nivel: 'essencial', t: `Proteja e eleve o nível da sua conta gov.br`, d: `Ative o 2FA na conta gov.br e suba o nível de confiabilidade para prata ou ouro.` },
        { id: 'senhas-6', nivel: 'opcional', t: `Use chaves de acesso (passkeys) quando o serviço oferecer`, d: `Entrar com biometria ou PIN do aparelho torna o login resistente a phishing.` },
        { id: 'senhas-7', nivel: 'opcional', t: `Prefira o aplicativo autenticador ao código por SMS`, d: `O código gerado no aparelho não pode ser interceptado por troca de chip (SIM swap).` },
        { id: 'senhas-8', nivel: 'opcional', t: `Descubra se suas senhas ou seu e-mail apareceram em vazamentos`, d: `Use os alertas de vazamento do gerenciador ou um serviço de consulta e troque o que vazou.` },
        { id: 'senhas-9', nivel: 'opcional', t: `Troque a senha quando houver motivo, não por calendário`, d: `Troque após vazamento, uso em site suspeito ou acesso estranho, não em intervalos fixos.` },
        { id: 'senhas-10', nivel: 'opcional', t: `Responda perguntas de segurança com respostas inventadas`, d: `Respostas fictícias (guardadas no gerenciador) não são achadas nas suas redes.` },
        { id: 'senhas-11', nivel: 'opcional', t: `Não envie senhas por mensagem ou e-mail`, d: `Elas ficam registradas na conversa e na caixa de entrada. Use o compartilhamento seguro do gerenciador.` },
        { id: 'senhas-12', nivel: 'opcional', t: `Saia das contas ao usar o aparelho de outra pessoa`, d: `Em computador compartilhado, use janela anônima, não salve senha e encerre a sessão no fim.` },
        { id: 'senhas-13', nivel: 'opcional', t: `Confira onde suas contas estão conectadas`, d: `Revise sessões e dispositivos com acesso, encerre os desconhecidos e troque a senha.` },
        { id: 'senhas-14', nivel: 'avancado', t: `Use uma chave de segurança física nas contas mais importantes`, d: `Um dispositivo USB/NFC como segundo fator, com uma chave reserva guardada em local seguro.` },
        { id: 'senhas-15', nivel: 'avancado', t: `Ative a proteção reforçada se você corre risco maior`, d: `Programas de proteção avançada exigem login resistente a phishing para quem é alvo frequente.` }
      ] },
    { id: 'celular', titulo: 'Celular',
      intro: 'Proteja o aparelho que guarda sua vida digital, inclusive em caso de roubo.',
      itens: [
        { id: 'celular-1', nivel: 'essencial', t: `Use bloqueio de tela com senha ou PIN de 6 dígitos ou mais`, d: `Prefira PIN longo (sem datas ou sequências) e use a biometria no dia a dia.` },
        { id: 'celular-2', nivel: 'essencial', t: `Ative a proteção contra roubo do celular`, d: `Recursos do sistema travam o aparelho ao ser arrancado da mão e exigem biometria para trocar senhas em locais desconhecidos.` },
        { id: 'celular-3', nivel: 'essencial', t: `Ative a localização do aparelho perdido`, d: `Habilite localizar, bloquear e apagar o aparelho remotamente, e teste antes de precisar.` },
        { id: 'celular-4', nivel: 'essencial', t: `Cadastre seu celular no programa Celular Seguro`, d: `Cadastro federal gratuito avisa bancos e operadoras em caso de roubo ou perda; indique uma pessoa de confiança.` },
        { id: 'celular-5', nivel: 'essencial', t: `Mantenha o sistema e os aplicativos atualizados`, d: `Ative atualização automática; se o aparelho não recebe mais correções, evite usar o app do banco nele.` },
        { id: 'celular-6', nivel: 'essencial', t: `Instale aplicativos apenas pela loja oficial`, d: `Baixe só da loja oficial, mantenha o Play Protect ativo e nunca instale APK recebido por mensagem.` },
        { id: 'celular-7', nivel: 'essencial', t: `Ative o PIN do chip (SIM)`, d: `Um PIN no chip impede que um ladrão use seu número para receber códigos por SMS.` },
        { id: 'celular-8', nivel: 'essencial', t: `Revise as permissões dos aplicativos`, d: `Tire permissões desnecessárias de localização, câmera, microfone, contatos e fotos; cuidado com a Acessibilidade no Android.` },
        { id: 'celular-9', nivel: 'opcional', t: `Esconda o conteúdo das notificações na tela bloqueada`, d: `Ocultar o texto evita expor códigos e conversas com o aparelho travado.` },
        { id: 'celular-10', nivel: 'opcional', t: `Prefira biometria segura ao desbloqueio facial por câmera simples`, d: `Use digital ou PIN em Androids cujo reconhecimento facial depende só da câmera, sobretudo no app do banco.` },
        { id: 'celular-11', nivel: 'opcional', t: `Apague os aplicativos que você não usa`, d: `App parado há meses continua coletando dados. Desinstale.` },
        { id: 'celular-12', nivel: 'opcional', t: `Desative os anúncios personalizados`, d: `Desligue o ID de publicidade e o rastreamento entre apps para reduzir o cruzamento de dados.` },
        { id: 'celular-13', nivel: 'opcional', t: `Verifique se há aplicativo espião no aparelho`, d: `Bateria que some e aparelho quente sem uso são sinais. Use a verificação de segurança e busque ajuda antes de remover algo.` },
        { id: 'celular-14', nivel: 'opcional', t: `Use o teclado original do celular`, d: `Teclados podem capturar senhas. Prefira o do fabricante e não dê acesso total sem necessidade.` },
        { id: 'celular-15', nivel: 'opcional', t: `Reinicie o celular uma vez por semana`, d: `Reiniciar interrompe ataques que vivem só na memória e aplica atualizações pendentes.` },
        { id: 'celular-16', nivel: 'opcional', t: `Desligue Wi-Fi e Bluetooth quando não estiver usando`, d: `Desative a conexão automática a redes abertas (que podem ser falsas) e remova redes salvas sem uso.` },
        { id: 'celular-17', nivel: 'opcional', t: `Não aceite "confiar neste computador" em carregadores públicos`, d: `Use sua fonte ou uma bateria portátil e recuse pedidos de confiança ou transferência de arquivos.` },
        { id: 'celular-18', nivel: 'avancado', t: `Configure o apagamento automático após muitas tentativas erradas`, d: `Apagar após várias tentativas de código, somente se tiver backup em dia.` },
        { id: 'celular-19', nivel: 'avancado', t: `Ative o modo de proteção máxima se você corre risco de ataque direcionado`, d: `Modo de isolamento/proteção avançada, para quem é exposto a ataques sofisticados, aceitando limitações.` }
      ] },
    { id: 'whatsapp', titulo: 'WhatsApp e Mensagens',
      intro: 'Evite a clonagem do WhatsApp e mantenha suas conversas privadas, no WhatsApp e em outros apps.',
      itens: [
        { id: 'whatsapp-1', nivel: 'essencial', t: `Ative a confirmação em duas etapas do WhatsApp`, d: `Um PIN de 6 dígitos e um e-mail impedem o registro do seu número em outro aparelho.` },
        { id: 'whatsapp-2', nivel: 'essencial', t: `Confira os aparelhos conectados ao seu WhatsApp`, d: `Desconecte dispositivos desconhecidos e nunca escaneie o QR do WhatsApp Web a pedido de alguém.` },
        { id: 'whatsapp-3', nivel: 'opcional', t: `Cadastre uma chave de acesso e um e-mail no WhatsApp`, d: `Biometria ou bloqueio de tela confirmam sua identidade e reduzem a dependência do SMS.` },
        { id: 'whatsapp-4', nivel: 'opcional', t: `Ative o bloqueio do WhatsApp por biometria`, d: `Exija digital ou rosto para abrir o app e use "Trancar conversa" nas mais sensíveis.` },
        { id: 'whatsapp-5', nivel: 'opcional', t: `Escolha quem pode adicionar você a grupos`, d: `Limite a inclusão a "Meus contatos" para evitar grupos de golpe.` },
        { id: 'whatsapp-6', nivel: 'opcional', t: `Silencie ligações de números desconhecidos`, d: `Ligações de desconhecidos não tocam, cortando uma via comum de golpe.` },
        { id: 'whatsapp-7', nivel: 'opcional', t: `Mostre sua foto e seus dados apenas para contatos`, d: `Restringir foto, recado e "visto por último" a contatos dificulta copiarem seu perfil.` },
        { id: 'whatsapp-8', nivel: 'opcional', t: `Ative o backup protegido por criptografia`, d: `Proteja a cópia de conversas no Google Drive ou iCloud com senha ou chave.` },
        { id: 'whatsapp-9', nivel: 'opcional', t: `Use mensagens temporárias em conversas sensíveis`, d: `Mensagens somem após 24h, 7 ou 90 dias — mas o destinatário ainda pode printar.` },
        { id: 'whatsapp-10', nivel: 'opcional', t: `Não abra arquivos inesperados, mesmo que venham de conhecidos`, d: `Desconfie de arquivos inesperados, sobretudo .apk e .exe, e confirme por ligação antes de abrir.` },
        { id: 'whatsapp-11', nivel: 'opcional', t: `Revise os participantes dos grupos que você administra`, d: `Ative a aprovação de novos membros, troque links que circularam demais e remova desconhecidos.` },
        { id: 'whatsapp-12', nivel: 'opcional', t: `Prefira aplicativos com criptografia de ponta a ponta ativada por padrão`, d: `Apps que já criptografam tudo por padrão, como WhatsApp e Signal, em vez de SMS.` },
        { id: 'whatsapp-13', nivel: 'avancado', t: `Confira o código de segurança em conversas importantes`, d: `Comparar o código pessoalmente ou por QR confirma que ninguém intercepta a conversa.` }
      ] },
    { id: 'banco', titulo: 'Banco, PIX e Cartões',
      intro: 'Proteja contas, transferências PIX e cartões contra golpes e roubos.',
      itens: [
        { id: 'banco-1', nivel: 'essencial', t: `Ative avisos de movimentação e ajuste os limites do PIX`, d: `Alerta em toda movimentação e limite de PIX reduzido, principalmente à noite.` },
        { id: 'banco-2', nivel: 'essencial', t: `Confira o nome de quem vai receber antes de confirmar o PIX`, d: `Veja nome e instituição do recebedor antes de confirmar e cancele se não forem os esperados.` },
        { id: 'banco-3', nivel: 'essencial', t: `Proteja o aplicativo do banco`, d: `Senha e biometria próprias, app atualizado e só da loja oficial, longe de redes públicas.` },
        { id: 'banco-4', nivel: 'essencial', t: `Consulte o Registrato do Banco Central`, d: `Com login gov.br, veja as contas e dívidas ligadas ao seu CPF para achar aberturas indevidas.` },
        { id: 'banco-5', nivel: 'opcional', t: `Use o modo de segurança do banco para quando estiver na rua`, d: `O modo do app limita transferências grandes fora de locais confiáveis.` },
        { id: 'banco-6', nivel: 'opcional', t: `Mantenha a maior parte do dinheiro fora do banco que está no celular`, d: `Deixe a reserva em conta/investimento com acesso mais difícil e confirmação extra para resgatar.` },
        { id: 'banco-7', nivel: 'opcional', t: `Revise suas chaves PIX`, d: `Use chave aleatória para receber de desconhecidos e exclua chaves não reconhecidas ou sem uso.` },
        { id: 'banco-8', nivel: 'opcional', t: `Revise as autorizações de PIX Automático e débito automático`, d: `Cancele cobranças periódicas que não reconhece e nunca aceite autorização pedida por suspeito.` },
        { id: 'banco-9', nivel: 'opcional', t: `Use cartão virtual nas compras pela internet`, d: `Um cartão virtual ou temporário por loja pode ser excluído se o número vazar.` },
        { id: 'banco-10', nivel: 'opcional', t: `Confira o recebedor do boleto antes de pagar`, d: `Veja recebedor e valor no app e, na dúvida, emita a segunda via pelo canal oficial.` },
        { id: 'banco-11', nivel: 'opcional', t: `Ative alertas de consulta ao seu CPF`, d: `Serviços de crédito avisam quando seu CPF é consultado ou usado para abrir crédito.` },
        { id: 'banco-12', nivel: 'opcional', t: `Bloqueie empréstimos consignados e confira os descontos do benefício`, d: `Bloqueie consignado no Meu INSS e confira o extrato para cancelar desconto não autorizado.` },
        { id: 'banco-13', nivel: 'opcional', t: `Revise os compartilhamentos de dados do Open Finance`, d: `Encerre no app o que não usa e conceda acesso só a instituição conhecida, por pouco tempo.` },
        { id: 'banco-14', nivel: 'opcional', t: `Aposte apenas em sites autorizados, com endereço terminado em .bet.br`, d: `Use só plataformas autorizadas (domínio .bet.br) e desconfie de ganho garantido.` },
        { id: 'banco-15', nivel: 'avancado', t: `Guarde criptomoedas com segurança`, d: `Corretora confiável com 2FA, carteira física para valores altos e nunca digite sua frase de recuperação.` }
      ] },
    { id: 'redes', titulo: 'Redes Sociais',
      intro: 'Proteja a conta e reduza o que você expõe sobre sua casa, sua rotina e sua família.',
      itens: [
        { id: 'redes-1', nivel: 'essencial', t: `Proteja sua conta com senha própria e verificação em duas etapas`, d: `Senha exclusiva e 2FA, de preferência com app autenticador.` },
        { id: 'redes-2', nivel: 'essencial', t: `Faça a verificação de privacidade da rede social`, d: `O guia de privacidade da rede mostra quem vê suas publicações, amigos e contatos.` },
        { id: 'redes-3', nivel: 'essencial', t: `Antes de publicar, pense que tudo pode ficar público e permanente`, d: `Qualquer conteúdo pode ser copiado ou printado, mesmo em perfil restrito.` },
        { id: 'redes-4', nivel: 'essencial', t: `Não publique onde você está em tempo real`, d: `Poste fotos de viagem depois de sair do local, para não avisar que a casa está vazia.` },
        { id: 'redes-5', nivel: 'opcional', t: `Não mostre documentos, cartões, passagens ou chaves em fotos`, d: `Confira o fundo das imagens: documentos, chaves e fachadas viram material de golpe.` },
        { id: 'redes-6', nivel: 'opcional', t: `Esconda do perfil sua data de nascimento, telefone e e-mail`, d: `Esses dados ajudam golpistas a se passar por você e a responder perguntas de segurança.` },
        { id: 'redes-7', nivel: 'opcional', t: `Limite quem pode marcar você e ver publicações antigas`, d: `Ative a aprovação de marcações e restrinja o público de posts antigos.` },
        { id: 'redes-8', nivel: 'opcional', t: `Desconfie de mensagens do suporte da rede social`, d: `Aviso direto com link é golpe; use a central de notificações oficial do app.` },
        { id: 'redes-9', nivel: 'opcional', t: `Desconfie de sorteios e promoções de perfis desconhecidos`, d: `Verifique se o perfil é oficial e nunca pague taxa para receber prêmio.` },
        { id: 'redes-10', nivel: 'opcional', t: `Remova apps e sites conectados às suas redes sociais`, d: `Revise os acessos de "Entrar com Facebook/Google" e remova o que não usa.` },
        { id: 'redes-11', nivel: 'opcional', t: `Desative a localização nas fotos que você compartilha`, d: `Remova os metadados de localização antes de enviar fotos como arquivo, por e-mail ou nuvem.` },
        { id: 'redes-12', nivel: 'opcional', t: `Feche as contas que você não usa mais`, d: `Baixe o que quiser guardar e exclua perfis abandonados, que são alvo fácil de invasão.` }
      ] },
    { id: 'email', titulo: 'E-mail',
      intro: 'Proteja a conta que pode recuperar todas as outras.',
      itens: [
        { id: 'email-1', nivel: 'essencial', t: `Proteja seu e-mail principal como a conta mais importante`, d: `Senha exclusiva e 2FA, de preferência com passkey ou app autenticador.` },
        { id: 'email-2', nivel: 'essencial', t: `Mantenha o telefone e o e-mail de recuperação atualizados`, d: `O provedor usa esses dados para devolver seu acesso; remova os antigos.` },
        { id: 'email-3', nivel: 'essencial', t: `Confira o remetente real antes de clicar`, d: `O nome exibido pode ser falso. Veja o endereço completo e acesse o site/app oficial, não o link.` },
        { id: 'email-4', nivel: 'opcional', t: `Verifique se há encaminhamentos e filtros que você não criou`, d: `Invasores criam regras para seguir recebendo suas mensagens. Apague as desconhecidas.` },
        { id: 'email-5', nivel: 'opcional', t: `Revise os aplicativos com acesso ao seu e-mail`, d: `Remova apps que não usa ou não reconhece, sobretudo os com permissão total.` },
        { id: 'email-6', nivel: 'opcional', t: `Tenha um e-mail para assuntos importantes e outro para cadastros`, d: `Separe banco e serviços oficiais de lojas e newsletters para conter golpes e vazamentos.` },
        { id: 'email-7', nivel: 'opcional', t: `Não envie documentos e senhas por e-mail sem proteção`, d: `Use link com validade ou arquivo com senha, enviando a senha por outro canal.` },
        { id: 'email-8', nivel: 'opcional', t: `Saia de listas de e-mail pelo botão do próprio provedor`, d: `Use o descadastro do Gmail/Outlook e, se for suspeito, marque como spam.` },
        { id: 'email-9', nivel: 'opcional', t: `Bloqueie o carregamento automático de imagens`, d: `Imagens externas podem avisar ao remetente que você abriu a mensagem.` },
        { id: 'email-10', nivel: 'opcional', t: `Não revele demais na resposta automática de férias`, d: `Evite datas de viagem, destino e contatos: a resposta chega também a golpistas.` },
        { id: 'email-11', nivel: 'avancado', t: `Use apelidos de e-mail nos cadastros`, d: `Aliases criam um endereço por cadastro, permitindo desativar só o que vazou.` },
        { id: 'email-12', nivel: 'avancado', t: `Considere um provedor de e-mail focado em privacidade`, d: `Provedores com criptografia de ponta a ponta e sem usar seu conteúdo em anúncios; a migração dá trabalho.` }
      ] },
    { id: 'navegacao', titulo: 'Navegação na Internet',
      intro: 'Navegue com mais segurança e limite o rastreamento online.',
      itens: [
        { id: 'navegacao-1', nivel: 'essencial', t: `Mantenha o navegador atualizado`, d: `Reinicie o navegador após atualizar para aplicar as correções de segurança.` },
        { id: 'navegacao-2', nivel: 'essencial', t: `Acesse sites importantes pelos favoritos ou digitando o endereço`, d: `Evite links de mensagem para banco e serviços: sites falsos imitam os verdadeiros.` },
        { id: 'navegacao-3', nivel: 'essencial', t: `Desconfie dos anúncios no topo da busca`, d: `Resultado patrocinado pode levar a site fraudulento. Confira o endereço antes de informar dados.` },
        { id: 'navegacao-4', nivel: 'essencial', t: `Instale poucas extensões, e só de fontes confiáveis`, d: `Extensões leem tudo o que você faz no navegador. Mantenha só as necessárias.` },
        { id: 'navegacao-5', nivel: 'opcional', t: `Saiba que o cadeado não garante que o site é confiável`, d: `O cadeado indica conexão criptografada, não legitimidade; golpistas também o têm.` },
        { id: 'navegacao-6', nivel: 'opcional', t: `Bloqueie as notificações de sites`, d: `Negue pedidos de notificação (sobretudo "prove que não é um robô") e remova permissões antigas.` },
        { id: 'navegacao-7', nivel: 'opcional', t: `Feche avisos de vírus que aparecem em sites`, d: `Alerta em tela cheia com som e "suporte" por telefone é golpe. Feche a aba sem ligar.` },
        { id: 'navegacao-8', nivel: 'opcional', t: `Não baixe programas e arquivos de sites desconhecidos`, d: `Baixe software só do fabricante ou de loja oficial; download aleatório é via comum de infecção.` },
        { id: 'navegacao-9', nivel: 'opcional', t: `Recuse acesso à câmera, ao microfone e à localização para sites`, d: `Conceda só quando necessário, por site, e revise a lista de acessos de vez em quando.` },
        { id: 'navegacao-10', nivel: 'opcional', t: `Use uma janela anônima em computadores de outras pessoas`, d: `A janela privativa não deixa histórico nem cookies, mas não oculta você do site ou do provedor.` },
        { id: 'navegacao-11', nivel: 'opcional', t: `Bloqueie anúncios e rastreadores`, d: `Um bloqueador confiável reduz rastreamento e anúncios maliciosos.` },
        { id: 'navegacao-12', nivel: 'opcional', t: `Recuse cookies desnecessários e bloqueie cookies de terceiros`, d: `Cookies de terceiros acompanham você entre sites diferentes.` },
        { id: 'navegacao-13', nivel: 'opcional', t: `Considere um navegador e um buscador focados em privacidade`, d: `Opções que coletam menos dados e bloqueiam rastreadores por padrão reduzem a criação de perfis.` },
        { id: 'navegacao-14', nivel: 'avancado', t: `Use perfis separados no navegador`, d: `Separar trabalho, uso pessoal e banco isola cookies e logins entre eles.` },
        { id: 'navegacao-15', nivel: 'avancado', t: `Remova o rastreamento dos links que você compartilha`, d: `Apague o que vem depois do "?" no link, que identifica origem e quem compartilhou.` },
        { id: 'navegacao-16', nivel: 'avancado', t: `Ative o DNS seguro no navegador`, d: `DNS criptografado com provedor confiável protege a consulta de nomes contra interceptação.` },
        { id: 'navegacao-17', nivel: 'avancado', t: `Use o Navegador Tor quando precisar de anonimato`, d: `Oculta seu endereço de internet, com navegação mais lenta e alguns sites bloqueados.` }
      ] },
    { id: 'ia', titulo: 'Inteligência Artificial',
      intro: 'Use assistentes de IA com segurança e reconheça golpes feitos com IA.',
      itens: [
        { id: 'ia-1', nivel: 'essencial', t: `Desconfie de áudios, vídeos e chamadas pedindo dinheiro, mesmo com voz conhecida`, d: `Vozes são clonadas com segundos de áudio. Desligue, ligue de volta e combine uma palavra-código.` },
        { id: 'ia-2', nivel: 'essencial', t: `Não acredite em vídeos de famosos oferecendo investimento, remédio ou dinheiro`, d: `Deepfakes promovem golpes. Confirme no perfil oficial da pessoa ou em veículos de notícia.` },
        { id: 'ia-3', nivel: 'essencial', t: `Não coloque dados pessoais sensíveis em assistentes de IA`, d: `Nada de CPF, senha, cartão, exame ou contrato: as conversas podem ser guardadas e usadas em treino. No trabalho, siga a política da empresa.` },
        { id: 'ia-4', nivel: 'opcional', t: `Desative o uso das suas conversas para treinar a IA`, d: `Desligue o treinamento e apague o histórico; use o modo temporário quando houver.` },
        { id: 'ia-5', nivel: 'opcional', t: `Confirme em fontes confiáveis as respostas importantes da IA`, d: `A IA inventa com convicção. Valide saúde, dinheiro e direitos em site oficial ou com um profissional.` },
        { id: 'ia-6', nivel: 'opcional', t: `Instale apenas aplicativos e extensões de IA oficiais`, d: `Apps com nome parecido cobram assinatura ou roubam senha. Confira o desenvolvedor na loja oficial.` },
        { id: 'ia-7', nivel: 'opcional', t: `Pense antes de enviar fotos para aplicativos de IA`, d: `Apps de avatar e filtro podem reter suas imagens. Leia a política e evite fotos de crianças.` },
        { id: 'ia-8', nivel: 'opcional', t: `Nunca crie nem compartilhe imagens íntimas falsas de outra pessoa`, d: `Causa dano grave e pode ser crime. Não repasse, denuncie e, se for vítima, veja "Se Algo Der Errado".` },
        { id: 'ia-9', nivel: 'avancado', t: `Limite o acesso de assistentes de IA ao seu e-mail, agenda e arquivos`, d: `Assistentes podem ser manipulados por instruções ocultas. Dê só o acesso necessário e exija confirmação para enviar ou pagar.` },
        { id: 'ia-10', nivel: 'avancado', t: `Revise recursos de IA que gravam sua tela ou suas reuniões`, d: `Ative só se for útil, exclua dados sensíveis dos registros e avise os participantes.` }
      ] },
    { id: 'familia', titulo: 'Crianças, Idosos e Família',
      intro: 'Ajude quem você ama a usar a internet com segurança: regras simples, configuração dos aparelhos e diálogo.',
      itens: [
        { id: 'familia-1', nivel: 'essencial', t: `Combine uma palavra-código com a família`, d: `Uma palavra secreta, fora das redes, confirma pedidos de dinheiro feitos em nome de um parente.` },
        { id: 'familia-2', nivel: 'essencial', t: `Ajude pais e avós a configurar a segurança dos aparelhos`, d: `Ative com eles 2FA, limites de PIX e alertas, e reforce que banco não se instala a pedido de desconhecido.` },
        { id: 'familia-3', nivel: 'essencial', t: `Use o controle parental nos aparelhos das crianças`, d: `Ferramentas do Google e da Apple aprovam downloads, filtram conteúdo e definem horários.` },
        { id: 'familia-4', nivel: 'essencial', t: `Combine com as crianças que elas podem contar tudo sem medo de castigo`, d: `A criança precisa relatar pedidos suspeitos sem medo de punição; o silêncio favorece o abusador.` },
        { id: 'familia-5', nivel: 'opcional', t: `Configure a privacidade dos jogos online`, d: `Limite o chat com desconhecidos e os gastos, e alerte sobre "grátis" que pede login e senha.` },
        { id: 'familia-6', nivel: 'opcional', t: `Pense antes de publicar fotos dos seus filhos`, d: `Evite imagens que revelem rotina, escola ou localização, e nunca imagens íntimas.` },
        { id: 'familia-7', nivel: 'opcional', t: `Respeite a idade mínima das redes sociais`, d: `Com a idade correta, as proteções extras para adolescentes são ativadas automaticamente.` },
        { id: 'familia-8', nivel: 'opcional', t: `Exija aprovação para compras em aplicativos e jogos`, d: `Não deixe cartão salvo na conta da criança e ative a aprovação de compras.` },
        { id: 'familia-9', nivel: 'opcional', t: `Compartilhe a localização só com quem precisa`, d: `Revise quem vê a localização da família (Maps, Buscar, WhatsApp) e remova quem está fora do círculo.` },
        { id: 'familia-10', nivel: 'opcional', t: `Saiba onde pedir ajuda em casos de cyberbullying e abuso`, d: `Conheça canais como SaferNet Brasil e Disque 100, e guarde provas antes de bloquear o agressor.` }
      ] },
    { id: 'backup', titulo: 'Backup e Recuperação',
      intro: 'Proteja fotos, documentos e o acesso às contas para conseguir recuperar tudo se algo der errado.',
      itens: [
        { id: 'backup-1', nivel: 'essencial', t: `Ative o backup automático do celular`, d: `Ligue o backup na nuvem e confira se as fotos entram e se há espaço.` },
        { id: 'backup-2', nivel: 'essencial', t: `Guarde os códigos de recuperação das contas importantes`, d: `Anote os códigos oferecidos ao ativar o 2FA e guarde-os fora do celular.` },
        { id: 'backup-3', nivel: 'essencial', t: `Tenha uma cópia dos arquivos importantes fora do computador`, d: `Documentos e fotos em HD externo ou nuvem; desconecte o HD após o backup.` },
        { id: 'backup-4', nivel: 'opcional', t: `Tenha mais de uma forma de entrar nas contas principais`, d: `Um segundo método de verificação evita ficar sem acesso se perder o celular.` },
        { id: 'backup-5', nivel: 'opcional', t: `Teste se o backup funciona`, d: `Abra alguns arquivos do backup de vez em quando para confirmar que ele serve.` },
        { id: 'backup-6', nivel: 'opcional', t: `Anote o IMEI do celular e guarde a nota fiscal`, d: `O IMEI, acessível sem o celular, serve para bloquear o aparelho e registrar B.O.` },
        { id: 'backup-7', nivel: 'opcional', t: `Guarde as versões digitais dos documentos com segurança`, d: `Prefira as versões oficiais e, se guardar fotos, use pastas protegidas.` },
        { id: 'backup-8', nivel: 'opcional', t: `Planeje o que acontece com suas contas depois da sua morte`, d: `Os recursos de herança das plataformas deixam alguém de confiança acessar ou encerrar as contas.` },
        { id: 'backup-9', nivel: 'avancado', t: `Siga a regra 3-2-1 para o que é insubstituível`, d: `Três cópias, em dois tipos de mídia, uma delas fora de casa, com senha nos backups com dados pessoais.` },
        { id: 'backup-10', nivel: 'avancado', t: `Ative a Proteção Avançada de Dados no iCloud`, d: `Criptografia de ponta a ponta do iCloud — configure antes uma chave ou contato de recuperação.` }
      ] },
    { id: 'wifi', titulo: 'Wi-Fi e Internet de Casa',
      intro: 'Proteja o roteador doméstico e use redes públicas com cautela.',
      itens: [
        { id: 'wifi-1', nivel: 'essencial', t: `Troque a senha de administração do roteador`, d: `Troque a senha padrão de configuração por uma forte e diferente da senha do Wi-Fi.` },
        { id: 'wifi-2', nivel: 'essencial', t: `Use WPA2 ou WPA3 e uma senha forte no Wi-Fi`, d: `Configure WPA3 (ou WPA2), nunca WEP ou rede aberta, e reserve a rede de convidados para visitas.` },
        { id: 'wifi-3', nivel: 'essencial', t: `Mantenha o roteador atualizado ou peça a troca de um modelo antigo`, d: `Ative a atualização automática e troque aparelho que não recebe mais correção.` },
        { id: 'wifi-4', nivel: 'opcional', t: `Tenha cuidado no Wi-Fi público`, d: `Confirme o nome exato da rede e prefira dados móveis para banco e compras.` },
        { id: 'wifi-5', nivel: 'opcional', t: `Crie uma rede de convidados para visitas e aparelhos inteligentes`, d: `Isole visitas e dispositivos IoT (câmera, TV) da rede principal.` },
        { id: 'wifi-6', nivel: 'opcional', t: `Desative o WPS`, d: `O WPS tem falhas conhecidas que facilitam descobrir a senha.` },
        { id: 'wifi-7', nivel: 'opcional', t: `Desative o acesso remoto e o UPnP do roteador`, d: `Ambos são explorados por invasores; desative se não tiver certeza de que precisa.` },
        { id: 'wifi-8', nivel: 'opcional', t: `Não use seu nome ou endereço no nome da rede Wi-Fi`, d: `Escolha um nome neutro, que não revele quem você é, onde mora ou o modelo do roteador.` },
        { id: 'wifi-9', nivel: 'opcional', t: `Confira quais aparelhos estão conectados à sua rede`, d: `Revise a lista de dispositivos e troque a senha se achar algo desconhecido.` },
        { id: 'wifi-10', nivel: 'opcional', t: `Use VPN só quando houver motivo e evite as gratuitas`, d: `Prefira serviço pago e conhecido; VPN grátis costuma monetizar seus dados.` },
        { id: 'wifi-11', nivel: 'avancado', t: `Use um DNS que bloqueia sites perigosos`, d: `Um DNS com filtro no roteador protege todos os aparelhos da casa de uma vez.` }
      ] },
    { id: 'computador', titulo: 'Computador',
      intro: 'Proteja seu computador, seus arquivos e o que você faz nele.',
      itens: [
        { id: 'computador-1', nivel: 'essencial', t: `Deixe as atualizações automáticas ligadas`, d: `Inclua navegador, leitor de PDF e pacote de escritório, e reinicie quando pedir.` },
        { id: 'computador-2', nivel: 'essencial', t: `Troque o Windows 10 ou outro sistema sem suporte`, d: `Migre para o Windows 11 ou Linux: sistema sem suporte não recebe correção.` },
        { id: 'computador-3', nivel: 'essencial', t: `Mantenha a proteção contra vírus do sistema ligada`, d: `Confirme o Microsoft Defender ativo e evite otimizadores e antivírus desconhecidos.` },
        { id: 'computador-4', nivel: 'essencial', t: `Não instale programas piratas, cracks ou ativadores`, d: `Pirataria é via comum de malware que rouba senha e dados de banco.` },
        { id: 'computador-5', nivel: 'essencial', t: `Proteja a entrada no computador e bloqueie a tela ao sair`, d: `Senha/PIN/biometria, bloqueio automático e trave a tela sempre que se afastar.` },
        { id: 'computador-6', nivel: 'opcional', t: `Ative a criptografia do disco`, d: `BitLocker, FileVault ou criptografia do dispositivo, com a chave guardada em local seguro.` },
        { id: 'computador-7', nivel: 'opcional', t: `Remova programas de acesso remoto que você não usa`, d: `Desinstale ferramentas de acesso remoto desconhecidas e troque senhas se precisar.` },
        { id: 'computador-8', nivel: 'opcional', t: `Desinstale programas que você não usa`, d: `Software esquecido deixa de ser atualizado e pode ter falha explorada.` },
        { id: 'computador-9', nivel: 'opcional', t: `Use uma conta sem permissão de administrador no dia a dia`, d: `Conta padrão no uso diário; a de administrador só para instalar programa.` },
        { id: 'computador-10', nivel: 'opcional', t: `Cuidado com pen drives e cabos desconhecidos`, d: `Não conecte dispositivo de origem desconhecida e analise arquivos de terceiros antes de abrir.` },
        { id: 'computador-11', nivel: 'opcional', t: `Revise as permissões de câmera, microfone e localização`, d: `Tire o acesso de programas que não precisam de câmera, microfone, localização ou arquivos.` },
        { id: 'computador-12', nivel: 'opcional', t: `Tampe a webcam quando não estiver usando`, d: `Uma tampa deslizante ou adesivo removível evita gravação sem você saber.` },
        { id: 'computador-13', nivel: 'opcional', t: `Reduza o envio de dados de uso para a fabricante`, d: `Envie só o diagnóstico obrigatório e desative experiências e anúncios personalizados.` },
        { id: 'computador-14', nivel: 'opcional', t: `Mantenha o firewall ligado`, d: `Confirme o firewall nativo ativo, principalmente em Wi-Fi público.` },
        { id: 'computador-15', nivel: 'avancado', t: `Desligue o notebook em viagens em vez de suspender`, d: `Com criptografia ativa, um equipamento desligado é mais difícil de acessar que um suspenso.` },
        { id: 'computador-16', nivel: 'avancado', t: `Proteja a inicialização com senha da BIOS e Secure Boot`, d: `Senha na BIOS/UEFI e Secure Boot ativo impedem boot não autorizado.` },
        { id: 'computador-17', nivel: 'avancado', t: `Considere o Linux em computadores antigos`, d: `Linux Mint e Ubuntu mantêm seguros equipamentos que não rodam o Windows 11.` },
        { id: 'computador-18', nivel: 'avancado', t: `Abra arquivos suspeitos em um ambiente isolado`, d: `Máquina virtual ou Windows Sandbox para abrir arquivo desconhecido sem afetar o sistema.` }
      ] },
    { id: 'casa', titulo: 'Casa Conectada',
      intro: 'Use câmeras, assistentes de voz e aparelhos inteligentes sem expor a privacidade e a segurança da casa.',
      itens: [
        { id: 'casa-1', nivel: 'essencial', t: `Troque a senha padrão de câmeras e aparelhos inteligentes`, d: `Senha única por aparelho, trocada já no primeiro uso.` },
        { id: 'casa-2', nivel: 'essencial', t: `Mantenha os aparelhos atualizados`, d: `Ative atualização automática e troque aparelho que o fabricante já não atualiza.` },
        { id: 'casa-3', nivel: 'essencial', t: `Ative a verificação em duas etapas nos aplicativos da casa`, d: `Senha forte e segundo fator nos apps de câmera, alarme e fechadura.` },
        { id: 'casa-4', nivel: 'essencial', t: `Não use TV Box pirata`, d: `TV Box que libera conteúdo pago ilegal costuma trazer malware e espionar a rede.` },
        { id: 'casa-5', nivel: 'opcional', t: `Compre aparelhos homologados pela Anatel e de marcas que oferecem atualização`, d: `Prefira aparelho homologado, de fabricante com suporte, e veja quais dados ele coleta.` },
        { id: 'casa-6', nivel: 'opcional', t: `Posicione as câmeras sem expor a intimidade de ninguém`, d: `Nada de câmera em quarto e banheiro nem filmando o vizinho; avise visitas e funcionários.` },
        { id: 'casa-7', nivel: 'opcional', t: `Revise e apague as gravações dos assistentes de voz`, d: `Ouça, apague e configure a exclusão automática nos apps da Alexa e do Google.` },
        { id: 'casa-8', nivel: 'opcional', t: `Desligue o microfone e a câmera dos assistentes quando não usar`, d: `Use o botão de mudo ou a tampa da câmera em conversas privadas.` },
        { id: 'casa-9', nivel: 'opcional', t: `Revise quem tem acesso aos aparelhos da casa`, d: `Remova do app quem não deve mais ter acesso (ex-parceiro, prestador, ex-morador).` },
        { id: 'casa-10', nivel: 'opcional', t: `Desative a coleta de dados da Smart TV`, d: `Desligue o rastreamento de visualização e os anúncios personalizados da TV.` },
        { id: 'casa-11', nivel: 'opcional', t: `Cuidado com os dados de relógios e pulseiras inteligentes`, d: `Proteja dados de saúde, sono e trajeto com zonas de privacidade e perfil privado.` },
        { id: 'casa-12', nivel: 'avancado', t: `Pense duas vezes antes de conectar fechaduras e alarmes à internet`, d: `Conecte só se mantiver um acesso físico e escolher marca com bom histórico de segurança.` }
      ] },
    { id: 'lgpd', titulo: 'Seus Dados e a LGPD',
      intro: 'Descubra quem guarda suas informações pessoais e como exercer seus direitos para reduzir a exposição.',
      itens: [
        { id: 'lgpd-1', nivel: 'essencial', t: `Não envie foto de documento ou selfie com documento a desconhecidos`, d: `Só por canal oficial de empresa que você procurou — nunca para quem ofereceu emprego, prêmio ou empréstimo.` },
        { id: 'lgpd-2', nivel: 'essencial', t: `Informe o CPF só quando for realmente necessário`, d: `Pergunte a finalidade do uso e recuse quando o pedido não se justificar.` },
        { id: 'lgpd-3', nivel: 'opcional', t: `Peça às empresas para ver, corrigir ou apagar seus dados`, d: `Use o canal de privacidade (encarregado/DPO) indicado na política da empresa.` },
        { id: 'lgpd-4', nivel: 'opcional', t: `Reclame à ANPD se a empresa não atender ao seu pedido`, d: `Registre reclamação na ANPD se houver negativa ou silêncio, guardando o pedido e a data.` },
        { id: 'lgpd-5', nivel: 'opcional', t: `Cadastre seu telefone no Não Me Perturbe`, d: `Bloqueie ligações de telemarketing de operadoras e de bancos que oferecem consignado e cartão.` },
        { id: 'lgpd-6', nivel: 'opcional', t: `Desligue o compartilhamento de dados com parceiros`, d: `Desative nos apps a opção de compartilhar dados com "parceiros" quando não for necessária.` },
        { id: 'lgpd-7', nivel: 'opcional', t: `Tarje os dados e use marca-d'água ao enviar documentos`, d: `Oculte dados desnecessários (removendo o conteúdo de fato) e marque a finalidade e o destinatário.` },
        { id: 'lgpd-8', nivel: 'opcional', t: `Não use sites que vendem consultas de CPF e dados de outras pessoas`, d: `Esses painéis usam dados vazados e podem roubar você. Consulte-se no Registrato, birôs ou gov.br.` },
        { id: 'lgpd-9', nivel: 'opcional', t: `Saiba o que fazer quando receber aviso de vazamento`, d: `Confirme por canal oficial, troque a senha do serviço e de onde usava a mesma, e desconfie de golpes.` },
        { id: 'lgpd-10', nivel: 'opcional', t: `Revise o histórico de localização e de atividade da sua conta Google`, d: `Configure a exclusão automática no Minha Atividade e limpe períodos da Linha do tempo do Maps.` },
        { id: 'lgpd-11', nivel: 'avancado', t: `Peça para sair do Cadastro Positivo, se preferir`, d: `Solicite a exclusão a Serasa, Boa Vista, SPC ou Quod, ciente de que pode dificultar crédito.` },
        { id: 'lgpd-12', nivel: 'avancado', t: `Pergunte como sua biometria será usada antes de cadastrá-la`, d: `Antes de digital ou facial, questione finalidade, prazo de guarda e se há alternativa.` }
      ] },
    { id: 'fisica', titulo: 'Segurança Física',
      intro: 'Proteja a si mesmo, seus documentos e seus aparelhos fora da internet.',
      itens: [
        { id: 'fisica-1', nivel: 'essencial', t: `Use o celular com atenção na rua`, d: `Evite usá-lo em pontos de fácil abordagem e ative os recursos de proteção contra roubo.` },
        { id: 'fisica-2', nivel: 'essencial', t: `Cubra o teclado ao digitar senha ou PIN`, d: `Esconda com a mão ao digitar em caixa, maquininha ou celular em público.` },
        { id: 'fisica-3', nivel: 'opcional', t: `Confira o caixa eletrônico antes de usar`, d: `Observe sinais de adulteração no leitor e no teclado e prefira caixas dentro de agências.` },
        { id: 'fisica-4', nivel: 'opcional', t: `Rasgue documentos e etiquetas antes de jogar fora`, d: `Destrua fatura, extrato, receita e etiqueta com dados pessoais antes do descarte.` },
        { id: 'fisica-5', nivel: 'opcional', t: `Não deixe celular, bolsa ou notebook à vista no carro`, d: `Guarde no porta-malas antes de chegar ao destino, para não ser visto.` },
        { id: 'fisica-6', nivel: 'opcional', t: `Use película de privacidade em locais públicos`, d: `O filtro dificulta que quem está ao lado veja sua tela.` },
        { id: 'fisica-7', nivel: 'opcional', t: `Proteja seu endereço ao receber encomendas`, d: `Prefira ponto de retirada ou o trabalho e não dê dados ou foto de documento a entregador.` },
        { id: 'fisica-8', nivel: 'opcional', t: `Compartilhe sua corrida de aplicativo com alguém de confiança`, d: `Envie o trajeto em tempo real e confira placa, modelo e nome do motorista antes de entrar.` },
        { id: 'fisica-9', nivel: 'opcional', t: `Leve os documentos no celular e deixe os originais em casa`, d: `Use as versões digitais oficiais e reduza o que carrega na carteira.` },
        { id: 'fisica-10', nivel: 'opcional', t: `Fique atento a rastreadores escondidos`, d: `Observe alertas de rastreador desconhecido no celular e, se receber um, procure o objeto.` },
        { id: 'fisica-11', nivel: 'avancado', t: `Saiba bloquear rapidamente a biometria do celular`, d: `Conheça o atalho que força o código em vez da biometria em caso de abordagem.` },
        { id: 'fisica-12', nivel: 'avancado', t: `Pense antes de enviar seu DNA para testes genéticos`, d: `Leia a política e prefira empresa que permita excluir amostra e resultado.` }
      ] },
    { id: 'habitos', titulo: 'Hábitos Seguros',
      intro: 'Atitudes simples do dia a dia que evitam a maioria dos problemas de segurança.',
      itens: [
        { id: 'habitos-1', nivel: 'essencial', t: `Pare, pense e confirme antes de clicar, pagar ou responder`, d: `Desconfie de mensagem, ligação ou site que peça dados, dinheiro ou urgência, e confirme por canal oficial.` },
        { id: 'habitos-2', nivel: 'essencial', t: `Não empreste o celular desbloqueado`, d: `Se precisar, limite a um único app com fixação (Android) ou Acesso Guiado (iPhone).` },
        { id: 'habitos-3', nivel: 'opcional', t: `Faça uma revisão de segurança a cada poucos meses`, d: `Revise as contas, os dispositivos conectados e o que falta deste checklist.` },
        { id: 'habitos-4', nivel: 'opcional', t: `Confirme notícias antes de compartilhar`, d: `Cheque em veículo confiável ou agência de checagem antes de repassar, sobretudo tema eleitoral.` },
        { id: 'habitos-5', nivel: 'opcional', t: `Use a Verificação de Segurança se alguém próximo pode estar vigiando você`, d: `Ferramentas nativas removem acessos de terceiros; quem sofre violência pode ligar 180.` },
        { id: 'habitos-6', nivel: 'opcional', t: `Separe as contas pessoais das contas de trabalho`, d: `E-mail, contas e equipamentos separados contêm o impacto de uma invasão.` },
        { id: 'habitos-7', nivel: 'opcional', t: `Evite falar de dados pessoais em voz alta em lugares públicos`, d: `Não dite CPF, cartão, chave PIX ou endereço em local movimentado.` }
      ] },
    { id: 'emergencia', titulo: 'Se Algo Der Errado',
      intro: 'O que fazer, passo a passo, em caso de golpe, roubo ou invasão.',
      itens: [
        { id: 'emergencia-1', nivel: 'essencial', t: `Tenha anotados os telefones do banco e da operadora`, d: `Deixe os telefones do banco, do cartão e da operadora num lugar acessível sem o celular.` },
        { id: 'emergencia-2', nivel: 'essencial', t: `Saiba o que fazer se o celular for roubado ou perdido`, d: `De outro aparelho, alerte no Celular Seguro, bloqueie contas, cartões, linha e IMEI, e troque senhas.` },
        { id: 'emergencia-3', nivel: 'essencial', t: `Saiba como contestar um PIX feito em golpe`, d: `Avise o banco logo, peça a devolução pelo MED no app, registre B.O. e guarde provas.` },
        { id: 'emergencia-4', nivel: 'essencial', t: `Saiba recuperar uma conta invadida`, d: `Use só o processo oficial, troque a senha, encerre sessões, revise a recuperação e avise contatos.` },
        { id: 'emergencia-5', nivel: 'opcional', t: `Saiba o que fazer se o seu WhatsApp for clonado`, d: `Reinstale, confirme o número por SMS para desconectar o invasor e avise seus contatos por outro canal.` },
        { id: 'emergencia-6', nivel: 'opcional', t: `Saiba o que fazer se instalou um aplicativo a pedido de um golpista`, d: `Ative o modo avião, bloqueie as contas por outro telefone, remova o app e restaure se houver dúvida.` },
        { id: 'emergencia-7', nivel: 'opcional', t: `Guarde provas e registre boletim de ocorrência`, d: `Capture conversas, comprovantes e perfis antes de apagar ou bloquear, e registre o B.O. online.` },
        { id: 'emergencia-8', nivel: 'opcional', t: `Saiba o que fazer se seus documentos forem roubados ou usados em fraude`, d: `Registre B.O., ative alertas de crédito, consulte o Registrato e conteste cada dívida.` },
        { id: 'emergencia-9', nivel: 'opcional', t: `Não pague chantagem com fotos ou vídeos íntimos`, d: `Não pague, preserve provas, bloqueie e denuncie, e acione StopNCII, Take It Down, SaferNet e a polícia.` },
        { id: 'emergencia-10', nivel: 'opcional', t: `Saiba o que fazer se o computador pegar vírus ou tiver os arquivos sequestrados`, d: `Desconecte o computador, não pague resgate, troque senhas por outro aparelho e restaure do backup.` }
      ] }
  ]
};

/* ===================== LÓGICA DA PÁGINA ===================== */
(function () {
  const root = document.getElementById('cats');
  if (!root) return;

  const STORAGE_KEY = 'cl_privacidade_v1';
  const NIVEL_NOME = { essencial: 'Essencial', opcional: 'Opcional', avancado: 'Avançado' };
  const itens = CHECKLIST.categorias.flatMap(c => c.itens);
  const total = itens.length;

  /* ---- estado (localStorage, à prova de bloqueio) ---- */
  let done = new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) JSON.parse(raw).forEach(id => done.add(id));
  } catch (e) { /* navegação privada ou storage bloqueado: segue sem salvar */ }
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...done])); } catch (e) {} };

  /* ---- render ---- */
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

  CHECKLIST.categorias.forEach(cat => {
    const det = el('details', 'cat');
    det.dataset.cat = cat.id;
    const sum = el('summary', 'cat-sum');
    const head = el('span', 'cat-head');
    head.append(el('span', 'cat-t', cat.titulo));
    const meta = el('span', 'cat-meta');
    meta.append(el('b', 'cat-done', '0'), document.createTextNode(' / ' + cat.itens.length));
    head.append(meta);
    sum.append(head);
    const bar = el('span', 'cat-bar'); bar.append(el('span', 'cat-fill'));
    sum.append(bar);
    det.append(sum);

    const body = el('div', 'cat-body');
    body.append(el('p', 'cat-intro', cat.intro));
    const ul = el('ul', 'items');
    cat.itens.forEach(it => {
      const li = el('li', 'item'); li.dataset.nivel = it.nivel;
      const lab = el('label', 'it-lab');
      const cb = el('input'); cb.type = 'checkbox'; cb.dataset.id = it.id;
      if (done.has(it.id)) cb.checked = true;
      const main = el('span', 'it-main');
      const top = el('span', 'it-top');
      top.append(el('span', 'it-t', it.t));
      top.append(el('span', 'pill nv-' + it.nivel, NIVEL_NOME[it.nivel]));
      main.append(top, el('span', 'it-d', it.d));
      lab.append(cb, main);
      li.append(lab);
      ul.append(li);
    });
    body.append(ul);
    det.append(body);
    root.append(det);
  });

  /* ---- contadores / barras ---- */
  const progTxt = document.getElementById('clProgTxt');
  const progFill = document.getElementById('clFill');
  const progPct = document.getElementById('clPct');

  function refresh() {
    let g = 0;
    root.querySelectorAll('.cat').forEach(det => {
      const cbs = det.querySelectorAll('input[type=checkbox]');
      let d = 0; cbs.forEach(c => { if (c.checked) d++; });
      g += d;
      det.querySelector('.cat-done').textContent = String(d);
      const pct = cbs.length ? Math.round(d / cbs.length * 100) : 0;
      det.querySelector('.cat-fill').style.width = pct + '%';
      det.classList.toggle('full', d === cbs.length && cbs.length > 0);
    });
    const pct = total ? Math.round(g / total * 100) : 0;
    progTxt.textContent = `Você marcou ${g} de ${total} itens`;
    progFill.style.width = pct + '%';
    progPct.textContent = pct + '%';
  }

  /* ---- interações ---- */
  root.addEventListener('change', e => {
    const cb = e.target;
    if (cb && cb.type === 'checkbox') {
      if (cb.checked) done.add(cb.dataset.id); else done.delete(cb.dataset.id);
      save(); refresh();
    }
  });

  /* filtro por nível */
  const chips = [...document.querySelectorAll('.lvl-chip')];
  chips.forEach(b => b.addEventListener('click', () => {
    const lv = b.dataset.lvl || '';
    root.dataset.filter = lv;
    chips.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  }));

  /* expandir / recolher tudo */
  const btnOpen = document.getElementById('clOpen');
  const btnClose = document.getElementById('clClose');
  if (btnOpen) btnOpen.addEventListener('click', () => root.querySelectorAll('.cat').forEach(d => d.open = true));
  if (btnClose) btnClose.addEventListener('click', () => root.querySelectorAll('.cat').forEach(d => d.open = false));

  /* baixar PDF = imprimir (abre tudo antes) */
  const btnPdf = document.getElementById('clPdf');
  if (btnPdf) btnPdf.addEventListener('click', () => window.print());
  window.addEventListener('beforeprint', () => root.querySelectorAll('.cat').forEach(d => d.open = true));

  /* limpar progresso */
  const btnReset = document.getElementById('clReset');
  if (btnReset) btnReset.addEventListener('click', () => {
    if (!confirm('Isto apaga todas as marcações deste navegador. Continuar?')) return;
    done = new Set(); save();
    root.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false; });
    refresh();
  });

  document.querySelector('.cl-ctl').hidden = false;
  refresh();
})();
