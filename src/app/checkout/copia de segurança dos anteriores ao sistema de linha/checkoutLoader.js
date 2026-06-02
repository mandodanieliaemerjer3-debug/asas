// checkoutLoader.js

import {
  collection,
  getDocs,
  getDoc,
  doc
} from "firebase/firestore";

import { db } from "../../lib/firebase";

// =========================
// CARREGAR CARRINHOS
// =========================

export const carregarCarrinhos = () => {

  const cart = JSON.parse(
    localStorage.getItem("carrinho") || "[]"
  );

  const bebidasCart = JSON.parse(
    localStorage.getItem("bebidasCarrinho") || "[]"
  );

  const docesCart = JSON.parse(
    localStorage.getItem("docesCarrinho") || "[]"
  );

  return {
    cart,
    bebidasCart,
    docesCart
  };
};

// =========================
// CARREGAR BAIRROS
// =========================

export const carregarBairros = async () => {

  const snap = await getDocs(
    collection(db, "neighborhoods")
  );

  const bairros = snap.docs.map(docItem => ({

    id: docItem.id,

    ...docItem.data()

  }));

  return bairros;
};

// =========================
// CARREGAR ENDEREÇO USUÁRIO
// =========================

export const carregarEnderecoUsuario = async (
  user,
  bairros
) => {

  // PADRÃO
  const resultado = {

    address: {
      rua: "",
      numero: ""
    },

    selectedBairro: null,

    taxaFinal: 0

  };

  // SEM USUÁRIO
  if (!user?.uid) {

    return resultado;
  }

  // BUSCA USUÁRIO
  const userRef = doc(
    db,
    "users",
    user.uid
  );

  const userSnap = await getDoc(userRef);

  // NÃO EXISTE
  if (!userSnap.exists()) {

    return resultado;
  }

  const data = userSnap.data();

  // SEM ENDEREÇO
  if (!data?.endereco) {

    return resultado;
  }

  // ENDEREÇO
  resultado.address = {

    rua: data.endereco.rua || "",

    numero: data.endereco.numero || ""

  };

  // BAIRRO
  if (data.endereco.bairroId) {

    const bairroEncontrado = bairros.find(
      bairro =>
        bairro.id === data.endereco.bairroId
    );

    if (bairroEncontrado) {

      resultado.selectedBairro =
        bairroEncontrado;

      resultado.taxaFinal =
        bairroEncontrado.fee || 0;
    }
  }

  return resultado;
};

// =========================
// CARREGAR TUDO
// =========================

export const carregarCheckout = async (
  user
) => {

  // CARRINHOS
  const {
    cart,
    bebidasCart,
    docesCart
  } = carregarCarrinhos();

  // BAIRROS
  const bairros =
    await carregarBairros();

  // ENDEREÇO
  const {
    address,
    selectedBairro,
    taxaFinal
  } = await carregarEnderecoUsuario(
    user,
    bairros
  );

  return {

    cart,

    bebidasCart,

    docesCart,

    neighborhoods: bairros,

    address,

    selectedBairro,

    taxaFinal

  };
};