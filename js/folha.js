/* ========================================
   LIMIAR: CONTROLE DE DANOS
   Folha de Morro Alto (folha.html)
   ======================================== */

(function () {
  'use strict';

  var db = null;
  var materias = [];

  // ========================================
  // INIT
  // ========================================
  function initDb() {
    db = window.getLimiarSupabase ? window.getLimiarSupabase() : null;
    return !!db;
  }

  function getQueryParam(name) {
    var match = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  // ========================================
  // CARREGAR / SUBSCRIBE
  // ========================================
  function loadMaterias() {
    if (!db) {
      mostrarErro('Banco indispon&iacute;vel.');
      return;
    }
    db.from('materias_folha')
      .select('*')
      .eq('publicada', true)
      .order('destaque', { ascending: false })
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false })
      .then(function (result) {
        if (result.error) {
          console.error('Erro:', result.error);
          mostrarErro('Erro ao carregar mat&eacute;rias.');
          return;
        }
        materias = result.data || [];
        rotear();
      });
  }

  function subscribe() {
    if (!db) return;
    db.channel('folha-rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'materias_folha' },
        function () { loadMaterias(); }
      )
      .subscribe();
  }

  // ========================================
  // ROTEAMENTO (homepage vs matéria)
  // ========================================
  function rotear() {
    var slug = getQueryParam('materia');
    if (slug) {
      var m = materias.find(function (x) { return x.slug === slug; });
      if (m) {
        renderMateria(m);
      } else {
        renderHomepage();
      }
    } else {
      renderHomepage();
    }
  }

  // ========================================
  // RENDER HOMEPAGE
  // ========================================
  function renderHomepage() {
    setUrl('http://www.folhademorroalto.com.br/');
    setTitle('Netscape: Folha de Morro Alto');
    setStatus('Document: Done.');

    var destaque = materias.find(function (m) { return m.destaque; });
    var outras = materias.filter(function (m) { return m !== destaque; });

    var html = '';
    html += renderCabecalho();

    // Marquee (chamada rotativa)
    html += '<div class="folha-marquee-wrap"><marquee scrollamount="4">' +
            '&#9670; &Uacute;LTIMA HORA &#9670; ' +
            (destaque ? destaque.titulo + ' &nbsp;&nbsp;&nbsp; ' : '') +
            'Edi&ccedil;&atilde;o online sempre atualizada &nbsp;&nbsp;&nbsp; Boas pr&aacute;ticas da Internet recomendam o uso de Netscape Navigator 3.0 ou superior &nbsp;&nbsp;&nbsp;' +
            '</marquee></div>';

    if (destaque) {
      html += '<a class="folha-manchete-link" href="?materia=' + encodeURIComponent(destaque.slug) + '">' +
                '<div class="folha-manchete-principal">' +
                  '<span class="folha-categoria">' + escapeHtml(destaque.categoria || 'CIDADE') + '</span>' +
                  '<h1 class="folha-manchete-titulo">' + escapeHtml(destaque.titulo) + '</h1>' +
                  (destaque.subtitulo ? '<h2 class="folha-manchete-subtitulo">' + escapeHtml(destaque.subtitulo) + '</h2>' : '') +
                  '<p class="folha-manchete-data">' +
                    (destaque.data_publicacao ? escapeHtml(destaque.data_publicacao) : '') +
                    (destaque.autor ? ' &middot; por ' + escapeHtml(destaque.autor) : '') +
                  '</p>' +
                  '<p class="folha-manchete-chamada">' + escapeHtml(destaque.chamada || '') + '</p>' +
                  '<span class="folha-leia-mais">LEIA A MAT&Eacute;RIA COMPLETA &#9656;</span>' +
                '</div>' +
              '</a>';
    }

    if (outras.length > 0) {
      html += '<hr class="folha-hr">' +
              '<h3 class="folha-secao-titulo">OUTRAS MAT&Eacute;RIAS DESTA EDI&Ccedil;&Atilde;O</h3>' +
              '<ul class="folha-materia-lista">';
      outras.forEach(function (m) {
        html += '<li class="folha-materia-item">' +
                  '<a href="?materia=' + encodeURIComponent(m.slug) + '">' +
                    '<span class="folha-categoria-mini">[' + escapeHtml(m.categoria || 'CIDADE') + ']</span> ' +
                    '<strong>' + escapeHtml(m.titulo) + '</strong>' +
                  '</a>' +
                  (m.chamada ? '<p>' + escapeHtml(m.chamada) + '</p>' : '') +
                  '<small>' + escapeHtml(m.data_publicacao || '') + '</small>' +
                '</li>';
      });
      html += '</ul>';
    }

    if (materias.length === 0) {
      html += '<p class="folha-vazio">Nenhuma mat&eacute;ria publicada no momento. Volte em breve.</p>';
    }

    html += renderRodape();

    document.getElementById('folha-pagina').innerHTML = html;
    document.getElementById('folha-pagina').scrollTop = 0;
  }

  // ========================================
  // RENDER MATÉRIA INDIVIDUAL
  // ========================================
  function renderMateria(m) {
    setUrl('http://www.folhademorroalto.com.br/?materia=' + m.slug);
    setTitle('Netscape: ' + m.titulo);
    setStatus('Document: Done. (' + (m.data_publicacao || '') + ')');

    var html = '';
    html += '<div class="folha-volta-topo">' +
              '<a href="folha" class="folha-link-voltar">&#9664; Voltar &agrave; edi&ccedil;&atilde;o</a>' +
            '</div>';

    html += '<article class="folha-materia">' +
              '<header class="folha-materia-header">' +
                '<div class="folha-materia-meta">' +
                  '<span class="folha-categoria">' + escapeHtml(m.categoria || 'CIDADE') + '</span>' +
                  '<span class="folha-materia-data">' + escapeHtml(m.data_publicacao || '') + '</span>' +
                  (m.autor ? '<span class="folha-materia-autor">por ' + escapeHtml(m.autor) + '</span>' : '') +
                '</div>' +
                '<h1 class="folha-materia-titulo">' + escapeHtml(m.titulo) + '</h1>' +
                (m.subtitulo ? '<h2 class="folha-materia-subtitulo">' + escapeHtml(m.subtitulo) + '</h2>' : '') +
              '</header>' +
              (m.chamada ? '<p class="folha-materia-chamada">' + escapeHtml(m.chamada) + '</p>' : '') +
              '<hr class="folha-hr">' +
              '<div class="folha-corpo">' + (m.corpo || '') + '</div>' +
            '</article>';

    html += '<div class="folha-volta-baixo">' +
              '<a href="folha" class="folha-link-voltar">&#9664; Voltar &agrave; edi&ccedil;&atilde;o</a>' +
            '</div>';

    html += renderRodape();

    document.getElementById('folha-pagina').innerHTML = html;
    document.getElementById('folha-pagina').scrollTop = 0;
  }

  // ========================================
  // HELPERS DE RENDER
  // ========================================
  function renderCabecalho() {
    return '<div class="folha-cabecalho">' +
              '<div class="folha-titulo-bloco">' +
                '<h1 class="folha-logo">FOLHA</h1>' +
                '<div class="folha-logo-sub">' +
                  '<span class="folha-logo-cidade">DE MORRO ALTO</span>' +
                  '<span class="folha-logo-slogan">&laquo;A verdade em sintonia desde 1962&raquo;</span>' +
                '</div>' +
              '</div>' +
              '<div class="folha-edicao-info">' +
                '<div class="folha-edicao-data">EDI&Ccedil;&Atilde;O ONLINE &middot; ATUALIZADA HOJE</div>' +
                '<div class="folha-edicao-preco">DISTRIBUI&Ccedil;&Atilde;O GRATUITA</div>' +
              '</div>' +
            '</div>' +
            '<hr class="folha-hr folha-hr-grossa">';
  }

  function renderRodape() {
    return '<hr class="folha-hr folha-hr-grossa">' +
            '<div class="folha-rodape">' +
              '<div class="folha-rodape-col">' +
                '<p><strong>Folha de Morro Alto</strong></p>' +
                '<p>Rua Quinze de Novembro, 247 &mdash; Centro</p>' +
                '<p>Tel: (24) 99-4710</p>' +
                '<p>folha@morroalto.com.br</p>' +
              '</div>' +
              '<div class="folha-rodape-col folha-rodape-center">' +
                '<p>VOC&Ecirc; &Eacute; O VISITANTE</p>' +
                '<div class="folha-contador">003472</div>' +
                '<p><small>desde 02/05/1997</small></p>' +
              '</div>' +
              '<div class="folha-rodape-col">' +
                '<p class="folha-best-viewed">Best viewed in<br><strong>Netscape Navigator 3.0+</strong><br>800x600 ou superior</p>' +
                '<p class="folha-webring">&#9750; Webring: Imprensa Fluminense &#9750;</p>' +
              '</div>' +
            '</div>' +
            '<p class="folha-copyright">&copy; 1999 Folha de Morro Alto &middot; Todos os direitos reservados &middot; HTML 3.2</p>';
  }

  // ========================================
  // CHROME DO NETSCAPE
  // ========================================
  function setUrl(url) {
    var el = document.getElementById('netscape-url');
    if (el) el.textContent = url;
  }

  function setTitle(title) {
    var el = document.getElementById('netscape-title');
    if (el) el.textContent = title;
    document.title = title;
  }

  function setStatus(s) {
    var el = document.getElementById('netscape-status');
    if (el) el.textContent = s;
  }

  function initChromeBtns() {
    var back = document.getElementById('netscape-back');
    if (back) back.addEventListener('click', function () {
      window.history.back();
    });
    var reload = document.getElementById('netscape-reload');
    if (reload) reload.addEventListener('click', function () {
      window.location.reload();
    });
    var home = document.getElementById('netscape-home');
    if (home) home.addEventListener('click', function () {
      window.location.href = 'folha';
    });
  }

  function mostrarErro(msg) {
    document.getElementById('folha-pagina').innerHTML =
      '<div class="folha-erro">' +
        '<h2>&#9888; Erro de conex&atilde;o</h2>' +
        '<p>' + msg + '</p>' +
        '<p><a href="folha">Tentar novamente</a></p>' +
      '</div>';
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
    initChromeBtns();
    if (initDb()) {
      loadMaterias();
      subscribe();
    } else {
      mostrarErro('Banco indispon&iacute;vel.');
    }
    // Detecta mudança de query (back/forward do browser real)
    window.addEventListener('popstate', function () {
      rotear();
    });
  });

})();
