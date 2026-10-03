(function () {
  'use strict';

  const TEMPO_POR_BANNER = 6000;
  const MAIS_PEDIDAS = ['maca-fuji', 'abacate', 'melancia', 'limao'];

  Ui.montarPagina();

  const banners = Ui.$('#banners');
  const ofertas = Ui.$('#ofertas');
  const destaques = Ui.$('#destaques');

  async function carregar() {
    ofertas.innerHTML = Ui.esqueletoCards(4);
    destaques.innerHTML = Ui.esqueletoCards(4);
    try {
      const produtos = await Api.listarProdutos();
      const porId = Object.fromEntries(produtos.map(p => [p.id, p]));

      montarCarrossel(BANNERS.map(b => ({ ...b, produto: porId[b.produtoId] })).filter(b => b.produto));
      ofertas.innerHTML = produtos.filter(p => p.precoAntigo).map(Ui.card).join('');
      destaques.innerHTML = MAIS_PEDIDAS.map(id => porId[id]).filter(Boolean).map(Ui.card).join('');
    } catch (erro) {
      Ui.falha(Ui.$('main'), erro, () => location.reload());
    }
  }

  function slide(b, i) {
    const p = b.produto;
    const esgotado = p.estoque === 0;
    const extra = CATEGORIAS[p.categoria].emojis.find(e => e !== p.emoji);
    return `<a class="banner banner--${b.tema}" href="produto.html?id=${p.id}" aria-label="${Ui.esc(b.titulo)}"
        role="group" aria-roledescription="slide" aria-hidden="${i !== 0}" ${i !== 0 ? 'tabindex="-1"' : ''}>
      <div class="banner__texto">
        <span class="banner__tag">${Ui.esc(b.chamada)}</span>
        <h2>${Ui.esc(b.titulo)}</h2>
        <p>${Ui.esc(b.texto)}</p>
        ${esgotado
          ? '<span class="banner__esgotado">Esgotou! Volta na próxima colheita</span>'
          : `<div class="banner__preco">
              ${p.precoAntigo ? `<span class="banner__de">de ${Ui.brl(p.precoAntigo)}</span>` : ''}
              <span class="banner__por">${Ui.brl(p.preco)} <small>/ ${Ui.esc(p.unidade)}</small></span>
            </div>`}
        <span class="btn">${esgotado ? 'Ver produto' : 'Aproveitar oferta'} ${Ui.icone('direita', 18)}</span>
      </div>
      <div class="banner__arte" aria-hidden="true">
        ${p.precoAntigo && !esgotado ? `<span class="banner__off">-${Ui.desconto(p)}%<small>OFF</small></span>` : ''}
        <span class="banner__emoji"><span style="display:inline-block;${p.filtro ? `filter:${p.filtro}` : ''}">${p.emoji}</span></span>
        <span class="banner__emoji banner__emoji--2">${extra}</span>
      </div>
    </a>`;
  }

  function montarCarrossel(lista) {
    banners.style.setProperty('--duracao', `${TEMPO_POR_BANNER}ms`);
    banners.innerHTML = `
      <div class="carrossel__trilho">${lista.map(slide).join('')}</div>
      <button class="carrossel__seta carrossel__seta--ant" type="button" aria-label="Banner anterior">${Ui.icone('esquerda', 22)}</button>
      <button class="carrossel__seta carrossel__seta--prox" type="button" aria-label="Próximo banner">${Ui.icone('direita', 22)}</button>
      <div class="carrossel__pontos">${lista.map((_, i) => `<button type="button" aria-label="Ir para o banner ${i + 1}"><span></span></button>`).join('')}</div>`;

    const trilho = Ui.$('.carrossel__trilho', banners);
    const slides = Ui.$$('.banner', banners);
    const pontos = Ui.$$('.carrossel__pontos button', banners);
    let atual = 0;
    const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function ir(indice) {
      atual = (indice + lista.length) % lista.length;
      trilho.style.transform = `translateX(-${atual * 100}%)`;
      slides.forEach((s, i) => {
        s.setAttribute('aria-hidden', i !== atual);
        if (i === atual) s.removeAttribute('tabindex');
        else s.setAttribute('tabindex', '-1');
      });
      // Recria a barrinha de progresso do ponto ativo para a animação recomeçar.
      pontos.forEach((ponto, i) => {
        ponto.classList.remove('ativo');
        if (i === atual) {
          void ponto.offsetWidth;
          ponto.classList.add('ativo');
        }
      });
      agendar();
    }

    // O avanço acompanha o fim da animação da barrinha. Assim, quando o mouse
    // pausa a barrinha (via CSS), o carrossel pausa junto. Com movimento
    // reduzido a animação dura quase zero, então nesse caso não avança sozinho.
    function agendar() {
      if (movimentoReduzido) return;
      const barra = pontos[atual].querySelector('span');
      barra.onanimationend = () => ir(atual + 1);
    }

    Ui.$('.carrossel__seta--ant', banners).addEventListener('click', () => ir(atual - 1));
    Ui.$('.carrossel__seta--prox', banners).addEventListener('click', () => ir(atual + 1));
    pontos.forEach((ponto, i) => ponto.addEventListener('click', () => ir(i)));

    // Arrastar com o dedo no celular.
    let inicioX = null;
    banners.addEventListener('touchstart', ev => { inicioX = ev.touches[0].clientX; }, { passive: true });
    banners.addEventListener('touchend', ev => {
      if (inicioX === null) return;
      const delta = ev.changedTouches[0].clientX - inicioX;
      if (Math.abs(delta) > 50) ir(atual + (delta < 0 ? 1 : -1));
      inicioX = null;
    });

    ir(0);
  }

  carregar();
})();
