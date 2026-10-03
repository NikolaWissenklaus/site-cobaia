(function () {
  'use strict';

  Ui.montarPagina();

  const main = Ui.$('#conteudo');
  let carrinho = null;
  let forma = 'cartao';

  const TEXTO_BOTAO = {
    cartao: total => `Pagar ${Ui.brl(total)}`,
    pix: total => `Gerar Pix de ${Ui.brl(total)}`,
    boleto: total => `Gerar boleto de ${Ui.brl(total)}`
  };

  async function iniciar() {
    try {
      carrinho = await Api.obterCarrinho(forma);
    } catch (erro) {
      Ui.falha(main, erro, iniciar);
      return;
    }
    if (!carrinho.itens.length) return location.replace('carrinho.html');
    if (!carrinho.entrega) return location.replace('entrega.html');
    renderizar();
  }

  function opcaoForma(id, titulo, detalhe, icone, selo = '') {
    return `<label class="forma">
      <input type="radio" name="forma" value="${id}" ${id === forma ? 'checked' : ''}>
      ${Ui.icone(icone, 24)}
      <strong>${titulo}</strong>
      <span>${detalhe}</span>
      ${selo ? `<span class="forma__selo">${selo}</span>` : ''}
    </label>`;
  }

  function renderizar() {
    const { contato, endereco: e, opcao } = carrinho.entrega;

    main.innerHTML = `${Ui.passos(2)}
      <div class="checkout">
        <div class="coluna">
          <section class="painel">
            <div class="painel__topo">
              <h2>Entregar para</h2>
              <a class="link" href="entrega.html">Alterar</a>
            </div>
            <p class="endereco">
              <strong>${Ui.esc(contato.nome)}</strong><br>
              ${Ui.esc(e.rua)}, ${Ui.esc(e.numero)}${e.complemento ? `, ${Ui.esc(e.complemento)}` : ''}<br>
              ${Ui.esc(e.bairro)}, ${Ui.esc(e.cidade)}/${Ui.esc(e.uf)} · CEP ${e.cep.replace(/^(\d{5})/, '$1-')}
            </p>
            <p class="endereco__metodo">${Ui.icone('caminhao', 18)} ${opcao.nome} · ${opcao.prazo} · ${opcao.preco ? Ui.brl(opcao.preco) : 'Grátis'}</p>
          </section>

          <form class="painel" id="form-pagamento" novalidate>
            <h1 class="painel__titulo">Pagamento</h1>
            <div class="formas" role="radiogroup" aria-label="Forma de pagamento">
              ${opcaoForma('cartao', 'Cartão de crédito', 'Até 6x sem juros', 'cartao')}
              ${opcaoForma('pix', 'Pix', 'Aprovação na hora', 'pix', '5% off')}
              ${opcaoForma('boleto', 'Boleto', 'Vence em 3 dias úteis', 'boleto')}
            </div>

            <div data-painel="cartao">
              <div class="campos">
                <div class="campo c6">
                  <label for="f-numero">Número do cartão</label>
                  <div class="campo__com-selo">
                    <input id="f-numero" name="numero" required inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" pattern="[\\d ]{15,23}" data-erro="Número incompleto">
                    <span class="campo__selo" id="bandeira" hidden></span>
                  </div>
                  <small class="campo__erro"></small>
                </div>
                ${Ui.campo({ nome: 'titular', rotulo: 'Nome impresso no cartão', valor: contato.nome.toUpperCase(), attrs: 'required minlength="3" autocomplete="cc-name" style="text-transform:uppercase"', erro: 'Informe o nome do cartão' })}
                ${Ui.campo({ nome: 'validade', rotulo: 'Validade', largura: 3, attrs: 'required inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" pattern="(0[1-9]|1[0-2])/\\d{2}"', erro: 'Use o formato MM/AA' })}
                ${Ui.campo({ nome: 'cvv', rotulo: 'CVV', largura: 3, attrs: 'required inputmode="numeric" autocomplete="cc-csc" placeholder="123" pattern="\\d{3,4}"', erro: '3 ou 4 dígitos no verso' })}
                <div class="campo c6">
                  <label for="f-parcelas">Parcelas</label>
                  <select id="f-parcelas" name="parcelas"></select>
                </div>
              </div>
              <p class="aviso"><strong>Ambiente de teste.</strong> Use o cartão <code>4111 1111 1111 1111</code> com qualquer validade futura. O CVV <code>000</code> simula um pagamento recusado.</p>
            </div>

            <div data-painel="pix" hidden>
              <div class="explica">
                ${Ui.icone('pix', 24)}
                <p>Ao confirmar, geramos um QR Code e um código copia e cola. O pagamento cai na hora e o Pix vale por 30 minutos. Você ganha <strong>5% de desconto</strong> no valor dos produtos.</p>
              </div>
            </div>

            <div data-painel="boleto" hidden>
              <div class="explica">
                ${Ui.icone('boleto', 24)}
                <p>O boleto vence em 3 dias úteis e pode levar até 2 dias para compensar. Separamos as frutas assim que o pagamento for confirmado.</p>
              </div>
            </div>

            <div class="erro-geral" id="erro-geral" hidden></div>
          </form>
        </div>

        <aside class="painel resumo">
          <h2>Resumo do pedido</h2>
          <div class="resumo__conteudo" id="resumo"></div>
          <button class="btn btn--bloco btn--grande" type="submit" form="form-pagamento" id="pagar"></button>
          <p class="resumo__seguro">${Ui.icone('escudo', 16)} Pagamento criptografado</p>
        </aside>
      </div>`;

    const form = Ui.$('#form-pagamento');
    const numero = form.elements.namedItem('numero');
    Ui.mascara(numero, 'cartao');
    Ui.mascara(form.elements.namedItem('validade'), 'validade');
    Ui.mascara(form.elements.namedItem('cvv'), 'cvv');

    numero.addEventListener('input', () => {
      const nome = Api.bandeira(numero.value);
      const selo = Ui.$('#bandeira');
      selo.hidden = !nome;
      selo.textContent = nome || '';
    });

    form.addEventListener('input', ev => {
      Ui.marcarErro(ev.target, '');
      Ui.$('#erro-geral').hidden = true;
    });
    form.addEventListener('change', ev => {
      if (ev.target.name === 'forma') trocarForma(ev.target.value);
    });
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      pagar(form);
    });

    atualizarTotais();
  }

  function atualizarTotais() {
    Ui.$('#resumo').innerHTML = Ui.resumo(carrinho);
    Ui.$('#pagar').textContent = TEXTO_BOTAO[forma](carrinho.total);
    const parcelas = Ui.$('#f-parcelas');
    if (forma === 'cartao' && parcelas) {
      const escolhida = parcelas.value;
      parcelas.innerHTML = carrinho.parcelas.map(p => `<option value="${p.vezes}">${
        p.vezes === 1 ? `À vista, ${Ui.brl(p.valor)}` : `${p.vezes}x de ${Ui.brl(p.valor)} sem juros`
      }</option>`).join('');
      if (escolhida && carrinho.parcelas.some(p => String(p.vezes) === escolhida)) parcelas.value = escolhida;
    }
  }

  async function trocarForma(nova) {
    forma = nova;
    Ui.$$('[data-painel]').forEach(p => { p.hidden = p.dataset.painel !== forma; });
    Ui.$('#erro-geral').hidden = true;

    // O total muda com a forma (desconto no Pix), então pergunta de novo à API.
    const resumo = Ui.$('#resumo');
    const botao = Ui.$('#pagar');
    resumo.classList.add('atualizando');
    botao.disabled = true;
    try {
      const novo = await Api.obterCarrinho(forma);
      if (nova !== forma) return;
      carrinho = novo;
      atualizarTotais();
    } catch (erro) {
      Ui.toast(erro.message, { tipo: 'erro' });
    } finally {
      resumo.classList.remove('atualizando');
      botao.disabled = false;
    }
  }

  async function pagar(form) {
    const erroGeral = Ui.$('#erro-geral');
    erroGeral.hidden = true;
    const painel = Ui.$(`[data-painel="${forma}"]`);
    if (!Ui.validarFormulario(painel)) return;

    const valor = nome => form.elements.namedItem(nome).value;
    const dados = { forma };
    if (forma === 'cartao') {
      dados.cartao = { numero: valor('numero'), nome: valor('titular'), validade: valor('validade'), cvv: valor('cvv') };
      dados.parcelas = valor('parcelas');
    }

    const textos = { cartao: 'Falando com a operadora', pix: 'Gerando Pix', boleto: 'Gerando boleto' };
    try {
      const pedido = await Ui.ocupado(Ui.$('#pagar'), () => Api.finalizarPedido(dados), textos[forma]);
      Ui.$('#pagar').disabled = true;
      location.replace(`confirmacao.html?pedido=${pedido.id}&novo=1`);
    } catch (erro) {
      const campo = erro.campo && form.elements.namedItem(erro.campo);
      if (campo) {
        Ui.marcarErro(campo, erro.message);
        campo.focus();
        return;
      }
      erroGeral.innerHTML = `${Ui.icone('alerta', 20)} <span>${Ui.esc(erro.message)}</span>`;
      erroGeral.hidden = false;
      // Conflito de estoque ou carrinho: volta para o carrinho resolver.
      if (erro.status === 409) {
        erroGeral.insertAdjacentHTML('beforeend', ' <a class="link" href="carrinho.html">Revisar carrinho</a>');
      }
    }
  }

  if (Ui.exigirLogin()) iniciar();
})();
