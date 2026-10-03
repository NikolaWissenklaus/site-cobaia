(function () {
  'use strict';

  Ui.montarPagina();

  const main = Ui.$('#conteudo');
  const chave = Ui.param('l');
  const lojista = LOJISTAS[chave];

  if (!lojista) {
    main.innerHTML = Ui.vazio({
      emoji: '🏪',
      titulo: 'Lojista não encontrado',
      texto: 'Esse lojista não vende por aqui.',
      acoes: '<a class="btn" href="index.html">Voltar para a loja</a>'
    });
    return;
  }

  document.title = `${lojista.nome} | Abacate Mucho`;

  main.innerHTML = `
    <section class="cat-hero cat-hero--${lojista.tema}">
      <div>
        <nav class="trilha" aria-label="Você está em"><a href="index.html">Início</a><span>/</span><span>Lojistas</span><span>/</span><span>${Ui.esc(lojista.nome)}</span></nav>
        <h1>${Ui.esc(lojista.nome)}</h1>
        <p>${Ui.esc(lojista.descricao)}</p>
        <span class="cat-hero__selo">${Ui.esc(lojista.selo)}</span>
      </div>
      <div class="cat-hero__emojis" aria-hidden="true">${lojista.emojis.map(e => `<span>${e}</span>`).join('')}</div>
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
      const lista = await Api.listarProdutos({ lojista: chave, ordem: ordem.value, soPromo: soPromo.checked });
      if (busca !== ultimaBusca) return;

      total.textContent = `${lista.length} ${lista.length === 1 ? 'produto' : 'produtos'} deste lojista`;
      grade.innerHTML = lista.length
        ? lista.map(Ui.card).join('')
        : Ui.vazio({ emoji: '🍃', titulo: 'Nenhuma oferta agora', texto: 'Desmarque o filtro para ver todas as frutas do lojista.' });
    } catch (erro) {
      if (busca === ultimaBusca) Ui.falha(grade, erro, carregar);
    }
  }

  soPromo.addEventListener('change', carregar);
  ordem.addEventListener('change', carregar);
  carregar();
})();
