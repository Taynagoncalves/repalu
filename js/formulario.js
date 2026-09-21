/**
 * REPALU — Formulário de cadastro multi-step (Pessoa Física / Empresa)
 * -----------------------------------------------------------------------
 * Passo 1: escolha do tipo de cadastro (define quais campos aparecem)
 * Passo 2: dados (PF ou Empresa, conforme escolha)
 * Passo 3: resumo + confirmação
 *
 * Todas as instâncias do formulário na página (modal + página /cadastro,
 * se ambas existirem) são inicializadas aqui e escutam pelo elemento
 * [data-formulario-cadastro].
 */
(function () {
  "use strict";

  // O markup do formulário é injetado dinamicamente por incluir-formulario.js
  // (para não duplicar HTML em cada página). Por isso a inicialização real
  // só acontece quando esse arquivo avisa que o formulário já está no DOM.
  document.addEventListener("repalu:formulario-injetado", inicializarTodosOsFormularios);
  // Fallback: se algum formulário já vier pronto direto no HTML da página
  // (sem passar pelo injetor), inicializa normalmente ao carregar o DOM.
  if (document.querySelectorAll("[data-formulario-cadastro]").length) {
    inicializarTodosOsFormularios();
  }

  function inicializarTodosOsFormularios() {
    const formularios = document.querySelectorAll("[data-formulario-cadastro]:not([data-inicializado])");
    formularios.forEach((form) => {
      form.setAttribute("data-inicializado", "true");
      inicializarFormulario(form);
    });
    window.RepaluFormulario = {
      selecionarTipo(tipo) {
        document.querySelectorAll("[data-formulario-cadastro]").forEach((form) => form.selecionarTipoExterno?.(tipo));
      },
    };
  }

  /* ============================ Máscaras ============================ */
  function mascararTelefone(valor) {
    const digitos = valor.replace(/\D/g, "").slice(0, 11);
    if (digitos.length <= 10) {
      return digitos.replace(/(\d{2})(\d{4})(\d{0,4})/, (m, a, b, c) => (c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : ""));
    }
    return digitos.replace(/(\d{2})(\d{5})(\d{0,4})/, (m, a, b, c) => (c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : ""));
  }

  function mascararCPF(valor) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function mascararCNPJ(valor) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }

  /* ==================== Validação de dígitos verificadores ==================== */
  function validarCPF(cpfFormatado) {
    const cpf = cpfFormatado.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i], 10) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(cpf[9], 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i], 10) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(cpf[10], 10);
  }

  function validarCNPJ(cnpjFormatado) {
    const cnpj = cnpjFormatado.replace(/\D/g, "");
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    const calcularDigito = (base) => {
      const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const soma = base.split("").reduce((acc, digito, indice) => acc + parseInt(digito, 10) * pesos[indice], 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const doze = cnpj.slice(0, 12);
    const digito1 = calcularDigito(doze);
    const digito2 = calcularDigito(doze + digito1);
    return cnpj === doze + String(digito1) + String(digito2);
  }

  function validarEmail(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
  }

  function validarTelefone(valor) {
    return valor.replace(/\D/g, "").length >= 10;
  }

  const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

  /* ============================ Formulário ============================ */
  function inicializarFormulario(form) {
    let etapaAtual = 1;
    const totalEtapas = 3;
    let tipoCadastro = null; // "pf" | "empresa"

    const barraPreenchimento = form.querySelector("[data-barra-preenchimento]");
    const itensEtapa = form.querySelectorAll("[data-etapa-rotulo]");
    const passos = form.querySelectorAll("[data-passo]");
    const telaSucesso = form.querySelector("[data-tela-sucesso]");
    const corpoFormulario = form.querySelector("[data-corpo-formulario]");

    /* ---------- Navegação entre passos ---------- */
    function irParaEtapa(numero) {
      etapaAtual = numero;
      passos.forEach((passo) => {
        passo.setAttribute("data-ativo", String(Number(passo.dataset.passo) === numero));
      });
      itensEtapa.forEach((item, indice) => {
        item.setAttribute("data-ativo", String(indice + 1 === numero));
      });
      if (barraPreenchimento) {
        barraPreenchimento.style.width = `${(numero / totalEtapas) * 100}%`;
      }
      form.querySelector(`[data-passo="${numero}"]`)?.scrollIntoView({ block: "nearest" });
    }

    /* ---------- Passo 1: escolha do tipo ---------- */
    const radiosTipo = form.querySelectorAll('input[name="tipoCadastro"]');
    const camposPF = form.querySelector("[data-campos-pf]");
    const camposEmpresa = form.querySelector("[data-campos-empresa]");

    function selecionarTipo(tipo) {
      tipoCadastro = tipo;
      radiosTipo.forEach((radio) => (radio.checked = radio.value === tipo));
      camposPF?.toggleAttribute("hidden", tipo !== "pf");
      camposEmpresa?.toggleAttribute("hidden", tipo !== "empresa");
      // Desativa "required" dos campos escondidos para não travar o HTML5 validation
      camposPF?.querySelectorAll("input, select").forEach((c) => (c.disabled = tipo !== "pf"));
      camposEmpresa?.querySelectorAll("input, select").forEach((c) => (c.disabled = tipo !== "empresa"));
    }
    radiosTipo.forEach((radio) => radio.addEventListener("change", () => selecionarTipo(radio.value)));

    form.querySelector("[data-avancar-1]")?.addEventListener("click", () => {
      if (!tipoCadastro) {
        form.querySelector("[data-erro-tipo]").textContent = "Escolha uma opção para continuar: Pessoa Física ou Empresa.";
        return;
      }
      form.querySelector("[data-erro-tipo]").textContent = "";
      irParaEtapa(2);
    });

    /* ---------- Passo 2: campos + validação em tempo real ---------- */
    const definicoesCampos = {
      nomeCompleto: { obrigatorio: true, rotulo: "nome completo", validar: (v) => v.trim().length >= 5 || "Digite seu nome completo." },
      email: { obrigatorio: true, rotulo: "e-mail", validar: (v) => validarEmail(v) || "Digite um e-mail válido, como nome@exemplo.com." },
      telefone: { obrigatorio: true, rotulo: "telefone/WhatsApp", mascara: mascararTelefone, validar: (v) => validarTelefone(v) || "Digite um telefone válido com DDD." },
      cpf: { obrigatorio: true, rotulo: "CPF", mascara: mascararCPF, validar: (v) => validarCPF(v) || "Esse CPF não parece válido. Confira os números digitados." },
      cidade: { obrigatorio: true, rotulo: "cidade", validar: (v) => v.trim().length >= 2 || "Digite o nome da sua cidade." },
      uf: { obrigatorio: true, rotulo: "UF", validar: (v) => UFS.includes(v) || "Selecione o estado (UF)." },
      dependentes: { obrigatorio: false, validar: (v) => v === "" || /^\d+$/.test(v) || "Digite apenas números." },

      razaoSocial: { obrigatorio: true, rotulo: "razão social", validar: (v) => v.trim().length >= 3 || "Digite a razão social da empresa." },
      cnpj: { obrigatorio: true, rotulo: "CNPJ", mascara: mascararCNPJ, validar: (v) => validarCNPJ(v) || "Esse CNPJ não parece válido. Confira os números digitados." },
      nomeResponsavel: { obrigatorio: true, rotulo: "nome do responsável", validar: (v) => v.trim().length >= 3 || "Digite o nome do responsável pelo cadastro." },
      emailCorporativo: { obrigatorio: true, rotulo: "e-mail corporativo", validar: (v) => validarEmail(v) || "Digite um e-mail corporativo válido." },
      telefoneEmpresa: { obrigatorio: true, rotulo: "telefone", mascara: mascararTelefone, validar: (v) => validarTelefone(v) || "Digite um telefone válido com DDD." },
      numeroColaboradores: { obrigatorio: true, rotulo: "número de colaboradores", validar: (v) => /^\d+$/.test(v) && Number(v) > 0 || "Digite um número de colaboradores maior que zero." },
      cidadeEmpresa: { obrigatorio: true, rotulo: "cidade", validar: (v) => v.trim().length >= 2 || "Digite a cidade da empresa." },
      ufEmpresa: { obrigatorio: true, rotulo: "UF", validar: (v) => UFS.includes(v) || "Selecione o estado (UF)." },
    };

    Object.keys(definicoesCampos).forEach((nome) => {
      const campo = form.querySelector(`[name="${nome}"]`);
      if (!campo) return;
      const def = definicoesCampos[nome];

      if (def.mascara) {
        campo.addEventListener("input", () => {
          const posicaoCursor = campo.selectionStart;
          const tamanhoAntes = campo.value.length;
          campo.value = def.mascara(campo.value);
          const diferenca = campo.value.length - tamanhoAntes;
          if (posicaoCursor != null) campo.setSelectionRange(posicaoCursor + diferenca, posicaoCursor + diferenca);
        });
      }

      campo.addEventListener("blur", () => validarCampo(nome));
      campo.addEventListener("input", () => {
        // limpa erro enquanto digita para não distrair; revalida completo no blur/avançar
        const elementoErro = form.querySelector(`[data-erro-de="${nome}"]`);
        if (elementoErro && elementoErro.textContent) elementoErro.textContent = "";
        campo.removeAttribute("aria-invalid");
      });
    });

    function validarCampo(nome) {
      const campo = form.querySelector(`[name="${nome}"]`);
      const def = definicoesCampos[nome];
      const elementoErro = form.querySelector(`[data-erro-de="${nome}"]`);
      if (!campo || !def || campo.disabled) return true;

      const valor = campo.value || "";
      if (!def.obrigatorio && valor.trim() === "") {
        campo.removeAttribute("aria-invalid");
        if (elementoErro) elementoErro.textContent = "";
        return true;
      }
      if (def.obrigatorio && valor.trim() === "") {
        campo.setAttribute("aria-invalid", "true");
        if (elementoErro) elementoErro.textContent = `Preencha o campo ${def.rotulo}.`;
        return false;
      }
      const resultado = def.validar(valor);
      if (resultado !== true) {
        campo.setAttribute("aria-invalid", "true");
        if (elementoErro) elementoErro.textContent = resultado;
        return false;
      }
      campo.removeAttribute("aria-invalid");
      if (elementoErro) elementoErro.textContent = "";
      return true;
    }

    function validarPasso2() {
      const nomesRelevantes = tipoCadastro === "pf"
        ? ["nomeCompleto", "email", "telefone", "cpf", "cidade", "uf", "dependentes"]
        : ["razaoSocial", "cnpj", "nomeResponsavel", "emailCorporativo", "telefoneEmpresa", "numeroColaboradores", "cidadeEmpresa", "ufEmpresa"];
      let tudoValido = true;
      nomesRelevantes.forEach((nome) => {
        const ok = validarCampo(nome);
        if (!ok) tudoValido = false;
      });
      return tudoValido;
    }

    form.querySelector("[data-voltar-2]")?.addEventListener("click", () => irParaEtapa(1));
    form.querySelector("[data-avancar-2]")?.addEventListener("click", () => {
      if (!validarPasso2()) {
        // Move o foco para o primeiro campo inválido, ajuda quem usa teclado/leitor de tela
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      preencherResumo();
      irParaEtapa(3);
    });

    /* ---------- Passo 3: resumo + envio ---------- */
    function preencherResumo() {
      const resumo = form.querySelector("[data-resumo]");
      if (!resumo) return;

      const linhas = tipoCadastro === "pf"
        ? [
            ["Tipo de cadastro", "Pessoa Física"],
            ["Nome completo", form.nomeCompleto.value],
            ["E-mail", form.email.value],
            ["Telefone/WhatsApp", form.telefone.value],
            ["CPF", form.cpf.value],
            ["Cidade/UF", `${form.cidade.value} / ${form.uf.value}`],
            ["Dependentes", form.dependentes.value || "0"],
          ]
        : [
            ["Tipo de cadastro", "Empresa"],
            ["Razão social", form.razaoSocial.value],
            ["CNPJ", form.cnpj.value],
            ["Responsável", form.nomeResponsavel.value],
            ["E-mail corporativo", form.emailCorporativo.value],
            ["Telefone", form.telefoneEmpresa.value],
            ["Colaboradores (aprox.)", form.numeroColaboradores.value],
            ["Cidade/UF", `${form.cidadeEmpresa.value} / ${form.ufEmpresa.value}`],
          ];

      resumo.innerHTML = linhas.map(([rotulo, valor]) => `<dt>${rotulo}</dt><dd>${escaparHtml(String(valor))}</dd>`).join("");
    }

    function escaparHtml(texto) {
      const div = document.createElement("div");
      div.textContent = texto;
      return div.innerHTML;
    }

    form.querySelector("[data-voltar-3]")?.addEventListener("click", () => irParaEtapa(2));

    form.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const botaoConfirmar = form.querySelector("[data-confirmar]");
      botaoConfirmar?.setAttribute("disabled", "true");

      const payload = montarPayload();
      try {
        await enviarLead(payload);
        mostrarSucesso();
      } catch (erro) {
        const erroGeral = form.querySelector("[data-erro-envio]");
        if (erroGeral) erroGeral.textContent = "Não conseguimos enviar seu cadastro agora. Tente novamente em instantes.";
        console.error("Falha ao enviar cadastro Repalu:", erro);
      } finally {
        botaoConfirmar?.removeAttribute("disabled");
      }
    });

    function montarPayload() {
      const base = {
        tipoCadastro, // "pf" | "empresa"
        origem: window.location.pathname,
        criadoEm: new Date().toISOString(),
      };
      if (tipoCadastro === "pf") {
        return {
          ...base,
          nomeCompleto: form.nomeCompleto.value.trim(),
          email: form.email.value.trim(),
          telefone: form.telefone.value.trim(),
          cpf: form.cpf.value.trim(),
          cidade: form.cidade.value.trim(),
          uf: form.uf.value,
          dependentes: Number(form.dependentes.value || 0),
        };
      }
      return {
        ...base,
        razaoSocial: form.razaoSocial.value.trim(),
        cnpj: form.cnpj.value.trim(),
        nomeResponsavel: form.nomeResponsavel.value.trim(),
        emailCorporativo: form.emailCorporativo.value.trim(),
        telefoneEmpresa: form.telefoneEmpresa.value.trim(),
        numeroColaboradores: Number(form.numeroColaboradores.value || 0),
        cidadeEmpresa: form.cidadeEmpresa.value.trim(),
        ufEmpresa: form.ufEmpresa.value,
      };
    }

    /**
     * Envia o lead para o backend.
     *
     * >>> PONTO DE INTEGRAÇÃO COM O BACKEND REAL (Node.js + Express + MySQL) <<<
     * O endpoint esperado é POST /api/leads, recebendo o JSON de `payload`.
     * Sugestão de tabela MySQL: leads (id, tipo_cadastro, nome_razao_social,
     * documento (cpf/cnpj), email, telefone, cidade, uf, dependentes ou
     * numero_colaboradores, origem, criado_em).
     * Enquanto o endpoint não existe, fazemos fallback salvando no
     * localStorage (chave "repalu_leads_pendentes") e logando no console,
     * só para não perder o cadastro durante o desenvolvimento do site.
     */
    async function enviarLead(payload) {
      try {
        const resposta = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resposta.ok) throw new Error(`API respondeu com status ${resposta.status}`);
        return await resposta.json().catch(() => ({}));
      } catch (erroDeRede) {
        // Fallback local — troque/remova este bloco assim que /api/leads estiver no ar.
        console.warn("[Repalu] POST /api/leads indisponível, salvando lead localmente.", erroDeRede);
        const pendentes = JSON.parse(localStorage.getItem("repalu_leads_pendentes") || "[]");
        pendentes.push(payload);
        localStorage.setItem("repalu_leads_pendentes", JSON.stringify(pendentes));
        console.log("[Repalu] Lead salvo em localStorage:", payload);
        return { fallback: true };
      }
    }

    function mostrarSucesso() {
      corpoFormulario?.setAttribute("hidden", "true");
      form.querySelector("[data-barra-progresso-wrapper]")?.setAttribute("hidden", "true");
      telaSucesso?.removeAttribute("hidden");
      telaSucesso?.focus();
    }

    form.querySelector("[data-novo-cadastro]")?.addEventListener("click", () => {
      form.reset();
      tipoCadastro = null;
      camposPF?.setAttribute("hidden", "true");
      camposEmpresa?.setAttribute("hidden", "true");
      form.querySelectorAll('[aria-invalid="true"]').forEach((c) => c.removeAttribute("aria-invalid"));
      form.querySelectorAll(".campo__erro").forEach((e) => (e.textContent = ""));
      corpoFormulario?.removeAttribute("hidden");
      form.querySelector("[data-barra-progresso-wrapper]")?.removeAttribute("hidden");
      telaSucesso?.setAttribute("hidden", "true");
      irParaEtapa(1);
    });

    // Expõe API mínima para o modal poder pré-selecionar o tipo ao abrir
    form.selecionarTipoExterno = selecionarTipo;
    irParaEtapa(1);
  }
})();
