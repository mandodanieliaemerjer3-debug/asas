import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export const prepararPedido = ({
  user,
  cart,
  bebidasCart,
  docesCart,
  address,
  selectedBairro,
  subtotal,
  taxaFinal,
  total,
  dadosTroco
}) => {
  // O restaurante principal é o parceiro (onde sai a comida)
  const restauranteDoCarrinho = cart.length > 0 ? cart.restaurantId : "adega_geral";

  return {
    clienteId: user?.uid || "anonimo",
    clienteNome: user?.displayName || "Usuário Mogu",
    restaurantId: restauranteDoCarrinho,
    adegaId: "adega_geral", // Adega Central cuida de bebidas/doces
    temBebidas: bebidasCart.length > 0,
    temDoces: docesCart.length > 0,
    endereco: {
      ...address,
      bairro: selectedBairro?.name || "",
      bairroId: selectedBairro?.id || ""
    },
    itens: cart.map(item => ({ id: item.id, name: item.name, price: item.price })),
    bebidas: bebidasCart.map(b => ({ id: b.id, nome: b.nome, preco: b.preco })),
    doces: docesCart.map(d => ({ id: d.id, nome: d.nome, preco: d.preco })),
    valores: { 
        subtotal, 
        taxaEntrega: taxaFinal, 
        total, 
        cashback: Math.floor((taxaFinal || 0) * 0.8) 
    },
    detalhesTroco: {
      precisa: dadosTroco.precisa,
      // O que o motoboy deve levar: Se não precisa, é o total. Se precisa, é o valor inputado.
      valorLevar: dadosTroco.precisa ? dadosTroco.valorInput : total,
      trocoCalculado: dadosTroco.precisa ? (dadosTroco.valorInput - total).toFixed(2) : 0
    },
    status: "Pendente",
    statusEntrega: "preparando",
    criadoEm: serverTimestamp()
  };
};

export const salvarPedido = async (pedido) => {
  const agora = new Date();
  const id = `${String(agora.getDate()).padStart(2, '0')}_${String(agora.getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  await setDoc(doc(db, "orders", id), pedido);
  return id;
};

export const limparCarrinho = () => {
  localStorage.removeItem("carrinho");
  localStorage.removeItem("bebidasCarrinho");
  localStorage.removeItem("docesCarrinho");
};