# Abacate Mucho

Loja virtual de frutas feita só com HTML, CSS e JavaScript puro. Não tem servidor: o "backend" e o login são simulados no navegador.

## Como rodar

Abra o `index.html` no navegador (dois cliques resolvem). Nada para instalar.

Se preferir servir por HTTP:

```bash
python -m http.server 8000
# e abra http://localhost:8000
```

## Páginas

| Arquivo | O que faz |
| --- | --- |
| `index.html` | Home com carrossel de ofertas (cada banner leva para a página do produto), categorias e vitrines. É a única página com o campo de login |
| `categoria.html?c=verdes` / `?c=vermelhas` | Lista da categoria com filtro de ofertas e ordenação |
| `produto.html?id=...` | Página do produto (PDP), com o nome do lojista que vende a fruta |
| `lojista.html?l=...` | Página do lojista com as frutas dele. O único caminho até ela é o nome do lojista na página do produto |
| `busca.html?q=...` | Resultado da busca do cabeçalho, com filtro de categoria, de ofertas e ordenação |
| `artigos.html` e `artigos.html?a=...` | Lista dos artigos do blog e a leitura de cada um, com convite para o produto citado |
| `carrinho.html` | Itens, quantidades e barra de frete grátis |
| `entrega.html` | Dados de contato, endereço (preenchido pelo ViaCEP quando tem internet) e forma de entrega |
| `pagamento.html` | Cartão, Pix (5% off) ou boleto |
| `confirmacao.html?pedido=...` | Pedido finalizado, com QR Code do Pix ou linha digitável do boleto |

## Como o backend é simulado

`js/api.js` guarda um banco em JSON no `localStorage` e responde com Promises depois de 250 a 650 ms, como uma API de verdade. Todas as regras ficam lá:

- estoque: não deixa colocar no carrinho mais do que existe;
- frete calculado pelo CEP, grátis na econômica acima de R$ 150;
- validação do cartão (Luhn, validade, CVV) e parcelamento;
- ao finalizar, o estoque baixa e o carrinho é esvaziado. Produto que zera aparece como esgotado.

Se o pagamento falhar, nada é gravado. Abra o console para ver as chamadas passando (`POST /carrinho/itens 200`, etc.).

Para testar o cartão use `4111 1111 1111 1111` com qualquer validade futura. O CVV `000` simula recusa da operadora.

Para voltar ao estoque inicial, use **Restaurar estoque e carrinho** no rodapé.

## Login

Na home, o cabeçalho tem um campo de nome e o botão **Login**. Vale qualquer nome, não existe senha. Ao entrar, o botão dá lugar ao **Logout** e a variável global `uid` passa a guardar o SHA-256 do que foi digitado (sem os espaços das pontas). O valor fica no `localStorage`, então continua disponível em todas as páginas até o logout. Sem login, `uid` é `undefined`.

Carrinho, busca e vitrines funcionam sem login. Para passar do carrinho (`entrega.html` e `pagamento.html`) é preciso estar logado: sem login aparece um aviso e o botão **Ok** leva de volta para a home.

## Busca

O campo de busca aparece no cabeçalho de todas as páginas e leva para `busca.html?q=termo`. A regra é um "contém" no nome do produto, sem diferenciar maiúsculas nem acentos (`maca` acha as duas maçãs). Buscar por `tudo` mostra o catálogo inteiro.

## Lojistas

A loja funciona como marketplace com três lojistas, definidos em `js/data.js` (`window.LOJISTAS`). Cada produto do catálogo tem o campo `lojista`.

| Lojista | Página | Frutas |
| --- | --- | --- |
| Abacate Mucho (loja oficial) | `lojista.html?l=abacate-mucho` | Abacate, maçã verde, limão, maçã Fuji, melancia |
| Se Eu Quisesse | `lojista.html?l=se-eu-quisesse` | Pera, melão, cereja, uva Rubi |
| Grande Vegan | `lojista.html?l=grande-vegan` | Kiwi, uva verde, morango, tomate cereja |

A página do produto mostra "Vendido e entregue por" seguido do nome do lojista. Só o nome é link, e esse é o único caminho do site até a página do lojista.

## Estrutura

```
css/style.css        estilos de todas as páginas
js/data.js           catálogo, categorias, lojistas, banners e artigos
js/api.js            backend simulado
js/auth.js           login simulado e a variável uid
js/ui.js             cabeçalho (busca e login), rodapé, card, avisos, máscaras
js/paginas/*.js      lógica de cada página
```
