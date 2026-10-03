(function () {
  'use strict';

  Ui.montarPagina();

  const main = Ui.$('#conteudo');
  let carrinho = null;
  let opcoes = [];
  let metodo = null;
  let ultimoCep = null;

  async function iniciar() {
    try {
      carrinho = await Api.obterCarrinho();
    } catch (erro) {
      Ui.falha(main, erro, iniciar);
      return;
    }
    if (!carrinho.itens.length) {
      location.replace('carrinho.html');
      return;
    }
    renderizar(carrinho.entrega);
  }

  function renderizar(salvo) {
    const c = (salvo && salvo.contato) || {};
    const e = (salvo && salvo.endereco) || {};
    metodo = salvo ? salvo.metodo : null;

    main.innerHTML = `${Ui.passos(1)}
      <div class="checkout">
        <form class="painel" id="form-entrega" novalidate>
          <h1 class="painel__titulo">Dados de entrega</h1>

          <h2 class="painel__sub">Quem vai receber</h2>
          <div class="campos">
            ${Ui.campo({ nome: 'nome', rotulo: 'Nome completo', largura: 4, valor: c.nome, attrs: 'required minlength="3" autocomplete="name"', erro: 'Informe seu nome completo' })}
            ${Ui.campo({ nome: 'cpf', rotulo: 'CPF', largura: 2, valor: c.cpf, attrs: 'required inputmode="numeric" pattern="\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}" placeholder="000.000.000-00"', erro: 'CPF precisa ter 11 dígitos' })}
            ${Ui.campo({ nome: 'email', rotulo: 'E-mail', tipo: 'email', largura: 3, valor: c.email, attrs: 'required autocomplete="email" placeholder="voce@email.com"', erro: 'Informe um e-mail válido' })}
            ${Ui.campo({ nome: 'telefone', rotulo: 'Celular', tipo: 'tel', largura: 3, valor: c.telefone, attrs: 'required autocomplete="tel" pattern="\\(\\d{2}\\) \\d{4,5}-\\d{4}" placeholder="(11) 90000-0000"', erro: 'Informe DDD e número' })}
          </div>

          <h2 class="painel__sub">Endereço</h2>
          <div class="campos">
            ${Ui.campo({ nome: 'cep', rotulo: 'CEP', largura: 2, valor: e.cep ? e.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : '', attrs: 'required inputmode="numeric" autocomplete="postal-code" pattern="\\d{5}-\\d{3}" placeholder="00000-000"', erro: 'CEP precisa ter 8 dígitos' })}
            ${Ui.campo({ nome: 'rua', rotulo: 'Rua', largura: 4, valor: e.rua, attrs: 'required autocomplete="address-line1"' })}
            ${Ui.campo({ nome: 'numero', rotulo: 'Número', largura: 2, valor: e.numero, attrs: 'required inputmode="numeric"' })}
            ${Ui.campo({ nome: 'complemento', rotulo: 'Complemento (opcional)', largura: 4, valor: e.complemento, attrs: 'autocomplete="address-line2" placeholder="Apto, bloco, referência"' })}
            ${Ui.campo({ nome: 'bairro', rotulo: 'Bairro', largura: 2, valor: e.bairro, attrs: 'required' })}
            ${Ui.campo({ nome: 'cidade', rotulo: 'Cidade', largura: 3, valor: e.cidade, attrs: 'required autocomplete="address-level2"' })}
            <div class="campo c1">
              <label for="f-uf">UF</label>
              <select id="f-uf" name="uf" required>
                <option value=""></option>
                ${Ui.UFS.map(uf => `<option ${uf === e.uf ? 'selected' : ''}>${uf}</option>`).join('')}
              </select>
              <small class="campo__erro"></small>
            </div>
          </div>

          <h2 class="painel__sub">Como você quer receber</h2>
          <div class="opcoes" id="opcoes"><p class="dica">Digite o CEP para ver prazos e valores.</p></div>
          <p class="campo__erro" id="erro-metodo" style="margin-top:8px"></p>
        </form>

        <aside class="painel resumo">
          <h2>Resumo do pedido</h2>
          <div id="resumo"></div>
          <button class="btn btn--bloco btn--grande" type="submit" form="form-entrega" id="continuar">Ir para pagamento</button>
          <a class="link-voltar" href="carrinho.html">${Ui.icone('esquerda', 18)} Voltar ao carrinho</a>
        </aside>
      </div>`;

    const form = Ui.$('#form-entrega');
    const campo = nome => form.elements.namedItem(nome);

    Ui.mascara(campo('cep'), 'cep');
    Ui.mascara(campo('cpf'), 'cpf');
    Ui.mascara(campo('telefone'), 'telefone');

    form.addEventListener('input', ev => Ui.marcarErro(ev.target, ''));
    form.addEventListener('change', ev => {
      if (ev.target.name !== 'metodo') return;
      metodo = ev.target.value;
      Ui.$('#erro-metodo').textContent = '';
      atualizarResumo();
    });

    campo('cep').addEventListener('input', () => {
      const cep = campo('cep').value.replace(/\D/g, '');
      if (cep.length === 8 && cep !== ultimoCep) buscarCep(cep, true);
    });

    form.addEventListener('submit', ev => {
      ev.preventDefault();
      enviar(form);
    });

    atualizarResumo();
    if (e.cep) buscarCep(e.cep, false);
  }

  async function buscarCep(cep, preencher) {
    ultimoCep = cep;
    const lista = Ui.$('#opcoes');
    lista.innerHTML = `<div class="carregando-linha"><span class="spinner"></span> Calculando frete para ${cep.replace(/^(\d{5})/, '$1-')}</div>`;
    if (preencher) preencherEndereco(cep);
    try {
      const resposta = await Api.cotarFrete(cep);
      if (cep !== ultimoCep) return;
      opcoes = resposta;
      if (!opcoes.some(o => o.id === metodo)) metodo = opcoes[0].id;
      lista.innerHTML = opcoes.map(o => `
        <label class="opcao">
          <input type="radio" name="metodo" value="${o.id}" ${o.id === metodo ? 'checked' : ''}>
          <span class="opcao__info"><strong>${o.nome}</strong><span>${o.prazo} · ${o.descricao}</span></span>
          <span class="opcao__preco">${o.preco === 0 ? '<span class="texto-verde">Grátis</span>' : Ui.brl(o.preco)}</span>
        </label>`).join('');
    } catch (erro) {
      opcoes = [];
      lista.innerHTML = `<p class="dica dica--erro">${Ui.esc(erro.message)}</p>`;
    }
    atualizarResumo();
  }

  // Busca a rua no ViaCEP. Se estiver sem internet, o cliente digita à mão.
  async function preencherEndereco(cep) {
    const form = Ui.$('#form-entrega');
    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), 4000);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controle.signal });
      const dados = await resposta.json();
      if (dados.erro || cep !== ultimoCep) return;
      const preencher = (nome, valor) => {
        if (!valor) return;
        form.elements.namedItem(nome).value = valor;
        Ui.marcarErro(form.elements.namedItem(nome), '');
      };
      preencher('rua', dados.logradouro);
      preencher('bairro', dados.bairro);
      preencher('cidade', dados.localidade);
      preencher('uf', dados.uf);
      form.elements.namedItem(dados.logradouro ? 'numero' : 'rua').focus();
    } catch (e) {
      // sem ViaCEP, segue o jogo
    } finally {
      clearTimeout(limite);
    }
  }

  function atualizarResumo() {
    const opcao = opcoes.find(o => o.id === metodo);
    const previa = { ...carrinho, frete: opcao ? opcao.preco : null };
    previa.total = previa.subtotal + (opcao ? opcao.preco : 0);
    Ui.$('#resumo').innerHTML = Ui.resumo(previa, { freteVazio: 'Informe o CEP' });
  }

  async function enviar(form) {
    const valor = nome => form.elements.namedItem(nome).value;
    const camposOk = Ui.validarFormulario(form);
    const erroMetodo = Ui.$('#erro-metodo');
    const metodoOk = Boolean(metodo && opcoes.length);
    erroMetodo.textContent = metodoOk ? '' : 'Informe um CEP válido para escolher a entrega';
    erroMetodo.style.display = metodoOk ? 'none' : 'block';
    if (!camposOk || !metodoOk) return;

    const dados = {
      contato: { nome: valor('nome'), cpf: valor('cpf'), email: valor('email'), telefone: valor('telefone') },
      endereco: {
        cep: valor('cep'),
        rua: valor('rua'),
        numero: valor('numero'),
        complemento: valor('complemento'),
        bairro: valor('bairro'),
        cidade: valor('cidade'),
        uf: valor('uf')
      },
      metodo
    };

    try {
      await Ui.ocupado(Ui.$('#continuar'), () => Api.salvarEntrega(dados), 'Salvando endereço');
      location.href = 'pagamento.html';
    } catch (erro) {
      const campo = erro.campo && form.elements.namedItem(erro.campo);
      if (campo) {
        Ui.marcarErro(campo, erro.message);
        campo.focus();
      } else {
        Ui.toast(erro.message, { tipo: 'erro' });
      }
    }
  }

  if (Ui.exigirLogin()) iniciar();
})();
