/*
 * Catálogo "de fábrica" da loja.
 *
 * Na primeira visita esses dados são copiados para o banco simulado (veja
 * api.js). A partir daí o estoque muda conforme as compras. Para voltar ao
 * estado original use o botão "Restaurar loja" no rodapé.
 *
 * As fotos são emojis. Alguns não existem na cor certa (uva verde, limão),
 * então o campo `filtro` gira a matiz do emoji com CSS.
 */

window.CATEGORIAS = {
  verdes: {
    nome: 'Frutas verdes',
    descricao: 'Ácidas, crocantes ou cremosas. Da maçã Granny Smith ao abacate que vira guacamole.',
    emojis: ['🍏', '🥝', '🥑']
  },
  vermelhas: {
    nome: 'Frutas vermelhas',
    descricao: 'Doces, suculentas e cheias de cor. Colhidas no ponto e entregues geladas.',
    emojis: ['🍓', '🍒', '🍎']
  }
};

// Quem vende cada fruta. A loja funciona como marketplace: além da própria
// Abacate Mucho, dois lojistas parceiros têm produtos no catálogo.
window.LOJISTAS = {
  'abacate-mucho': {
    nome: 'Abacate Mucho',
    selo: 'Loja oficial',
    descricao: 'A loja da casa. Vende abacate e, por insistência dos clientes, outras frutas também.',
    tema: 'verdes',
    emojis: ['🥑', '🍏', '🍉']
  },
  'se-eu-quisesse': {
    nome: 'Se Eu Quisesse',
    selo: 'Lojista parceiro',
    descricao: 'Só vende o que tem vontade. Nesta semana teve vontade de pera, melão, cereja e uva.',
    tema: 'ameixa',
    emojis: ['🍒', '🍐', '🍈']
  },
  'grande-vegan': {
    nome: 'Grande Vegan',
    selo: 'Lojista parceiro',
    descricao: 'Garante que nenhuma fruta à venda contém carne. Até hoje ninguém reclamou.',
    tema: 'oliva',
    emojis: ['🍓', '🥝', '🍅']
  }
};

window.CATALOGO = [
  // Verdes
  {
    id: 'maca-verde',
    nome: 'Maçã Verde Granny Smith',
    categoria: 'verdes',
    lojista: 'abacate-mucho',
    emoji: '🍏',
    preco: 13.9,
    unidade: 'kg',
    estoque: 18,
    origem: 'São Joaquim, SC',
    descricao: 'Casca lisa, polpa branca e aquele azedinho que acorda qualquer um. Vai bem crua, na salada ou assada com canela.',
    conservacao: 'Na gaveta da geladeira dura até 3 semanas.'
  },
  {
    id: 'kiwi',
    nome: 'Kiwi Hayward',
    categoria: 'verdes',
    lojista: 'grande-vegan',
    emoji: '🥝',
    preco: 15.9,
    precoAntigo: 22.9,
    unidade: 'kg',
    estoque: 9,
    origem: 'Farroupilha, RS',
    descricao: 'Polpa verde brilhante, doce na medida e cheia de vitamina C. Corte ao meio e coma de colherzinha.',
    conservacao: 'Fora da geladeira até amaciar. Depois, geladeira por até 1 semana.'
  },
  {
    id: 'abacate',
    nome: 'Abacate Manteiga',
    categoria: 'verdes',
    lojista: 'abacate-mucho',
    emoji: '🥑',
    preco: 11.9,
    unidade: 'kg',
    estoque: 12,
    origem: 'Bauru, SP',
    selo: 'Orgânico',
    descricao: 'Polpa amarelinha, cremosa e sem fiapos. Serve para vitamina com açúcar ou guacamole com limão, sem julgamentos.',
    conservacao: 'Amadureça na fruteira. Maduro, vai para a geladeira por até 4 dias.'
  },
  {
    id: 'pera',
    nome: 'Pera Williams',
    categoria: 'verdes',
    lojista: 'se-eu-quisesse',
    emoji: '🍐',
    preco: 16.9,
    unidade: 'kg',
    estoque: 10,
    origem: 'Vale do Rio Negro, Argentina',
    descricao: 'Suculenta e perfumada, derrete na boca quando está no ponto. Combina muito com queijo gorgonzola.',
    conservacao: 'Geladeira por até 10 dias. Tire uma hora antes para realçar o aroma.'
  },
  {
    id: 'limao',
    nome: 'Limão Tahiti',
    categoria: 'verdes',
    lojista: 'abacate-mucho',
    emoji: '🍋',
    filtro: 'hue-rotate(30deg) saturate(.75) brightness(.92)',
    preco: 6.9,
    unidade: 'kg',
    estoque: 30,
    origem: 'Itajobi, SP',
    descricao: 'Casca fina, muito suco e quase nenhuma semente. Rende limonada, caipirinha e tempero de peixe.',
    conservacao: 'Geladeira, dentro de saco fechado, por até 2 semanas.'
  },
  {
    id: 'uva-verde',
    nome: 'Uva Verde Thompson',
    categoria: 'verdes',
    lojista: 'grande-vegan',
    emoji: '🍇',
    filtro: 'hue-rotate(185deg) saturate(.8) brightness(1.5)',
    preco: 14.9,
    unidade: 'bandeja 500g',
    estoque: 8,
    origem: 'Petrolina, PE',
    selo: 'Sem semente',
    descricao: 'Bagos grandes, crocantes e sem semente. Vai direto da bandeja para a lancheira das crianças.',
    conservacao: 'Geladeira, sem lavar, por até 1 semana. Lave só na hora de comer.'
  },
  {
    id: 'melao',
    nome: 'Melão Gália',
    categoria: 'verdes',
    lojista: 'se-eu-quisesse',
    emoji: '🍈',
    preco: 12.9,
    precoAntigo: 16.9,
    unidade: 'unidade',
    estoque: 6,
    origem: 'Mossoró, RN',
    descricao: 'Polpa verde-clara, muito doce e com perfume forte. Fica perfeito gelado, em cubos, no café da manhã.',
    conservacao: 'Inteiro fora da geladeira. Depois de cortado, geladeira com filme por 3 dias.'
  },

  // Vermelhas
  {
    id: 'morango',
    nome: 'Morango Orgânico',
    categoria: 'vermelhas',
    lojista: 'grande-vegan',
    emoji: '🍓',
    preco: 8.9,
    precoAntigo: 12.9,
    unidade: 'bandeja 300g',
    estoque: 10,
    origem: 'Atibaia, SP',
    selo: 'Orgânico',
    descricao: 'Colhido ontem, vermelho até o cabinho e sem agrotóxico. Doce o bastante para comer puro.',
    conservacao: 'Geladeira, sem lavar e sem tirar o cabinho, por até 4 dias.'
  },
  {
    id: 'cereja',
    nome: 'Cereja Importada',
    categoria: 'vermelhas',
    lojista: 'se-eu-quisesse',
    emoji: '🍒',
    preco: 24.9,
    precoAntigo: 34.9,
    unidade: 'caixa 250g',
    estoque: 4,
    origem: 'Região do Maule, Chile',
    descricao: 'Safra nova, firme e bem escura, do jeito que tem que ser. Estoque curto porque a temporada é rápida.',
    conservacao: 'Geladeira, em pote fechado, por até 1 semana.'
  },
  {
    id: 'maca-fuji',
    nome: 'Maçã Fuji',
    categoria: 'vermelhas',
    lojista: 'abacate-mucho',
    emoji: '🍎',
    preco: 10.9,
    unidade: 'kg',
    estoque: 20,
    origem: 'Fraiburgo, SC',
    descricao: 'A maçã mais pedida da casa: crocante, doce e suculenta. Ótima para comer com casca.',
    conservacao: 'Na gaveta da geladeira dura até 1 mês.'
  },
  {
    id: 'melancia',
    nome: 'Melancia Baby',
    categoria: 'vermelhas',
    lojista: 'abacate-mucho',
    emoji: '🍉',
    preco: 15.9,
    unidade: 'unidade (~2 kg)',
    estoque: 7,
    origem: 'Uruana, GO',
    descricao: 'Tamanho que cabe na geladeira, casca fina e polpa bem vermelha. Rende suco para a família toda.',
    conservacao: 'Inteira fora da geladeira. Cortada, geladeira com filme por 4 dias.'
  },
  {
    id: 'tomate-cereja',
    nome: 'Tomate Cereja',
    categoria: 'vermelhas',
    lojista: 'grande-vegan',
    emoji: '🍅',
    preco: 7.9,
    unidade: 'bandeja 250g',
    estoque: 15,
    origem: 'Mogi das Cruzes, SP',
    descricao: 'Sim, tomate é fruta. Docinho, estoura na boca e salva qualquer salada ou massa.',
    conservacao: 'Fora da geladeira por 3 dias. Na geladeira perde um pouco do sabor.'
  },
  {
    id: 'uva-rubi',
    nome: 'Uva Rubi',
    categoria: 'vermelhas',
    lojista: 'se-eu-quisesse',
    emoji: '🍇',
    filtro: 'hue-rotate(55deg) saturate(1.4)',
    preco: 13.9,
    unidade: 'bandeja 500g',
    estoque: 11,
    origem: 'Marialva, PR',
    descricao: 'Casca rosada, polpa firme e sabor adocicado. Clássica de mesa no Paraná.',
    conservacao: 'Geladeira, sem lavar, por até 1 semana.'
  }
];

// Banners da home. Cada um leva direto para a página do produto em oferta;
// preço e estoque vêm da API na hora de montar o carrossel.
window.BANNERS = [
  {
    produtoId: 'morango',
    tema: 'vermelho',
    chamada: 'Oferta da semana',
    titulo: 'Morango orgânico de Atibaia',
    texto: 'Colhido ontem, sem agrotóxico, direto para a sua geladeira.'
  },
  {
    produtoId: 'kiwi',
    tema: 'verde',
    chamada: 'Semana do kiwi',
    titulo: 'Kiwi Hayward com preço de feira',
    texto: 'Doce, suculento e com o dobro de vitamina C da laranja.'
  },
  {
    produtoId: 'cereja',
    tema: 'vinho',
    chamada: 'Oferta relâmpago',
    titulo: 'Cerejas chilenas por menos',
    texto: 'Safra nova, firme e bem escura. São poucas caixas, então corre.'
  }
];

// Artigos do blog. O corpo já vem em HTML porque é texto fixo, escrito por
// nós. `produtoId` aponta a fruta que aparece no convite do fim do artigo.
window.ARTIGOS = [
  {
    id: 'vitamina-de-abacate',
    titulo: 'Como fazer vitamina de abacate',
    chamada: 'Receita',
    resumo: 'Três ingredientes, um liquidificador e nenhum mistério.',
    leitura: '1 min',
    tema: 'verdes',
    emojis: ['🥑', '🥛', '🥄'],
    produtoId: 'abacate',
    convite: 'Faltou o abacate?',
    corpo: `
      <p>Vitamina de abacate é a prova de que dá para beber uma fruta que parece manteiga.</p>
      <h2>Você vai precisar de</h2>
      <ul>
        <li>Meio abacate maduro</li>
        <li>1 copo de leite gelado</li>
        <li>1 colher de açúcar ou mel</li>
      </ul>
      <h2>Modo de fazer</h2>
      <ol>
        <li>Tire o caroço. Ele não bate bem.</li>
        <li>Coloque tudo no liquidificador.</li>
        <li>Bata até ficar verde-claro e sem pedaços.</li>
        <li>Beba logo, antes que alguém peça um gole.</li>
      </ol>
      <p><strong>Ficou grossa demais?</strong> Agora é um creme. Coma de colher e diga que era o plano.</p>`
  },
  {
    id: 'kiwi-passaro-vs-kiwi-fruta',
    titulo: 'Kiwi pássaro vs. kiwi fruta',
    chamada: 'Tira-teima',
    resumo: 'Os dois são marrons e peludinhos. Só um vai bem na salada de frutas.',
    leitura: '1 min',
    tema: 'kiwi',
    emojis: ['🥝', '🐦', '🤔'],
    produtoId: 'kiwi',
    convite: 'Este aqui é a fruta. Garantimos.',
    corpo: `
      <p>Os dois são marrons, peludinhos e mais ou menos redondos. A confusão é compreensível.</p>
      <table>
        <thead><tr><th></th><th>Kiwi pássaro</th><th>Kiwi fruta</th></tr></thead>
        <tbody>
          <tr><th>Voa</th><td>Não</td><td>Não</td></tr>
          <tr><th>Tem bico</th><td>Sim</td><td>Não</td></tr>
          <tr><th>É peludinho</th><td>Sim</td><td>Sim</td></tr>
          <tr><th>Verde por dentro</th><td>Melhor não conferir</td><td>Sim</td></tr>
          <tr><th>Onde mora</th><td>Nova Zelândia</td><td>Na sua geladeira</td></tr>
          <tr><th>Vai na salada de frutas</th><td>Não</td><td>Sim</td></tr>
        </tbody>
      </table>
      <h2>Como saber qual é qual</h2>
      <p>Se saiu correndo, é o pássaro. Se ficou parado na fruteira, pode cortar ao meio.</p>
      <p><strong>Curiosidade:</strong> a fruta ganhou esse nome por causa do pássaro. O pássaro não foi consultado.</p>`
  }
];
