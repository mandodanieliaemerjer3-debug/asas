"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore"; 
import { useAuth } from "../../../contexts/AuthContext";
import RodapeNav from "../../../components/RodapeNav";
import CarrinhoGlobal from "../../../components/CarrinhoGlobal";
import ModalMontarProduto from "../../../components/ModalMontarProduto";
import soundManager from "../../../lib/sounds";

export default function PaginaExclusivaRestaurante() {

  const params = useParams();
  const id = params?.id; 

  const router = useRouter();
  const { user } = useAuth();

  const [restaurante, setRestaurante] = useState(null);
  const [cardapio, setCardapio] = useState([]);
  const [cart, setCart] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  // =========================
  // CARREGAR DADOS (100% FIREBASE)
  // =========================
  useEffect(() => {
    if (!id) return;

    const unsubRestaurante = onSnapshot(doc(db, "restaurants", id), (docSnap) => {
      if (docSnap.exists()) {
        setRestaurante({ id: docSnap.id, ...docSnap.data() });
      }
    });

    const q = query(collection(db, "products"), where("restaurantId", "==", id));
    
    const unsubProdutos = onSnapshot(q, (querySnapshot) => {
      const produtosFirebase = querySnapshot.docs.map((doc) => {
        const dados = doc.data();
        return {
          id: doc.id,
          ...dados,
          name: dados.n || dados.name,
          description: dados.d || dados.description,
          price: dados.p || dados.price,
          image: dados.img || dados.image,
          restaurantId: id
        };
      });

      setCardapio(produtosFirebase);
    });

    return () => {
      unsubRestaurante();
      unsubProdutos();
    };
  }, [id]);

  // =========================
  // CARREGAR CARRINHO
  // =========================
  useEffect(() => {
    const saved = localStorage.getItem("carrinho");
    if (saved) setCart(JSON.parse(saved));

    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });
    return () => unsub();
  }, [user]);

  // =========================
  // ADICIONAR AO CARRINHO
  // =========================
  const adicionarAoCarrinho = (item) => {
    soundManager.play("add");

    const itemAprimorado = {
      ...item,
      restaurantId: id,
      restaurantName: restaurante?.name || "Desconhecido"
    };

    const carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");

    if (carrinho.length > 0 && carrinho[0].restaurantId !== itemAprimorado.restaurantId) {
      alert("Limpando sacola para trocar de restaurante...");
      localStorage.removeItem("carrinho");
      const novoCarrinho = [{ ...itemAprimorado }];
      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
      setCart(novoCarrinho);
      return;
    }

    const novo = [...carrinho, itemAprimorado];
    localStorage.setItem("carrinho", JSON.stringify(novo));
    setCart(novo);
  };

  if (!restaurante) {
    return <div className="h-screen flex items-center justify-center bg-white font-black animate-bounce text-red-600">Carregando...</div>;
  }

  return (
    <main className="min-h-screen bg-white pb-40 max-w-md mx-auto shadow-2xl relative overflow-x-hidden font-sans">
      {/* HEADER */}
      <div className="relative h-64 w-full">
        <img src={restaurante.banner} className="w-full h-full object-cover" alt="" />
        <button onClick={() => router.back()} className="absolute top-6 left-6 w-12 h-12 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center text-white border border-white/20">←</button>
      </div>

      {/* CARDÁPIO */}
      <section className="mt-10 px-6">
        <h2 className="font-black text-[11px] uppercase italic text-gray-400 mb-6">Cardápio Completo</h2>
        <div className="grid gap-6">
          {cardapio.map((item) => (
            <div key={item.id} className="flex gap-5 p-4 border rounded-[30px]">
              <img src={item.image} className="w-24 h-24 rounded-2xl object-cover" alt="" />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-400">{item.description}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-red-600 font-black">R$ {item.price?.toFixed(2)}</span>
                  <button
                    onClick={() => {
                      // 🔥 LÓGICA CORRIGIDA: VERIFICA SE PRECISA DE MODAL OU ADICIONA DIRETO
                      const ehConfiguravel = 
                        item.forma === "selecao_sabor" || 
                        item.category === "lanche" || 
                        item.category === "pizza" || 
                        item.category === "marmita" || 
                        item.category === "sorvete";

                      if (ehConfiguravel) {
                        setProdutoSelecionado(item);
                        setModalAberto(true);
                      } else {
                        adicionarAoCarrinho(item);
                      }
                    }}
                    className="bg-black text-white px-4 py-2 rounded-xl text-xs"
                  >
                    + Pedir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {modalAberto && produtoSelecionado && (
        <ModalMontarProduto
          produto={produtoSelecionado}
          onClose={() => setModalAberto(false)}
          onConfirm={(itemPronto) => {
            adicionarAoCarrinho(itemPronto);
            setModalAberto(false);
          }}
        />
      )}

      <RodapeNav saldo={userProfile?.moedas || 0} cartCount={cart.length} router={router} />
      <CarrinhoGlobal />
    </main>
  );
}