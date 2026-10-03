/*
 * Peças de interface usadas por todas as páginas: cabeçalho (com busca e
 * login), rodapé, card de produto, seletor de quantidade, avisos e máscaras
 * de formulário.
 */
(function () {
  'use strict';

  const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

  function esc(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const TRACOS = {
    sacola: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    lixeira: '<path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alerta: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    caminhao: '<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    folha: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    cartao: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    pix: '<path d="m12 2.5 9.5 9.5-9.5 9.5L2.5 12z"/><path d="m8.5 12 3.5-3.5 3.5 3.5-3.5 3.5z"/>',
    boleto: '<path d="M3 5v14M6 5v14M10 5v14M12 5v14M15 5v14M19 5v14M21 5v14"/>',
    copiar: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    esquerda: '<path d="m15 18-6-6 6-6"/>',
    direita: '<path d="m9 18 6-6-6-6"/>',
    loja: '<path d="M3 9 4.5 4h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
    pacote: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    lupa: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    cadeado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
  };

  function icone(nome, tam = 20) {
    return `<svg class="icone" viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRACOS[nome] || ''}</svg>`;
  }

  const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

  const Ui = {
    $,
    $$,
    esc,
    icone,
    UFS,

    brl: v => moeda.format(v),
    param: nome => new URLSearchParams(location.search).get(nome),
    desconto: p => (p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) : 0),

    // ------------------------------------------------------------------ produto

    foto(p, classe = '') {
      const filtro = p.filtro ? ` style="filter:${p.filtro}"` : '';
      return `<div class="foto foto--${p.categoria} ${classe}" role="img" aria-label="${esc(p.nome)}">`
        + `<span class="foto__emoji"><span${filtro}>${p.emoji}</span></span></div>`;
    },

    preco(p, classe = '') {
      return `<div class="preco ${p.precoAntigo ? 'preco--promo' : ''} ${classe}">
        ${p.precoAntigo ? `<span class="preco__antigo">${Ui.brl(p.precoAntigo)}</span>` : ''}
        <span class="preco__atual">${Ui.brl(p.preco)}<small> / ${esc(p.unidade)}</small></span>
      </div>`;
    },

    selos(p) {
      const selos = [];
      if (p.estoque === 0) selos.push('<span class="selo selo--cinza">Esgotado</span>');
      else if (p.precoAntigo) selos.push(`<span class="selo">-${Ui.desconto(p)}%</span>`);
      if (p.selo) selos.push(`<span class="selo selo--verde">${esc(p.selo)}</span>`);
      return selos.length ? `<div class="selos">${selos.join('')}</div>` : '';
    },

    card(p) {
      const esgotado = p.estoque === 0;
      const alerta = !esgotado && p.estoque <= 5
        ? `<span class="card__alerta">Só restam ${p.estoque}</span>`
        : `<span class="card__origem">${esc(p.origem)}</span>`;
      return `<article class="card ${esgotado ? 'card--esgotado' : ''}">
        ${Ui.selos(p)}
        ${Ui.foto(p)}
        <div class="card__corpo">
          <h3 class="card__nome"><a class="card__link" href="produto.html?id=${p.id}">${esc(p.nome)}</a></h3>
          ${alerta}
          <div class="card__rodape">
            ${Ui.preco(p)}
            <button class="btn btn--icone" type="button" data-adicionar="${p.id}" ${esgotado ? 'disabled' : ''}
              aria-label="Adicionar ${esc(p.nome)} ao carrinho" title="${esgotado ? 'Esgotado' : 'Adicionar ao carrinho'}">${icone('mais')}</button>
          </div>
        </div>
      </article>`;
    },

    esqueletoCards(n) {
      return Array.from({ length: n }, () => `<div class="card card--esqueleto" aria-hidden="true">
        <div class="foto esqueleto"></div>
        <div class="card__corpo"><div class="esqueleto linha"></div><div class="esqueleto linha linha--curta"></div></div>
      </div>`).join('');
    },

    // ------------------------------------------------------------ quantidade

    qtd(valor, max, min = 1) {
      return `<div class="qtd" data-min="${min}" data-max="${max}" data-atual="${valor}">
        <button type="button" data-passo="-1" aria-label="Diminuir" ${valor <= min ? 'disabled' : ''}>−</button>
        <input type="number" inputmode="numeric" value="${valor}" min="${min}" max="${max}" aria-label="Quantidade">
        <button type="button" data-passo="1" aria-label="Aumentar" ${valor >= max ? 'disabled' : ''}>+</button>
      </div>`;
    },

    // Liga todos os seletores de quantidade dentro de `raiz` (inclusive os que
    // forem renderizados depois). `aoMudar` só roda quando o valor muda de fato.
    ligarQtd(raiz, aoMudar) {
      function definir(caixa, valor) {
        const min = Number(caixa.dataset.min);
        const max = Number(caixa.dataset.max);
        const input = $('input', caixa);
        const novo = Math.min(max, Math.max(min, Math.floor(valor) || min));
        input.value = novo;
        $('[data-passo="-1"]', caixa).disabled = novo <= min;
        $('[data-passo="1"]', caixa).disabled = novo >= max;
        if (novo === Number(caixa.dataset.atual)) return;
        caixa.dataset.atual = novo;
        if (aoMudar) aoMudar(novo, caixa);
      }
      raiz.addEventListener('click', ev => {
        const botao = ev.target.closest('.qtd [data-passo]');
        if (!botao) return;
        const caixa = botao.closest('.qtd');
        definir(caixa, Number($('input', caixa).value) + Number(botao.dataset.passo));
      });
      raiz.addEventListener('change', ev => {
        if (ev.target.matches('.qtd input')) definir(ev.target.closest('.qtd'), Number(ev.target.value));
      });
    },

    // ---------------------------------------------------------------- avisos

    toast(mensagem, { tipo = 'ok', link } = {}) {
      let pilha = $('.toasts');
      if (!pilha) {
        pilha = document.createElement('div');
        pilha.className = 'toasts';
        pilha.setAttribute('aria-live', 'polite');
        document.body.appendChild(pilha);
      }
      const el = document.createElement('div');
      el.className = `toast toast--${tipo}`;
      el.innerHTML = `${icone(tipo === 'erro' ? 'alerta' : 'check', 18)}<span>${esc(mensagem)}</span>`
        + (link ? `<a href="${link.href}">${esc(link.texto)}</a>` : '');
      pilha.appendChild(el);
      setTimeout(() => {
        el.classList.add('toast--saindo');
        el.addEventListener('animationend', () => el.remove());
      }, 3800);
    },

    // Troca o conteúdo do botão por um spinner enquanto a chamada roda.
    async ocupado(botao, tarefa, texto = '') {
      const original = botao.innerHTML;
      botao.disabled = true;
      botao.classList.add('btn--carregando');
      botao.innerHTML = `<span class="spinner"></span>${texto ? `<span>${esc(texto)}</span>` : ''}`;
      try {
        return await tarefa();
      } finally {
        if (botao.isConnected) {
          botao.disabled = false;
          botao.classList.remove('btn--carregando');
          botao.innerHTML = original;
        }
      }
    },

    // Janela de aviso com um botão só. A Promise resolve quando ela fecha,
    // seja pelo botão ou pelo Esc.
    popup({ titulo, texto, botao = 'Ok' }) {
      return new Promise(resolve => {
        const caixa = document.createElement('dialog');
        caixa.className = 'popup';
        caixa.innerHTML = `<div class="popup__icone">${icone('cadeado', 26)}</div>
          <h2>${esc(titulo)}</h2>
          <p>${esc(texto)}</p>
          <form method="dialog"><button class="btn btn--bloco" autofocus>${esc(botao)}</button></form>`;
        caixa.addEventListener('close', () => {
          caixa.remove();
          resolve();
        });
        document.body.appendChild(caixa);
        caixa.showModal();
      });
    },

    // As etapas depois do carrinho só abrem para quem fez login. Sem login,
    // avisa e manda de volta para a home, que é onde fica o campo de login.
    exigirLogin() {
      if (Auth.logado()) return true;
      Ui.popup({
        titulo: 'Você precisa estar logado',
        texto: 'Para continuar a compra, faça login na página inicial. Seu carrinho fica guardado.'
      }).then(() => { location.href = 'index.html'; });
      return false;
    },

    vazio({ emoji, titulo, texto, acoes = '' }) {
      return `<section class="vazio">
        <div class="vazio__emoji">${emoji}</div>
        <h1>${titulo}</h1>
        <p>${texto}</p>
        <div class="vazio__acoes">${acoes}</div>
      </section>`;
    },

    falha(el, erro, tentarDeNovo) {
      el.innerHTML = Ui.vazio({
        emoji: '🥀',
        titulo: 'Algo deu errado',
        texto: esc(erro.message || 'Não foi possível carregar.'),
        acoes: '<button class="btn" type="button">Tentar de novo</button>'
      });
      $('button', el).addEventListener('click', tentarDeNovo);
    },

    // -------------------------------------------------------------- checkout

    passos(atual) {
      const etapas = [['Carrinho', 'carrinho.html'], ['Entrega', 'entrega.html'], ['Pagamento', 'pagamento.html'], ['Confirmação', null]];
      const itens = etapas.map(([nome, href], i) => {
        const estado = i < atual ? 'passo--feito' : i === atual ? 'passo--atual' : '';
        const conteudo = `<span class="passo__num">${i < atual ? icone('check', 14) : i + 1}</span><span class="passo__nome">${nome}</span>`;
        const navegavel = i < atual && href && atual < 3;
        return `<li class="passo ${estado}">${navegavel ? `<a href="${href}">${conteudo}</a>` : conteudo}</li>`;
      });
      return `<ol class="passos">${itens.join('')}</ol>`;
    },

    resumo(c, { itens = true, freteVazio = 'Calculado na entrega' } = {}) {
      const lista = itens
        ? `<ul class="resumo__itens">${c.itens.map(i => `<li>
            ${Ui.foto(i.produto, 'foto--mini')}
            <span class="resumo__nome">${esc(i.produto.nome)}<small>${i.quantidade} × ${Ui.brl(i.produto.preco)}</small></span>
            <strong>${Ui.brl(i.subtotal)}</strong>
          </li>`).join('')}</ul>`
        : '';
      let frete = freteVazio;
      if (c.frete === 0) frete = '<span class="texto-verde">Grátis</span>';
      else if (c.frete !== null && c.frete !== undefined) frete = Ui.brl(c.frete);

      return `${lista}
        <div class="resumo__linha"><span>Subtotal (${c.quantidade} ${c.quantidade === 1 ? 'item' : 'itens'})</span><span>${Ui.brl(c.subtotal)}</span></div>
        <div class="resumo__linha"><span>Frete</span><span>${frete}</span></div>
        ${c.desconto > 0 ? `<div class="resumo__linha texto-verde"><span>Desconto Pix</span><span>− ${Ui.brl(c.desconto)}</span></div>` : ''}
        <div class="resumo__total"><span>Total</span><span>${Ui.brl(c.total)}</span></div>
        ${c.economia > 0 ? `<p class="resumo__economia">${icone('folha', 16)} Você está economizando ${Ui.brl(c.economia)} nas ofertas</p>` : ''}`;
    },

    barraFrete(c) {
      const limite = Api.config.freteGratisAPartir;
      const falta = Math.max(0, limite - c.subtotal);
      const pct = Math.min(100, (c.subtotal / limite) * 100);
      const texto = falta > 0
        ? `Faltam <strong>${Ui.brl(falta)}</strong> para ganhar frete grátis na entrega econômica`
        : '<strong>Oba!</strong> Você ganhou frete grátis na entrega econômica';
      return `<div class="barra-frete ${falta ? '' : 'barra-frete--ok'}">
        <p>${icone('caminhao', 18)} ${texto}</p>
        <div class="barra-frete__trilho"><span style="width:${pct}%"></span></div>
      </div>`;
    },

    // ------------------------------------------------------------ formulários

    campo({ nome, rotulo, largura = 6, tipo = 'text', valor = '', attrs = '', erro = '' }) {
      return `<div class="campo c${largura}">
        <label for="f-${nome}">${rotulo}</label>
        <input id="f-${nome}" name="${nome}" type="${tipo}" value="${esc(valor)}" ${attrs} ${erro ? `data-erro="${esc(erro)}"` : ''}>
        <small class="campo__erro"></small>
      </div>`;
    },

    marcarErro(campo, mensagem) {
      const caixa = campo.closest('.campo');
      if (!caixa) return;
      caixa.classList.toggle('campo--erro', Boolean(mensagem));
      let alvo = $('.campo__erro', caixa);
      if (!alvo) {
        alvo = document.createElement('small');
        alvo.className = 'campo__erro';
        caixa.appendChild(alvo);
      }
      alvo.textContent = mensagem || '';
    },

    // Usa as regras nativas do HTML (required, pattern, type=email) mas mostra
    // a mensagem embaixo do campo em vez do balão do navegador.
    validarFormulario(raiz) {
      let primeiro = null;
      for (const campo of $$('.campo input, .campo select', raiz)) {
        const ok = campo.checkValidity();
        const vazio = !String(campo.value).trim() && campo.required;
        Ui.marcarErro(campo, ok ? '' : vazio ? 'Campo obrigatório' : (campo.dataset.erro || campo.validationMessage));
        if (!ok && !primeiro) primeiro = campo;
      }
      if (primeiro) primeiro.focus();
      return !primeiro;
    },

    mascara(input, tipo) {
      const formatos = {
        cep: v => v.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
        cpf: v => v.slice(0, 11)
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
        telefone: v => {
          v = v.slice(0, 11);
          if (v.length <= 2) return v ? `(${v}` : '';
          const ddd = v.slice(0, 2);
          const resto = v.slice(2);
          const corte = resto.length > 8 ? 5 : 4;
          return resto.length > corte ? `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}` : `(${ddd}) ${resto}`;
        },
        cartao: v => v.slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '),
        validade: v => v.slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2'),
        cvv: v => v.slice(0, 4)
      };
      input.addEventListener('input', () => {
        input.value = formatos[tipo](input.value.replace(/\D/g, ''));
      });
    },

    async copiar(texto) {
      try {
        await navigator.clipboard.writeText(texto);
      } catch (e) {
        const area = document.createElement('textarea');
        area.value = texto;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      Ui.toast('Código copiado');
    },

    // ---------------------------------------------------------------- layout

    montarPagina() {
      const pagina = document.body.dataset.pagina;
      // O campo de login só existe na home.
      const login = pagina === 'inicio'
        ? `<form class="login" id="login">
            <input name="nome" placeholder="Seu nome" aria-label="Seu nome" maxlength="60" autocomplete="off" required>
            <button class="btn btn--p" type="submit" data-entrar>Login</button>
            <span class="login__uid" hidden></span>
            <button class="btn btn--p btn--claro" type="button" data-sair hidden>Logout</button>
          </form>`
        : '';

      document.body.insertAdjacentHTML('afterbegin', `
        <div class="faixa">${icone('caminhao', 16)} Frete grátis na entrega econômica acima de ${Ui.brl(Api.config.freteGratisAPartir)} <span class="faixa__sep">·</span> <span class="faixa__extra">Frutas colhidas nesta semana</span></div>
        <header class="topo ${login ? 'topo--login' : ''}">
          <div class="container topo__linha">
            <a class="logo" href="index.html" aria-label="Abacate Mucho, página inicial"><span class="logo__marca"></span>Abacate<b>Mucho</b></a>
            <nav class="menu" aria-label="Categorias">
              <a href="index.html" data-menu="inicio">Início</a>
              <a href="categoria.html?c=verdes" data-menu="verdes">Frutas verdes</a>
              <a href="categoria.html?c=vermelhas" data-menu="vermelhas">Frutas vermelhas</a>
              <a href="artigos.html" data-menu="artigos">Artigos</a>
            </nav>
            <div class="topo__acoes">
              <form class="busca" action="busca.html" role="search">
                <input type="search" name="q" placeholder="Buscar frutas" aria-label="Buscar produtos" autocomplete="off" required>
                <button type="submit" aria-label="Buscar">${icone('lupa', 18)}</button>
              </form>
              ${login}
            </div>
            <a class="sacola" href="carrinho.html" aria-label="Abrir carrinho">
              <span class="sacola__icone">${icone('sacola', 22)}<span class="sacola__qtd" hidden>0</span></span>
              <span class="sacola__total">${Ui.brl(0)}</span>
            </a>
          </div>
        </header>`);

      document.body.insertAdjacentHTML('beforeend', `
        <footer class="rodape">
          <div class="container rodape__grade">
            <div>
              <a class="logo logo--claro" href="index.html"><span class="logo__marca"></span>Abacate<b>Mucho</b></a>
              <p>Frutas colhidas no ponto, embaladas com cuidado e entregues geladas na sua porta.</p>
            </div>
            <div>
              <h4>Categorias</h4>
              <a href="categoria.html?c=verdes">Frutas verdes</a>
              <a href="categoria.html?c=vermelhas">Frutas vermelhas</a>
              <a href="artigos.html">Artigos</a>
              <a href="carrinho.html">Meu carrinho</a>
            </div>
            <div>
              <h4>Atendimento</h4>
              <span>Segunda a sábado, 8h às 20h</span>
              <span>contato@abacatemucho.com.br</span>
            </div>
            <div>
              <h4>Loja de demonstração</h4>
              <span>Estoque, carrinho e pedidos ficam salvos neste navegador.</span>
              <button class="rodape__reset" type="button">Restaurar estoque e carrinho</button>
            </div>
          </div>
          <div class="container rodape__base">© 2026 Abacate Mucho. Projeto de estudo: nenhuma fruta foi cobrada de verdade.</div>
        </footer>`);

      if (pagina) Ui.marcarMenu(pagina);
      if (login) Ui.ligarLogin();

      // Busca só com espaços não sai do lugar.
      const busca = $('.busca');
      busca.addEventListener('submit', ev => {
        const campo = busca.elements.namedItem('q');
        campo.value = campo.value.trim();
        if (!campo.value) ev.preventDefault();
      });

      Ui.atualizarSacola(false);
      window.addEventListener('loja:mudou', () => Ui.atualizarSacola(true));
      // Mantém o contador certo se o carrinho mudar em outra aba.
      window.addEventListener('storage', ev => {
        if (ev.key && ev.key.startsWith('abacatemucho:')) Ui.atualizarSacola(true);
      });

      const reset = $('.rodape__reset');
      reset.addEventListener('click', async () => {
        if (!reset.dataset.confirmar) {
          reset.dataset.confirmar = '1';
          reset.textContent = 'Clique de novo para confirmar';
          setTimeout(() => {
            delete reset.dataset.confirmar;
            reset.textContent = 'Restaurar estoque e carrinho';
          }, 4000);
          return;
        }
        await Ui.ocupado(reset, () => Api.resetarLoja(), 'Restaurando');
        location.href = 'index.html';
      });
    },

    // Troca o par campo + Login pelo par uid + Logout conforme o estado.
    ligarLogin() {
      const form = $('#login');
      const campo = $('input', form);
      const entrar = $('[data-entrar]', form);
      const sair = $('[data-sair]', form);
      const etiqueta = $('.login__uid', form);

      function pintar() {
        const logado = Auth.logado();
        campo.hidden = entrar.hidden = logado;
        etiqueta.hidden = sair.hidden = !logado;
        etiqueta.textContent = logado ? `uid ${uid.slice(0, 6)}…` : '';
        etiqueta.title = logado ? uid : '';
      }

      form.addEventListener('submit', async ev => {
        ev.preventDefault();
        if (!campo.value.trim()) {
          campo.value = '';
          campo.focus();
          return;
        }
        await Auth.entrar(campo.value);
        campo.value = '';
        Ui.toast('Login feito');
      });
      sair.addEventListener('click', () => {
        Auth.sair();
        Ui.toast('Você saiu da conta');
      });
      window.addEventListener('auth:mudou', pintar);
      pintar();
    },

    marcarMenu(chave) {
      $$('.menu a').forEach(a => a.classList.toggle('ativo', a.dataset.menu === chave));
    },

    atualizarSacola(animar) {
      const qtd = $('.sacola__qtd');
      if (!qtd) return;
      const { quantidade, subtotal } = Api.resumoRapido();
      qtd.textContent = quantidade > 99 ? '99+' : quantidade;
      qtd.hidden = quantidade === 0;
      $('.sacola__total').textContent = Ui.brl(subtotal);
      if (animar) {
        qtd.classList.remove('pulo');
        void qtd.offsetWidth; // reinicia a animação
        qtd.classList.add('pulo');
      }
    }
  };

  // Botão "+" dos cards funciona em qualquer página.
  document.addEventListener('click', async ev => {
    const botao = ev.target.closest('[data-adicionar]');
    if (!botao) return;
    ev.preventDefault();
    const id = botao.dataset.adicionar;
    try {
      const carrinho = await Ui.ocupado(botao, () => Api.adicionarAoCarrinho(id, 1));
      const item = carrinho.itens.find(i => i.produto.id === id);
      Ui.toast(`${item.produto.nome} no carrinho (${item.quantidade})`, { link: { href: 'carrinho.html', texto: 'Ver carrinho' } });
    } catch (erro) {
      Ui.toast(erro.message, { tipo: 'erro' });
    }
  });

  window.Ui = Ui;
})();
