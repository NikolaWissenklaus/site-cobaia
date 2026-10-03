(function () {
  'use strict';

  Ui.montarPagina();

  const main = Ui.$('#conteudo');
  const id = Ui.param('a');
  const artigo = ARTIGOS.find(a => a.id === id);

  // Sem `?a=` mostra a lista. Com `?a=` mostra a leitura do artigo.
  if (!id) {
    main.innerHTML = `
      <nav class="trilha" aria-label="Você está em"><a href="index.html">Início</a><span>/</span><span>Artigos</span></nav>
      <div class="artigos-topo">
        <h1 class="busca-titulo">Artigos</h1>
        <p>Leituras rápidas sobre fruta. Nenhuma passa de um minuto.</p>
      </div>
      <div class="categorias">${ARTIGOS.map(tile).join('')}</div>`;
    return;
  }

  if (!artigo) {
    main.innerHTML = Ui.vazio({
      emoji: '📰',
      titulo: 'Artigo não encontrado',
      texto: 'Esse texto não existe ou saiu do ar.',
      acoes: '<a class="btn" href="artigos.html">Ver todos os artigos</a>'
    });
    return;
  }

  document.title = `${artigo.titulo} | Abacate Mucho`;
  const produto = CATALOGO.find(p => p.id === artigo.produtoId);

  main.innerHTML = `
    <nav class="trilha" aria-label="Você está em">
      <a href="index.html">Início</a><span>/</span>
      <a href="artigos.html">Artigos</a><span>/</span>
      <span>${Ui.esc(artigo.titulo)}</span>
    </nav>
    <article class="painel artigo">
      <div class="artigo__capa" aria-hidden="true">${artigo.emojis.slice(0, 2).join(' ')}</div>
      <span class="artigo__chamada">${Ui.esc(artigo.chamada)}</span>
      <h1>${Ui.esc(artigo.titulo)}</h1>
      <p class="artigo__meta">Leitura de ${Ui.esc(artigo.leitura)}</p>
      <div class="artigo__corpo">${artigo.corpo}</div>
      ${produto ? `<div class="artigo__convite">
        <span>${Ui.esc(artigo.convite)}</span>
        <a class="btn btn--p" href="produto.html?id=${produto.id}">Ver ${Ui.esc(produto.nome)}</a>
      </div>` : ''}
      <a class="link-voltar" href="artigos.html">${Ui.icone('esquerda', 18)} Todos os artigos</a>
    </article>`;

  function tile(a) {
    return `<a class="cat-tile cat-tile--${a.tema}" href="artigos.html?a=${a.id}">
      <div>
        <span class="cat-tile__sobre">${Ui.esc(a.chamada)} · ${Ui.esc(a.leitura)}</span>
        <h3>${Ui.esc(a.titulo)}</h3>
        <p>${Ui.esc(a.resumo)}</p>
        <span class="cat-tile__cta">Ler artigo ${Ui.icone('direita', 18)}</span>
      </div>
      <div class="cat-tile__arte" aria-hidden="true">${a.emojis.map(e => `<span>${e}</span>`).join('')}</div>
    </a>`;
  }
})();
