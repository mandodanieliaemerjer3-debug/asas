import {
  collection,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../../lib/firebase";

// ==========================================
// 1. PREPARAR PEDIDO
// ==========================================
export const prepararPedido = ({
  user,
  cart,
  bebidasCart,
  docesCart,
  address,
  selectedBairro,
  subtotal,
  taxaFinal,
  total
}) => {

  // Identifica o restaurante principal baseado no primeiro item válido do carrinho
  const restauranteDoCarrinho =
    cart.length > 0 && cart.restaurantId
      ? cart.restaurantId
      : "adega_geral";

  // Cálculo das moedas de cashback com base na taxa de entrega
  const moedasCalculadas = Math.floor((taxaFinal || 0) * 0.8);

  // Retorna o objeto estruturado exatamente como o banco espera receber
  return {
    clienteId: user?.uid || "anonimo",
    clienteNome: user?.displayName || "Usuário Mogu",
    restaurantId: restauranteDoCarrinho,
    temBebidas: bebidasCart.length > 0,
    temDoces: docesCart.length > 0,
    endereco: {
      ...address,
      bairro: selectedBairro?.name || "",
      bairroId: selectedBairro?.id || "",
      linhaId: String(selectedBairro?.linha || "Sem Linha")
    },
    // Se o item individual não tiver restaurantId, ele herda o do restaurante do carrinho automaticamente
    itens: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      restaurantId: item.restaurantId || restauranteDoCarrinho, 
      isBolo: item.isBolo || false,
      peso: item.peso || 0
    })),
    bebidas: bebidasCart,
    doces: docesCart,
    valores: {
      subtotal: subtotal || 0,
      taxaEntrega: taxaFinal || 0,
      total: total || 0,
      cashback: moedasCalculadas // 🟢 CORRIGIDO: Agora aponta para a constante certa!
    },
    status: "Pendente",
    statusEntrega: "preparando",
    confirmadoEm: serverTimestamp(),
    criadoEm: new Date().toISOString()
  };
};

// ==========================================
// 2. SALVAR PEDIDO (GERANDO ID COM DIA/MÊS)
// ==========================================
export const salvarPedido = async (pedido) => {
  const agora = new Date();
  
  // Extrai o dia e o mês garantindo duas casas decimais (Ex: 17_05)
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0'); 
  
  // Cria um hash de segurança curto com 6 caracteres maiúsculos
  const hashAleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Junta no novo formato legível: DIA_MES-HASH
  const novoIdCustomizado = `${dia}_${mes}-${hashAleatorio}`;

  // Cria a referência explícita usando o setDoc na coleção orders
  const docRef = doc(db, "orders", novoIdCustomizado);

  // Grava de forma assíncrona no banco de dados
  await setDoc(docRef, pedido);

  // Retorna a string para o roteador do Next.js seguir em frente
  return novoIdCustomizado;
};

// ==========================================
// 3. LIMPAR STORAGE
// ==========================================
export const limparCarrinho = () => {
  localStorage.removeItem("carrinho");
  localStorage.removeItem("bebidasCarrinho");
  localStorage.removeItem("docesCarrinho");
};

// ==========================================
// 4. VALIDAR CHECKOUT
// ==========================================
export const validarCheckout = ({
  address,
  selectedBairro,
  cart,
  bebidasCart
}) => {
  if (!address?.rua || !selectedBairro) {
    return {
      valido: false,
      mensagem: "Preencha o endereço"
    };
  }

  if (cart.length === 0 && bebidasCart.length === 0) {
    return {
      valido: false,
      mensagem: "Seu carrinho está vazio"
    };
  }

  return {
    valido: true
  };
};