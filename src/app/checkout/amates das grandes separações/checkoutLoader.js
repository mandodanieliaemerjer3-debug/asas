import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// =========================
// CARREGAR CARRINHOS
// =========================
export const carregarCarrinhos = () => {
  const cart = JSON.parse(localStorage.getItem("carrinho") || "[]");
  const bebidasCart = JSON.parse(localStorage.getItem("bebidasCarrinho") || "[]");
  const docesCart = JSON.parse(localStorage.getItem("docesCarrinho") || "[]");

  return { cart, bebidasCart, docesCart };
};

// =========================
// CARREGAR BAIRROS
// =========================
export const carregarBairros = async () => {
  const snap = await getDocs(collection(db, "neighborhoods"));

  return snap.docs.map(docItem => ({
    id: docItem.id,
    ...docItem.data()
  }));
};

// =========================
// CARREGAR ENDEREÇO USUÁRIO E CRUZAR LINHAS
// =========================
export const carregarEnderecoUsuario = async (user, bairros, cart) => {
  const resultado = {
    address: {
      rua: "",
      numero: ""
    },
    selectedBairro: null,
    taxaFinal: 0,
    entregaDisponivel: false
  };

  if (!user?.uid) return resultado;

  const userSnap = await getDoc(doc(db, "users", user.uid));

  if (!userSnap.exists() || !userSnap.data()?.endereco) {
    return resultado;
  }

  const data = userSnap.data();

  resultado.address = {
    rua: data.endereco.rua || "",
    numero: data.endereco.numero || ""
  };

  if (data.endereco.bairroId) {
    const bairroEncontrado = bairros.find(
      (b) => b.id === data.endereco.bairroId
    );

    if (bairroEncontrado) {
      resultado.selectedBairro = bairroEncontrado;

      // NÃO USA MAIS b.fee
      resultado.taxaFinal = 0;

      // =====================================
      // PEGA O RESTAURANTE DO PRIMEIRO ITEM
      // =====================================
      const restId =
        cart && cart.length > 0
          ? cart[0].restaurantId
          : null;

      if (restId) {
        const restSnap = await getDoc(
          doc(db, "restaurants", restId)
        );

        if (restSnap.exists()) {
          const taxasDoRestaurante =
            restSnap.data().taxasPorLinha || {};

          // FORÇA STRING
          const chaveLinha = String(
            bairroEncontrado.linhaId ||
            bairroEncontrado.linha
          );

          const configLinha =
            taxasDoRestaurante[chaveLinha];

          // DEBUG
          console.log("🕵️‍♂️ === INVESTIGAÇÃO DO FRETE ===");
          console.log(
            "1. Bairro do Cliente:",
            bairroEncontrado.name
          );

          console.log(
            "2. Linha do Bairro:",
            chaveLinha
          );

          console.log(
            "3. Restaurante:",
            restId
          );

          console.log(
            "4. Taxas cadastradas:",
            taxasDoRestaurante
          );

          console.log(
            "5. Resultado do cruzamento:",
            configLinha
          );

          console.log("=================================");

          // SE EXISTE CONFIGURAÇÃO
          if (configLinha) {
            resultado.taxaFinal =
              Number(configLinha.preco) || 0;

            resultado.entregaDisponivel =
              configLinha.ativo === true;
          }
        } else {
          console.log(
            "❌ Restaurante não encontrado:",
            restId
          );
        }
      } else {
        console.log(
          "❌ Carrinho sem restaurantId!"
        );
      }
    }
  }

  return resultado;
};

// =========================
// CARREGAR TUDO
// =========================
export const carregarCheckout = async (user) => {
  const {
    cart,
    bebidasCart,
    docesCart
  } = carregarCarrinhos();

  const bairros = await carregarBairros();

  const {
    address,
    selectedBairro,
    taxaFinal,
    entregaDisponivel
  } = await carregarEnderecoUsuario(
    user,
    bairros,
    cart
  );

  return {
    cart,
    bebidasCart,
    docesCart,
    neighborhoods: bairros,
    address,
    selectedBairro,
    taxaFinal,
    entregaDisponivel
  };
};