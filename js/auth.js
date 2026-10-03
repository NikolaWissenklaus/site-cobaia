/*
 * Login de mentira, só no navegador.
 *
 * Quem entra pela home digita um nome qualquer. O que fica guardado é o
 * SHA-256 desse nome: na variável global `uid` e no localStorage, para o valor
 * continuar disponível em todas as páginas até o logout.
 */
var uid;

(function () {
  'use strict';

  const UID_KEY = 'abacatemucho:uid';

  function lerUid() {
    try {
      const salvo = localStorage.getItem(UID_KEY);
      return /^[0-9a-f]{64}$/.test(salvo || '') ? salvo : undefined;
    } catch (e) {
      return uid;
    }
  }

  function gravarUid(valor) {
    uid = valor;
    try {
      if (valor) localStorage.setItem(UID_KEY, valor);
      else localStorage.removeItem(UID_KEY);
    } catch (e) {
      // segue só em memória
    }
    window.dispatchEvent(new CustomEvent('auth:mudou'));
  }

  const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

  // O crypto.subtle só existe em contexto seguro (https, localhost, file).
  // Abrindo pelo IP da máquina em http ele some, então fica esta versão de reserva.
  function sha256Manual(bytes) {
    const gira = (x, n) => (x >>> n) | (x << (32 - n));
    const fracao = (p, raiz) => ((Math.pow(p, 1 / raiz) % 1) * 4294967296) >>> 0;
    const primos = [];
    for (let n = 2; primos.length < 64; n++) {
      if (primos.every(p => n % p)) primos.push(n);
    }
    const k = primos.map(p => fracao(p, 3));
    const h = primos.slice(0, 8).map(p => fracao(p, 2));

    const tamanho = bytes.length;
    const total = Math.ceil((tamanho + 9) / 64) * 64;
    const dados = new Uint8Array(total);
    dados.set(bytes);
    dados[tamanho] = 0x80;
    const visao = new DataView(dados.buffer);
    visao.setUint32(total - 8, Math.floor(tamanho / 0x20000000));
    visao.setUint32(total - 4, (tamanho << 3) >>> 0);

    const w = new Uint32Array(64);
    for (let bloco = 0; bloco < total; bloco += 64) {
      for (let i = 0; i < 16; i++) w[i] = visao.getUint32(bloco + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = gira(w[i - 15], 7) ^ gira(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = gira(w[i - 2], 17) ^ gira(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const s1 = gira(e, 6) ^ gira(e, 11) ^ gira(e, 25);
        const t1 = (hh + s1 + ((e & f) ^ (~e & g)) + k[i] + w[i]) >>> 0;
        const s0 = gira(a, 2) ^ gira(a, 13) ^ gira(a, 22);
        const t2 = (s0 + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) >>> 0; });
    }
    return h.map(v => v.toString(16).padStart(8, '0')).join('');
  }

  async function sha256(texto) {
    const bytes = new TextEncoder().encode(texto);
    if (window.crypto && crypto.subtle) {
      return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
    }
    return sha256Manual(bytes);
  }

  uid = lerUid();

  // Login ou logout feito em outra aba vale aqui também.
  window.addEventListener('storage', ev => {
    if (ev.key !== UID_KEY && ev.key !== null) return;
    uid = lerUid();
    window.dispatchEvent(new CustomEvent('auth:mudou'));
  });

  window.Auth = {
    sha256,
    sha256Manual,
    logado: () => Boolean(uid),

    async entrar(nome) {
      const limpo = String(nome || '').trim();
      if (!limpo) throw new Error('Digite um nome para entrar');
      gravarUid(await sha256(limpo));
      return uid;
    },

    sair() {
      gravarUid(undefined);
    }
  };
})();
