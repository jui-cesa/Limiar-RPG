/* ========================================
   LIMIAR: CONTROLE DE DANOS
   Página individual de Ficha (ficha.html)
   ======================================== */

(function () {
  'use strict';

  var PLAYBOOKS = window.LIMIAR_PLAYBOOKS;
  var ORDEM = window.LIMIAR_ORDEM;

  var db = null;
  var arquetipo = null;          // arquétipo da URL
  var fichaData = null;          // row do supabase
  var saveTimers = {};           // debounce timers
  var rtChannel = null;          // realtime channel

  // ========================================
  // INIT
  // ========================================
  function getQueryParam(name) {
    var match = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function initDb() {
    db = window.getLimiarSupabase ? window.getLimiarSupabase() : null;
    return !!db;
  }

  function loadFicha() {
    if (!db || !arquetipo) return;
    db.from('fichas').select('*').eq('arquetipo', arquetipo).single().then(function (result) {
      if (result.error) {
        console.error('Erro ao carregar ficha:', result.error);
        showError('Ficha não encontrada.');
        return;
      }
      fichaData = result.data;
      // Garante que pistas/itens existem mesmo se schema antigo
      if (!Array.isArray(fichaData.pistas)) fichaData.pistas = [];
      if (!Array.isArray(fichaData.itens)) fichaData.itens = [];

      // Tenta senha em cache
      var senhaCache = localStorage.getItem('limiar_ficha_senha_' + arquetipo);
      if (senhaCache && senhaCache === fichaData.senha) {
        abrirFicha();
      } else {
        if (senhaCache) localStorage.removeItem('limiar_ficha_senha_' + arquetipo);
        mostrarSenhaModal();
      }
    });
  }

  function subscribeFicha() {
    if (!db || !arquetipo) return;
    rtChannel = db.channel('ficha-' + arquetipo)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fichas', filter: 'arquetipo=eq.' + arquetipo },
        function (payload) {
          if (!payload.new) return;
          // Atualiza dados locais
          fichaData = payload.new;
          if (!Array.isArray(fichaData.pistas)) fichaData.pistas = [];
          if (!Array.isArray(fichaData.itens)) fichaData.itens = [];
          // Re-renderiza só o que não está em foco (status), e listas dinâmicas se mudaram
          if (!document.getElementById('ficha-conteudo').classList.contains('hidden')) {
            renderStatusBolas();
          }
        }
      )
      .subscribe();
  }

  // ========================================
  // SENHA
  // ========================================
  function mostrarSenhaModal() {
    var pb = PLAYBOOKS[arquetipo];
    document.getElementById('senha-personagem').textContent = pb.nome + ' — ' + pb.arquetipo;
    document.getElementById('senha-input').value = '';
    document.getElementById('senha-erro').textContent = '';
    document.getElementById('senha-modal').classList.remove('hidden');
    setTimeout(function () { document.getElementById('senha-input').focus(); }, 100);
  }

  function tentarSenha() {
    var input = document.getElementById('senha-input');
    var erro = document.getElementById('senha-erro');
    var senhaDigitada = input.value;

    if (!fichaData) {
      erro.textContent = 'ERRO: FICHA NÃO CARREGADA';
      return;
    }

    if (senhaDigitada !== fichaData.senha) {
      erro.textContent = 'ACESSO NEGADO. TENTE NOVAMENTE.';
      input.style.borderColor = '#8b0000';
      var titulo = document.querySelector('.senha-titulo');
      titulo.classList.add('glitch-active');
      setTimeout(function () { titulo.classList.remove('glitch-active'); }, 300);
      return;
    }

    // Sucesso: salva localStorage e abre
    localStorage.setItem('limiar_ficha_senha_' + arquetipo, senhaDigitada);
    document.getElementById('senha-modal').classList.add('hidden');
    abrirFicha();
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
  // ABRIR FICHA (após senha OK)
  // ========================================
  function abrirFicha() {
    var pb = PLAYBOOKS[arquetipo];

    // Header
    document.getElementById('fc-foto').src = 'assets/images/Characters/' + pb.versao + '.png';
    document.getElementById('fc-foto').alt = pb.nome;
    var nomeEl = document.getElementById('fc-nome');
    nomeEl.textContent = pb.nome;
    nomeEl.setAttribute('data-text', pb.nome);
    document.getElementById('fc-arquetipo').textContent = pb.arquetipo + ' · ' + pb.arquetipo_sub;
    document.getElementById('fc-jogador').textContent = pb.jogador;
    document.title = 'LIMIAR: ' + pb.nome;

    // Tab PERSONAGEM
    document.getElementById('fc-citacao').textContent = '"' + pb.citacao + '"';
    document.getElementById('fc-dia').textContent = pb.atributos.dia;
    document.getElementById('fc-noite').textContent = pb.atributos.noite;
    document.getElementById('fc-profundo').textContent = pb.atributos.profundo;

    var movHtml = '';
    pb.movimentos.forEach(function (m) {
      movHtml += '<div class="fc-movimento"><h5>' + m.nome + '</h5><p>' + m.desc + '</p></div>';
    });
    document.getElementById('fc-movimentos').innerHTML = movHtml;

    document.getElementById('fc-canto').textContent = pb.canto;
    document.getElementById('fc-equipamento').textContent = pb.equipamento;

    // Tab STATUS
    renderStatusBolas();
    document.getElementById('fc-condicoes').value = fichaData.condicoes || '';
    bindAutoSave('fc-condicoes', 'condicoes');

    // Tab NOTAS
    document.getElementById('fc-notas').value = fichaData.notas || '';
    bindAutoSave('fc-notas', 'notas');

    renderRelacoes();
    renderPerguntas();

    // Tab INVENTÁRIO
    renderInventario('pistas');
    renderInventario('itens');

    // Mostra UI
    document.getElementById('ficha-header').classList.remove('hidden');
    document.getElementById('ficha-tabs').classList.remove('hidden');
    document.getElementById('ficha-conteudo').classList.remove('hidden');

    initTabs();
  }

  // ========================================
  // STATUS BOLAS
  // ========================================
  function renderStatusBolas() {
    renderBolas('stress', fichaData.stress || 0, 6);
    renderBolas('sinal', fichaData.sinal || 0, 4);
    renderBolas('chaves', fichaData.chaves || 0, 3);
  }

  function renderBolas(tipo, valor, max) {
    var container = document.getElementById('fc-bolas-' + tipo);
    if (!container) return;
    var simboloVazio = (tipo === 'chaves') ? '◈' : '○';
    var simboloPreenchido = (tipo === 'chaves') ? '◆' : '●';
    var html = '';
    for (var i = 0; i < max; i++) {
      var preenchida = i < valor;
      html += '<button type="button" class="fc-bola bola-' + tipo + (preenchida ? ' preenchida' : '') +
              '" data-tipo="' + tipo + '" data-index="' + i + '">' +
              (preenchida ? simboloPreenchido : simboloVazio) +
              '</button>';
    }
    container.innerHTML = html;
    container.querySelectorAll('.fc-bola').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleBola(tipo, parseInt(btn.getAttribute('data-index'), 10));
      });
    });
  }

  function toggleBola(tipo, index) {
    if (!fichaData) return;
    var atual = fichaData[tipo] || 0;
    var novo;
    if (index < atual) {
      novo = index;
    } else {
      novo = index + 1;
    }
    var max = { stress: 6, sinal: 4, chaves: 3 }[tipo];
    if (novo < 0) novo = 0;
    if (novo > max) novo = max;
    fichaData[tipo] = novo;
    renderBolas(tipo, novo, max);
    saveField(tipo, novo);
  }

  // ========================================
  // RELAÇÕES E PERGUNTAS
  // ========================================
  function renderRelacoes() {
    var container = document.getElementById('fc-relacoes');
    container.innerHTML = '';
    var outros = ORDEM.filter(function (a) { return a !== arquetipo; });
    outros.forEach(function (arq, idx) {
      var pb = PLAYBOOKS[arq];
      var fieldName = 'relacao_' + (idx + 1);
      var div = document.createElement('div');
      div.className = 'fc-relacao';
      div.innerHTML =
        '<label class="fc-relacao-nome">' + pb.nome + ' <span>(' + pb.arquetipo + ')</span></label>' +
        '<input type="text" class="fc-input" id="' + fieldName + '" placeholder="Como você se relaciona com ' + pb.nome + '?">';
      var input = div.querySelector('input');
      input.value = fichaData[fieldName] || '';
      input.addEventListener('input', function () {
        debouncedSave(fieldName, input.value);
      });
      container.appendChild(div);
    });
  }

  function renderPerguntas() {
    var container = document.getElementById('fc-perguntas');
    container.innerHTML = '';
    var pb = PLAYBOOKS[arquetipo];
    pb.perguntas.forEach(function (pergunta, idx) {
      var fieldName = 'pergunta_' + (idx + 1);
      var div = document.createElement('div');
      div.className = 'fc-pergunta';
      div.innerHTML =
        '<p class="fc-pergunta-texto">' + (idx + 1) + '. ' + pergunta + '</p>' +
        '<textarea class="fc-textarea" id="' + fieldName + '" placeholder="Sua resposta..."></textarea>';
      var ta = div.querySelector('textarea');
      ta.value = fichaData[fieldName] || '';
      ta.addEventListener('input', function () {
        debouncedSave(fieldName, ta.value);
      });
      container.appendChild(div);
    });
  }

  function bindAutoSave(elementId, field) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.addEventListener('input', function () {
      debouncedSave(field, el.value);
    });
  }

  // ========================================
  // INVENTÁRIO (pistas e itens)
  // ========================================
  function renderInventario(tipo) {
    var container = document.getElementById('inv-' + tipo);
    if (!container) return;
    container.innerHTML = '';

    var lista = fichaData[tipo] || [];
    if (lista.length === 0) {
      container.innerHTML = '<p class="inv-vazio">Nenhum ' + (tipo === 'pistas' ? 'fragmento coletado' : 'item registrado') + ' ainda.</p>';
      return;
    }

    lista.forEach(function (item, idx) {
      var card = document.createElement('div');
      card.className = 'inv-item';
      card.innerHTML =
        '<button type="button" class="inv-remover" data-tipo="' + tipo + '" data-index="' + idx + '" title="Remover">&times;</button>' +
        '<input type="text" class="inv-titulo" placeholder="Título da ' + (tipo === 'pistas' ? 'pista' : 'item') + '" data-tipo="' + tipo + '" data-index="' + idx + '" data-campo="titulo">' +
        '<textarea class="inv-descricao" placeholder="Descrição, contexto, onde encontrou..." data-tipo="' + tipo + '" data-index="' + idx + '" data-campo="descricao"></textarea>';

      card.querySelector('.inv-titulo').value = item.titulo || '';
      card.querySelector('.inv-descricao').value = item.descricao || '';

      card.querySelector('.inv-titulo').addEventListener('input', function (e) {
        editarInventario(tipo, idx, 'titulo', e.target.value);
      });
      card.querySelector('.inv-descricao').addEventListener('input', function (e) {
        editarInventario(tipo, idx, 'descricao', e.target.value);
      });
      card.querySelector('.inv-remover').addEventListener('click', function () {
        removerItemInventario(tipo, idx);
      });

      container.appendChild(card);
    });
  }

  function editarInventario(tipo, idx, campo, valor) {
    if (!fichaData[tipo]) fichaData[tipo] = [];
    if (!fichaData[tipo][idx]) fichaData[tipo][idx] = { titulo: '', descricao: '' };
    fichaData[tipo][idx][campo] = valor;
    debouncedSave(tipo, fichaData[tipo]);
  }

  function adicionarItemInventario(tipo) {
    if (!fichaData[tipo]) fichaData[tipo] = [];
    fichaData[tipo].push({ titulo: '', descricao: '' });
    renderInventario(tipo);
    saveField(tipo, fichaData[tipo]);
    // Foca no novo
    var container = document.getElementById('inv-' + tipo);
    var inputs = container.querySelectorAll('.inv-titulo');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  }

  function removerItemInventario(tipo, idx) {
    if (!fichaData[tipo]) return;
    fichaData[tipo].splice(idx, 1);
    renderInventario(tipo);
    saveField(tipo, fichaData[tipo]);
  }

  function initInventarioBotoes() {
    document.querySelectorAll('.inv-adicionar').forEach(function (btn) {
      btn.addEventListener('click', function () {
        adicionarItemInventario(btn.getAttribute('data-tipo'));
      });
    });
  }

  // ========================================
  // PERSISTÊNCIA
  // ========================================
  function saveField(field, value) {
    if (!db || !arquetipo) return;
    showSyncStatus(true);
    var update = {};
    update[field] = value;
    update.updated_at = new Date().toISOString();
    db.from('fichas').update(update).eq('arquetipo', arquetipo).then(function (result) {
      if (result.error) {
        console.error('Erro ao salvar:', result.error);
        showSyncStatus(false, 'ERRO');
        return;
      }
      showSyncStatus(false, 'SALVO');
    });
  }

  function debouncedSave(field, value) {
    if (saveTimers[field]) clearTimeout(saveTimers[field]);
    saveTimers[field] = setTimeout(function () {
      saveField(field, value);
    }, 800);
  }

  function showSyncStatus(syncing, msg) {
    var el = document.getElementById('ficha-sync-status');
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
  // TABS
  // ========================================
  function initTabs() {
    var tabs = document.querySelectorAll('.ficha-tab');
    var conteudos = document.querySelectorAll('.ficha-tab-content');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var alvo = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.remove('tab-active'); });
        tab.classList.add('tab-active');
        conteudos.forEach(function (c) {
          if (c.getAttribute('data-tab') === alvo) {
            c.classList.add('tab-active');
          } else {
            c.classList.remove('tab-active');
          }
        });
      });
    });
  }

  // ========================================
  // ERROR
  // ========================================
  function showError(msg) {
    var modal = document.getElementById('senha-modal');
    modal.classList.remove('hidden');
    document.getElementById('senha-personagem').textContent = 'ERRO';
    document.getElementById('senha-erro').textContent = msg;
    document.getElementById('senha-input').style.display = 'none';
    document.getElementById('senha-confirmar').style.display = 'none';
  }

  // ========================================
  // INIT
  // ========================================
  document.addEventListener('DOMContentLoaded', function () {
    arquetipo = getQueryParam('arquetipo');
    if (!arquetipo || !PLAYBOOKS || !PLAYBOOKS[arquetipo]) {
      window.location.href = 'fichas';
      return;
    }

    var ok = initDb();
    initSenhaModal();
    initInventarioBotoes();

    if (ok) {
      loadFicha();
      subscribeFicha();
    } else {
      showError('Configuração do banco indisponível.');
    }
  });

})();
