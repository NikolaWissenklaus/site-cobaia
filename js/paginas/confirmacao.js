(function () {
  'use strict';

  Ui.montarPagina();

  const main = Ui.$('#conteudo');
  const id = Ui.param('pedido');
  const acabouDeComprar = Ui.param('novo') === '1';
  let pedido = null;
  let relogio = null;

  const dataHora = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const data = iso => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

  async function carregar() {
    try {
      pedido = await Api.obterPedido(id);
    } catch (erro) {
      if (erro.status === 404) {
        main.innerHTML = Ui.vazio({
          emoji: '📦',
          titulo: 'Pedido não encontrado',
          texto: 'Confira o link ou volte para a loja.',
          acoes: '<a class="btn" href="index.html">Ir para a loja</a>'
        });
      } else {
        Ui.falha(main, erro, carregar);
      }
      return;
    }
    renderizar();
    // Remove o "novo=1" para o confete não voltar ao recarregar a página.
    if (acabouDeComprar) {
      history.replaceState(null, '', `confirmacao.html?pedido=${pedido.id}`);
      if (pedido.status === 'pago') confete();
    }
  }

  function renderizar() {
    const pago = pedido.status === 'pago';
    const pg = pedido.pagamento;
    const email = Ui.esc(pedido.entrega.contato.email);

    let titulo = 'Pedido confirmado!';
    let texto = `Já estamos separando suas frutas. Mandamos os detalhes para <strong>${email}</strong>.`;
    if (!pago) {
      titulo = 'Falta só simular o pagamento';
      texto = pg.forma === 'pix'
        ? 'Esta loja é uma simulação e não gera Pix de verdade. Use o botão abaixo para simular o pagamento.'
        : 'Esta loja é uma simulação e não emite boleto de verdade. Use o botão abaixo para simular a compensação.';
    }

    main.innerHTML = `${Ui.passos(3)}
      <section class="sucesso">
        <div class="sucesso__icone ${pago ? '' : 'sucesso__icone--espera'}">${Ui.icone(pago ? 'check' : 'relogio', 44)}</div>
        <h1>${titulo}</h1>
        <p>${texto}</p>
        <p class="sucesso__numero">Pedido <strong>#${pedido.id}</strong> · feito em ${dataHora(pedido.criadoEm)}</p>
      </section>

      <div class="checkout">
        <div class="coluna">
          ${pago ? '' : pg.forma === 'pix' ? blocoPix() : blocoBoleto()}
          <section class="painel">
            <h2>Acompanhe seu pedido</h2>
            ${linhaDoTempo()}
          </section>
          <section class="painel">
            <h2>Entrega</h2>
            ${blocoEntrega()}
          </section>
        </div>

        <aside class="painel resumo">
          <h2>Itens do pedido</h2>
          ${Ui.resumo(pedido)}
          <p class="pagamento-info">${descricaoPagamento()}</p>
          <a class="btn btn--bloco" href="index.html">Continuar comprando</a>
        </aside>
      </div>`;

    ligarBotoes();
    iniciarContagem();
  }

  function descricaoPagamento() {
    const pg = pedido.pagamento;
    if (pg.forma === 'cartao') {
      const parcelas = pg.parcelas > 1 ? `${pg.parcelas}x de ${Ui.brl(pg.valorParcela)}` : 'à vista';
      return `${Ui.icone('cartao', 20)} <span>${pg.bandeira} final ${pg.final}, ${parcelas}</span>`;
    }
    if (pg.forma === 'pix') return `${Ui.icone('pix', 20)} <span>Pix simulado, ${pedido.status === 'pago' ? 'recebido' : 'aguardando'}</span>`;
    return `${Ui.icone('boleto', 20)} <span>Boleto simulado, ${pedido.status === 'pago' ? 'compensado' : 'aguardando'}</span>`;
  }

  function blocoPix() {
    return `<section class="painel">
      <h2>Pix simulado</h2>
      <div class="pagar">
        <div class="pagar__figura">${figuraSimulacao()}</div>
        <div>
          <p class="aviso aviso--simulacao"><strong>Não existe Pix para pagar.</strong> Aqui não tem QR Code nem copia e cola: esta loja é uma demonstração e não recebe dinheiro de ninguém.</p>
          <ol>
            <li>Numa loja de verdade, você pagaria <strong>${Ui.brl(pedido.total)}</strong> pelo app do banco</li>
            <li>Aqui, clique em <strong>Simular pagamento</strong></li>
            <li>O pedido passa para pago, sem nenhuma cobrança</li>
          </ol>
          <div class="pagar__rodape">
            <p class="pagar__prazo">Expira em <strong id="contagem">30:00</strong></p>
            <button class="btn btn--p" type="button" id="simular">Simular pagamento</button>
          </div>
        </div>
      </div>
    </section>`;
  }

  function blocoBoleto() {
    const pg = pedido.pagamento;
    return `<section class="painel">
      <h2>Boleto simulado</h2>
      <div class="pagar">
        <div class="pagar__figura">${figuraSimulacao()}</div>
        <div>
          <p class="aviso aviso--simulacao"><strong>Não existe boleto para pagar.</strong> Aqui não tem código de barras nem linha digitável: esta loja é uma demonstração e não recebe dinheiro de ninguém.</p>
          <ol>
            <li>Numa loja de verdade, você pagaria <strong>${Ui.brl(pedido.total)}</strong> até ${data(pg.vencimento)}</li>
            <li>Aqui, clique em <strong>Simular compensação</strong></li>
            <li>O pedido passa para pago, sem nenhuma cobrança</li>
          </ol>
          <div class="pagar__rodape">
            <p class="pagar__prazo">Venceria em <strong>${data(pg.vencimento)}</strong></p>
            <button class="btn btn--p" type="button" id="simular">Simular compensação</button>
          </div>
        </div>
      </div>
    </section>`;
  }

  function blocoEntrega() {
    const { contato, endereco: e, opcao } = pedido.entrega;
    const retirada = opcao.id === 'retirada';
    return `<p class="endereco">
        <strong>${Ui.esc(contato.nome)}</strong> · ${Ui.esc(contato.telefone)}<br>
        ${retirada ? `Retirada em ${Ui.esc(opcao.descricao)}` : `${Ui.esc(e.rua)}, ${Ui.esc(e.numero)}${e.complemento ? `, ${Ui.esc(e.complemento)}` : ''}<br>
        ${Ui.esc(e.bairro)}, ${Ui.esc(e.cidade)}/${Ui.esc(e.uf)} · CEP ${e.cep.replace(/^(\d{5})/, '$1-')}`}
      </p>
      <p class="endereco__metodo">${Ui.icone(retirada ? 'loja' : 'caminhao', 18)} ${opcao.nome} · ${opcao.prazo}</p>`;
  }

  function linhaDoTempo() {
    const pago = pedido.status === 'pago';
    const retirada = pedido.entrega.opcao.id === 'retirada';
    const etapas = [
      { titulo: 'Pedido recebido', detalhe: dataHora(pedido.criadoEm), estado: 'feito' },
      {
        titulo: pago ? 'Pagamento aprovado' : 'Aguardando pagamento',
        detalhe: pago ? dataHora(pedido.pagoEm) : 'Assim que cair, avisamos por e-mail',
        estado: pago ? 'feito' : 'agora'
      },
      { titulo: 'Separando as frutas', detalhe: 'Escolhemos uma por uma', estado: pago ? 'agora' : '' },
      { titulo: retirada ? 'Pronto para retirar' : 'Saiu para entrega', detalhe: pedido.entrega.opcao.prazo, estado: '' }
    ];
    return `<ol class="linha-tempo">${etapas.map(e => `<li class="${e.estado}">
      <span class="linha-tempo__ponto">${e.estado === 'feito' ? Ui.icone('check', 13) : ''}</span>
      <div><strong>${e.titulo}</strong><small>${e.detalhe}</small></div>
    </li>`).join('')}</ol>`;
  }

  function ligarBotoes() {
    const simular = Ui.$('#simular');
    if (!simular) return;
    simular.addEventListener('click', async () => {
      try {
        pedido = await Ui.ocupado(simular, () => Api.confirmarPagamento(pedido.id), 'Confirmando');
        renderizar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        confete();
        Ui.toast('Pagamento confirmado!');
      } catch (erro) {
        Ui.toast(erro.message, { tipo: 'erro' });
      }
    });
  }

  function iniciarContagem() {
    clearInterval(relogio);
    const alvo = Ui.$('#contagem');
    if (!alvo) return;
    const fim = new Date(pedido.pagamento.expiraEm).getTime();
    const tick = () => {
      const resta = Math.max(0, fim - Date.now());
      const min = Math.floor(resta / 60000);
      const seg = Math.floor((resta % 60000) / 1000);
      alvo.textContent = resta ? `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}` : 'expirado';
      if (!resta) clearInterval(relogio);
    };
    tick();
    relogio = setInterval(tick, 1000);
  }

  // Fica no lugar do QR Code e do código de barras. É um abacate de propósito:
  // nada aqui pode ser escaneado nem pago, a loja só simula a compra.
  function figuraSimulacao() {
    return `<svg viewBox="0 0 120 120" role="img" aria-label="Abacate. Esta loja é uma simulação e não gera cobrança">
      <path d="M60 10c-15 0-24 15-27 31-2 11-11 19-11 36a38 38 0 0 0 76 0c0-17-9-25-11-36-3-16-12-31-27-31z" fill="#3f7d3a"/>
      <path d="M60 20c-10 0-16 12-19 25-2 10-9 17-9 31a28 28 0 0 0 56 0c0-14-7-21-9-31-3-13-9-25-19-25z" fill="#d9e8a3"/>
      <circle cx="60" cy="78" r="16" fill="#8a5a2b"/>
      <circle cx="54" cy="72" r="4" fill="#b98552"/>
    </svg>
    <span>Simulação</span>`;
  }

  function confete() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const frutas = pedido.itens.map(i => i.produto.emoji);
    const camada = document.createElement('div');
    camada.className = 'confete';
    for (let i = 0; i < 36; i++) {
      const s = document.createElement('span');
      s.textContent = frutas[i % frutas.length];
      s.style.left = `${Math.random() * 100}%`;
      s.style.fontSize = `${18 + Math.random() * 22}px`;
      s.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
      s.style.animationDelay = `${Math.random() * 0.8}s`;
      camada.appendChild(s);
    }
    document.body.appendChild(camada);
    setTimeout(() => camada.remove(), 5000);
  }

  carregar();
})();
