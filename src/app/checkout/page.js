"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs, getDoc, doc, addDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

import Bebidas from "./Bebidas";
import Endereco from "./Endereco";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [bebidasCart, setBebidasCart] = useState([]);
  const [docesCart, setDocesCart] = useState([]);

  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedBairro, setSelectedBairro] = useState(null);
  const [taxaFinal, setTaxaFinal] = useState(0);

  const [address, setAddress] = useState({ rua: "", numero: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setCart(JSON.parse(localStorage.getItem("carrinho") || "[]"));
      setBebidasCart(JSON.parse(localStorage.getItem("bebidasCarrinho") || "[]"));
      setDocesCart(JSON.parse(localStorage.getItem("docesCarrinho") || "[]"));

      const snap = await getDocs(collection(db, "neighborhoods"));
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNeighborhoods(lista);

      if (user) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();

          if (data.endereco) {
            setAddress({
              rua: data.endereco.rua || "",
              numero: data.endereco.numero || ""
            });

            if (data.endereco.bairroId) {
              const bairro = lista.find(b => b.id === data.endereco.bairroId);
              if (bairro) {
                setSelectedBairro(bairro);
                setTaxaFinal(bairro.fee || 0);
              }
            }
          }
        }
      }

      setLoading(false);
    };

    init();
  }, [user]);

  // REMOVER
  const removerItem = (i) => {
    const novo = cart.filter((_, index) => index !== i);
    setCart(novo);
    localStorage.setItem("carrinho", JSON.stringify(novo));
  };

  const removerBebida = (i) => {
    const novo = bebidasCart.filter((_, index) => index !== i);
    setBebidasCart(novo);
    localStorage.setItem("bebidasCarrinho", JSON.stringify(novo));
  };

  const removerDoce = (i) => {
    const novo = docesCart.filter((_, index) => index !== i);
    setDocesCart(novo);
    localStorage.setItem("docesCarrinho", JSON.stringify(novo));
  };

  // VALORES
  const subtotal = cart.reduce((a, b) => a + (b.price || 0), 0);
  const totalBebidas = bebidasCart.reduce((a, b) => a + (b.preco || 0), 0);
  const totalDoces = docesCart.reduce((a, b) => a + (b.preco || 0), 0);

  const moedas = Math.floor(taxaFinal * 0.8);
  const total = subtotal + totalBebidas + totalDoces + taxaFinal;

  // FINALIZAR
  const confirmarPedido = async () => {
    if (!address.rua || !selectedBairro)
      return alert("Preencha o endereço");

    if (cart.length === 0)
      return alert("Seu carrinho está vazio");

    const pedido = {
      clienteId: user?.uid || "anonimo",
      endereco: {
        ...address,
        bairro: selectedBairro.name,
        bairroId: selectedBairro.id
      },
      itens: cart,
      bebidas: bebidasCart,
      doces: docesCart,
      valores: { total },
      criadoEm: new Date().toISOString()
    };

    const ref = await addDoc(collection(db, "orders"), pedido);

    localStorage.removeItem("carrinho");
    localStorage.removeItem("bebidasCarrinho");
    localStorage.removeItem("docesCarrinho");

    router.push(`/pagamento/${ref.id}`);
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto p-4 pb-40">

      {/* BANNER */}
      <img
        src="/banner-doces.png"
        className="w-full h-28 object-cover object-center rounded-2xl mb-4"
      />

      {/* ENDEREÇO */}
      <Endereco
        address={address}
        setAddress={setAddress}
        neighborhoods={neighborhoods}
        selectedBairro={selectedBairro}
        setSelectedBairro={setSelectedBairro}
        setTaxaFinal={setTaxaFinal}
      />

      {/* 🔥 BEBIDAS (REPETIDOR AGORA EM CIMA) */}
      <Bebidas
        onAdd={(b) => {
          const novo = [...bebidasCart, b];
          setBebidasCart(novo);
          localStorage.setItem("bebidasCarrinho", JSON.stringify(novo));
        }}
      />

      {/* 🛒 CARRINHO PRINCIPAL */}
      <div className="bg-white p-4 rounded-2xl mb-4">
        <p className="font-bold mb-2">🍔 Pedido</p>

        {cart.map((item, i) => (
          <div key={i} className="flex justify-between mb-1">
            <span>{item.name}</span>
            <div className="flex gap-2">
              <span>R$ {item.price}</span>
              <button onClick={() => removerItem(i)}>❌</button>
            </div>
          </div>
        ))}
      </div>

      {/* 🥤 LISTA BEBIDAS */}
      {bebidasCart.length > 0 && (
        <div className="bg-white p-4 rounded-2xl mb-4">
          <p className="font-bold mb-2">🥤 Bebidas</p>

          {bebidasCart.map((b, i) => (
            <div key={i} className="flex justify-between mb-1">
              <span>{b.nome}</span>
              <div className="flex gap-2">
                <span>R$ {b.preco}</span>
                <button onClick={() => removerBebida(i)}>❌</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🍰 SOBREMESAS */}
      {docesCart.length > 0 && (
        <div className="bg-white p-4 rounded-2xl mb-4">
          <p className="font-bold mb-2">🍰 Sobremesas</p>

          {docesCart.map((d, i) => (
            <div key={i} className="flex justify-between mb-1">
              <span>{d.nome}</span>
              <div className="flex gap-2">
                <span>R$ {d.preco}</span>
                <button onClick={() => removerDoce(i)}>❌</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🍰 BOTÃO GRANDE DOCES */}
      <div className="bg-pink-100 p-4 rounded-3xl mb-4 text-center">
        <p className="font-black text-pink-700 text-lg">
          Ganhe 80% do frete
        </p>

        <button
          onClick={() => router.push(`/doces?credito=${moedas}`)}
          className="mt-3 w-full bg-pink-500 text-white p-4 rounded-2xl font-bold text-lg"
        >
          ESCOLHER SOBREMESA 🍰
        </button>
      </div>

      {/* TOTAL */}
      <div className="bg-white p-4 rounded-2xl">
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>R$ {total}</span>
        </div>
      </div>

      {/* FINALIZAR */}
      <button
        onClick={confirmarPedido}
        className="fixed bottom-0 left-0 right-0 bg-black text-white p-5 font-bold text-lg"
      >
        FINALIZAR PEDIDO
      </button>
    </div>
  );
}