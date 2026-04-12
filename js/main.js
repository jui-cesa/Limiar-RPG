/* ========================================
   LIMIAR: CONTROLE DE DANOS
   Efeitos interativos — Terror Analógico
   ======================================== */

(function () {
  'use strict';

  /* --- PRELOADER --- */
  function initPreloader() {
    var preloader = document.getElementById('preloader');
    if (!preloader) return;

    function dismiss() {
      preloader.classList.add('fade-out');
      setTimeout(function () {
        preloader.style.display = 'none';
      }, 600);
    }

    preloader.addEventListener('click', dismiss);
    setTimeout(dismiss, 2500);
  }

  /* --- STATIC NOISE CANVAS --- */
  function initStaticNoise() {
    var canvas = document.getElementById('static-noise');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var frameCount = 0;
    var isMobile = window.innerWidth < 768;

    function resize() {
      // Use lower resolution for performance
      var scale = isMobile ? 0.15 : 0.25;
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }

    resize();
    window.addEventListener('resize', function () {
      isMobile = window.innerWidth < 768;
      resize();
    });

    function drawNoise() {
      frameCount++;
      // ~10fps: skip frames
      if (frameCount % 6 !== 0) {
        requestAnimationFrame(drawNoise);
        return;
      }

      var w = canvas.width;
      var h = canvas.height;
      var imageData = ctx.createImageData(w, h);
      var data = imageData.data;

      for (var i = 0; i < data.length; i += 4) {
        var val = Math.random() * 255;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(drawNoise);
    }

    // Disable on mobile for battery
    if (!isMobile) {
      requestAnimationFrame(drawNoise);
    }
  }

  /* --- RANDOM GLITCH TRIGGER --- */
  function initRandomGlitch() {
    var glitchElements = document.querySelectorAll('.glitch');
    if (glitchElements.length === 0) return;

    function triggerGlitch() {
      var target = glitchElements[Math.floor(Math.random() * glitchElements.length)];
      target.classList.add('glitch-active');

      setTimeout(function () {
        target.classList.remove('glitch-active');
      }, 150 + Math.random() * 350);

      // Schedule next glitch
      var nextDelay = 3000 + Math.random() * 6000;
      setTimeout(triggerGlitch, nextDelay);
    }

    // Start after a delay
    setTimeout(triggerGlitch, 4000);
  }

  /* --- VHS TRACKING BAND --- */
  function initVHSTracking() {
    var tracking = document.getElementById('vhs-tracking');
    if (!tracking) return;

    function sweep() {
      tracking.classList.remove('active');
      // Force reflow to restart animation
      void tracking.offsetWidth;
      tracking.classList.add('active');

      setTimeout(function () {
        tracking.classList.remove('active');
      }, 900);

      // Schedule next sweep
      var nextDelay = 8000 + Math.random() * 12000;
      setTimeout(sweep, nextDelay);
    }

    setTimeout(sweep, 5000);
  }

  /* --- TEXT CORRUPTION --- */
  function initTextCorruption() {
    var corruptElements = document.querySelectorAll('[data-corrupt]');
    if (corruptElements.length === 0) return;

    var glitchChars = ['\u2588', '\u2591', '\u2592', '\u2593', '\u2580', '\u2584'];

    function corruptText() {
      var target = corruptElements[Math.floor(Math.random() * corruptElements.length)];
      var originalText = target.textContent;
      var chars = originalText.split('');

      // Corrupt 2-5 random characters
      var numCorrupt = 2 + Math.floor(Math.random() * 4);
      var corruptedIndices = [];

      for (var i = 0; i < numCorrupt; i++) {
        var idx = Math.floor(Math.random() * chars.length);
        if (chars[idx] !== ' ' && chars[idx] !== '\n') {
          corruptedIndices.push({ index: idx, original: chars[idx] });
          chars[idx] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
      }

      if (corruptedIndices.length > 0) {
        target.textContent = chars.join('');

        // Restore after brief flash
        setTimeout(function () {
          target.textContent = originalText;
        }, 80 + Math.random() * 150);
      }

      // Schedule next corruption
      var nextDelay = 4000 + Math.random() * 8000;
      setTimeout(corruptText, nextDelay);
    }

    setTimeout(corruptText, 6000);
  }

  /* --- VHS TIMESTAMP --- */
  function initVHSTimestamp() {
    var timeEl = document.getElementById('vhs-time');
    if (!timeEl) return;

    var seconds = 0;
    var scrambleCount = 0;

    setInterval(function () {
      seconds++;
      var s = seconds % 60;
      var m = Math.floor(seconds / 60) % 60;
      var h = 23;
      var mm = 47 + Math.floor(seconds / 60);

      // Occasional scramble
      if (Math.random() < 0.03) {
        scrambleCount = 3;
      }

      if (scrambleCount > 0) {
        scrambleCount--;
        timeEl.textContent =
          String(Math.floor(Math.random() * 24)).padStart(2, '0') + ':' +
          String(Math.floor(Math.random() * 60)).padStart(2, '0') + ':' +
          String(Math.floor(Math.random() * 60)).padStart(2, '0');
      } else {
        timeEl.textContent =
          String(h).padStart(2, '0') + ':' +
          String(mm % 60).padStart(2, '0') + ':' +
          String(s).padStart(2, '0');
      }
    }, 1000);
  }

  /* --- NAVIGATION BAR --- */
  function initNavBar() {
    var nav = document.getElementById('nav-bar');
    if (!nav) return;

    var heroSection = document.getElementById('hero');
    if (!heroSection) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          nav.classList.remove('visible');
        } else {
          nav.classList.add('visible');
        }
      });
    }, { threshold: 0.3 });

    observer.observe(heroSection);

    // Smooth scroll for nav links
    var links = nav.querySelectorAll('.nav-link');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = this.getAttribute('href').substring(1);
        var target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* --- SECTION REVEAL ON SCROLL --- */
  function initSectionReveal() {
    var sections = document.querySelectorAll('.section-reveal');
    if (sections.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ========================================
     SUPABASE — CHARACTER SELECTION SYSTEM
     ======================================== */

  var db = null;
  var playerName = null;
  var currentSelections = [];

  function initSupabase() {
    var config = window.LIMIAR_CONFIG;
    if (!config || !config.SUPABASE_URL || config.SUPABASE_URL === 'SUA_URL_AQUI') {
      console.warn('Supabase não configurado. Copie config.example.js para config.js e preencha.');
      return false;
    }
    if (typeof window.supabase === 'undefined') {
      console.warn('Supabase SDK não carregou. Seleção offline.');
      return false;
    }
    db = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
    return true;
  }

  /* --- MECHANICAL KEYBOARD SOUND (Web Audio API) --- */
  var audioCtx = null;

  function playKeySound() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return; }
    }

    var now = audioCtx.currentTime;

    // Click noise burst (white noise, very short)
    var bufferSize = Math.floor(audioCtx.sampleRate * 0.025);
    var noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var data = noiseBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      // Shape: sharp attack, fast decay
      var envelope = Math.exp(-i / (bufferSize * 0.08));
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    var noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Bandpass filter — gives it that plastic/mechanical character
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000 + Math.random() * 1500;
    filter.Q.value = 1.5;

    // Gain — keep it subtle
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.08 + Math.random() * 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + 0.04);
  }

  /* --- NAME MODAL --- */
  function initNameModal() {
    var modal = document.getElementById('name-modal');
    var input = document.getElementById('player-name-input');
    var btn = document.getElementById('name-confirm-btn');
    var errorEl = document.getElementById('name-error');

    // Check localStorage for saved name
    var savedName = localStorage.getItem('limiar_player_name');
    if (savedName) {
      playerName = savedName;
      modal.classList.add('hidden');
      setTimeout(function () { modal.style.display = 'none'; }, 500);
      return;
    }

    // Keyboard sound on each keypress
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') return;
      playKeySound();
    });

    function confirmName() {
      var name = input.value.trim();
      if (!name) {
        errorEl.textContent = 'ERRO: NOME OBRIGATÓRIO';
        input.style.borderColor = '#8b0000';
        return;
      }
      if (name.length < 2) {
        errorEl.textContent = 'ERRO: NOME MUITO CURTO';
        input.style.borderColor = '#8b0000';
        return;
      }

      playerName = name.toUpperCase();
      localStorage.setItem('limiar_player_name', playerName);
      modal.classList.add('hidden');
      setTimeout(function () { modal.style.display = 'none'; }, 500);

      // Now load selections
      loadSelectionsAndSubscribe();
    }

    btn.addEventListener('click', confirmName);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') confirmName();
    });

    // Clear error on typing
    input.addEventListener('input', function () {
      errorEl.textContent = '';
      input.style.borderColor = '#1a1a1a';
    });
  }

  /* --- LOAD SELECTIONS & REALTIME --- */
  function loadSelectionsAndSubscribe() {
    if (!db) return;

    loadSelections();

    // Subscribe to realtime changes
    db.channel('selections-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'selections' },
        function () {
          loadSelections();
        }
      )
      .subscribe();
  }

  function loadSelections() {
    if (!db) return;

    db.from('selections').select('*').then(function (result) {
      if (result.error) {
        console.error('Erro ao carregar seleções:', result.error);
        return;
      }
      currentSelections = result.data || [];

      // Check if GM reset cleared our selection
      var mySelection = JSON.parse(localStorage.getItem('limiar_selection') || 'null');
      if (mySelection) {
        var stillExists = currentSelections.some(function (s) {
          return s.arquetipo === mySelection.arquetipo &&
                 s.versao === mySelection.versao &&
                 s.player_name === playerName;
        });
        if (!stillExists) {
          localStorage.removeItem('limiar_selection');
          document.body.classList.remove('player-locked');
        }
      }

      renderSelections();
    });
  }

  /* --- RENDER SELECTIONS --- */
  function renderSelections() {
    var mySelection = JSON.parse(localStorage.getItem('limiar_selection') || 'null');
    var statusEl = document.getElementById('selection-status');
    var arquetCards = document.querySelectorAll('.arquetipo-card');
    var totalClaimed = currentSelections.length;

    // Update status counter
    if (statusEl) {
      if (mySelection) {
        statusEl.textContent = 'LOGADO COMO: ' + playerName + ' // ' + totalClaimed + '/6 REGISTROS RESERVADOS';
      } else {
        statusEl.textContent = 'LOGADO COMO: ' + playerName + ' // ' + totalClaimed + '/6 REGISTROS RESERVADOS';
      }
    }

    // Toggle body lock
    if (mySelection) {
      document.body.classList.add('player-locked');
    } else {
      document.body.classList.remove('player-locked');
    }

    arquetCards.forEach(function (card) {
      var arquetipo = card.getAttribute('data-arquetipo');
      var versaoCards = card.querySelectorAll('.versao-card');
      var buttons = card.querySelectorAll('.btn-selecionar');

      // Remove previous state
      card.classList.remove('claimed', 'my-selection');
      versaoCards.forEach(function (vc) {
        vc.classList.remove('selecionado', 'indisponivel');
      });
      buttons.forEach(function (b) {
        b.classList.remove('selected');
        b.disabled = false;
        b.textContent = 'SELECIONAR';
      });

      // Remove injected badges
      var existingBadge = card.querySelector('.claimed-badge, .locked-badge');
      if (existingBadge) existingBadge.remove();

      // Find if this archetype is claimed
      var claim = currentSelections.find(function (s) { return s.arquetipo === arquetipo; });

      if (claim) {
        var isMySelection = mySelection &&
                            mySelection.arquetipo === arquetipo &&
                            claim.player_name === playerName;

        if (isMySelection) {
          // MY SELECTION
          card.classList.add('my-selection');

          versaoCards.forEach(function (vc) {
            if (vc.getAttribute('data-versao') === claim.versao) {
              vc.classList.add('selecionado');
            } else {
              vc.classList.add('indisponivel');
            }
          });

          buttons.forEach(function (b) {
            if (b.getAttribute('data-versao') === claim.versao) {
              b.classList.add('selected');
              b.textContent = 'DESMARCAR';
              b.disabled = false;
            } else {
              b.disabled = true;
              b.textContent = '';
            }
          });

          // Inject locked badge
          var lockedBadge = document.createElement('div');
          lockedBadge.className = 'locked-badge';
          lockedBadge.innerHTML = '\u2588 SEU REGISTRO \u2588 ' + claim.versao.toUpperCase() + ' <span class="locked-hint">(clique para desmarcar)</span>';
          card.appendChild(lockedBadge);

        } else {
          // CLAIMED BY ANOTHER PLAYER
          card.classList.add('claimed');

          buttons.forEach(function (b) {
            b.disabled = true;
            b.textContent = '';
          });

          // Inject claimed badge
          var claimedBadge = document.createElement('div');
          claimedBadge.className = 'claimed-badge';
          claimedBadge.innerHTML =
            'RESERVADO POR <span class="claimed-player">' + claim.player_name + '</span>' +
            ' \u2014 <span class="claimed-versao">' + claim.versao.toUpperCase() + '</span>';
          card.appendChild(claimedBadge);
        }
      } else {
        // AVAILABLE — but disable if player already made their choice
        if (mySelection) {
          buttons.forEach(function (b) {
            b.disabled = true;
            b.textContent = 'SELECIONAR';
          });
        }
      }
    });
  }

  /* --- HANDLE DESELECT --- */
  function handleDeselect(arquetipo, versao) {
    if (!db || !playerName) return;

    // Disable buttons during operation
    var allButtons = document.querySelectorAll('.btn-selecionar');
    allButtons.forEach(function (b) { b.disabled = true; });

    // Delete from Supabase (only own selection)
    db.from('selections')
      .delete()
      .eq('arquetipo', arquetipo)
      .eq('player_name', playerName)
      .then(function (result) {
        if (result.error) {
          console.error('Erro ao desmarcar:', result.error);
          loadSelections();
          return;
        }

        // Clear localStorage
        localStorage.removeItem('limiar_selection');
        document.body.classList.remove('player-locked');

        // Realtime will trigger renderSelections
        loadSelections();
      });
  }

  /* --- HANDLE SELECT --- */
  function handleSelect(arquetipo, versao) {
    if (!db || !playerName) return;

    // Check if player is deselecting their own choice
    var mySelection = JSON.parse(localStorage.getItem('limiar_selection') || 'null');
    if (mySelection && mySelection.arquetipo === arquetipo && mySelection.versao === versao) {
      handleDeselect(arquetipo, versao);
      return;
    }

    // Player already selected something else
    if (mySelection) return;

    // Check if archetype is already claimed locally
    var alreadyClaimed = currentSelections.some(function (s) { return s.arquetipo === arquetipo; });
    if (alreadyClaimed) return;

    // Disable all buttons to prevent double-click
    var allButtons = document.querySelectorAll('.btn-selecionar');
    allButtons.forEach(function (b) { b.disabled = true; });

    // Insert into Supabase
    db.from('selections').insert({
      player_name: playerName,
      arquetipo: arquetipo,
      versao: versao
    }).then(function (result) {
      if (result.error) {
        // UNIQUE violation or other error
        console.error('Erro na seleção:', result.error);

        // Show error on the archetype card
        var card = document.querySelector('.arquetipo-card[data-arquetipo="' + arquetipo + '"]');
        if (card) {
          var errorBadge = document.createElement('div');
          errorBadge.className = 'claimed-badge';
          errorBadge.textContent = 'ERRO: REGISTRO JÁ RESERVADO';
          card.appendChild(errorBadge);
          setTimeout(function () { errorBadge.remove(); }, 3000);
        }

        // Re-enable buttons and refresh
        loadSelections();
        return;
      }

      // Success — save to localStorage
      localStorage.setItem('limiar_selection', JSON.stringify({
        arquetipo: arquetipo,
        versao: versao
      }));

      document.body.classList.add('player-locked');

      // Glitch effect on success
      var selectedVersaoCard = document.querySelector(
        '.versao-card[data-arquetipo="' + arquetipo + '"][data-versao="' + versao + '"]'
      );
      if (selectedVersaoCard) {
        selectedVersaoCard.style.transition = 'none';
        selectedVersaoCard.style.transform = 'translateX(-3px)';
        setTimeout(function () {
          selectedVersaoCard.style.transform = 'translateX(4px)';
          setTimeout(function () {
            selectedVersaoCard.style.transform = 'translateX(-2px)';
            setTimeout(function () {
              selectedVersaoCard.style.transition = 'all 0.4s ease';
              selectedVersaoCard.style.transform = '';
            }, 60);
          }, 60);
        }, 60);
      }

      // Realtime will trigger renderSelections automatically
    });
  }

  /* --- WIRE UP BUTTONS --- */
  function initCharacterSelection() {
    var buttons = document.querySelectorAll('.btn-selecionar');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var arquetipo = btn.getAttribute('data-arquetipo');
        var versao = btn.getAttribute('data-versao');
        handleSelect(arquetipo, versao);
      });
    });
  }

  /* --- FICHA MODAL (CHARACTER SHEET) --- */
  function initFichaModal() {
    var modal = document.getElementById('ficha-modal');
    var overlay = modal.querySelector('.ficha-overlay');
    var btnFechar = document.getElementById('ficha-fechar');
    var fichaImg = document.getElementById('ficha-img');
    var fichaNome = document.getElementById('ficha-nome');
    var fichaArqLabel = document.getElementById('ficha-arquetipo-label');
    var fichaAparencia = document.getElementById('ficha-aparencia');
    var fichaDesc = document.getElementById('ficha-desc');
    var fichaMedalhao = document.getElementById('ficha-medalhao');
    var fichaItem = document.getElementById('ficha-item');
    var fichaFoco = document.getElementById('ficha-foco');

    var fichaOcupacao = document.getElementById('ficha-ocupacao');
    var fichaAttrDia = document.getElementById('ficha-attr-dia');
    var fichaAttrNoite = document.getElementById('ficha-attr-noite');
    var fichaAttrProfundo = document.getElementById('ficha-attr-profundo');
    var fichaValDia = document.getElementById('ficha-val-dia');
    var fichaValNoite = document.getElementById('ficha-val-noite');
    var fichaValProfundo = document.getElementById('ficha-val-profundo');

    function openFicha(card) {
      // Reset image to prevent showing previous character
      fichaImg.style.opacity = '0';
      fichaImg.src = '';

      var newSrc = card.getAttribute('data-img') || '';
      var tempImg = new Image();
      tempImg.onload = function () {
        fichaImg.src = newSrc;
        fichaImg.style.opacity = '1';
      };
      tempImg.src = newSrc;

      fichaImg.alt = card.getAttribute('data-nome') || '';
      fichaNome.innerHTML = card.getAttribute('data-nome') || '';
      fichaArqLabel.innerHTML = card.getAttribute('data-arq-label') || '';
      fichaAparencia.innerHTML = card.getAttribute('data-aparencia') || '';
      fichaDesc.innerHTML = card.getAttribute('data-historia') || '';
      fichaMedalhao.innerHTML = card.getAttribute('data-medalhao') || '';
      fichaItem.innerHTML = card.getAttribute('data-item') || '';
      fichaOcupacao.innerHTML = card.getAttribute('data-ocupacao') || '';

      // Attributes (1-5 scale, bar width as percentage of max 5)
      var dia = parseInt(card.getAttribute('data-dia') || '0', 10);
      var noite = parseInt(card.getAttribute('data-noite') || '0', 10);
      var profundo = parseInt(card.getAttribute('data-profundo') || '0', 10);

      fichaValDia.textContent = dia;
      fichaValNoite.textContent = noite;
      fichaValProfundo.textContent = profundo;

      // Animate bars after a short delay
      fichaAttrDia.style.width = '0%';
      fichaAttrNoite.style.width = '0%';
      fichaAttrProfundo.style.width = '0%';

      setTimeout(function () {
        fichaAttrDia.style.width = (dia / 5 * 100) + '%';
        fichaAttrNoite.style.width = (noite / 5 * 100) + '%';
        fichaAttrProfundo.style.width = (profundo / 5 * 100) + '%';
      }, 400);

      // TV turn-on animation: line → expand
      modal.classList.add('active', 'step1');
      modal.classList.remove('step2');

      setTimeout(function () {
        modal.classList.remove('step1');
        modal.classList.add('step2');
      }, 200);

      document.body.style.overflow = 'hidden';
    }

    function closeFicha() {
      modal.classList.remove('step2');
      modal.classList.add('step1');

      setTimeout(function () {
        modal.classList.remove('active', 'step1');
        document.body.style.overflow = '';
      }, 300);
    }

    // Click on portrait or info area opens the ficha
    var versaoCards = document.querySelectorAll('.versao-card');
    versaoCards.forEach(function (card) {
      var portrait = card.querySelector('.versao-portrait');
      var info = card.querySelector('.versao-info');

      function handleClick() {
        // Don't open if the card is unavailable
        if (card.classList.contains('indisponivel')) return;
        openFicha(card);
      }

      if (portrait) portrait.addEventListener('click', handleClick);
      if (info) info.addEventListener('click', handleClick);
    });

    // Close handlers
    btnFechar.addEventListener('click', closeFicha);
    overlay.addEventListener('click', closeFicha);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeFicha();
      }
    });
  }

  /* --- INIT --- */
  document.addEventListener('DOMContentLoaded', function () {
    // Check for reduced motion preference
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initPreloader();
    initNavBar();
    initSectionReveal();
    initVHSTimestamp();
    initFichaModal();

    if (!prefersReducedMotion) {
      initStaticNoise();
      initRandomGlitch();
      initVHSTracking();
      initTextCorruption();
    }

    // Supabase + character selection
    var supabaseReady = initSupabase();
    initNameModal();
    initCharacterSelection();

    // If player already has a name, start loading
    if (playerName && supabaseReady) {
      loadSelectionsAndSubscribe();
    }
  });

})();
