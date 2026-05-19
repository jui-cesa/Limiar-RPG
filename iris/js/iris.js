/* ========================================
   INSTITUTO ÍRIS — Lógica
   ======================================== */

(function () {
  'use strict';

  // Senha "ofuscada" (base64). Senha real: RESSONANCIA-74
  // Troque aqui se quiser uma senha diferente.
  // Pra gerar nova: btoa('SUA-SENHA-AQUI') no console.
  var SENHA_OFUSCADA = 'UkVTU09OQU5DSUEtNzQ=';
  var STORAGE_KEY = 'iris_auth';
  var MAX_TENTATIVAS = 3;

  // ========================================
  // FORM DE LOGIN (acesso.html)
  // ========================================
  function initLogin() {
    var form = document.getElementById('iris-login-form');
    if (!form) return;

    var input = document.getElementById('iris-senha');
    var erro = document.getElementById('iris-erro');
    var tentativasEl = document.getElementById('iris-tentativas');
    var tentativas = parseInt(sessionStorage.getItem('iris_tentativas') || '0', 10);

    function atualizarTentativasUI() {
      if (tentativasEl) tentativasEl.textContent = tentativas;
    }
    atualizarTentativasUI();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valor = (input.value || '').trim();
      if (!valor) return;

      if (validarSenha(valor)) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        sessionStorage.removeItem('iris_tentativas');
        // Feedback rápido
        erro.classList.remove('ativo');
        input.style.borderColor = '#33ff33';
        input.style.boxShadow = '0 0 12px rgba(51, 255, 51, 0.5)';
        setTimeout(function () {
          window.location.href = 'projetos.html';
        }, 350);
      } else {
        tentativas++;
        sessionStorage.setItem('iris_tentativas', String(tentativas));
        atualizarTentativasUI();
        input.value = '';
        input.style.borderColor = '#cc0000';
        input.style.boxShadow = '0 0 8px rgba(204, 0, 0, 0.4)';
        erro.classList.add('ativo');
        setTimeout(function () {
          input.style.borderColor = '';
          input.style.boxShadow = '';
        }, 1500);

        if (tentativas >= MAX_TENTATIVAS) {
          input.disabled = true;
          form.querySelector('button').disabled = true;
          var bloqueio = document.getElementById('iris-bloqueio');
          if (bloqueio) bloqueio.style.display = 'block';
        }
      }
    });
  }

  function validarSenha(input) {
    try {
      return btoa(unescape(encodeURIComponent(input))) === SENHA_OFUSCADA;
    } catch (e) {
      return false;
    }
  }

  // ========================================
  // GUARD DA ÁREA RESTRITA (projetos.html)
  // ========================================
  function guardRestrito() {
    var body = document.body;
    if (!body.classList.contains('iris-restrito')) return;
    if (sessionStorage.getItem(STORAGE_KEY) !== '1') {
      window.location.href = 'acesso.html';
      return;
    }
    var sair = document.getElementById('iris-sair');
    if (sair) {
      sair.addEventListener('click', function () {
        sessionStorage.removeItem(STORAGE_KEY);
        window.location.href = 'acesso.html';
      });
    }
  }

  // ========================================
  // INIT
  // ========================================
  document.addEventListener('DOMContentLoaded', function () {
    initLogin();
    guardRestrito();
  });

})();
