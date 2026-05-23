/* ========================================
   LIMIAR: CONTROLE DE DANOS
   Quadro de Investigação Colaborativo
   ======================================== */

(function () {
  'use strict';

  // Estado global
  var db = null;
  var canal = null;            // canal realtime (cards/linhas)
  var canalPresenca = null;    // canal de presença/cursores
  var jogador = null;          // nome
  var jogadorCor = '#33ff33';
  var cards = {};              // { id: cardData }
  var linhas = {};             // { id: linhaData }
  var cursoresRemotos = {};    // { uid: { x, y, nome, cor, ts } }

  var pan = { x: 0, y: 0 };
  var zoom = 1;
  var MIN_ZOOM = 0.25, MAX_ZOOM = 2.5;

  var arrastandoFundo = false;
  var arrastandoCard = null;    // { id, offsetX, offsetY }
  var ultimoMousePos = { x: 0, y: 0 };

  var modoLinha = false;
  var linhaPrimeiroCard = null;

  var selecionadoId = null;
  var editandoId = null;

  var saveTimers = {};

  // ========================================
  // INIT
  // ========================================
  function initDb() {
    db = window.getLimiarSupabase ? window.getLimiarSupabase() : null;
    return !!db;
  }

  function hashCor(nome) {
    var hash = 0;
    for (var i = 0; i < nome.length; i++) {
      hash = ((hash << 5) - hash) + nome.charCodeAt(i);
      hash |= 0;
    }
    var paleta = ['#33ff33', '#ffaa00', '#cc66ff', '#66ccff', '#ff6688', '#88ff88', '#ffcc44', '#bb88ff'];
    return paleta[Math.abs(hash) % paleta.length];
  }

  // ========================================
  // MODAL DE NOME
  // ========================================
  function initNomeModal() {
    var modal = document.getElementById('quadro-nome-modal');
    var input = document.getElementById('quadro-nome-input');
    var btn = document.getElementById('quadro-nome-btn');
    var erro = document.getElementById('quadro-nome-erro');

    var nomeSalvo = localStorage.getItem('limiar_player_name');
    if (nomeSalvo) {
      input.value = nomeSalvo;
    }

    function entrar() {
      var n = (input.value || '').trim();
      if (n.length < 2) {
        erro.textContent = 'NOME MUITO CURTO';
        return;
      }
      jogador = n.toUpperCase();
      jogadorCor = hashCor(jogador);
      localStorage.setItem('limiar_player_name', jogador);
      modal.style.display = 'none';
      document.getElementById('tb-jogador-nome').textContent = jogador;
      document.getElementById('tb-jogador-nome').style.color = jogadorCor;
      mostrarUI();
      iniciarQuadro();
    }

    btn.addEventListener('click', entrar);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') entrar();
    });
    input.focus();
  }

  function mostrarUI() {
    document.getElementById('quadro-toolbar').classList.remove('hidden');
    document.getElementById('quadro-canvas').classList.remove('hidden');
    document.getElementById('quadro-statusbar').classList.remove('hidden');
    document.getElementById('quadro-hint').classList.remove('hidden');
  }

  // ========================================
  // QUADRO INIT
  // ========================================
  function iniciarQuadro() {
    if (!initDb()) {
      setStatus('ERRO: Supabase não configurado.');
      return;
    }
    carregarCards();
    carregarLinhas();
    subscribeDb();
    subscribePresenca();
    bindToolbar();
    bindCanvas();
    bindHint();
  }

  function setStatus(s) {
    var el = document.getElementById('quadro-status');
    if (el) el.textContent = s;
  }

  // ========================================
  // CARREGAR DADOS
  // ========================================
  function carregarCards() {
    db.from('quadro_cards').select('*').then(function (r) {
      if (r.error) { setStatus('Erro ao carregar cards.'); return; }
      cards = {};
      (r.data || []).forEach(function (c) { cards[c.id] = c; });
      renderCards();
    });
  }

  function carregarLinhas() {
    db.from('quadro_linhas').select('*').then(function (r) {
      if (r.error) { setStatus('Erro ao carregar linhas.'); return; }
      linhas = {};
      (r.data || []).forEach(function (l) { linhas[l.id] = l; });
      renderLinhas();
    });
  }

  function subscribeDb() {
    canal = db.channel('quadro-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quadro_cards' }, function (p) {
        if (p.eventType === 'DELETE') {
          if (p.old && p.old.id) {
            delete cards[p.old.id];
            renderCards();
            renderLinhas();
          }
        } else if (p.new) {
          cards[p.new.id] = p.new;
          renderCardSingle(p.new.id);
          renderLinhas();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quadro_linhas' }, function (p) {
        if (p.eventType === 'DELETE') {
          if (p.old && p.old.id) delete linhas[p.old.id];
        } else if (p.new) {
          linhas[p.new.id] = p.new;
        }
        renderLinhas();
      })
      .subscribe();
  }

  // ========================================
  // PRESENÇA + CURSORES
  // ========================================
  var meuUid = 'u-' + Math.random().toString(36).substr(2, 9);

  function subscribePresenca() {
    canalPresenca = db.channel('quadro-presenca', {
      config: { presence: { key: meuUid } }
    });
    canalPresenca
      .on('presence', { event: 'sync' }, function () {
        atualizarOnline();
      })
      .on('presence', { event: 'leave' }, function (p) {
        if (p && p.key && cursoresRemotos[p.key]) {
          delete cursoresRemotos[p.key];
          renderCursores();
        }
      })
      .on('broadcast', { event: 'cursor' }, function (msg) {
        if (!msg.payload) return;
        var data = msg.payload;
        if (data.uid === meuUid) return;
        cursoresRemotos[data.uid] = {
          x: data.x, y: data.y,
          nome: data.nome, cor: data.cor,
          ts: Date.now()
        };
        renderCursores();
      })
      .subscribe(function (status) {
        if (status === 'SUBSCRIBED') {
          canalPresenca.track({ nome: jogador, uid: meuUid });
        }
      });

    // Limpa cursores antigos (>5s sem update)
    setInterval(function () {
      var agora = Date.now();
      var changed = false;
      Object.keys(cursoresRemotos).forEach(function (k) {
        if (agora - cursoresRemotos[k].ts > 5000) {
          delete cursoresRemotos[k];
          changed = true;
        }
      });
      if (changed) renderCursores();
    }, 2000);
  }

  function atualizarOnline() {
    if (!canalPresenca) return;
    var state = canalPresenca.presenceState();
    var qtd = Object.keys(state).length;
    document.getElementById('tb-online-num').textContent = qtd;
  }

  // Throttle broadcast de cursor
  var ultimoCursorEnviado = 0;
  function enviarCursor(x, y) {
    var agora = Date.now();
    if (agora - ultimoCursorEnviado < 50) return;
    ultimoCursorEnviado = agora;
    if (!canalPresenca) return;
    canalPresenca.send({
      type: 'broadcast', event: 'cursor',
      payload: { uid: meuUid, nome: jogador, cor: jogadorCor, x: x, y: y }
    });
  }

  function renderCursores() {
    var container = document.getElementById('quadro-cursores');
    container.innerHTML = '';
    Object.keys(cursoresRemotos).forEach(function (uid) {
      var c = cursoresRemotos[uid];
      var p = worldToScreen(c.x, c.y);
      var el = document.createElement('div');
      el.className = 'quadro-cursor';
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      el.innerHTML =
        '<svg width="20" height="22" viewBox="0 0 20 22"><path d="M0 0 L0 16 L5 13 L8 22 L11 21 L8 12 L14 12 Z" fill="' + c.cor + '" stroke="#000" stroke-width="1"/></svg>' +
        '<span class="quadro-cursor-nome" style="background:' + c.cor + '">' + escapeHtml(c.nome) + '</span>';
      container.appendChild(el);
    });
  }

  // ========================================
  // PAN / ZOOM
  // ========================================
  function aplicarTransform() {
    var mundo = document.getElementById('quadro-mundo');
    mundo.style.transform = 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + zoom + ')';
    document.getElementById('tb-zoom-val').textContent = Math.round(zoom * 100) + '%';
    renderCursores();
  }

  function screenToWorld(sx, sy) {
    return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
  }

  function worldToScreen(wx, wy) {
    return { x: wx * zoom + pan.x, y: wy * zoom + pan.y };
  }

  function zoomEm(delta, centroX, centroY) {
    var novoZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * (1 + delta)));
    if (novoZoom === zoom) return;
    // Mantém ponto sob o cursor fixo durante o zoom
    var antesW = screenToWorld(centroX, centroY);
    zoom = novoZoom;
    var depoisW = screenToWorld(centroX, centroY);
    pan.x += (depoisW.x - antesW.x) * zoom;
    pan.y += (depoisW.y - antesW.y) * zoom;
    aplicarTransform();
  }

  // ========================================
  // RENDER CARDS
  // ========================================
  function renderCards() {
    var container = document.getElementById('quadro-cards');
    container.innerHTML = '';
    Object.keys(cards).forEach(function (id) {
      container.appendChild(criarElCard(cards[id]));
    });
  }

  function renderCardSingle(id) {
    var existing = document.getElementById('card-' + id);
    var novo = criarElCard(cards[id]);
    if (existing) {
      // Se está editando, ignora updates remotos
      if (existing.classList.contains('editando')) return;
      existing.parentNode.replaceChild(novo, existing);
    } else {
      document.getElementById('quadro-cards').appendChild(novo);
    }
  }

  function criarElCard(c) {
    var el = document.createElement('div');
    el.className = 'quadro-card quadro-card-' + (c.cor || 'amarelo');
    if (selecionadoId === c.id) el.classList.add('selecionado');
    el.id = 'card-' + c.id;
    el.style.left = c.x + 'px';
    el.style.top = c.y + 'px';
    el.style.width = (c.largura || 240) + 'px';
    el.style.minHeight = (c.altura || 180) + 'px';
    el.style.transform = 'rotate(' + (c.rotacao || 0) + 'deg)';
    el.style.zIndex = c.z_index || 1;
    el.setAttribute('data-id', c.id);

    var html = '';
    if (c.imagem_url) {
      html += '<img class="quadro-card-imagem" src="' + escapeAttr(c.imagem_url) + '" alt="">';
    }
    html += '<div class="quadro-card-titulo" data-campo="titulo">' + (c.titulo ? escapeHtml(c.titulo) : '<span class="placeholder">título</span>') + '</div>';
    html += '<div class="quadro-card-conteudo" data-campo="conteudo">' + (c.conteudo ? escapeHtml(c.conteudo).replace(/\n/g, '<br>') : '<span class="placeholder">duplo-click pra editar</span>') + '</div>';
    if (c.criado_por) {
      html += '<div class="quadro-card-autor">' + escapeHtml(c.criado_por) + '</div>';
    }
    el.innerHTML = html;

    bindCardEvents(el, c.id);
    return el;
  }

  function bindCardEvents(el, id) {
    el.addEventListener('mousedown', function (e) {
      if (editandoId === id) return;
      e.stopPropagation();
      if (modoLinha) {
        selecionarParaLinha(id);
        return;
      }
      selecionarCard(id);
      arrastandoCard = {
        id: id,
        offsetX: e.clientX - (cards[id].x * zoom + pan.x),
        offsetY: e.clientY - (cards[id].y * zoom + pan.y)
      };
      trazerParaFrente(id);
    });

    el.addEventListener('dblclick', function (e) {
      e.stopPropagation();
      iniciarEdicao(id);
    });
  }

  // ========================================
  // RENDER LINHAS
  // ========================================
  function renderLinhas() {
    var svg = document.getElementById('quadro-linhas-svg');
    svg.innerHTML = '';
    // Ajusta tamanho do SVG pra cobrir todos os cards
    var maxX = 2000, maxY = 2000;
    Object.keys(cards).forEach(function (id) {
      var c = cards[id];
      var w = c.largura || 240;
      var h = c.altura || 180;
      if (c.x + w > maxX) maxX = c.x + w + 200;
      if (c.y + h > maxY) maxY = c.y + h + 200;
    });
    svg.setAttribute('width', maxX);
    svg.setAttribute('height', maxY);
    svg.setAttribute('viewBox', '0 0 ' + maxX + ' ' + maxY);

    Object.keys(linhas).forEach(function (id) {
      var l = linhas[id];
      var a = cards[l.card_origem];
      var b = cards[l.card_destino];
      if (!a || !b) return;
      var ax = a.x + (a.largura || 240) / 2;
      var ay = a.y + (a.altura || 180) / 2;
      var bx = b.x + (b.largura || 240) / 2;
      var by = b.y + (b.altura || 180) / 2;
      // Curva suave entre os pontos
      var midX = (ax + bx) / 2;
      var midY = (ay + by) / 2 + 30;
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M ' + ax + ' ' + ay + ' Q ' + midX + ' ' + midY + ' ' + bx + ' ' + by);
      path.setAttribute('stroke', '#c33');
      path.setAttribute('stroke-width', '3');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.75');
      svg.appendChild(path);
    });
  }

  // ========================================
  // SELEÇÃO / EDIÇÃO
  // ========================================
  function selecionarCard(id) {
    if (selecionadoId === id) return;
    var anterior = document.querySelector('.quadro-card.selecionado');
    if (anterior) anterior.classList.remove('selecionado');
    selecionadoId = id;
    var el = document.getElementById('card-' + id);
    if (el) el.classList.add('selecionado');
  }

  function deselecionarTudo() {
    var anterior = document.querySelector('.quadro-card.selecionado');
    if (anterior) anterior.classList.remove('selecionado');
    selecionadoId = null;
  }

  function trazerParaFrente(id) {
    var maxZ = 1;
    Object.keys(cards).forEach(function (k) {
      if (cards[k].z_index > maxZ) maxZ = cards[k].z_index;
    });
    var novoZ = maxZ + 1;
    cards[id].z_index = novoZ;
    var el = document.getElementById('card-' + id);
    if (el) el.style.zIndex = novoZ;
    debouncedSave(id, 'z_index', novoZ);
  }

  function iniciarEdicao(id) {
    var el = document.getElementById('card-' + id);
    if (!el) return;
    var c = cards[id];
    editandoId = id;
    el.classList.add('editando');

    el.innerHTML =
      '<input class="quadro-card-titulo-input" type="text" placeholder="Título" value="' + escapeAttr(c.titulo || '') + '">' +
      '<textarea class="quadro-card-conteudo-input" placeholder="Anotação...">' + escapeHtml(c.conteudo || '') + '</textarea>' +
      '<input class="quadro-card-imagem-input" type="text" placeholder="URL de imagem (opcional)" value="' + escapeAttr(c.imagem_url || '') + '">' +
      '<div class="quadro-card-acoes">' +
        '<button class="quadro-card-ok">OK</button>' +
        '<button class="quadro-card-cancel">Cancelar</button>' +
        '<button class="quadro-card-del">&#9587; Excluir</button>' +
      '</div>';

    var tituloInput = el.querySelector('.quadro-card-titulo-input');
    var conteudoInput = el.querySelector('.quadro-card-conteudo-input');
    var imagemInput = el.querySelector('.quadro-card-imagem-input');
    tituloInput.focus();
    tituloInput.select();

    el.querySelector('.quadro-card-ok').addEventListener('click', function (e) {
      e.stopPropagation();
      var novoTitulo = tituloInput.value;
      var novoConteudo = conteudoInput.value;
      var novaImagem = imagemInput.value.trim();
      cards[id].titulo = novoTitulo;
      cards[id].conteudo = novoConteudo;
      cards[id].imagem_url = novaImagem;
      saveCardCampos(id, { titulo: novoTitulo, conteudo: novoConteudo, imagem_url: novaImagem });
      finalizarEdicao(id);
    });
    el.querySelector('.quadro-card-cancel').addEventListener('click', function (e) {
      e.stopPropagation();
      finalizarEdicao(id);
    });
    el.querySelector('.quadro-card-del').addEventListener('click', function (e) {
      e.stopPropagation();
      excluirCard(id);
    });

    // Stop propagation pra eventos não vazarem
    [tituloInput, conteudoInput, imagemInput].forEach(function (inp) {
      inp.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      inp.addEventListener('click', function (e) { e.stopPropagation(); });
    });
  }

  function finalizarEdicao(id) {
    editandoId = null;
    var el = document.getElementById('card-' + id);
    if (!el) return;
    el.classList.remove('editando');
    var novo = criarElCard(cards[id]);
    el.parentNode.replaceChild(novo, el);
  }

  // ========================================
  // SAVE
  // ========================================
  function saveCardCampos(id, campos) {
    if (!db) return;
    var update = Object.assign({}, campos, { updated_at: new Date().toISOString() });
    db.from('quadro_cards').update(update).eq('id', id).then(function (r) {
      if (r.error) console.error('Erro save:', r.error);
    });
  }

  function debouncedSave(id, campo, valor) {
    var key = id + ':' + campo;
    if (saveTimers[key]) clearTimeout(saveTimers[key]);
    saveTimers[key] = setTimeout(function () {
      var update = {};
      update[campo] = valor;
      saveCardCampos(id, update);
    }, 200);
  }

  function debouncedSavePos(id) {
    var key = id + ':pos';
    if (saveTimers[key]) clearTimeout(saveTimers[key]);
    saveTimers[key] = setTimeout(function () {
      var c = cards[id];
      if (!c) return;
      saveCardCampos(id, { x: c.x, y: c.y });
    }, 200);
  }

  // ========================================
  // CRIAR / EXCLUIR
  // ========================================
  function criarCard(cor) {
    var viewport = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var w = screenToWorld(viewport.x, viewport.y);
    var rotacao = (Math.random() - 0.5) * 8;
    var maxZ = 1;
    Object.keys(cards).forEach(function (k) {
      if (cards[k].z_index > maxZ) maxZ = cards[k].z_index;
    });
    var novo = {
      tipo: 'sticky',
      x: Math.round(w.x - 120),
      y: Math.round(w.y - 90),
      largura: 240,
      altura: 180,
      cor: cor,
      titulo: '',
      conteudo: '',
      imagem_url: '',
      rotacao: rotacao,
      z_index: maxZ + 1,
      criado_por: jogador
    };
    db.from('quadro_cards').insert(novo).select().single().then(function (r) {
      if (r.error) { setStatus('Erro ao criar: ' + r.error.message); return; }
      // Abre em edição automaticamente
      cards[r.data.id] = r.data;
      renderCardSingle(r.data.id);
      iniciarEdicao(r.data.id);
    });
  }

  function excluirCard(id) {
    if (!db) return;
    db.from('quadro_cards').delete().eq('id', id).then(function () {
      delete cards[id];
      var el = document.getElementById('card-' + id);
      if (el) el.remove();
      renderLinhas();
    });
  }

  // ========================================
  // LINHAS (modo conectar)
  // ========================================
  function entrarModoLinha() {
    modoLinha = true;
    linhaPrimeiroCard = null;
    document.body.classList.add('quadro-modo-linha');
    document.getElementById('tb-linha').classList.add('ativo');
    setStatus('Modo LINHA: clique no primeiro card, depois no segundo. ESC pra cancelar.');
  }

  function sairModoLinha() {
    modoLinha = false;
    if (linhaPrimeiroCard) {
      var el = document.getElementById('card-' + linhaPrimeiroCard);
      if (el) el.classList.remove('linha-origem');
    }
    linhaPrimeiroCard = null;
    document.body.classList.remove('quadro-modo-linha');
    document.getElementById('tb-linha').classList.remove('ativo');
    setStatus('Pronto.');
  }

  function selecionarParaLinha(id) {
    if (!linhaPrimeiroCard) {
      linhaPrimeiroCard = id;
      var el = document.getElementById('card-' + id);
      if (el) el.classList.add('linha-origem');
      setStatus('Agora clique no segundo card.');
    } else {
      if (id === linhaPrimeiroCard) {
        sairModoLinha();
        return;
      }
      db.from('quadro_linhas').insert({
        card_origem: linhaPrimeiroCard,
        card_destino: id,
        criado_por: jogador
      }).then(function (r) {
        if (r.error) setStatus('Erro: ' + r.error.message);
      });
      sairModoLinha();
    }
  }

  // ========================================
  // CANVAS BINDINGS
  // ========================================
  function bindCanvas() {
    var canvas = document.getElementById('quadro-canvas');
    var mundo = document.getElementById('quadro-mundo');

    canvas.addEventListener('mousedown', function (e) {
      if (e.target.closest('.quadro-card')) return;
      if (modoLinha) return;
      deselecionarTudo();
      arrastandoFundo = true;
      ultimoMousePos = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function (e) {
      if (arrastandoFundo) {
        pan.x += e.clientX - ultimoMousePos.x;
        pan.y += e.clientY - ultimoMousePos.y;
        ultimoMousePos = { x: e.clientX, y: e.clientY };
        aplicarTransform();
      } else if (arrastandoCard) {
        var id = arrastandoCard.id;
        var newScreenX = e.clientX - arrastandoCard.offsetX;
        var newScreenY = e.clientY - arrastandoCard.offsetY;
        var w = screenToWorld(newScreenX, newScreenY);
        // newScreenX já é a posição "do canto" em tela; converter pra mundo (sem pan adicional)
        cards[id].x = Math.round((newScreenX - pan.x) / zoom);
        cards[id].y = Math.round((newScreenY - pan.y) / zoom);
        var el = document.getElementById('card-' + id);
        if (el) {
          el.style.left = cards[id].x + 'px';
          el.style.top = cards[id].y + 'px';
        }
        renderLinhas();
        debouncedSavePos(id);
      }

      // Envia cursor pra outros
      var wp = screenToWorld(e.clientX, e.clientY);
      enviarCursor(wp.x, wp.y);
    });

    document.addEventListener('mouseup', function () {
      arrastandoFundo = false;
      arrastandoCard = null;
      canvas.style.cursor = '';
    });

    // Zoom com scroll
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var delta = e.deltaY < 0 ? 0.1 : -0.1;
      zoomEm(delta, e.clientX, e.clientY);
    }, { passive: false });

    // Atalhos
    document.addEventListener('keydown', function (e) {
      if (editandoId) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selecionadoId) {
        e.preventDefault();
        excluirCard(selecionadoId);
        selecionadoId = null;
      } else if (e.key === 'l' || e.key === 'L') {
        if (modoLinha) sairModoLinha(); else entrarModoLinha();
      } else if (e.key === 'Escape') {
        if (modoLinha) sairModoLinha();
        else deselecionarTudo();
      }
    });
  }

  // ========================================
  // TOOLBAR BINDINGS
  // ========================================
  function bindToolbar() {
    ['amarelo', 'rosa', 'azul', 'verde', 'branco'].forEach(function (cor) {
      var btn = document.getElementById('tb-sticky' + cor);
      if (btn) btn.addEventListener('click', function () { criarCard(cor); });
    });

    document.getElementById('tb-linha').addEventListener('click', function () {
      if (modoLinha) sairModoLinha();
      else entrarModoLinha();
    });

    document.getElementById('tb-zoom-in').addEventListener('click', function () {
      zoomEm(0.2, window.innerWidth / 2, window.innerHeight / 2);
    });
    document.getElementById('tb-zoom-out').addEventListener('click', function () {
      zoomEm(-0.2, window.innerWidth / 2, window.innerHeight / 2);
    });
    document.getElementById('tb-zoom-reset').addEventListener('click', function () {
      zoom = 1; pan = { x: 0, y: 0 };
      aplicarTransform();
    });
  }

  function bindHint() {
    document.getElementById('quadro-hint-close').addEventListener('click', function () {
      document.getElementById('quadro-hint').style.display = 'none';
    });
  }

  // ========================================
  // HELPERS
  // ========================================
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ========================================
  // INIT
  // ========================================
  document.addEventListener('DOMContentLoaded', function () {
    initNomeModal();
  });

})();
