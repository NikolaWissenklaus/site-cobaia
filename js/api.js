/*
 * "Backend" da loja.
 *
 * Não existe servidor: o banco é um JSON no localStorage e toda chamada passa
 * por uma latência artificial e devolve uma Promise, como um fetch faria.
 * As regras de negócio (estoque, frete, parcelamento, validação de cartão)
 * ficam só aqui. As páginas conversam com a Api e nunca tocam no storage.
 *
 * Cada chamada lê o banco, roda o handler e só grava se ele terminar sem
 * erro. Assim uma compra recusada não baixa estoque pela metade.
 *
 * Abra o console do navegador para ver as "requisições" passando.
 */
(function () {
  'use strict';

  const DB_KEY = 'abacatemucho:db:v2';
  const LATENCIA = { min: 250, max: 650 };
  const FRETE_GRATIS_A_PARTIR = 150;
  const DESCONTO_PIX = 0.05;
  const PARCELA_MINIMA = 20;
  const MAX_PARCELAS = 6;
  // Números públicos de teste das bandeiras. Nenhum deles é um cartão real.
  const CARTOES_DE_TESTE = [
    '4111111111111111', // Visa
    '5555555555554444', // Mastercard
    '378282246310005',  // Amex
    '6362970000457013', // Elo
    '6062825624254001'  // Hipercard
  ];

  class ApiError extends Error {
    constructor(mensagem, status = 400, campo = null) {
      super(mensagem);
      this.name = 'ApiError';
      this.status = status;
      this.campo = campo;
    }
  }

  // ---------------------------------------------------------------------------
  // Persistência
  // ---------------------------------------------------------------------------

  // Cópia em memória para quando o navegador bloqueia o localStorage
  // (aba anônima com cookies desligados, por exemplo).
  let memoria = null;

  function dbInicial() {
    return {
      produtos: window.CATALOGO.map(p => ({ ...p })),
      carrinho: { itens: [], entrega: null },
      pedidos: [],
      proximoPedido: 48213
    };
  }

  function lerDb() {
    let bruto;
    try {
      bruto = localStorage.getItem(DB_KEY);
    } catch (e) {
      bruto = memoria;
    }
    if (bruto) {
      try {
        return JSON.parse(bruto);
      } catch (e) {
        console.warn('[api] banco ilegível, recriando');
      }
    }
    const db = dbInicial();
    gravarDb(db);
    return db;
  }

  function gravarDb(db) {
    memoria = JSON.stringify(db);
    try {
      localStorage.setItem(DB_KEY, memoria);
    } catch (e) {
      // segue só em memória
    }
  }

  const clonar = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  const arred = v => Math.round(v * 100) / 100;

  function requisicao(metodo, caminho, handler, esperaExtra = 0) {
    const espera = LATENCIA.min + Math.random() * (LATENCIA.max - LATENCIA.min) + esperaExtra;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = lerDb();
        try {
          const resposta = handler(db);
          if (metodo !== 'GET') {
            gravarDb(db);
            window.dispatchEvent(new CustomEvent('loja:mudou'));
          }
          log(metodo, caminho, 200, `${Math.round(espera)}ms`);
          resolve(clonar(resposta));
        } catch (erro) {
          const falha = erro instanceof ApiError
            ? erro
            : new ApiError('Erro inesperado no servidor. Tente de novo.', 500);
          if (!(erro instanceof ApiError)) console.error(erro);
          log(metodo, caminho, falha.status, falha.message);
          reject(falha);
        }
      }, espera);
    });
  }

  function log(metodo, caminho, status, detalhe) {
    const cor = status < 400 ? '#2e7d32' : '#c62828';
    console.debug(`%c${metodo} ${caminho} %c${status}%c ${detalhe}`, 'font-weight:bold', `color:${cor};font-weight:bold`, 'color:gray');
  }

  // ---------------------------------------------------------------------------
  // Regras de negócio
  // ---------------------------------------------------------------------------

  function acharProduto(db, id) {
    const produto = db.produtos.find(p => p.id === id);
    if (!produto) throw new ApiError('Produto não encontrado', 404);
    return produto;
  }

  function quantidadeValida(valor) {
    const n = Math.floor(Number(valor));
    if (!(n >= 1)) throw new ApiError('Quantidade inválida', 422);
    return n;
  }

  function opcoesDeFrete(cep, subtotal) {
    // O primeiro dígito do CEP indica a região: 0 e 1 são SP, 2 e 3 são
    // RJ, ES e MG. O resto do país fica na faixa mais distante.
    const regiao = Number(cep[0]);
    const faixa = regiao <= 1 ? 0 : regiao <= 3 ? 1 : 2;
    const acrescimo = [0, 5, 12][faixa];
    const prazo = ([de, ate]) => {
      if (de === ate) return de === 1 ? 'Chega amanhã' : `${de} dias úteis`;
      return `${de} a ${ate} dias úteis`;
    };

    const opcoes = [
      {
        id: 'economica',
        nome: 'Econômica',
        descricao: 'Caixa térmica',
        prazo: prazo([[2, 3], [3, 5], [5, 8]][faixa]),
        preco: subtotal >= FRETE_GRATIS_A_PARTIR ? 0 : arred(9.9 + acrescimo)
      },
      {
        id: 'expressa',
        nome: 'Expressa refrigerada',
        descricao: 'Van com refrigeração',
        prazo: prazo([[1, 1], [1, 2], [2, 3]][faixa]),
        preco: arred(19.9 + acrescimo * 1.5)
      }
    ];
    if (faixa === 0) {
      opcoes.push({
        id: 'retirada',
        nome: 'Retirar na loja',
        descricao: 'Rua dos Pinheiros, 1020, São Paulo',
        prazo: 'Pronto em 2 horas',
        preco: 0
      });
    }
    return opcoes;
  }

  function opcoesDeParcelamento(total) {
    const vezes = Math.max(1, Math.min(MAX_PARCELAS, Math.floor(total / PARCELA_MINIMA)));
    return Array.from({ length: vezes }, (_, i) => ({ vezes: i + 1, valor: arred(total / (i + 1)) }));
  }

  // Junta os itens do carrinho com os dados atuais dos produtos e calcula os
  // totais. Preço e frete são sempre recalculados aqui, nunca vêm da página.
  function montarCarrinho(db, forma = null) {
    const itens = [];
    for (const item of db.carrinho.itens) {
      const produto = db.produtos.find(p => p.id === item.produtoId);
      if (!produto) continue;
      itens.push({
        produto,
        quantidade: item.quantidade,
        subtotal: arred(produto.preco * item.quantidade),
        semEstoque: item.quantidade > produto.estoque
      });
    }

    const subtotal = arred(itens.reduce((soma, i) => soma + i.subtotal, 0));
    const economia = arred(itens.reduce((soma, i) => {
      const p = i.produto;
      return soma + (p.precoAntigo ? (p.precoAntigo - p.preco) * i.quantidade : 0);
    }, 0));

    let entrega = null;
    let frete = null;
    if (db.carrinho.entrega) {
      const salvo = db.carrinho.entrega;
      const opcao = opcoesDeFrete(salvo.endereco.cep, subtotal).find(o => o.id === salvo.metodo);
      if (opcao) {
        entrega = { ...salvo, opcao };
        frete = opcao.preco;
      }
    }

    const desconto = forma === 'pix' ? arred(subtotal * DESCONTO_PIX) : 0;
    const total = arred(subtotal - desconto + (frete || 0));

    return {
      itens,
      quantidade: itens.reduce((soma, i) => soma + i.quantidade, 0),
      subtotal,
      economia,
      frete,
      desconto,
      total,
      entrega,
      parcelas: opcoesDeParcelamento(total)
    };
  }

  function luhn(numero) {
    let soma = 0;
    for (let i = 0; i < numero.length; i++) {
      let d = Number(numero[numero.length - 1 - i]);
      if (i % 2) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      soma += d;
    }
    return soma % 10 === 0;
  }

  function bandeira(numero) {
    const n = String(numero || '').replace(/\D/g, '');
    if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'Elo';
    if (/^(606282|3841)/.test(n)) return 'Hipercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^4/.test(n)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
    return null;
  }

  function validarCartao(cartao) {
    const numero = String(cartao.numero || '').replace(/\D/g, '');
    if (numero.length < 13 || numero.length > 19 || !luhn(numero)) {
      throw new ApiError('Número de cartão inválido', 422, 'numero');
    }
    // A loja é uma simulação e não cobra ninguém. Para ninguém digitar o
    // cartão de verdade aqui, só passam os números de teste conhecidos.
    if (!CARTOES_DE_TESTE.includes(numero)) {
      throw new ApiError('Esta loja é uma simulação. Não use seu cartão de verdade: use o cartão de teste 4111 1111 1111 1111.', 422, 'numero');
    }
    const titular = String(cartao.nome || '').trim();
    if (titular.length < 3) throw new ApiError('Informe o nome impresso no cartão', 422, 'titular');

    const validade = /^(\d{2})\/(\d{2})$/.exec(String(cartao.validade || '').trim());
    if (!validade || +validade[1] < 1 || +validade[1] > 12) {
      throw new ApiError('Validade inválida', 422, 'validade');
    }
    // Cartão vale até o último dia do mês impresso.
    const venceEm = new Date(2000 + Number(validade[2]), Number(validade[1]), 1);
    if (venceEm <= new Date()) throw new ApiError('Cartão vencido', 422, 'validade');

    const cvv = String(cartao.cvv || '');
    if (!/^\d{3,4}$/.test(cvv)) throw new ApiError('CVV inválido', 422, 'cvv');

    // Regra do ambiente de teste para simular recusa da operadora.
    if (cvv === '000') {
      throw new ApiError('Pagamento recusado pela operadora. Confira os dados ou use outro cartão.', 402);
    }

    return { bandeira: bandeira(numero) || 'Cartão', final: numero.slice(-4), titular: titular.toUpperCase() };
  }

  // ---------------------------------------------------------------------------
  // Endpoints
  // ---------------------------------------------------------------------------

  // Tira acento e caixa para "maca" achar "Maçã".
  const semAcento = texto => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  function listarProdutos({ categoria = null, lojista = null, ordem = 'relevancia', soPromo = false, busca = null } = {}) {
    const qs = new URLSearchParams(Object.entries({ busca, categoria, lojista, ordem, soPromo }).filter(([, v]) => v));
    return requisicao('GET', `/produtos?${qs}`, db => {
      let lista = db.produtos.slice();
      if (categoria) lista = lista.filter(p => p.categoria === categoria);
      if (lojista) lista = lista.filter(p => p.lojista === lojista);
      if (soPromo) lista = lista.filter(p => p.precoAntigo);

      // Busca simples: o termo precisa aparecer no nome. "tudo" traz o catálogo inteiro.
      const termo = semAcento(busca);
      if (termo && termo !== 'tudo') lista = lista.filter(p => semAcento(p.nome).includes(termo));

      const off = p => (p.precoAntigo ? 1 - p.preco / p.precoAntigo : 0);
      const criterios = {
        relevancia: () => 0,
        'menor-preco': (a, b) => a.preco - b.preco,
        'maior-preco': (a, b) => b.preco - a.preco,
        'maior-desconto': (a, b) => off(b) - off(a),
        nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR')
      };
      const criterio = criterios[ordem] || criterios.relevancia;
      // Esgotados sempre vão para o fim da lista.
      lista.sort((a, b) => (a.estoque === 0) - (b.estoque === 0) || criterio(a, b));
      return lista;
    });
  }

  function obterProduto(id) {
    return requisicao('GET', `/produtos/${id}`, db => {
      const produto = acharProduto(db, id);
      const item = db.carrinho.itens.find(i => i.produtoId === id);
      return { ...produto, noCarrinho: item ? item.quantidade : 0 };
    });
  }

  function obterCarrinho(forma = null) {
    return requisicao('GET', `/carrinho${forma ? `?forma=${forma}` : ''}`, db => montarCarrinho(db, forma));
  }

  function adicionarAoCarrinho(produtoId, quantidade = 1) {
    return requisicao('POST', '/carrinho/itens', db => {
      const produto = acharProduto(db, produtoId);
      const qtd = quantidadeValida(quantidade);
      const item = db.carrinho.itens.find(i => i.produtoId === produtoId);
      const jaTem = item ? item.quantidade : 0;

      if (produto.estoque === 0) throw new ApiError(`${produto.nome} esgotou`, 409);
      if (jaTem + qtd > produto.estoque) {
        const resta = produto.estoque - jaTem;
        throw new ApiError(
          resta > 0
            ? `Só dá para adicionar mais ${resta} de ${produto.nome}`
            : `Todo o estoque de ${produto.nome} já está no seu carrinho`,
          409
        );
      }

      if (item) item.quantidade += qtd;
      else db.carrinho.itens.push({ produtoId, quantidade: qtd });
      return montarCarrinho(db);
    });
  }

  function alterarQuantidade(produtoId, quantidade) {
    return requisicao('PATCH', `/carrinho/itens/${produtoId}`, db => {
      const item = db.carrinho.itens.find(i => i.produtoId === produtoId);
      if (!item) throw new ApiError('Item não está no carrinho', 404);
      const produto = acharProduto(db, produtoId);
      const qtd = quantidadeValida(quantidade);
      if (qtd > produto.estoque) {
        throw new ApiError(`Temos só ${produto.estoque} de ${produto.nome} no estoque`, 409);
      }
      item.quantidade = qtd;
      return montarCarrinho(db);
    });
  }

  function removerDoCarrinho(produtoId) {
    return requisicao('DELETE', `/carrinho/itens/${produtoId}`, db => {
      db.carrinho.itens = db.carrinho.itens.filter(i => i.produtoId !== produtoId);
      if (!db.carrinho.itens.length) db.carrinho.entrega = null;
      return montarCarrinho(db);
    });
  }

  function cotarFrete(cep) {
    const limpo = String(cep || '').replace(/\D/g, '');
    return requisicao('GET', `/frete?cep=${limpo}`, db => {
      if (limpo.length !== 8) throw new ApiError('CEP inválido', 422, 'cep');
      return opcoesDeFrete(limpo, montarCarrinho(db).subtotal);
    });
  }

  function salvarEntrega({ contato = {}, endereco = {}, metodo } = {}) {
    return requisicao('PUT', '/carrinho/entrega', db => {
      if (!db.carrinho.itens.length) throw new ApiError('Seu carrinho está vazio', 409);

      const limpar = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v || '').trim()]));
      const c = limpar(contato);
      const e = limpar(endereco);
      const obrigatorios = ['nome', 'email', 'telefone', 'cpf'].map(k => [k, c[k]])
        .concat(['cep', 'rua', 'numero', 'bairro', 'cidade', 'uf'].map(k => [k, e[k]]));
      for (const [campo, valor] of obrigatorios) {
        if (!valor) throw new ApiError('Campo obrigatório', 422, campo);
      }
      if (!/^\S+@\S+\.\S+$/.test(c.email)) throw new ApiError('E-mail inválido', 422, 'email');
      if (c.cpf.replace(/\D/g, '').length !== 11) throw new ApiError('CPF inválido', 422, 'cpf');

      e.cep = e.cep.replace(/\D/g, '');
      if (e.cep.length !== 8) throw new ApiError('CEP inválido', 422, 'cep');

      const opcao = opcoesDeFrete(e.cep, montarCarrinho(db).subtotal).find(o => o.id === metodo);
      if (!opcao) throw new ApiError('Escolha uma forma de entrega', 422, 'metodo');

      db.carrinho.entrega = { contato: c, endereco: e, metodo: opcao.id };
      return montarCarrinho(db);
    });
  }

  function finalizarPedido({ forma, cartao = {}, parcelas = 1 } = {}) {
    // Espera extra para imitar a ida à operadora do cartão.
    return requisicao('POST', '/pedidos', db => {
      if (!['cartao', 'pix', 'boleto'].includes(forma)) {
        throw new ApiError('Escolha a forma de pagamento', 422, 'forma');
      }
      const carrinho = montarCarrinho(db, forma);
      if (!carrinho.itens.length) throw new ApiError('Seu carrinho está vazio', 409);
      if (!carrinho.entrega) throw new ApiError('Informe o endereço de entrega antes de pagar', 409);

      const faltando = carrinho.itens.find(i => i.semEstoque);
      if (faltando) {
        throw new ApiError(
          `Só restam ${faltando.produto.estoque} de ${faltando.produto.nome}. Ajuste o carrinho para continuar.`,
          409
        );
      }

      const agora = new Date();
      const numero = String(db.proximoPedido++);
      const pagamento = { forma };
      let status = 'pago';

      if (forma === 'cartao') {
        const vezes = Number(parcelas) || 1;
        const opcao = carrinho.parcelas.find(p => p.vezes === vezes);
        if (!opcao) throw new ApiError('Parcelamento inválido', 422, 'parcelas');
        Object.assign(pagamento, validarCartao(cartao), { parcelas: vezes, valorParcela: opcao.valor });
      } else if (forma === 'pix') {
        // Nada de código Pix nem linha digitável: a loja não gera cobrança.
        status = 'aguardando';
        pagamento.expiraEm = new Date(agora.getTime() + 30 * 60 * 1000).toISOString();
      } else {
        status = 'aguardando';
        pagamento.vencimento = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Baixa no estoque: daqui em diante as frutas saem da vitrine.
      for (const item of carrinho.itens) {
        acharProduto(db, item.produto.id).estoque -= item.quantidade;
      }

      const pedido = {
        id: numero,
        criadoEm: agora.toISOString(),
        pagoEm: status === 'pago' ? agora.toISOString() : null,
        status,
        itens: carrinho.itens.map(({ produto, quantidade, subtotal }) => ({
          produto: {
            id: produto.id,
            nome: produto.nome,
            categoria: produto.categoria,
            lojista: produto.lojista,
            emoji: produto.emoji,
            filtro: produto.filtro,
            preco: produto.preco,
            unidade: produto.unidade
          },
          quantidade,
          subtotal
        })),
        quantidade: carrinho.quantidade,
        subtotal: carrinho.subtotal,
        economia: carrinho.economia,
        frete: carrinho.frete,
        desconto: carrinho.desconto,
        total: carrinho.total,
        entrega: carrinho.entrega,
        pagamento
      };

      db.pedidos.unshift(pedido);
      db.carrinho = { itens: [], entrega: null };
      return pedido;
    }, 900);
  }

  function obterPedido(id) {
    return requisicao('GET', `/pedidos/${id}`, db => {
      const pedido = db.pedidos.find(p => p.id === String(id));
      if (!pedido) throw new ApiError('Pedido não encontrado', 404);
      return pedido;
    });
  }

  // Simula o aviso do banco de que o Pix ou o boleto foi pago.
  function confirmarPagamento(id) {
    return requisicao('POST', `/pedidos/${id}/pagamento`, db => {
      const pedido = db.pedidos.find(p => p.id === String(id));
      if (!pedido) throw new ApiError('Pedido não encontrado', 404);
      if (pedido.status !== 'pago') {
        pedido.status = 'pago';
        pedido.pagoEm = new Date().toISOString();
      }
      return pedido;
    }, 600);
  }

  function resetarLoja() {
    return requisicao('POST', '/admin/reset', db => {
      Object.assign(db, dbInicial());
      return { ok: true };
    });
  }

  // Leitura síncrona só para o contador do cabeçalho, que num site real
  // viria junto com a sessão e não precisaria de uma chamada separada.
  function resumoRapido() {
    const c = montarCarrinho(lerDb());
    return { quantidade: c.quantidade, subtotal: c.subtotal };
  }

  window.Api = {
    listarProdutos,
    obterProduto,
    obterCarrinho,
    adicionarAoCarrinho,
    alterarQuantidade,
    removerDoCarrinho,
    cotarFrete,
    salvarEntrega,
    finalizarPedido,
    obterPedido,
    confirmarPagamento,
    resetarLoja,
    resumoRapido,
    bandeira,
    ApiError,
    config: { freteGratisAPartir: FRETE_GRATIS_A_PARTIR, descontoPix: DESCONTO_PIX }
  };
})();
