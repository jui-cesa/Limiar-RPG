/* ========================================
   LIMIAR: CONTROLE DE DANOS
   Zona do Mestre (mestre.html)
   ======================================== */

(function () {
  'use strict';

  var PLAYBOOKS = window.LIMIAR_PLAYBOOKS;
  var ORDEM = window.LIMIAR_ORDEM;
  var FACCOES = window.LIMIAR_FACCOES;
  var FACCOES_ORDEM = window.LIMIAR_FACCOES_ORDEM || [];
  var VIGILIA = window.LIMIAR_VIGILIA;
  var STORAGE_KEY = 'limiar_mestre_senha';

  var db = null;
  var mestreConfig = null;             // { id, senha, notas_party, ... }
  var fichasData = {};                 // { arquetipo: row }
  var fichasDataAnterior = {};         // pra detectar mudanças (atividade)
  var saveTimers = {};
  var atividadeRecente = [];           // in-memory log
  var ATIVIDADE_MAX = 12;

  // ========================================
  // INIT DB
  // ========================================
  function initDb() {
    db = window.getLimiarSupabase ? window.getLimiarSupabase() : null;
    return !!db;
  }

  // ========================================
  // SENHA / LOGIN
  // ========================================
  function loadConfigEMostrarSenha() {
    db.from('mestre_config').select('*').eq('id', 1).single().then(function (result) {
      if (result.error) {
        showSenhaErro('Erro ao carregar config. Rode o SQL no Supabase.');
        return;
      }
      mestreConfig = result.data;
      var cache = localStorage.getItem(STORAGE_KEY);
      if (cache && cache === mestreConfig.senha) {
        entrar();
      } else {
        if (cache) localStorage.removeItem(STORAGE_KEY);
        mostrarSenhaModal();
      }
    });
  }

  function mostrarSenhaModal() {
    document.getElementById('senha-modal').classList.remove('hidden');
    setTimeout(function () { document.getElementById('senha-input').focus(); }, 100);
  }

  function showSenhaErro(msg) {
    document.getElementById('senha-modal').classList.remove('hidden');
    document.getElementById('senha-erro').textContent = msg;
  }

  function tentarSenha() {
    if (!mestreConfig) return;
    var input = document.getElementById('senha-input');
    var erro = document.getElementById('senha-erro');
    var digitada = input.value;

    if (digitada !== mestreConfig.senha) {
      erro.textContent = 'ACESSO NEGADO. SINTONIA INVÁLIDA.';
      input.style.borderColor = '#8b0000';
      var titulo = document.querySelector('.senha-titulo');
      titulo.classList.add('glitch-active');
      setTimeout(function () { titulo.classList.remove('glitch-active'); }, 300);
      return;
    }

    localStorage.setItem(STORAGE_KEY, digitada);
    document.getElementById('senha-modal').classList.add('hidden');
    entrar();
  }

  function entrar() {
    document.getElementById('mestre-header').classList.remove('hidden');
    document.getElementById('mestre-conteudo').classList.remove('hidden');
    loadFichas();
    subscribeFichas();
    subscribeMestreConfig();
    bindNotasParty();
    bindSair();
  }

  function sair() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function bindSair() {
    document.getElementById('mestre-sair').addEventListener('click', sair);
  }

  function initSenhaModal() {
    document.getElementById('senha-confirmar').addEventListener('click', tentarSenha);
    var input = document.getElementById('senha-input');
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        tentarSenha();
      } else if (window.playKeySound) {
        window.playKeySound();
      }
    });
    input.addEventListener('input', function () {
      document.getElementById('senha-erro').textContent = '';
      input.style.borderColor = '';
    });
  }

  // ========================================
  // CARREGAR / SUBSCRIBE
  // ========================================
  function loadFichas() {
    db.from('fichas').select('*').then(function (result) {
      if (result.error) {
        console.error('Erro fichas:', result.error);
        return;
      }
      var rows = result.data || [];
      fichasData = {};
      rows.forEach(function (r) {
        if (!Array.isArray(r.pistas)) r.pistas = [];
        if (!Array.isArray(r.itens)) r.itens = [];
        fichasData[r.arquetipo] = r;
      });
      // Cópia inicial pra detectar mudanças
      fichasDataAnterior = JSON.parse(JSON.stringify(fichasData));
      renderTudo();
    });
  }

  function subscribeFichas() {
    db.channel('mestre-fichas')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fichas' },
        function (payload) {
          if (!payload.new) return;
          var arq = payload.new.arquetipo;
          var anterior = fichasDataAnterior[arq];
          var novo = payload.new;
          if (!Array.isArray(novo.pistas)) novo.pistas = [];
          if (!Array.isArray(novo.itens)) novo.itens = [];

          // Detecta campo que mudou e loga atividade
          if (anterior) {
            var campoMudado = detectarCampoMudado(anterior, novo);
            if (campoMudado) registrarAtividade(arq, campoMudado);
          }

          fichasData[arq] = novo;
          fichasDataAnterior[arq] = JSON.parse(JSON.stringify(novo));
          renderDashboard();
          renderAlertas();
          renderAtividade();
          renderHeaderPersonagem(arq);
          // Não re-renderiza o body inteiro do <details> pra não sobrescrever foco
        }
      )
      .subscribe();
  }

  function subscribeMestreConfig() {
    db.channel('mestre-config-rt')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mestre_config' },
        function (payload) {
          if (!payload.new) return;
          mestreConfig = payload.new;
          var ta = document.getElementById('mestre-notas-party');
          if (ta && document.activeElement !== ta) {
            ta.value = mestreConfig.notas_party || '';
          }
          renderBingo();
        }
      )
      .subscribe();
  }

  function detectarCampoMudado(antigo, novo) {
    var campos = ['stress', 'sinal', 'chaves', 'condicoes',
                  'relacao_1', 'relacao_2', 'relacao_3', 'relacao_4',
                  'pergunta_1', 'pergunta_2', 'pergunta_3',
                  'pistas', 'itens', 'notas_mestre'];
    for (var i = 0; i < campos.length; i++) {
      var c = campos[i];
      var a = antigo[c];
      var n = novo[c];
      if (typeof a === 'object' || typeof n === 'object') {
        if (JSON.stringify(a) !== JSON.stringify(n)) return c;
      } else {
        if (a !== n) return c;
      }
    }
    return null;
  }

  function registrarAtividade(arq, campo) {
    atividadeRecente.unshift({
      arquetipo: arq,
      campo: campo,
      timestamp: new Date()
    });
    if (atividadeRecente.length > ATIVIDADE_MAX) atividadeRecente.pop();
  }

  // ========================================
  // RENDER
  // ========================================
  function renderTudo() {
    renderDashboard();
    renderAlertas();
    renderAtividade();
    renderNotasParty();
    renderBingo();
    renderVigilia();
    renderPersonagens();
  }

  // ========================================
  // BINGO DAS FACÇÕES
  // ========================================
  function getBingoState() {
    if (mestreConfig && mestreConfig.bingo_faccoes && typeof mestreConfig.bingo_faccoes === 'object') {
      return mestreConfig.bingo_faccoes;
    }
    return { iris: 0, decon: 0 };
  }

  function renderBingo() {
    var container = document.getElementById('bingo-faccoes');
    if (!container || !FACCOES) return;
    container.innerHTML = '';
    var state = getBingoState();

    FACCOES_ORDEM.forEach(function (key) {
      var f = FACCOES[key];
      if (!f) return;
      var nivel = state[key] || 0;

      var bloco = document.createElement('div');
      bloco.className = 'bingo-faccao';
      bloco.setAttribute('data-faccao', key);
      bloco.style.setProperty('--faccao-cor', f.cor);

      // Header
      var header = '<div class="bingo-faccao-header">' +
        '<h3 class="bingo-faccao-nome">&#9646; ' + f.nome + '</h3>' +
        '<span class="bingo-faccao-nivel">N&iacute;vel <strong>' + nivel + '</strong> / ' + f.estagios.length + '</span>' +
        '<button class="bingo-reset" data-faccao="' + key + '" title="Zerar bingo">ZERAR</button>' +
      '</div>';

      // Trilha de bolinhas
      var trilha = '<div class="bingo-trilha">';
      for (var i = 1; i <= f.estagios.length; i++) {
        var preenchida = i <= nivel;
        var atual = i === nivel;
        var est = f.estagios[i - 1];
        trilha += '<div class="bingo-marco" data-faccao="' + key + '" data-idx="' + i + '">' +
          '<button class="bingo-bolinha' + (preenchida ? ' preenchida' : '') + (atual ? ' atual' : '') + '"' +
            ' data-faccao="' + key + '" data-idx="' + i + '" title="' + escapeAttr(est.nome) + '">' +
            (preenchida ? '&#9679;' : '&#9675;') +
          '</button>' +
          (i < f.estagios.length ? '<span class="bingo-conector' + (i < nivel ? ' preenchido' : '') + '"></span>' : '') +
        '</div>';
      }
      trilha += '</div>';

      // Labels dos estágios (clicáveis para abrir consequência)
      var labels = '<div class="bingo-labels">';
      f.estagios.forEach(function (est, idx) {
        var n = idx + 1;
        var atualLabel = n === nivel;
        labels += '<details class="bingo-estagio' + (atualLabel ? ' estagio-atual' : '') + (n <= nivel ? ' estagio-alcancado' : '') + '">' +
          '<summary><span class="estagio-num">' + n + '.</span> ' + est.nome + '</summary>' +
          '<p class="estagio-consequencia">' + est.consequencia + '</p>' +
        '</details>';
      });
      labels += '</div>';

      // Metadata (objetivo + avançam + recuam) - colapsável
      var meta = '<details class="bingo-meta">' +
        '<summary>&#9656; Como esta fac&ccedil;&atilde;o se move</summary>' +
        '<div class="bingo-meta-body">' +
          '<p class="bingo-objetivo"><strong>Querem:</strong> ' + f.objetivo + '</p>' +
          '<div class="bingo-meta-grid">' +
            '<div><strong>Avan&ccedil;am quando:</strong><ul>' + f.avancam.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul></div>' +
            '<div><strong>Recuam quando:</strong><ul>' + f.recuam.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul></div>' +
          '</div>' +
        '</div>' +
      '</details>';

      bloco.innerHTML = header + trilha + labels + meta;
      container.appendChild(bloco);
    });

    // Bind cliques nas bolinhas
    container.querySelectorAll('.bingo-bolinha').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var faccao = btn.getAttribute('data-faccao');
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        clicarMarco(faccao, idx);
      });
    });

    // Bind reset
    container.querySelectorAll('.bingo-reset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (confirm('Zerar o bingo desta facção?')) {
          setEstagioFaccao(btn.getAttribute('data-faccao'), 0);
        }
      });
    });
  }

  function renderVigilia() {
    var container = document.getElementById('bingo-vigilia');
    if (!container || !VIGILIA) return;
    var html = '<div class="bingo-vigilia-bloco" style="--faccao-cor: ' + VIGILIA.cor + '">' +
      '<div class="bingo-faccao-header">' +
        '<h3 class="bingo-faccao-nome">&#9646; ' + VIGILIA.nome + '</h3>' +
        '<span class="bingo-vigilia-sub">' + VIGILIA.subtitulo + '</span>' +
      '</div>' +
      '<div class="bingo-vigilia-blocos">';
    VIGILIA.blocos.forEach(function (b) {
      html += '<div class="bingo-vigilia-item"><h5>' + b.titulo + '</h5><p>' + b.texto + '</p></div>';
    });
    html += '</div></div>';
    container.innerHTML = html;
  }

  function clicarMarco(faccao, idx) {
    var state = getBingoState();
    var atual = state[faccao] || 0;
    // Click no marco atual → recua 1
    // Click em outro marco → vira o atual
    var novo = (idx === atual) ? (idx - 1) : idx;
    if (novo < 0) novo = 0;
    setEstagioFaccao(faccao, novo);
  }

  function setEstagioFaccao(faccao, novoNivel) {
    var state = getBingoState();
    state[faccao] = novoNivel;
    if (!mestreConfig) mestreConfig = {};
    mestreConfig.bingo_faccoes = state;
    saveConfig('bingo_faccoes', state);
    renderBingo();
  }

  function escapeAttr(str) {
    if (str == null) return '';
    return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderDashboard() {
    var totalStress = 0, totalSinal = 0, totalChaves = 0, totalPistas = 0, totalItens = 0;
    ORDEM.forEach(function (arq) {
      var d = fichasData[arq];
      if (!d) return;
      totalStress += d.stress || 0;
      totalSinal += d.sinal || 0;
      totalChaves += d.chaves || 0;
      totalPistas += (d.pistas || []).length;
      totalItens += (d.itens || []).length;
    });

    var maxStress = ORDEM.length * 6;
    var maxSinal = ORDEM.length * 4;
    var maxChaves = ORDEM.length * 3;

    setText('dash-stress-val', totalStress);
    setText('dash-stress-max', maxStress);
    setBarFill('dash-stress-fill', totalStress / maxStress);

    setText('dash-sinal-val', totalSinal);
    setText('dash-sinal-max', maxSinal);
    setBarFill('dash-sinal-fill', totalSinal / maxSinal);

    setText('dash-chaves-val', totalChaves);
    setText('dash-chaves-max', maxChaves);
    setBarFill('dash-chaves-fill', totalChaves / maxChaves);

    setText('dash-pistas-val', totalPistas);
    setText('dash-itens-val', totalItens);
  }

  function renderAlertas() {
    var alertas = [];
    ORDEM.forEach(function (arq) {
      var d = fichasData[arq];
      if (!d) return;
      var nome = (PLAYBOOKS[arq] || {}).nome || arq;
      if ((d.stress || 0) >= 6) {
        alertas.push({ tipo: 'stress', nome: nome, msg: 'STRESS 6/6 — pr&oacute;xima rolagem com 7- = sai da cena' });
      } else if ((d.stress || 0) >= 5) {
        alertas.push({ tipo: 'stress', nome: nome, msg: 'STRESS ' + d.stress + '/6 — pr&oacute;ximo de quebrar' });
      }
      if ((d.sinal || 0) >= 4) {
        alertas.push({ tipo: 'sinal', nome: nome, msg: 'SINAL 4/4 — pr&oacute;xima rolagem com 7- = APAGADO' });
      } else if ((d.sinal || 0) >= 3) {
        alertas.push({ tipo: 'sinal', nome: nome, msg: 'SINAL ' + d.sinal + '/4 — pr&oacute;ximo de apagamento' });
      }
      if ((d.chaves || 0) === 0) {
        alertas.push({ tipo: 'chaves', nome: nome, msg: 'SEM CHAVES restantes' });
      }
    });

    var secao = document.getElementById('mestre-alertas-secao');
    var lista = document.getElementById('mestre-alertas-lista');
    if (alertas.length === 0) {
      secao.classList.add('hidden');
      return;
    }
    secao.classList.remove('hidden');
    lista.innerHTML = '';
    alertas.forEach(function (a) {
      var div = document.createElement('div');
      div.className = 'mestre-alerta alerta-' + a.tipo;
      div.innerHTML = '<span class="alerta-icon">&#9888;</span> <strong>' + a.nome + '</strong> — ' + a.msg;
      lista.appendChild(div);
    });
  }

  function renderAtividade() {
    var container = document.getElementById('mestre-atividade');
    if (atividadeRecente.length === 0) {
      container.innerHTML = '<p class="mestre-atividade-vazio">Aguardando atividade dos sintonizados...</p>';
      return;
    }
    var html = '<ul class="mestre-atividade-lista">';
    atividadeRecente.forEach(function (a) {
      var nome = (PLAYBOOKS[a.arquetipo] || {}).nome || a.arquetipo;
      var hora = a.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      html += '<li><span class="ativ-hora">' + hora + '</span>' +
              '<span class="ativ-nome">' + nome + '</span>' +
              '<span class="ativ-campo">editou <em>' + traduzirCampo(a.campo) + '</em></span></li>';
    });
    html += '</ul>';
    container.innerHTML = html;
  }

  function traduzirCampo(c) {
    var map = {
      stress: 'Stress', sinal: 'Sinal', chaves: 'Chaves',
      condicoes: 'Condi&ccedil;&otilde;es',
      relacao_1: 'Rela&ccedil;&atilde;o 1', relacao_2: 'Rela&ccedil;&atilde;o 2',
      relacao_3: 'Rela&ccedil;&atilde;o 3', relacao_4: 'Rela&ccedil;&atilde;o 4',
      pergunta_1: 'Pergunta 1', pergunta_2: 'Pergunta 2', pergunta_3: 'Pergunta 3',
      pistas: 'Pistas', itens: 'Itens',
      notas_mestre: 'Notas do Mestre'
    };
    return map[c] || c;
  }

  function renderNotasParty() {
    var ta = document.getElementById('mestre-notas-party');
    if (!ta || !mestreConfig) return;
    if (document.activeElement !== ta) {
      ta.value = mestreConfig.notas_party || '';
    }
  }

  function bindNotasParty() {
    var ta = document.getElementById('mestre-notas-party');
    if (!ta) return;
    if (mestreConfig) ta.value = mestreConfig.notas_party || '';
    ta.addEventListener('input', function () {
      debouncedSaveConfig('notas_party', ta.value);
    });
  }

  // ========================================
  // PERSONAGENS (cards expansíveis)
  // ========================================
  function renderPersonagens() {
    var container = document.getElementById('mestre-personagens');
    container.innerHTML = '';
    ORDEM.forEach(function (arq) {
      var pb = PLAYBOOKS[arq];
      var d = fichasData[arq];
      if (!pb || !d) return;

      var details = document.createElement('details');
      details.className = 'mestre-personagem';
      details.id = 'mp-' + arq;

      var summary = document.createElement('summary');
      summary.className = 'mestre-personagem-header';
      summary.innerHTML = renderPersonagemHeaderHtml(arq);
      details.appendChild(summary);

      var body = document.createElement('div');
      body.className = 'mestre-personagem-body';
      body.innerHTML = renderPersonagemBodyHtml(arq);
      details.appendChild(body);

      container.appendChild(details);

      bindPersonagemBody(arq, body);
    });
  }

  function renderHeaderPersonagem(arq) {
    var details = document.getElementById('mp-' + arq);
    if (!details) return;
    var summary = details.querySelector('summary');
    if (!summary) return;
    summary.innerHTML = renderPersonagemHeaderHtml(arq);
  }

  function renderPersonagemHeaderHtml(arq) {
    var pb = PLAYBOOKS[arq];
    var d = fichasData[arq] || { stress: 0, sinal: 0, chaves: 3 };
    return '' +
      '<img class="mp-foto" src="assets/images/Characters/' + pb.versao + '.png" alt="' + pb.nome + '">' +
      '<div class="mp-info">' +
        '<span class="mp-nome">' + pb.nome + '</span>' +
        '<span class="mp-arq">' + pb.arquetipo + ' &middot; ' + pb.jogador + '</span>' +
      '</div>' +
      '<div class="mp-stats">' +
        '<span class="mp-stat mp-stat-stress">STRESS ' + (d.stress || 0) + '/6</span>' +
        '<span class="mp-stat mp-stat-sinal">SINAL ' + (d.sinal || 0) + '/4</span>' +
        '<span class="mp-stat mp-stat-chaves">CHAVES ' + (d.chaves || 0) + '/3</span>' +
      '</div>' +
      '<span class="mp-arrow">&#9662;</span>';
  }

  function renderPersonagemBodyHtml(arq) {
    var pb = PLAYBOOKS[arq];
    var d = fichasData[arq];

    var html = '';
    // Atributos read-only
    html += '<div class="mp-bloco"><h4 class="fc-label">// ATRIBUTOS</h4>' +
            '<div class="fc-atributos">' +
              '<div class="fc-atr atr-dia"><span class="fc-atr-icon">&#9728;</span> DIA <strong>' + pb.atributos.dia + '</strong></div>' +
              '<div class="fc-atr atr-noite"><span class="fc-atr-icon">&#9790;</span> NOITE <strong>' + pb.atributos.noite + '</strong></div>' +
              '<div class="fc-atr atr-profundo"><span class="fc-atr-icon">&#10044;</span> PROFUNDO <strong>' + pb.atributos.profundo + '</strong></div>' +
            '</div></div>';

    // Status (bolas editáveis)
    html += '<div class="mp-bloco"><h4 class="fc-label">// STATUS</h4>';
    html += renderMedidor(arq, 'stress', d.stress || 0, 6, 'STRESS');
    html += renderMedidor(arq, 'sinal', d.sinal || 0, 4, 'SINAL');
    html += renderMedidor(arq, 'chaves', d.chaves || 0, 3, 'CHAVES');
    html += '</div>';

    // Condições
    html += '<div class="mp-bloco"><h4 class="fc-label">// CONDI&Ccedil;&Otilde;ES</h4>' +
            '<textarea class="fc-textarea mp-edit" data-field="condicoes" data-arq="' + arq + '">' + escapeHtml(d.condicoes || '') + '</textarea></div>';

    // Relações
    html += '<div class="mp-bloco"><h4 class="fc-label">// RELA&Ccedil;&Otilde;ES</h4>';
    var outros = ORDEM.filter(function (a) { return a !== arq; });
    outros.forEach(function (oarq, idx) {
      var opb = PLAYBOOKS[oarq];
      var field = 'relacao_' + (idx + 1);
      html += '<div class="fc-relacao">' +
                '<label class="fc-relacao-nome">' + opb.nome + ' <span>(' + opb.arquetipo + ')</span></label>' +
                '<input type="text" class="fc-input mp-edit" data-field="' + field + '" data-arq="' + arq + '" value="' + escapeHtml(d[field] || '') + '">' +
              '</div>';
    });
    html += '</div>';

    // Perguntas
    html += '<div class="mp-bloco"><h4 class="fc-label">// PERGUNTAS PESSOAIS</h4>';
    pb.perguntas.forEach(function (p, i) {
      var field = 'pergunta_' + (i + 1);
      html += '<div class="fc-pergunta">' +
                '<p class="fc-pergunta-texto">' + (i + 1) + '. ' + p + '</p>' +
                '<textarea class="fc-textarea mp-edit" data-field="' + field + '" data-arq="' + arq + '">' + escapeHtml(d[field] || '') + '</textarea>' +
              '</div>';
    });
    html += '</div>';

    // Inventário (pistas)
    html += '<div class="mp-bloco"><h4 class="fc-label">// PISTAS</h4>' +
            '<div class="inv-lista mp-inv-lista" data-tipo="pistas" data-arq="' + arq + '">' +
            renderInvLista(d.pistas, 'pistas', arq) +
            '</div>' +
            '<button type="button" class="inv-adicionar mp-add" data-tipo="pistas" data-arq="' + arq + '">+ ADICIONAR PISTA</button></div>';

    // Inventário (itens)
    html += '<div class="mp-bloco"><h4 class="fc-label">// ITENS</h4>' +
            '<div class="inv-lista mp-inv-lista" data-tipo="itens" data-arq="' + arq + '">' +
            renderInvLista(d.itens, 'itens', arq) +
            '</div>' +
            '<button type="button" class="inv-adicionar mp-add" data-tipo="itens" data-arq="' + arq + '">+ ADICIONAR ITEM</button></div>';

    // Notas do mestre
    html += '<div class="mp-bloco mp-notas-mestre">' +
              '<h4 class="fc-label">&#128221; NOTAS DO MESTRE (privadas)</h4>' +
              '<textarea class="fc-textarea mp-edit mp-notas-mestre-ta" data-field="notas_mestre" data-arq="' + arq + '" placeholder="Anota&ccedil;&otilde;es privadas sobre este personagem...">' + escapeHtml(d.notas_mestre || '') + '</textarea>' +
            '</div>';

    return html;
  }

  function renderMedidor(arq, tipo, valor, max, label) {
    var simboloVazio = (tipo === 'chaves') ? '◈' : '○';
    var simboloPreenchido = (tipo === 'chaves') ? '◆' : '●';
    var bolas = '';
    for (var i = 0; i < max; i++) {
      var preenchida = i < valor;
      bolas += '<button type="button" class="fc-bola bola-' + tipo + (preenchida ? ' preenchida' : '') +
               '" data-tipo="' + tipo + '" data-index="' + i + '" data-arq="' + arq + '">' +
               (preenchida ? simboloPreenchido : simboloVazio) + '</button>';
    }
    return '<div class="fc-medidor">' +
              '<span class="fc-medidor-label fc-medidor-' + tipo + '">' + label + '</span>' +
              '<div class="fc-bolas">' + bolas + '</div>' +
            '</div>';
  }

  function renderInvLista(lista, tipo, arq) {
    if (!lista || lista.length === 0) {
      return '<p class="inv-vazio">Nenhum ' + (tipo === 'pistas' ? 'fragmento' : 'item') + ' registrado.</p>';
    }
    var html = '';
    lista.forEach(function (item, idx) {
      html += '<div class="inv-item">' +
                '<button type="button" class="inv-remover mp-inv-remover" data-tipo="' + tipo + '" data-index="' + idx + '" data-arq="' + arq + '" title="Remover">&times;</button>' +
                '<input type="text" class="inv-titulo mp-inv-edit" data-tipo="' + tipo + '" data-index="' + idx + '" data-campo="titulo" data-arq="' + arq + '" placeholder="T&iacute;tulo" value="' + escapeHtml(item.titulo || '') + '">' +
                '<textarea class="inv-descricao mp-inv-edit" data-tipo="' + tipo + '" data-index="' + idx + '" data-campo="descricao" data-arq="' + arq + '" placeholder="Descri&ccedil;&atilde;o, contexto...">' + escapeHtml(item.descricao || '') + '</textarea>' +
              '</div>';
    });
    return html;
  }

  function bindPersonagemBody(arq, body) {
    // Bolas (status)
    body.querySelectorAll('.fc-bola').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleBola(arq, btn.getAttribute('data-tipo'), parseInt(btn.getAttribute('data-index'), 10));
      });
    });

    // Inputs/textareas editáveis (campos simples)
    body.querySelectorAll('.mp-edit').forEach(function (el) {
      el.addEventListener('input', function () {
        var field = el.getAttribute('data-field');
        debouncedSaveFicha(arq, field, el.value);
      });
    });

    // Inventário (edição de item)
    body.querySelectorAll('.mp-inv-edit').forEach(function (el) {
      el.addEventListener('input', function () {
        var tipo = el.getAttribute('data-tipo');
        var idx = parseInt(el.getAttribute('data-index'), 10);
        var campo = el.getAttribute('data-campo');
        editarInventario(arq, tipo, idx, campo, el.value);
      });
    });

    // Inventário (remover item)
    body.querySelectorAll('.mp-inv-remover').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removerInventario(arq, btn.getAttribute('data-tipo'), parseInt(btn.getAttribute('data-index'), 10));
      });
    });

    // Inventário (adicionar)
    body.querySelectorAll('.mp-add').forEach(function (btn) {
      btn.addEventListener('click', function () {
        adicionarInventario(arq, btn.getAttribute('data-tipo'));
      });
    });
  }

  // ========================================
  // EDIÇÃO (status, inventário, etc.)
  // ========================================
  function toggleBola(arq, tipo, index) {
    var d = fichasData[arq];
    if (!d) return;
    var atual = d[tipo] || 0;
    var novo = (index < atual) ? index : (index + 1);
    var max = { stress: 6, sinal: 4, chaves: 3 }[tipo];
    if (novo < 0) novo = 0;
    if (novo > max) novo = max;
    d[tipo] = novo;
    saveFichaField(arq, tipo, novo);
    // Re-render só do medidor afetado
    var details = document.getElementById('mp-' + arq);
    if (details) {
      var body = details.querySelector('.mestre-personagem-body');
      if (body) {
        var medidor = body.querySelectorAll('.fc-medidor');
        medidor.forEach(function (m) {
          var label = m.querySelector('.fc-medidor-label');
          if (!label) return;
          var labelTipo = (label.classList.contains('fc-medidor-stress') ? 'stress' :
                           label.classList.contains('fc-medidor-sinal') ? 'sinal' :
                           label.classList.contains('fc-medidor-chaves') ? 'chaves' : null);
          if (labelTipo === tipo) {
            m.outerHTML = renderMedidor(arq, tipo, novo, max, tipo.toUpperCase());
          }
        });
        // Re-bind bolas (porque outerHTML quebra listeners)
        body.querySelectorAll('.fc-bola').forEach(function (b) {
          if (b.dataset.bound) return;
          b.dataset.bound = '1';
          b.addEventListener('click', function () {
            toggleBola(arq, b.getAttribute('data-tipo'), parseInt(b.getAttribute('data-index'), 10));
          });
        });
      }
    }
    renderHeaderPersonagem(arq);
  }

  function editarInventario(arq, tipo, idx, campo, valor) {
    var d = fichasData[arq];
    if (!d[tipo]) d[tipo] = [];
    if (!d[tipo][idx]) d[tipo][idx] = { titulo: '', descricao: '' };
    d[tipo][idx][campo] = valor;
    debouncedSaveFicha(arq, tipo, d[tipo]);
  }

  function adicionarInventario(arq, tipo) {
    var d = fichasData[arq];
    if (!d[tipo]) d[tipo] = [];
    d[tipo].push({ titulo: '', descricao: '' });
    saveFichaField(arq, tipo, d[tipo]);
    // Re-render lista
    var details = document.getElementById('mp-' + arq);
    if (details) {
      var body = details.querySelector('.mestre-personagem-body');
      var lista = body.querySelector('.mp-inv-lista[data-tipo="' + tipo + '"]');
      if (lista) {
        lista.innerHTML = renderInvLista(d[tipo], tipo, arq);
        bindPersonagemBody(arq, body);
        // Foca no novo
        var inputs = lista.querySelectorAll('.inv-titulo');
        if (inputs.length) inputs[inputs.length - 1].focus();
      }
    }
  }

  function removerInventario(arq, tipo, idx) {
    var d = fichasData[arq];
    if (!d[tipo]) return;
    d[tipo].splice(idx, 1);
    saveFichaField(arq, tipo, d[tipo]);
    var details = document.getElementById('mp-' + arq);
    if (details) {
      var body = details.querySelector('.mestre-personagem-body');
      var lista = body.querySelector('.mp-inv-lista[data-tipo="' + tipo + '"]');
      if (lista) {
        lista.innerHTML = renderInvLista(d[tipo], tipo, arq);
        bindPersonagemBody(arq, body);
      }
    }
  }

  // ========================================
  // PERSISTÊNCIA
  // ========================================
  function saveFichaField(arq, field, value) {
    if (!db) return;
    showSync(true);
    var update = {};
    update[field] = value;
    update.updated_at = new Date().toISOString();
    db.from('fichas').update(update).eq('arquetipo', arq).then(function (result) {
      if (result.error) {
        console.error('Erro save ficha:', result.error);
        showSync(false, 'ERRO');
        return;
      }
      showSync(false, 'SALVO');
    });
  }

  function debouncedSaveFicha(arq, field, value) {
    var key = arq + ':' + field;
    if (saveTimers[key]) clearTimeout(saveTimers[key]);
    saveTimers[key] = setTimeout(function () {
      saveFichaField(arq, field, value);
    }, 800);
  }

  function saveConfig(field, value) {
    if (!db) return;
    showSync(true);
    var update = {};
    update[field] = value;
    update.updated_at = new Date().toISOString();
    db.from('mestre_config').update(update).eq('id', 1).then(function (result) {
      if (result.error) {
        console.error('Erro save config:', result.error);
        showSync(false, 'ERRO');
        return;
      }
      if (mestreConfig) mestreConfig[field] = value;
      showSync(false, 'SALVO');
    });
  }

  function debouncedSaveConfig(field, value) {
    var key = 'config:' + field;
    if (saveTimers[key]) clearTimeout(saveTimers[key]);
    saveTimers[key] = setTimeout(function () {
      saveConfig(field, value);
    }, 800);
  }

  function showSync(syncing, msg) {
    var el = document.getElementById('mestre-sync-status');
    if (!el) return;
    if (syncing) {
      el.textContent = 'SINCRONIZANDO...';
      el.className = 'ficha-sync-status sincronizando';
    } else {
      el.textContent = msg || 'SALVO';
      el.className = 'ficha-sync-status salvo';
      setTimeout(function () {
        if (!el.classList.contains('sincronizando')) {
          el.textContent = '';
        }
      }, 1500);
    }
  }

  // ========================================
  // HELPERS
  // ========================================
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setBarFill(id, ratio) {
    var el = document.getElementById(id);
    if (!el) return;
    var pct = Math.max(0, Math.min(1, ratio)) * 100;
    el.style.width = pct + '%';
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ========================================
  // INIT
  // ========================================
  document.addEventListener('DOMContentLoaded', function () {
    var ok = initDb();
    initSenhaModal();
    if (!ok) {
      showSenhaErro('Configuração do banco indisponível.');
      return;
    }
    loadConfigEMostrarSenha();
  });

})();
