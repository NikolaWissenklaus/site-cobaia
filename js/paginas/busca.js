(function () {
  'use strict';

  Ui.montarPagina();

  const main = Ui.$('#conteudo');
  const termo = (Ui.param('q') || '').trim();
  const tudo = termo.toLowerCase() === 'tudo';

  // Deixa o termo no campo do cabeçalho para ficar fácil de ajustar.
  Ui.$('.busca input').value = termo;

  if (!termo) {
    main.innerHTML = Ui.vazio({
      emoji: '🔍',
      titulo: 'O que você procura?',
      texto: 'Digite o nome de uma fruta no campo de busca. Para ver o catálogo inteiro, busque por "tudo".',
      acoes: '<a class="btn" href="busca.html?q=tudo">Ver todos os produtos</a>'
    });
    return;
  }

  document.title = `${tudo ? 'Todos os produtos' : `Busca: ${termo}`} | Abacate Mucho`;

  main.innerHTML = `
    <nav class="trilha" aria-label="Você está em"><a href="index.html">Início</a><span>/</span><span>Busca</span></nav>
    <h1 class="busca-titulo">${tudo ? 'Todos os produtos' : `Resultados para <q>${Ui.esc(termo)}</q>`}</h1>

    <div class="barra">
      <span class="barra__total" id="total">Carregando...</span>
      <div class="barra__filtros">
        <select class="seletor" id="categoria" aria-label="Filtrar por categoria">
          <option value="">Todas as categorias</option>
          ${Object.entries(CATEGORIAS).map(([chave, c]) => `<option value="${chave}">${c.nome}</option>`).join('')}
        </select>
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
  const categoria = Ui.$('#categoria');
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
      const lista = await Api.listarProdutos({
        busca: termo,
        categoria: categoria.value || null,
        ordem: ordem.value,
        soPromo: soPromo.checked
      });
      if (busca !== ultimaBusca) return;

      total.textContent = `${lista.length} ${lista.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
      if (lista.length) {
        grade.innerHTML = lista.map(Ui.card).join('');
        return;
      }

      const filtrando = categoria.value || soPromo.checked;
      grade.innerHTML = Ui.vazio(filtrando
        ? { emoji: '🍃', titulo: 'Nada com esses filtros', texto: 'Tire algum filtro para ver mais resultados.' }
        : {
          emoji: '🔍',
          titulo: 'Nenhuma fruta encontrada',
          texto: `Não achamos nada com "${Ui.esc(termo)}". Confira a grafia ou busque por "tudo" para ver o catálogo.`,
          acoes: '<a class="btn" href="busca.html?q=tudo">Ver todos os produtos</a>'
        });
    } catch (erro) {
      if (busca === ultimaBusca) Ui.falha(grade, erro, carregar);
    }
  }

  categoria.addEventListener('change', carregar);
  soPromo.addEventListener('change', carregar);
  ordem.addEventListener('change', carregar);
  carregar();
})();
