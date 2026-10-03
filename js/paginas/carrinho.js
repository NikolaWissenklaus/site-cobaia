(function () {
  'use strict';

  Ui.montarPagina();

  const main = Ui.$('#conteudo');
  let carrinho = null;

  async function carregar() {
    try {
      carrinho = await Api.obterCarrinho();
      renderizar();
    } catch (erro) {
      Ui.falha(main, erro, carregar);
    }
  }

  function item(i) {
    const p = i.produto;
    return `<li class="item ${i.semEstoque ? 'item--alerta' : ''}" data-id="${p.id}">
      <a href="produto.html?id=${p.id}" tabindex="-1">${Ui.foto(p, 'foto--item')}</a>
      <div>
        <a class="item__nome" href="produto.html?id=${p.id}">${Ui.esc(p.nome)}</a>
        <span class="item__unidade">${Ui.brl(p.preco)} / ${Ui.esc(p.unidade)}</span>
        ${i.semEstoque ? `<span class="item__aviso">${p.estoque ? `Só temos ${p.estoque} no estoque. Diminua a quantidade.` : 'Esgotou. Remova para continuar.'}</span>` : ''}
        <div class="item__controles">
          ${Ui.qtd(i.quantidade, Math.max(p.estoque, 1))}
          <button class="item__remover" type="button" data-remover>${Ui.icone('lixeira', 16)} Remover</button>
        </div>
      </div>
      <strong class="item__subtotal">${Ui.brl(i.subtotal)}</strong>
    </li>`;
  }

  function renderizar() {
    if (!carrinho.itens.length) {
      main.innerHTML = Ui.vazio({
        emoji: '🧺',
        titulo: 'Seu carrinho está vazio',
        texto: 'Que tal começar pelas ofertas da semana?',
        acoes: '<a class="btn" href="categoria.html?c=verdes">Frutas verdes</a><a class="btn btn--vermelho" href="categoria.html?c=vermelhas">Frutas vermelhas</a>'
      });
      return;
    }

    const bloqueado = carrinho.itens.some(i => i.semEstoque);
    main.innerHTML = `${Ui.passos(0)}
      <div class="checkout">
        <section class="painel">
          <div class="painel__topo">
            <h1 class="painel__titulo">Seu carrinho</h1>
            <span class="barra__total">${carrinho.quantidade} ${carrinho.quantidade === 1 ? 'item' : 'itens'}</span>
          </div>
          ${Ui.barraFrete(carrinho)}
          <ul class="itens">${carrinho.itens.map(item).join('')}</ul>
          <a class="link-voltar" href="index.html">${Ui.icone('esquerda', 18)} Continuar comprando</a>
        </section>
        <aside class="painel resumo">
          <h2>Resumo</h2>
          ${Ui.resumo(carrinho, { itens: false })}
          <a class="btn btn--bloco btn--grande" href="entrega.html" data-continuar ${bloqueado ? 'aria-disabled="true"' : ''}>Continuar para entrega</a>
          <p class="resumo__seguro">${Ui.icone('escudo', 16)} Seus dados ficam protegidos</p>
        </aside>
      </div>`;
  }

  async function atualizar(li, chamada) {
    li.classList.add('atualizando');
    try {
      carrinho = await chamada();
    } catch (erro) {
      Ui.toast(erro.message, { tipo: 'erro' });
      carrinho = await Api.obterCarrinho();
    }
    renderizar();
  }

  Ui.ligarQtd(main, (qtd, caixa) => {
    const li = caixa.closest('.item');
    atualizar(li, () => Api.alterarQuantidade(li.dataset.id, qtd));
  });

  // Sem login ninguém passa do carrinho.
  main.addEventListener('click', ev => {
    if (ev.target.closest('[data-continuar]') && !Ui.exigirLogin()) ev.preventDefault();
  });

  main.addEventListener('click', ev => {
    const botao = ev.target.closest('[data-remover]');
    if (!botao) return;
    const li = botao.closest('.item');
    const nome = Ui.$('.item__nome', li).textContent;
    atualizar(li, async () => {
      const novo = await Api.removerDoCarrinho(li.dataset.id);
      Ui.toast(`${nome} saiu do carrinho`);
      return novo;
    });
  });

  carregar();
})();
