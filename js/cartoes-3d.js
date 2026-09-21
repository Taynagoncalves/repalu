/**
 * REPALU — Animação 3D dos cartões do hero
 * -----------------------------------------------------------------------
 * Três fases:
 *   1) Entrada orquestrada (uma vez, ao carregar): cartões deslizam/flutuam
 *      até a posição final, com leve atraso entre eles (stagger).
 *   2) Flutuação contínua: translateY + rotação 3D sutil em loop, via
 *      requestAnimationFrame, usando uma função senoidal (sem dependências).
 *   3) Tilt de hover/touch: cada cartão reage à posição do ponteiro com
 *      perspective + rotateX/rotateY, mais um brilho que cruza a superfície.
 *
 * Tudo em CSS/JS puro — sem GSAP: o efeito é feito só de transforms e
 * requestAnimationFrame, o que já é leve o suficiente sem precisar de uma
 * lib externa (GSAP só valeria a pena se fôssemos orquestrar timelines bem
 * mais complexas, com sequenciamento condicional entre várias seções).
 */
(function () {
  const palco = document.querySelector(".palco-cartoes");
  if (!palco) return;

  const cartoes = Array.from(palco.querySelectorAll(".palco-cartoes__cartao"));
  if (!cartoes.length) return;

  const prefereMenosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Posição final de cada cartão (usada tanto na entrada quanto na flutuação).
  // Lida do CSS via classe; aqui só guardamos um "offset" de fase para a
  // flutuação não ficar sincronizada entre os cartões (fica mais orgânico).
  const estadoCartoes = cartoes.map((cartao, indice) => ({
    el: cartao,
    faseFlutuacao: indice * 1.7, // dessincroniza o ciclo de cada cartão
    tilt: { x: 0, y: 0 }, // rotação alvo vinda do mouse/touch
    tiltAtual: { x: 0, y: 0 }, // rotação suavizada (interpolada)
  }));

  if (prefereMenosMovimento) {
    // Sem entrada animada, sem flutuação contínua, sem tilt: cartões estáticos.
    cartoes.forEach((c) => {
      c.style.opacity = "1";
      c.style.transform = "none";
    });
    return;
  }

  // ---------------------------------------------------------------------
  // 1) Entrada orquestrada
  // ---------------------------------------------------------------------
  function tocarEntrada() {
    estadoCartoes.forEach((estado, indice) => {
      const atraso = indice * 160; // stagger entre cartões
      estado.el.style.transform = "translate3d(0, 60px, -120px) rotateX(-14deg) rotateY(10deg)";
      estado.el.style.transition = "none";
      // força reflow para garantir que o estado inicial seja aplicado antes da transição
      void estado.el.offsetHeight;

      setTimeout(() => {
        estado.el.style.transition = "opacity 0.9s cubic-bezier(.16,.8,.24,1), transform 1.1s cubic-bezier(.16,.8,.24,1)";
        estado.el.style.opacity = "1";
        estado.el.style.transform = "translate3d(0,0,0) rotateX(0deg) rotateY(0deg)";
      }, atraso);
    });

    // Libera a flutuação contínua só depois que a entrada terminou,
    // para as duas animações não brigarem pelo mesmo `transform`.
    const tempoTotalEntrada = estadoCartoes.length * 160 + 1150;
    setTimeout(iniciarLoopFlutuacao, tempoTotalEntrada);
  }

  // ---------------------------------------------------------------------
  // 2) Flutuação contínua (loop suave, ~5s por ciclo) + 3) Tilt de hover
  // Combinamos as duas no mesmo requestAnimationFrame porque ambas escrevem
  // no mesmo `transform` do cartão — precisam ser somadas em um só lugar.
  // ---------------------------------------------------------------------
  let rodando = false;
  const DURACAO_CICLO_MS = 5200;

  function iniciarLoopFlutuacao() {
    if (rodando) return;
    rodando = true;
    estadoCartoes.forEach((estado) => (estado.el.style.transition = "box-shadow 0.3s ease"));
    requestAnimationFrame(quadro);
  }

  function quadro(agora) {
    estadoCartoes.forEach((estado) => {
      const progresso = (agora / DURACAO_CICLO_MS + estado.faseFlutuacao) * Math.PI * 2;
      const flutuarY = Math.sin(progresso) * 10; // até 10px para cima/baixo
      const flutuarRotZ = Math.sin(progresso * 0.8) * 1.6; // leve inclinação
      const flutuarRotX = Math.cos(progresso * 0.6) * 2.2;

      // Suaviza a interpolação do tilt de mouse (lerp) para não ficar brusco
      estado.tiltAtual.x += (estado.tilt.x - estado.tiltAtual.x) * 0.08;
      estado.tiltAtual.y += (estado.tilt.y - estado.tiltAtual.y) * 0.08;

      const rotX = flutuarRotX + estado.tiltAtual.x;
      const rotY = estado.tiltAtual.y;
      const rotZ = flutuarRotZ;

      estado.el.style.transform =
        `translate3d(0, ${flutuarY.toFixed(2)}px, 0) ` +
        `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;

      // Move o brilho junto com o tilt para reforçar a sensação de "material"
      const brilho = estado.el.querySelector(".cartao__brilho");
      if (brilho) {
        const deslocamento = 40 + estado.tiltAtual.y * 3;
        brilho.style.transform = `translateX(${(-120 + deslocamento).toFixed(1)}%)`;
      }
    });
    requestAnimationFrame(quadro);
  }

  // ---------------------------------------------------------------------
  // 3) Tilt via mouse/touch — calcula rotateX/rotateY a partir da posição
  //    do ponteiro relativa ao centro do cartão.
  // ---------------------------------------------------------------------
  const LIMITE_TILT = 9; // graus máximos de inclinação por eixo

  function aplicarTiltPorPonteiro(estado, clienteX, clienteY) {
    const rect = estado.el.getBoundingClientRect();
    const relX = (clienteX - rect.left) / rect.width; // 0..1
    const relY = (clienteY - rect.top) / rect.height; // 0..1
    estado.tilt.y = (relX - 0.5) * LIMITE_TILT * 2; // eixo Y segue X do mouse
    estado.tilt.x = -(relY - 0.5) * LIMITE_TILT * 2; // eixo X segue Y do mouse (invertido)
  }

  function resetarTilt(estado) {
    estado.tilt.x = 0;
    estado.tilt.y = 0;
  }

  estadoCartoes.forEach((estado) => {
    estado.el.addEventListener("mousemove", (evento) => {
      aplicarTiltPorPonteiro(estado, evento.clientX, evento.clientY);
    });
    estado.el.addEventListener("mouseleave", () => resetarTilt(estado));

    estado.el.addEventListener(
      "touchmove",
      (evento) => {
        const toque = evento.touches[0];
        if (!toque) return;
        aplicarTiltPorPonteiro(estado, toque.clientX, toque.clientY);
      },
      { passive: true }
    );
    estado.el.addEventListener("touchend", () => resetarTilt(estado));
  });

  // Dispara a entrada quando o palco entra na viewport (evita animar fora de tela)
  if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            tocarEntrada();
            observador.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observador.observe(palco);
  } else {
    tocarEntrada();
  }
})();
