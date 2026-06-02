import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../../lib/firebase";

// =========================
// PREPARAR PEDIDO
// =========================
export const prepararPedido = ({
  user,

  cart = [],
  bebidasCart = [],
  docesCart = [],

  address = {},
  selectedBairro = null,

  subtotal = 0,
  taxaFinal = 0,
  total = 0,

  dadosTroco = {
    precisa: false,
    valorInput: 0
  }
}) => {
  // =========================
  // RESTAURANTE PRINCIPAL
  // =========================
  const restauranteDoCarrinho =
    cart.length > 0
      ? cart[0].restaurantId
      : "adega_geral";

  // =========================
  // TROCO
  // =========================
  const precisaTroco =
    dadosTroco?.precisa || false;

  const valorTroco =
    Number(
      dadosTroco?.valorInput || 0
    );

  // =========================
  // TROCO CALCULADO
  // =========================
  const trocoCalculado =
    precisaTroco
      ? Number(
          (
            valorTroco - total
          ).toFixed(2)
        )
      : 0;

  return {
    // =========================
    // CLIENTE
    // =========================
    clienteId:
      user?.uid || "anonimo",

    clienteNome:
      user?.displayName ||
      "Usuário Mogu",

    // =========================
    // RESTAURANTES
    // =========================
    restaurantId:
      restauranteDoCarrinho,

    adegaId: "adega_geral",

    // =========================
    // FLAGS
    // =========================
    temBebidas:
      bebidasCart.length > 0,

    temDoces:
      docesCart.length > 0,

    // =========================
    // ENDEREÇO
    // =========================
    endereco: {
      rua: address?.rua || "",
      numero:
        address?.numero || "",

      bairro:
        selectedBairro?.name ||
        "",

      bairroId:
        selectedBairro?.id || ""
    },

    // =========================
    // ITENS
    // =========================
    itens: cart.map((item) => ({
      id: item.id || "",

      name: item.name || "",

      price:
        Number(item.price) || 0,

      restaurantId:
        item.restaurantId ||
        ""
    })),

    // =========================
    // BEBIDAS
    // =========================
    bebidas: bebidasCart.map(
      (b) => ({
        id: b.id || "",

        nome: b.nome || "",

        preco:
          Number(b.preco) || 0
      })
    ),

    // =========================
    // DOCES
    // =========================
    doces: docesCart.map(
      (d) => ({
        id: d.id || "",

        nome: d.nome || "",

        preco:
          Number(d.preco) || 0
      })
    ),

    // =========================
    // VALORES
    // =========================
    valores: {
      subtotal:
        Number(subtotal) || 0,

      taxaEntrega:
        Number(taxaFinal) || 0,

      total:
        Number(total) || 0,

      cashback: Math.floor(
        Number(taxaFinal || 0) *
          0.8
      )
    },

    // =========================
    // TROCO
    // =========================
    detalhesTroco: {
      precisa: precisaTroco,

      valorLevar:
        precisaTroco
          ? valorTroco
          : total,

      trocoCalculado
    },

    // =========================
    // STATUS
    // =========================
    status: "Pendente",

    statusEntrega:
      "preparando",

    // =========================
    // DATA
    // =========================
    criadoEm:
      serverTimestamp()
  };
};

// =========================
// SALVAR PEDIDO
// =========================
export const salvarPedido =
  async (pedido) => {
    const agora = new Date();

    const id = `${String(
      agora.getDate()
    ).padStart(2, "0")}_${String(
      agora.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    await setDoc(
      doc(db, "orders", id),
      pedido
    );

    return id;
  };

// =========================
// LIMPAR CARRINHO
// =========================
export const limparCarrinho =
  () => {
    localStorage.removeItem(
      "carrinho"
    );

    localStorage.removeItem(
      "bebidasCarrinho"
    );

    localStorage.removeItem(
      "docesCarrinho"
    );
  };