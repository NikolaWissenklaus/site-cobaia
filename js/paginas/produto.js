(function () {
  'use strict';

  Ui.montarPagina();

  const main = Ui.$('#conteudo');
  const id = Ui.param('id');
  let produto = null;

  async function carregar() {
    try {
      produto = await Api.obterProduto(id);
    } catch (erro) {
      if (erro.status === 404) {
        main.innerHTML = Ui.vazio({
          emoji: '🔍',
          titulo: 'Produto não encontrado',
          texto: 'Essa fruta pode ter saído do catálogo.',
          acoes: '<a class="btn" href="index.html">Voltar para a loja</a>'
        });
      } else {
        Ui.falha(main, erro, carregar);
      }
      return;
    }

    document.title = `${produto.nome} | Abacate Mucho`;
    Ui.marcarMenu(produto.categoria);
    const categoria = CATEGORIAS[produto.categoria];

    main.innerHTML = `
      <nav class="trilha" aria-label="Você está em">
        <a href="index.html">Início</a><span>/</span>
        <a href="categoria.html?c=${produto.categoria}">${categoria.nome}</a><span>/</span>
        <span>${Ui.esc(produto.nome)}</span>
      </nav>
      <section class="pdp" id="pdp"></section>
      <section class="secao">
        <div class="secao__topo">
          <div><h2>Combina com</h2><p>Mais ${categoria.nome.toLowerCase()} para completar a cesta.</p></div>
          <a class="link" href="categoria.html?c=${produto.categoria}">Ver todas</a>
        </div>
        <div class="grade" id="relacionados">${Ui.esqueletoCards(4)}</div>
      </section>`;

    renderizar();
    carregarRelacionados();
  }

  function estoque(p) {
    if (p.estoque === 0) return '<span class="estoque estoque--fim">Esgotado. Volta na próxima colheita</span>';
    if (p.estoque <= 5) return `<span class="estoque estoque--pouco">Últimas ${p.estoque} unidades</span>`;
    return '<span class="estoque estoque--ok">Em estoque</span>';
  }

  function acoes(p) {
    const livre = p.estoque - p.noCarrinho;
    if (p.estoque === 0) {
      return '<button class="btn btn--bloco" type="button" disabled>Produto esgotado</button>';
    }
    if (livre <= 0) {
      return '<a class="btn btn--bloco" href="carrinho.html">Todo o estoque já está no seu carrinho. Ir para o carrinho</a>';
    }
    return `${Ui.qtd(1, livre)}
      <button class="btn" type="button" id="adicionar">${Ui.icone('sacola', 18)} Adicionar</button>
      <button class="btn btn--vermelho" type="button" id="comprar">Comprar agora</button>`;
  }

  function renderizar() {
    const p = produto;
    const lojista = LOJISTAS[p.lojista];
    Ui.$('#pdp').innerHTML = `
      <div class="pdp__galeria">
        ${Ui.selos(p)}
        ${Ui.foto(p)}
      </div>
      <div class="pdp__info">
        <span class="pdp__cat pdp__cat--${p.categoria}">${CATEGORIAS[p.categoria].nome}</span>
        <h1>${Ui.esc(p.nome)}</h1>
        <p class="pdp__origem">Origem: ${Ui.esc(p.origem)}</p>
        ${lojista ? `<p class="pdp__lojista">Vendido e entregue por <a href="lojista.html?l=${p.lojista}">${Ui.esc(lojista.nome)}</a></p>` : ''}

        ${Ui.preco(p, 'preco--grande')}
        ${p.precoAntigo ? `<p class="pdp__economia">Economize ${Ui.brl(p.precoAntigo - p.preco)} (${Ui.desconto(p)}% off)</p>` : ''}
        <p class="pdp__pix">ou <strong>${Ui.brl(p.preco * (1 - Api.config.descontoPix))}</strong> no Pix</p>
        ${estoque(p)}

        <div class="pdp__acoes">${acoes(p)}</div>
        <p class="pdp__nota">${p.noCarrinho ? `Você já tem ${p.noCarrinho} no carrinho. <a href="carrinho.html">Ver carrinho</a>` : ''}</p>

        <p class="pdp__descricao">${Ui.esc(p.descricao)}</p>
        <dl class="ficha">
          <div><dt>Unidade</dt><dd>${Ui.esc(p.unidade)}</dd></div>
          <div><dt>Origem</dt><dd>${Ui.esc(p.origem)}</dd></div>
          <div><dt>Como conservar</dt><dd>${Ui.esc(p.conservacao)}</dd></div>
          ${p.selo ? `<div><dt>Destaque</dt><dd>${Ui.esc(p.selo)}</dd></div>` : ''}
        </dl>
      </div>`;

    const adicionar = Ui.$('#adicionar');
    const comprar = Ui.$('#comprar');
    if (adicionar) adicionar.addEventListener('click', () => colocarNoCarrinho(adicionar, false));
    if (comprar) comprar.addEventListener('click', () => colocarNoCarrinho(comprar, true));
  }

  async function colocarNoCarrinho(botao, irParaCarrinho) {
    const qtd = Number(Ui.$('#pdp .qtd input').value);
    try {
      await Ui.ocupado(botao, () => Api.adicionarAoCarrinho(produto.id, qtd));
      if (irParaCarrinho) {
        location.href = 'carrinho.html';
        return;
      }
      Ui.toast(`${qtd} × ${produto.nome} no carrinho`, { link: { href: 'carrinho.html', texto: 'Ver carrinho' } });
      // Busca de novo para refletir quanto ainda dá para adicionar.
      produto = await Api.obterProduto(id);
      renderizar();
    } catch (erro) {
      Ui.toast(erro.message, { tipo: 'erro' });
    }
  }

  async function carregarRelacionados() {
    const grade = Ui.$('#relacionados');
    try {
      const lista = await Api.listarProdutos({ categoria: produto.categoria });
      grade.innerHTML = lista.filter(p => p.id !== produto.id).slice(0, 4).map(Ui.card).join('');
    } catch (erro) {
      grade.closest('.secao').remove();
    }
  }

  Ui.ligarQtd(main);
  carregar();
})();
