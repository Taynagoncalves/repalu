/**
 * REPALU — Comportamento geral do site
 * Menu mobile (painel lateral com focus trap), accordion de FAQ,
 * abertura/fechamento do modal de cadastro a partir de qualquer CTA.
 */
(function () {
  "use strict";

  /* ---------------------- Menu mobile (painel lateral) ---------------------- */
  const botaoAbrirMenu = document.querySelector("[data-abrir-menu]");
  const botaoFecharMenu = document.querySelector("[data-fechar-menu]");
  const painelMobile = document.querySelector("[data-painel-mobile]");
  const sobreposicao = document.querySelector("[data-sobreposicao-menu]");

  let ultimoFocoAntesDoMenu = null;

  function elementosFocaveis(container) {
    return Array.from(
      container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
    );
  }

  function abrirMenu() {
    if (!painelMobile) return;
    ultimoFocoAntesDoMenu = document.activeElement;
    painelMobile.setAttribute("data-aberto", "true");
    sobreposicao?.setAttribute("data-aberto", "true");
    botaoAbrirMenu?.setAttribute("aria-expanded", "true");
    document.body.setAttribute("data-menu-aberto", "true");
    const focaveis = elementosFocaveis(painelMobile);
    focaveis[0]?.focus();
  }

  function fecharMenu() {
    if (!painelMobile) return;
    painelMobile.setAttribute("data-aberto", "false");
    sobreposicao?.setAttribute("data-aberto", "false");
    botaoAbrirMenu?.setAttribute("aria-expanded", "false");
    document.body.removeAttribute("data-menu-aberto");
    ultimoFocoAntesDoMenu?.focus();
  }

  botaoAbrirMenu?.addEventListener("click", abrirMenu);
  botaoFecharMenu?.addEventListener("click", fecharMenu);
  sobreposicao?.addEventListener("click", fecharMenu);

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && painelMobile?.getAttribute("data-aberto") === "true") {
      fecharMenu();
    }
    // Focus trap simples dentro do painel mobile
    if (evento.key === "Tab" && painelMobile?.getAttribute("data-aberto") === "true") {
      const focaveis = elementosFocaveis(painelMobile);
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
  });

  // Fecha o menu mobile ao clicar em um link de navegação
  painelMobile?.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", fecharMenu);
  });

  /* ---------------------------- Accordion de FAQ ---------------------------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const pergunta = item.querySelector(".faq-item__pergunta");
    const resposta = item.querySelector(".faq-item__resposta");
    if (!pergunta || !resposta) return;

    pergunta.addEventListener("click", () => {
      const aberto = pergunta.getAttribute("aria-expanded") === "true";
      pergunta.setAttribute("aria-expanded", String(!aberto));
      resposta.style.maxHeight = aberto ? "0px" : resposta.scrollHeight + "px";
    });
  });

  /* --------------------- Modal de cadastro (multi-step) --------------------- */
  const modalFundo = document.querySelector("[data-modal-cadastro]");
  const botoesAbrirCadastro = document.querySelectorAll("[data-abrir-cadastro]");
  const botaoFecharModal = document.querySelector("[data-fechar-modal]");
  let focoAntesDoModal = null;

  function abrirModalCadastro(tipoPreSelecionado) {
    if (!modalFundo) {
      // Página sem modal embutido (ex.: já está em /paginas/cadastro.html) — não faz nada.
      return;
    }
    focoAntesDoModal = document.activeElement;
    modalFundo.setAttribute("data-aberto", "true");
    document.body.setAttribute("data-menu-aberto", "true");

    if (tipoPreSelecionado && window.RepaluFormulario) {
      window.RepaluFormulario.selecionarTipo(tipoPreSelecionado);
    }

    const focaveis = elementosFocaveis(modalFundo);
    focaveis[0]?.focus();
  }

  function fecharModalCadastro() {
    if (!modalFundo) return;
    modalFundo.setAttribute("data-aberto", "false");
    document.body.removeAttribute("data-menu-aberto");
    focoAntesDoModal?.focus();
  }

  botoesAbrirCadastro.forEach((botao) => {
    botao.addEventListener("click", (evento) => {
      evento.preventDefault();
      abrirModalCadastro(botao.getAttribute("data-abrir-cadastro") || null);
    });
  });

  botaoFecharModal?.addEventListener("click", fecharModalCadastro);
  modalFundo?.addEventListener("click", (evento) => {
    if (evento.target === modalFundo) fecharModalCadastro();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && modalFundo?.getAttribute("data-aberto") === "true") {
      fecharModalCadastro();
    }
    if (evento.key === "Tab" && modalFundo?.getAttribute("data-aberto") === "true") {
      const focaveis = elementosFocaveis(modalFundo);
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
  });

  window.RepaluModalCadastro = { abrir: abrirModalCadastro, fechar: fecharModalCadastro };
})();
