(function () {
  'use strict';

  Ui.montarPagina();

  const main = Ui.$('#conteudo');
  const chave = Ui.param('c');
  const categoria = CATEGORIAS[chave];

  if (!categoria) {
    main.innerHTML = Ui.vazio({
      emoji: '🧺',
      titulo: 'Categoria não encontrada',
      texto: 'Por aqui só temos frutas verdes e vermelhas.',
      acoes: '<a class="btn" href="categoria.html?c=verdes">Frutas verdes</a><a class="btn btn--vermelho" href="categoria.html?c=vermelhas">Frutas vermelhas</a>'
    });
    return;
  }

  document.title = `${categoria.nome} | Abacate Mucho`;
  Ui.marcarMenu(chave);

  main.innerHTML = `
    <section class="cat-hero cat-hero--${chave}">
      <div>
        <nav class="trilha" aria-label="Você está em"><a href="index.html">Início</a><span>/</span><span>${categoria.nome}</span></nav>
        <h1>${categoria.nome}</h1>
        <p>${categoria.descricao}</p>
      </div>
      <div class="cat-hero__emojis" aria-hidden="true">${categoria.emojis.map(e => `<span>${e}</span>`).join('')}</div>
    </section>

    <div class="barra">
      <span class="barra__total" id="total">Carregando...</span>
      <div class="barra__filtros">
        <label class="chip"><input type="checkbox" id="so-promo"> Só ofertas</label>
        <select class="seletor" id="ordem" aria-label="Ordenar por">
          <option value="relevancia">Mais relevantes</option>
          <option value="menor-preco">Menor preço</option>
          <option value="maior-preco">Maior preço</option>
          <option value="maior-desconto">Maior desconto</option>
          <option value="nome">Nome (A a Z)</option>
        </select>
      </div>
    </div>

    <div class="grade" id="produtos"></div>`;

  const grade = Ui.$('#produtos');
  const total = Ui.$('#total');
  const soPromo = Ui.$('#so-promo');
  const ordem = Ui.$('#ordem');

  // Guarda o número da última busca para descartar respostas atrasadas quando
  // o usuário troca o filtro rápido.
  let ultimaBusca = 0;

  async function carregar() {
    const busca = ++ultimaBusca;
    grade.innerHTML = Ui.esqueletoCards(4);
    total.textContent = 'Carregando...';
    try {
      const lista = await Api.listarProdutos({ categoria: chave, ordem: ordem.value, soPromo: soPromo.checked });
      if (busca !== ultimaBusca) return;

      const disponiveis = lista.filter(p => p.estoque > 0).length;
      total.textContent = `${lista.length} ${lista.length === 1 ? 'produto' : 'produtos'}`
        + (disponiveis < lista.length ? ` · ${lista.length - disponiveis} esgotado${lista.length - disponiveis > 1 ? 's' : ''}` : '');

      grade.innerHTML = lista.length
        ? lista.map(Ui.card).join('')
        : Ui.vazio({ emoji: '🍃', titulo: 'Nenhuma oferta agora', texto: 'Desmarque o filtro para ver todas as frutas.' });
    } catch (erro) {
      if (busca === ultimaBusca) Ui.falha(grade, erro, carregar);
    }
  }

  soPromo.addEventListener('change', carregar);
  ordem.addEventListener('change', carregar);
  carregar();
})();
