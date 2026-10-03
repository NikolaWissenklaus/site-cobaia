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
      titulo = 'Falta só pagar';
      texto = pg.forma === 'pix'
        ? 'Seu pedido está reservado. Pague o Pix abaixo para a gente começar a separar.'
        : 'Seu pedido está reservado. Assim que o boleto compensar, começamos a separar.';
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
    if (pg.forma === 'pix') return `${Ui.icone('pix', 20)} <span>Pix ${pedido.status === 'pago' ? 'recebido' : 'aguardando pagamento'}</span>`;
    return `${Ui.icone('boleto', 20)} <span>Boleto ${pedido.status === 'pago' ? 'compensado' : `com vencimento em ${data(pg.vencimento)}`}</span>`;
  }

  function blocoPix() {
    const pg = pedido.pagamento;
    return `<section class="painel">
      <h2>Pague com Pix</h2>
      <div class="pagar">
        <div class="pagar__qr">${qrCode(pg.codigo)}</div>
        <div>
          <ol>
            <li>Abra o app do seu banco e entre na área Pix</li>
            <li>Escaneie o QR Code ou use o copia e cola</li>
            <li>Confira o valor de <strong>${Ui.brl(pedido.total)}</strong> e confirme</li>
          </ol>
          <div class="copia">
            <code class="codigo" title="${pg.codigo}">${pg.codigo}</code>
            <button class="btn btn--claro btn--p" type="button" data-copiar="${pg.codigo}">${Ui.icone('copiar', 16)} Copiar</button>
          </div>
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
      <h2>Boleto bancário</h2>
      ${codigoDeBarras(pg.linhaDigitavel)}
      <div class="copia">
        <code class="codigo" title="${pg.linhaDigitavel}">${pg.linhaDigitavel}</code>
        <button class="btn btn--claro btn--p" type="button" data-copiar="${pg.linhaDigitavel.replace(/\D/g, '')}">${Ui.icone('copiar', 16)} Copiar</button>
      </div>
      <div class="pagar__rodape">
        <p class="pagar__prazo">Vence em <strong>${data(pg.vencimento)}</strong></p>
        <button class="btn btn--p" type="button" id="simular">Simular compensação</button>
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
    Ui.$$('[data-copiar]').forEach(b => b.addEventListener('click', () => Ui.copiar(b.dataset.copiar)));
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

  // QR Code de enfeite: tem os três quadrados de posição de um QR de verdade,
  // mas o miolo é gerado a partir do texto e não é lido por câmera.
  function qrCode(texto) {
    const n = 29;
    let semente = 0;
    for (let i = 0; i < texto.length; i++) semente = (semente * 31 + texto.charCodeAt(i)) >>> 0;
    const aleatorio = () => {
      semente = (semente * 1103515245 + 12345) >>> 0;
      return (semente >>> 16) / 65536;
    };
    const localizador = (l, c) => {
      if (l === 7 || c === 7) return false;
      if (l === 0 || l === 6 || c === 0 || c === 6) return true;
      return l >= 2 && l <= 4 && c >= 2 && c <= 4;
    };
    let caminho = '';
    for (let l = 0; l < n; l++) {
      for (let c = 0; c < n; c++) {
        let escuro;
        if (l < 8 && c < 8) escuro = localizador(l, c);
        else if (l < 8 && c >= n - 8) escuro = localizador(l, n - 1 - c);
        else if (l >= n - 8 && c < 8) escuro = localizador(n - 1 - l, c);
        else escuro = aleatorio() > 0.52;
        if (escuro) caminho += `M${c} ${l}h1v1h-1z`;
      }
    }
    return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges" role="img" aria-label="QR Code do Pix"><path d="${caminho}" fill="#1d2a1e"/></svg>`;
  }

  function codigoDeBarras(linha) {
    const digitos = linha.replace(/\D/g, '');
    let x = 0;
    let barras = '';
    for (const d of digitos) {
      const largura = 1 + (Number(d) % 3);
      barras += `<rect x="${x}" y="0" width="${largura}" height="60"/>`;
      x += largura + 1 + (Number(d) % 2);
    }
    return `<svg class="barras" viewBox="0 0 ${x} 60" preserveAspectRatio="none" aria-hidden="true"><g fill="#1d2a1e">${barras}</g></svg>`;
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
