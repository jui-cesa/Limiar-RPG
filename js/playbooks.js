/* ========================================
   LIMIAR: CONTROLE DE DANOS
   Playbooks dos 5 Sintonizados (compartilhado)
   ======================================== */

window.LIMIAR_PLAYBOOKS = {
  olhar: {
    nome: 'DANILO',
    versao: 'Danilo',
    jogador: 'Line',
    arquetipo: 'O OLHAR',
    arquetipo_sub: 'Câmera — 19 anos',
    citacao: 'Se eu não filmar, ninguém vai acreditar. E se eu não acreditar, eu enlouqueço.',
    atributos: { dia: 2, noite: 5, profundo: 2 },
    movimentos: [
      {
        nome: 'A LENTE NÃO MENTE',
        desc: 'Sempre que você estiver filmando uma cena com a Handycam e algo paranormal acontecer, o grupo ganha +1 progressivo na próxima Bisbilhotar feita revisando a fita. Eventos sobrenaturais aparecem na fita mesmo que ninguém tenha visto na hora — pode ser usado como Pista grátis depois.'
      },
      {
        nome: 'FORA DO QUADRO, FORA DE PERIGO',
        desc: 'Uma vez por sessão, quando algo do Profundo se voltar contra você, declare "Eu não estava no quadro" e abaixe a câmera. Você redireciona o efeito para o lugar ao invés de você (parede racha, cadeira voa, vidro estoura — você não é atingido). Marque 1 Stress pelo susto e siga.'
      }
    ],
    canto: 'Prateleira atrás do balcão com fitas suas, pilhas, TV pequena de monitoramento, caderno com horários da TV a cabo da cidade vizinha.',
    equipamento: 'Handycam Sony, mochila com fitas virgens, skate.',
    perguntas: [
      'Por que você começou a filmar tudo? O que aconteceu quando você tinha 11 anos que você queria provar?',
      'Quem é a única pessoa que vê suas fitas, e por quê?',
      'O que você nunca conseguiria filmar — nem se sua vida dependesse?'
    ]
  },

  memoria: {
    nome: 'RICARDO',
    versao: 'Ricardo',
    jogador: 'Ana Bittar',
    arquetipo: 'A MEMÓRIA',
    arquetipo_sub: 'Cinéfilo da Locadora — 20 anos',
    citacao: 'Em todo filme de terror dos anos 80, o cara que diz "tá tudo bem" morre primeiro. Cuidado com isso.',
    atributos: { dia: 4, noite: 2, profundo: 3 },
    movimentos: [
      {
        nome: 'JÁ VI ESSE FILME',
        desc: 'Uma vez por cena, quando uma situação te lembrar especificamente de um filme/série/livro, declare em voz alta e role Dia. Em 8+, o Mestre é obrigado a confirmar um clichê daquele filme como verdade aqui (escolha do jogador). Em 7-, o Mestre confirma um clichê falso — você acredita, mas não vai funcionar.'
      },
      {
        nome: 'MESTRE DOS CLICHÊS',
        desc: 'Você é o especialista do Fator Slasher. Quando outro Sintonizado tenta usar Clichê de Sobrevivência e você está na cena pra dar um pitaco rápido (uma frase tipo "Igual no Halloween!"), o bônus dele sobe de +1 para +2 (ou +2 para +3). Você pode ajudar uma vez por cena de combate.'
      }
    ],
    canto: 'O balcão. É seu. Você sabe onde fica cada fita, qual cliente leva o quê. Há uma gaveta secreta com VHS estranhos que você juntou ao longo dos anos.',
    equipamento: 'Caneta atrás da orelha, jaqueta com bolsos, pager (compartilha frequências com Léo).',
    perguntas: [
      'Por que você ainda trabalha na locadora? Você tinha um plano?',
      'Qual filme te marcou de uma forma que você nunca contou pra ninguém?',
      'Quando o Bruno ofereceu o emprego, você estava fugindo de quê?'
    ]
  },

  asfalto: {
    nome: 'BRUNA',
    versao: 'Bruna',
    jogador: 'Yasmim',
    arquetipo: 'O ASFALTO',
    arquetipo_sub: 'Piloto — 23 anos',
    citacao: 'Entra. Bate a porta. Fechou? Bom. Não olha pra trás.',
    atributos: { dia: 2, noite: 5, profundo: 2 },
    movimentos: [
      {
        nome: 'OPALA PRETO',
        desc: 'Seu carro é uma extensão sua. Dentro do Opala (com você no volante), você ganha +1 em qualquer rolagem feita do carro. Além disso, o Profundo tem mais dificuldade de te alcançar dentro com as portas trancadas — Movimentos de Sobrevivência feitos dentro do Opala têm +1 adicional (cumulativo com o primeiro).'
      },
      {
        nome: 'EU CONHEÇO A ESTRADA',
        desc: 'Você sabe atalhos que ninguém em Morro Alto conhece. Uma vez por sessão, declare uma rota improvável — vocês chegam ao destino em metade do tempo narrativo, e o Mestre não pode interromper a viagem com encontro.'
      }
    ],
    canto: 'Vaga reservada na frente. Dentro do Opala você tem mapas marcados a lápis, uma chave de boca, um isqueiro Zippo de 1971 do seu avô, e um galão de gasolina.',
    equipamento: 'Opala SS preto 1976, porta-malas espaçoso. Sempre cheio (você nunca deixa o tanque baixar).',
    perguntas: [
      'De quem era o Opala antes de ser seu? Por que ele virou seu?',
      'Pra onde você foge quando não aguenta Morro Alto?',
      'Quem está no banco do passageiro nas suas piores lembranças?'
    ]
  },

  codigo: {
    nome: 'LÉO',
    versao: 'Leo',
    jogador: 'Maoboro Dejorges',
    arquetipo: 'O CÓDIGO',
    arquetipo_sub: 'Hacker / Lan House — 18 anos',
    citacao: 'Tem uma frequência aí em 88.3 que não é da Jovem Pan. Espera. Põe no fone. Põe.',
    atributos: { dia: 2, noite: 2, profundo: 5 },
    movimentos: [
      {
        nome: 'EU INTERCEPTO',
        desc: 'Você tem um Bip modificado, rádio amador escondido na lan house, e contas de BBS em todo lugar. Sempre que o grupo precisar de informação técnica ou eletrônica (frequência do DECON, ligação telefônica, sinal de antena), role Profundo. Um sucesso pleno também te dá a localização aproximada da fonte.'
      },
      {
        nome: 'A ESTÁTICA FALA COMIGO',
        desc: 'Você é o único do grupo que pode usar Sintonizar mais de uma vez por cena. Cada uso extra marca 1 Sinal automaticamente, sem rolagem. Em compensação, quando você Sintoniza com sucesso pleno (12+), além da Pista, você pode fazer uma pergunta direta a Nil — e o Mestre tem que dar uma resposta (mesmo que seja críptica).'
      }
    ],
    canto: 'Sala dos fundos com 386 zoado, monte de cabos, dois rádios amadores, e bilhete grudado na CPU dizendo "NÃO MEXE - LÉO".',
    equipamento: 'Bip modificado, walkman com antena externa caseira, mochila cheia de disquetes.',
    perguntas: [
      'Em qual dia você descobriu que conseguia ouvir coisas que outros não? O que aconteceu?',
      'Tem uma pessoa do BBS que você nunca conheceu pessoalmente, mas confia mais do que em qualquer um. Quem?',
      'O que você ainda não contou pro grupo sobre a V-001?'
    ]
  },

  influencia: {
    nome: 'LUCAS',
    versao: 'Lucas',
    jogador: 'Leziz',
    arquetipo: 'A INFLUÊNCIA',
    arquetipo_sub: 'Estagiário da Prefeitura — 24 anos',
    citacao: 'Eu tenho uma cópia da chave. Eu tenho cópia de TODAS as chaves. Não pergunta como.',
    atributos: { dia: 4, noite: 2, profundo: 3 },
    movimentos: [
      {
        nome: 'CHAVE MESTRA',
        desc: 'Uma vez por sessão, declare que você tem a chave de algum lugar institucional de Morro Alto (prefeitura, escola, posto de saúde, depósito municipal, garagem da câmara, almoxarifado da CONTV). Você consegue entrar sem rolar.'
      },
      {
        nome: 'EU CONHEÇO ESSE FUNCIONÁRIO',
        desc: 'Você trabalha na prefeitura há tempo o bastante pra ter contato em todos os escalões. Quando precisar abrir uma porta burocrática ou conseguir um registro oficial, role Dia + 1. Em 8+, você sabe exatamente quem subornar, bajular ou ameaçar — o Mestre te diz o nome.'
      }
    ],
    canto: 'Poltrona no canto, arquivo de papelão com plantas baixas xerocadas de prédios públicos, três molhos de chave pendurados em pregos.',
    equipamento: 'Crachá da prefeitura (válido), três molhos de chave, caderno preto de capa dura.',
    perguntas: [
      'Quem te conseguiu o emprego na prefeitura, e o que essa pessoa quer de você?',
      'Qual chave você roubou que ninguém sabe que você tem?',
      'O que tem dentro do arquivo morto da prefeitura que você já viu, e que tirou seu sono?'
    ]
  }
};

window.LIMIAR_ORDEM = ['olhar', 'memoria', 'asfalto', 'codigo', 'influencia'];
