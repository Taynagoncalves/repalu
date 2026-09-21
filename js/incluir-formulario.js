/**
 * REPALU — Injeta o markup do formulário de cadastro multi-step
 * -----------------------------------------------------------------------
 * O formulário aparece em várias páginas (dentro do modal) e também na
 * página dedicada /paginas/cadastro.html. Para não duplicar o HTML em
 * cada arquivo (e sem poder usar fetch() de arquivos locais, que falha
 * quando o site é aberto direto via file://), geramos o markup aqui a
 * partir de uma única fonte e inserimos em todo elemento [data-formulario-slot].
 *
 * Depois de inserido, script.js e formulario.js seguem funcionando
 * normalmente pois procuram os elementos só após esta injeção (todos os
 * scripts estão no fim do <body>, então o DOM já existe nesse ponto —
 * mas por segurança este arquivo roda por último, após formulario.js
 * precisar existir; por isso ele mesmo dispara a inicialização do
 * formulário ao final, chamando window.RepaluFormulario.inicializar()).
 */
(function () {
  "use strict";

  const UFS = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
  ];

  function opcoesUF() {
    return `<option value="">UF</option>` + UFS.map((uf) => `<option value="${uf}">${uf}</option>`).join("");
  }

  const templateFormulario = `
    <form data-formulario-cadastro novalidate>
      <div data-barra-progresso-wrapper>
        <div class="barra-progresso">
          <div class="barra-progresso__trilha">
            <div class="barra-progresso__preenchimento" data-barra-preenchimento></div>
          </div>
          <ul class="barra-progresso__etapas">
            <li data-etapa-rotulo data-ativo="true">1. Tipo de cadastro</li>
            <li data-etapa-rotulo>2. Seus dados</li>
            <li data-etapa-rotulo>3. Confirmação</li>
          </ul>
        </div>
      </div>

      <div data-corpo-formulario>
        <!-- Passo 1: tipo de cadastro -->
        <section class="passo-formulario" data-passo="1" data-ativo="true">
          <h3 style="margin-bottom: var(--espaco-2);">Esse cadastro é para você ou para sua empresa?</h3>
          <div class="selecao-tipo" role="radiogroup" aria-label="Tipo de cadastro">
            <label>
              <input type="radio" name="tipoCadastro" value="pf">
              <span class="selecao-tipo__conteudo">
                <span class="selecao-tipo__titulo">Pessoa Física</span>
                <span class="selecao-tipo__desc">Quero o cartão para mim e/ou minha família.</span>
              </span>
            </label>
            <label>
              <input type="radio" name="tipoCadastro" value="empresa">
              <span class="selecao-tipo__conteudo">
                <span class="selecao-tipo__titulo">Empresa</span>
                <span class="selecao-tipo__desc">Quero oferecer o benefício para meus colaboradores.</span>
              </span>
            </label>
          </div>
          <p class="campo__erro" data-erro-tipo role="alert" aria-live="assertive"></p>
          <div class="acoes-formulario" style="justify-content:flex-end;">
            <button type="button" class="botao botao--primario" data-avancar-1>Continuar</button>
          </div>
        </section>

        <!-- Passo 2: dados -->
        <section class="passo-formulario" data-passo="2">
          <div data-campos-pf hidden>
            <div class="campo">
              <label for="campo-nomeCompleto">Nome completo</label>
              <input id="campo-nomeCompleto" type="text" name="nomeCompleto" autocomplete="name">
              <p class="campo__erro" data-erro-de="nomeCompleto" aria-live="polite"></p>
            </div>
            <div class="grade-campos grade-campos--2">
              <div class="campo">
                <label for="campo-email">E-mail</label>
                <input id="campo-email" type="email" name="email" autocomplete="email">
                <p class="campo__erro" data-erro-de="email" aria-live="polite"></p>
              </div>
              <div class="campo">
                <label for="campo-telefone">Telefone/WhatsApp</label>
                <input id="campo-telefone" type="tel" name="telefone" inputmode="numeric" placeholder="(00) 00000-0000" autocomplete="tel">
                <p class="campo__erro" data-erro-de="telefone" aria-live="polite"></p>
              </div>
            </div>
            <div class="grade-campos grade-campos--2">
              <div class="campo">
                <label for="campo-cpf">CPF</label>
                <input id="campo-cpf" type="text" name="cpf" inputmode="numeric" placeholder="000.000.000-00">
                <p class="campo__erro" data-erro-de="cpf" aria-live="polite"></p>
              </div>
              <div class="campo">
                <label for="campo-dependentes">Dependentes <span class="opcional">(opcional)</span></label>
                <input id="campo-dependentes" type="text" name="dependentes" inputmode="numeric" placeholder="0">
                <p class="campo__erro" data-erro-de="dependentes" aria-live="polite"></p>
              </div>
            </div>
            <div class="grade-campos grade-campos--2">
              <div class="campo">
                <label for="campo-cidade">Cidade</label>
                <input id="campo-cidade" type="text" name="cidade" autocomplete="address-level2">
                <p class="campo__erro" data-erro-de="cidade" aria-live="polite"></p>
              </div>
              <div class="campo">
                <label for="campo-uf">Estado (UF)</label>
                <select id="campo-uf" name="uf">${opcoesUF()}</select>
                <p class="campo__erro" data-erro-de="uf" aria-live="polite"></p>
              </div>
            </div>
          </div>

          <div data-campos-empresa hidden>
            <div class="campo">
              <label for="campo-razaoSocial">Razão social</label>
              <input id="campo-razaoSocial" type="text" name="razaoSocial">
              <p class="campo__erro" data-erro-de="razaoSocial" aria-live="polite"></p>
            </div>
            <div class="campo">
              <label for="campo-cnpj">CNPJ</label>
              <input id="campo-cnpj" type="text" name="cnpj" inputmode="numeric" placeholder="00.000.000/0000-00">
              <p class="campo__erro" data-erro-de="cnpj" aria-live="polite"></p>
            </div>
            <div class="grade-campos grade-campos--2">
              <div class="campo">
                <label for="campo-nomeResponsavel">Nome do responsável</label>
                <input id="campo-nomeResponsavel" type="text" name="nomeResponsavel" autocomplete="name">
                <p class="campo__erro" data-erro-de="nomeResponsavel" aria-live="polite"></p>
              </div>
              <div class="campo">
                <label for="campo-emailCorporativo">E-mail corporativo</label>
                <input id="campo-emailCorporativo" type="email" name="emailCorporativo" autocomplete="email">
                <p class="campo__erro" data-erro-de="emailCorporativo" aria-live="polite"></p>
              </div>
            </div>
            <div class="grade-campos grade-campos--2">
              <div class="campo">
                <label for="campo-telefoneEmpresa">Telefone</label>
                <input id="campo-telefoneEmpresa" type="tel" name="telefoneEmpresa" inputmode="numeric" placeholder="(00) 00000-0000">
                <p class="campo__erro" data-erro-de="telefoneEmpresa" aria-live="polite"></p>
              </div>
              <div class="campo">
                <label for="campo-numeroColaboradores">Nº aproximado de colaboradores</label>
                <input id="campo-numeroColaboradores" type="text" name="numeroColaboradores" inputmode="numeric" placeholder="Ex.: 25">
                <p class="campo__erro" data-erro-de="numeroColaboradores" aria-live="polite"></p>
              </div>
            </div>
            <div class="grade-campos grade-campos--2">
              <div class="campo">
                <label for="campo-cidadeEmpresa">Cidade</label>
                <input id="campo-cidadeEmpresa" type="text" name="cidadeEmpresa" autocomplete="address-level2">
                <p class="campo__erro" data-erro-de="cidadeEmpresa" aria-live="polite"></p>
              </div>
              <div class="campo">
                <label for="campo-ufEmpresa">Estado (UF)</label>
                <select id="campo-ufEmpresa" name="ufEmpresa">${opcoesUF()}</select>
                <p class="campo__erro" data-erro-de="ufEmpresa" aria-live="polite"></p>
              </div>
            </div>
          </div>

          <div class="acoes-formulario">
            <button type="button" class="botao botao--fantasma" data-voltar-2>Voltar</button>
            <button type="button" class="botao botao--primario" data-avancar-2>Continuar</button>
          </div>
        </section>

        <!-- Passo 3: resumo -->
        <section class="passo-formulario" data-passo="3">
          <h3 style="margin-bottom: var(--espaco-2);">Confira seus dados</h3>
          <div class="resumo-cadastro">
            <dl data-resumo></dl>
          </div>
          <p class="campo__erro" data-erro-envio role="alert" aria-live="assertive"></p>
          <div class="acoes-formulario">
            <button type="button" class="botao botao--fantasma" data-voltar-3>Voltar</button>
            <button type="submit" class="botao botao--primario" data-confirmar>Confirmar cadastro</button>
          </div>
        </section>
      </div>

      <div class="tela-sucesso" data-tela-sucesso hidden tabindex="-1">
        <div class="tela-sucesso__icone">
          <svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h3>Cadastro recebido!</h3>
        <p>Nossa equipe vai entrar em contato em breve para ativar seu cartão Repalu.</p>
        <button type="button" class="botao botao--secundario" data-novo-cadastro style="margin-top: var(--espaco-3);">Fazer novo cadastro</button>
      </div>
    </form>
  `;

  document.querySelectorAll("[data-formulario-slot]").forEach((slot) => {
    slot.innerHTML = templateFormulario;
  });

  // Reexecuta a inicialização do formulario.js agora que o markup existe.
  // (formulario.js roda antes deste arquivo, então disparamos manualmente
  // o mesmo processo de inicialização via evento customizado.)
  document.dispatchEvent(new CustomEvent("repalu:formulario-injetado"));
})();
