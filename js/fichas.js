/* ========================================
   LIMIAR: CONTROLE DE DANOS
   Listagem de Fichas (página fichas.html)
   ======================================== */

(function () {
  'use strict';

  var PLAYBOOKS = window.LIMIAR_PLAYBOOKS;
  var ORDEM = window.LIMIAR_ORDEM;

  var db = null;
  var fichasData = {};

  function initDb() {
    db = window.getLimiarSupabase ? window.getLimiarSupabase() : null;
    return !!db;
  }

  function loadFichas() {
    if (!db) return;
    db.from('fichas').select('*').then(function (result) {
      if (result.error) {
        console.error('Erro ao carregar fichas:', result.error);
        renderError();
        return;
      }
      var rows = result.data || [];
      fichasData = {};
      rows.forEach(function (r) { fichasData[r.arquetipo] = r; });
      renderCards();
    });
  }

  function subscribeFichas() {
    if (!db) return;
    db.channel('fichas-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fichas' },
        function () { loadFichas(); }
      )
      .subscribe();
  }

  function renderError() {
    var grid = document.getElementById('fichas-grid');
    grid.innerHTML = '<div class="fichas-loading">ERRO AO CARREGAR ARQUIVO. VERIFIQUE A CONEX&Atilde;O.</div>';
  }

  function renderCards() {
    var grid = document.getElementById('fichas-grid');
    grid.innerHTML = '';

    ORDEM.forEach(function (arq) {
      var pb = PLAYBOOKS[arq];
      var data = fichasData[arq] || { stress: 0, sinal: 0, chaves: 3 };

      var card = document.createElement('div');
      card.className = 'ficha-card';
      card.setAttribute('data-arquetipo', arq);

      card.innerHTML =
        '<div class="card-static-overlay"></div>' +
        '<div class="ficha-card-foto">' +
          '<img src="assets/images/Characters/' + pb.versao + '.png" alt="' + pb.nome + '">' +
        '</div>' +
        '<div class="ficha-card-info">' +
          '<h3 class="ficha-card-nome">' + pb.nome + '</h3>' +
          '<span class="ficha-card-arquetipo">' + pb.arquetipo + '</span>' +
          '<span class="ficha-card-jogador">Jogador: <strong>' + pb.jogador + '</strong></span>' +
          '<div class="ficha-card-atributos">' +
            '<span><i>&#9728;</i> ' + pb.atributos.dia + '</span>' +
            '<span><i>&#9790;</i> ' + pb.atributos.noite + '</span>' +
            '<span><i>&#10044;</i> ' + pb.atributos.profundo + '</span>' +
          '</div>' +
          '<div class="ficha-card-status">' +
            renderStatusLine('stress', data.stress, 6) +
            renderStatusLine('sinal', data.sinal, 4) +
            renderStatusLine('chaves', data.chaves, 3) +
          '</div>' +
        '</div>' +
        '<button class="ficha-card-abrir" data-arquetipo="' + arq + '">ABRIR FICHA</button>';

      grid.appendChild(card);
    });

    grid.querySelectorAll('.ficha-card-abrir').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var arq = btn.getAttribute('data-arquetipo');
        window.location.href = 'ficha?arquetipo=' + encodeURIComponent(arq);
      });
    });
  }

  function renderStatusLine(tipo, valor, max) {
    var label = { stress: 'STRESS', sinal: 'SINAL', chaves: 'CHAVES' }[tipo];
    var simbolo = (tipo === 'chaves') ? '◈' : '○';
    var simboloPreenchido = (tipo === 'chaves') ? '◆' : '●';
    var bolas = '';
    for (var i = 0; i < max; i++) {
      if (i < valor) {
        bolas += '<span class="status-bola preenchida bola-' + tipo + '">' + simboloPreenchido + '</span>';
      } else {
        bolas += '<span class="status-bola bola-' + tipo + '">' + simbolo + '</span>';
      }
    }
    return '<div class="status-linha"><span class="status-label">' + label + '</span><span class="status-bolas">' + bolas + '</span></div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var ok = initDb();
    if (ok) {
      loadFichas();
      subscribeFichas();
    } else {
      renderError();
    }
  });

})();
