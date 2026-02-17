"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

import comidasLocais from "../../../data/comidas.json";
import restaurantesLocais from "../../../data/restaurantes.json";

export default function PaginaDoRestaurante() {
  const params = useParams();
  const id = params?.id;
  
  const router = useRouter();
  const { user } = useAuth();

  const [restaurante, setRestaurante] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [cardapio, setCardapio] = useState([]);
  const [cart, setCart] = useState([]);
  const [saldoReal, setSaldoReal] = useState(0);

  // FUNÇÃO DE PARTILHA
  const compartilharCardapio = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cardápio - ${restaurante.name}`,
          text: `Confira o nosso cardápio no Guapiara Delivery e peça agora!`,
          url: window.location.href, // Pega o link exato da página atual
        });
      } catch (err) {
        console.log("Erro ao partilhar", err);
      }
    } else {
      // Caso o navegador não suporte partilha (PC antigo), copia o link
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado para a área de transferência!");
    }
  };

  useEffect(() => {
    if (!id) return;
    const lojaEncontrada = restaurantesLocais.find(r => String(r.id) === String(id));
    if (lojaEncontrada) {
      setRestaurante(lojaEncontrada);
      const itensFiltrados = comidasLocais.filter(item => String(item.restaurantId) === String(id));
      setCardapio(itensFiltrados);
    }
    setCarregando(false);
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setSaldoReal(snap.data().moedas || 0);
    });
    return () => unsub();
  }, [user]);

  const adicionarAoCarrinho = (item) => {
    const currentCart = localStorage.getItem("carrinho") ? JSON.parse(localStorage.getItem("carrinho")) : [];
    const novoCarrinho = [...currentCart, item];
    setCart(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
  };

  if (carregando) return <div className="p-20 text-center font-black uppercase italic animate-pulse text-red-600">Carregando...</div>;

  if (!restaurante) return <div className="p-20 text-center font-black">Loja não encontrada!</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-44 font-sans max-w-md mx-auto border-x border-gray-100 text-gray-900">
      
      {/* HEADER COM BOTÃO DE PARTILHA */}
      <header className="bg-white p-6 rounded-b-[45px] shadow-sm mb-6 border-b border-gray-100 relative">
        <div className="flex justify-between items-start mb-6">
          <button onClick={() => router.push("/")} className="text-gray-300 font-black text-[9px] uppercase italic tracking-[3px]">← Guapiara Delivery</button>
          
          {/* BOTÃO DE PARTILHA */}
          <button 
            onClick={compartilharCardapio}
            className="bg-green-50 text-green-600 p-3 rounded-2xl flex items-center gap-2 active:scale-90 transition"
          >
            <span className="text-xs font-black uppercase italic">Enviar</span>
            <span className="text-lg">📲</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-50 overflow-hidden border-4 border-white shadow-md">
             <img src={restaurante.image} className="w-full h-full object-cover" alt={restaurante.name} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{restaurante.name}</h1>
            <p className="text-[9px] font-black text-red-600 uppercase mt-2 italic">Toque em "Enviar" para partilhar este cardápio</p>
          </div>
        </div>
      </header>

      {/* LISTA DE PRODUTOS */}
      <section className="px-4 space-y-4">
        {cardapio.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-[35px] shadow-sm flex items-center gap-4 border border-white">
            <img src={item.image} className="w-24 h-24 rounded-[28px] object-cover" alt={item.name} />
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase italic leading-tight">{item.name}</h3>
              <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase line-clamp-2">{item.description}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-green-600 font-black italic text-base font-mono">R$ {item.price.toFixed(2)}</span>
                <button 
                  onClick={() => adicionarAoCarrinho(item)}
                  className="bg-red-600 text-white w-10 h-10 rounded-2xl font-black text-xl shadow-lg active:scale-90 transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* RODAPÉ COM SALDO REAL */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-8 flex justify-between items-center rounded-t-[50px] shadow-[0_-15px_50px_rgba(0,0,0,0.1)]">
           <div className="bg-gray-900 px-6 py-3 rounded-full flex items-center gap-3">
              <span className="text-xl">🪙</span>
              <div className="flex flex-col text-white font-black leading-none">
                 <span className="text-[8px] text-yellow-400 uppercase tracking-tighter">Saldo</span>
                 <span className="text-base">{saldoReal}</span>
              </div>
           </div>

           {cart.length > 0 && (
             <button 
                onClick={() => router.push("/checkout")}
                className="bg-red-600 text-white px-8 py-5 rounded-3xl font-black uppercase italic text-[11px] shadow-xl"
             >
                Ver Sacola ({cart.length})
             </button>
           )}
        </div>
      </nav>
    </main>
  );
}