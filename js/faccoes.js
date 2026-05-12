/* ========================================
   LIMIAR: CONTROLE DE DANOS
   Facções — estágios e consequências (Bingo)
   ======================================== */

window.LIMIAR_FACCOES = {
  iris: {
    nome: 'INSTITUTO ÍRIS',
    cor: '#ffaa00',
    objetivo: 'Retomar o controle audiovisual. Reativar frequências. Apagar quem está sintonizado fora deles.',
    avancam: [
      'Uma Fita roda e algum jogador tira 7-.',
      'O grupo deixa um Caso sem resolver.',
      'Um NPC importante é "convertido" pela Cantiga.'
    ],
    recuam: [
      'O grupo resolve Casos ligados ao Íris.',
      'Destrói equipamento do Íris.',
      'Salva alguém da Cantiga.'
    ],
    estagios: [
      {
        nome: 'ATIVIDADE DISCRETA',
        consequencia: 'Comerciais estranhos na TV local. Padrões subliminares começam a aparecer entre programas. Quase ninguém percebe.'
      },
      {
        nome: 'ANTENAS FANTASMA',
        consequencia: 'Antenas começam a aparecer em telhados sem dono. Ninguém viu instalando. Recepção da cidade muda sutilmente.'
      },
      {
        nome: 'PESADELOS COLETIVOS',
        consequencia: 'Cantigas espalham. Crianças começam a cantarolar a mesma melodia que ninguém ensinou. Adultos sonham com a mesma voz.'
      },
      {
        nome: 'ENGRAVATADOS BRANCOS',
        consequencia: 'Operativos do Íris (não confundir com DECON) entram em ação de campo. Vestem branco. Sorriem demais. Coordenam pessoas convertidas.'
      },
      {
        nome: 'DOMÍNIO DA FREQUÊNCIA',
        consequencia: 'Frequência domina a cidade. Sintonizados precisam de fones de proteção pra pensar. População entra em transe de baixo nível.'
      },
      {
        nome: 'A TRANSMISSÃO FINAL',
        consequencia: 'FIM DA CAMPANHA — DERROTA. Morro Alto inteira fica sintonizada. Sintonizados são apagados da existência. Nil silencia.'
      }
    ]
  },

  decon: {
    nome: 'DECON',
    cor: '#4466cc',
    objetivo: 'Confiscar tudo. Estudar. Sintonizados são fonte de dados, não aliados.',
    avancam: [
      'Grupo é visto em cena de anomalia (testemunhas, câmera, registro).',
      'Uma Fita é exposta publicamente.'
    ],
    recuam: [
      'Queimar provas.',
      'Falsificar rastros.',
      'Descobrir nomes reais de Engravatados.'
    ],
    estagios: [
      {
        nome: 'OPERAÇÃO SILENCIOSA',
        consequencia: 'DECON está ativo na cidade, mas sem ações visíveis. Apenas reconhecimento e arquivamento.'
      },
      {
        nome: 'SANTANAS NA RUA',
        consequencia: 'Santanas pretos começam a aparecer estacionados em pontos estratégicos. Ninguém identifica os ocupantes.'
      },
      {
        nome: 'VIGILÂNCIA DIRETA',
        consequencia: 'Telefones grampeados. Gente parada em frente da locadora "esperando alguém". Cartas violadas chegam mal lacradas.'
      },
      {
        nome: 'TENTATIVA DE COOPTAÇÃO',
        consequencia: 'Tentam cooptar UM Sintonizado com proposta sob medida (acesso, dinheiro, segurança da família). Mestre escolhe o alvo.'
      },
      {
        nome: 'TENTATIVA DE CAPTURA',
        consequencia: 'Operação aberta. Cercam um Sintonizado em local público. Algemas, capuz, Santana preto.'
      },
      {
        nome: 'EDIFÍCIO OZÔNIO',
        consequencia: 'FIM DA CAMPANHA — DESAPARECIMENTO. Sintonizados são levados para o Edifício Ozônio. Família recebe atestado falso.'
      }
    ]
  }
};

// Vigília tem bloco especial (sem bingo, só texto)
window.LIMIAR_VIGILIA = {
  nome: 'A VIGÍLIA / NIL',
  cor: '#9933cc',
  subtitulo: 'Aliado instável (sem bingo)',
  blocos: [
    {
      titulo: 'STATUS',
      texto: 'A Vigília não tem Bingo — ela está morta. Nil ainda transmite.'
    },
    {
      titulo: 'PODE',
      texto: 'Dar dicas. Mentir ocasionalmente. Não é onisciente. Tem agenda. Quer vingança contra o Íris e PODE sacrificar Sintonizados pra isso.'
    },
    {
      titulo: 'ABRIGAR NIL',
      texto: 'Um Sintonizado pode "abrigá-lo" temporariamente (vira uma Chave especial), mas o personagem fica parcialmente controlado pelo Mestre por uma cena.'
    },
    {
      titulo: 'REGRA DO MESTRE',
      texto: 'Nunca diga aos jogadores quanto Nil sabe. Mantenha-o ambíguo.'
    }
  ]
};

window.LIMIAR_FACCOES_ORDEM = ['iris', 'decon'];
