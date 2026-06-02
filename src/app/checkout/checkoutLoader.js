import {
  collection,
  getDocs,
  getDoc,
  doc
} from "firebase/firestore";

import { db } from "../../lib/firebase";

// =========================
// CACHE FUTURO PWA
// =========================
const CACHE_KEYS = {
  bairros: "cache_bairros",
  restaurante: "cache_restaurante"
};

// =========================
// CARRINHOS
// =========================
export const carregarCarrinhos = () => {
  try {
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
  } catch (err) {
    console.error(
      "Erro ao carregar carrinhos:",
      err
    );

    return {
      cart: [],
      bebidasCart: [],
      docesCart: []
    };
  }
};

// =========================
// BAIRROS
// =========================
export const carregarBairros = async () => {
  try {
    const snap = await getDocs(
      collection(db, "neighborhoods")
    );

    const bairros = snap.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));

    // =========================
    // FUTURO PWA CACHE
    // =========================
    localStorage.setItem(
      CACHE_KEYS.bairros,
      JSON.stringify(bairros)
    );

    return bairros;
  } catch (err) {
    console.error(
      "Erro ao carregar bairros:",
      err
    );

    // =========================
    // FALLBACK CACHE
    // =========================
    const cache = localStorage.getItem(
      CACHE_KEYS.bairros
    );

    return cache ? JSON.parse(cache) : [];
  }
};

// =========================
// RESTAURANTE
// =========================
export const carregarTaxasRestaurante =
  async (restId) => {
    if (!restId) {
      return {};
    }

    try {
      const restSnap = await getDoc(
        doc(db, "restaurants", restId)
      );

      if (!restSnap.exists()) {
        return {};
      }

      const taxas =
        restSnap.data().taxasPorLinha || {};

      // =========================
      // FUTURO PWA CACHE
      // =========================
      localStorage.setItem(
        `${CACHE_KEYS.restaurante}_${restId}`,
        JSON.stringify(taxas)
      );

      return taxas;
    } catch (err) {
      console.error(
        "Erro ao carregar taxas:",
        err
      );

      // =========================
      // FALLBACK CACHE
      // =========================
      const cache = localStorage.getItem(
        `${CACHE_KEYS.restaurante}_${restId}`
      );

      return cache
        ? JSON.parse(cache)
        : {};
    }
  };

// =========================
// ENDEREÇO USUÁRIO
// =========================
export const carregarEnderecoUsuario =
  async (
    user,
    bairros,
    cart,
    taxasDoRestaurante
  ) => {
    const resultado = {
      address: {
        rua: "",
        numero: ""
      },
      selectedBairro: null,
      taxaFinal: 0,
      entregaDisponivel: false
    };

    if (!user?.uid) {
      return resultado;
    }

    try {
      const userSnap = await getDoc(
        doc(db, "users", user.uid)
      );

      if (
        !userSnap.exists() ||
        !userSnap.data()?.endereco
      ) {
        return resultado;
      }

      const data = userSnap.data();

      resultado.address = {
        rua: data.endereco.rua || "",
        numero: data.endereco.numero || ""
      };

      // =========================
      // BAIRRO
      // =========================
      if (data.endereco.bairroId) {
        const bairroEncontrado =
          bairros.find(
            (b) =>
              b.id ===
              data.endereco.bairroId
          );

        if (bairroEncontrado) {
          resultado.selectedBairro =
            bairroEncontrado;

          const chaveLinha = String(
            bairroEncontrado.linhaId ||
              bairroEncontrado.linha
          );

          const configLinha =
            taxasDoRestaurante[
              chaveLinha
            ];

          if (configLinha) {
            resultado.taxaFinal =
              Number(
                configLinha.preco
              ) || 0;

            resultado.entregaDisponivel =
              configLinha.ativo === true;
          }
        }
      }

      return resultado;
    } catch (err) {
      console.error(
        "Erro ao carregar endereço:",
        err
      );

      return resultado;
    }
  };

// =========================
// CHECKOUT COMPLETO
// =========================
export const carregarCheckout =
  async (user) => {
    // =========================
    // CARRINHOS
    // =========================
    const {
      cart,
      bebidasCart,
      docesCart
    } = carregarCarrinhos();

    // =========================
    // RESTAURANTE PRINCIPAL
    // =========================
    const restId =
      cart.length > 0
        ? cart[0].restaurantId
        : null;

    // =========================
    // PARALELIZA CONSULTAS
    // =========================
    const [
      bairros,
      taxasDoRestaurante
    ] = await Promise.all([
      carregarBairros(),
      carregarTaxasRestaurante(
        restId
      )
    ]);

    // =========================
    // ENDEREÇO
    // =========================
    const {
      address,
      selectedBairro,
      taxaFinal,
      entregaDisponivel
    } =
      await carregarEnderecoUsuario(
        user,
        bairros,
        cart,
        taxasDoRestaurante
      );

    return {
      cart,
      bebidasCart,
      docesCart,

      neighborhoods: bairros,

      address,
      selectedBairro,

      taxaFinal,
      entregaDisponivel,

      // =========================
      // NOVO
      // =========================
      taxasDoRestaurante
    };
  };