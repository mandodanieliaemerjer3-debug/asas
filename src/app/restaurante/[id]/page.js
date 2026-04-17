"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import RodapeNav from "../../../components/RodapeNav";

export default function PaginaExclusivaRestaurante() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const { user } = useAuth();

  const [restaurante, setRestaurante] = useState(null);
  const [cardapio, setCardapio] = useState([]);
  const [cart, setCart] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (!id) return;

    // 1. Busca Dados Dinâmicos do Restaurante (Banner e Logo do Firebase)
    const unsubRes = onSnapshot(doc(db, "restaurants", id), (docSnap) => {
      if (docSnap.exists()) setRestaurante(docSnap.data());
    });

    // 2. Filtra apenas os produtos deste restaurante específico
    const q = query(collection(db, "products"), where("restaurantId", "==", id));
    const unsubProd = onSnapshot(q, (snap) => {
      setCardapio(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubRes(); unsubProd(); };
  }, [id]);

  // Sincroniza Moedas e Perfil
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });
    return () => unsub();
  }, [user]);

  if (!restaurante) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="animate-bounce font-black italic uppercase text-red-600">Mogu Mogu Cozinha...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-white pb-40 max-w-md mx-auto shadow-2xl relative overflow-x-hidden font-sans">
      
      {/* 📸 HEADER IMPACTANTE: FOTO DA EQUIPE (BANNER) */}
      <div className="relative h-64 w-full">
        <img 
          src={restaurante.banner || "/images/placeholder-banner.jpg"} 
          className="w-full h-full object-cover" 
          alt="Equipe do Restaurante" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/40"></div>
        
        {/* Botão Voltar Transparente */}
        <button 
          onClick={() => router.back()} 
          className="absolute top-6 left-6 w-12 h-12 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition"
        >
          ←
        </button>
      </div>

      {/* 🏬 IDENTIDADE VISUAL: LOGO (FACHADA) SOBREPOSTO */}
      <div className="px-6 -mt-16 relative z-10 flex items-end gap-5">
        <div className="w-28 h-28 rounded-[35px] border-[6px] border-white shadow-2xl overflow-hidden bg-gray-50 transform rotate-3">
          <img 
            src={restaurante.logo} 
            className="w-full h-full object-cover" 
            alt="Logo do Estabelecimento" 
          />
        </div>
        <div className="mb-2 pb-1">
          <h1 className="text-gray-900 font-black text-2xl uppercase italic leading-tight tracking-tighter">
            {restaurante.name}
          </h1>
          <div className="flex gap-2 mt-1">
            <span className="bg-black text-white text-[8px] font-black px-3 py-1 rounded-full uppercase italic">
              {restaurante.category}
            </span>
            {restaurante.aberto !== false && (
              <span className="bg-green-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase italic animate-pulse">
                Aberto Agora
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ⭐ DESTAQUE: MODA DO CHEF */}
      {cardapio.some(p => p.tags?.includes("chef")) && (
        <section className="mt-10 px-6">
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-black text-[11px] uppercase italic text-orange-600 tracking-widest">
              👨‍🍳 Sugestões do Chef
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {cardapio.filter(p => p.tags?.includes("chef")).map(item => (
              <div key={item.id} className="min-w-[160px] bg-orange-50/50 p-4 rounded-[40px] border border-orange-100/50 shadow-sm">
                <img src={item.image} className="w-full h-28 object-cover rounded-[30px] mb-3 shadow-md" />
                <p className="font-black text-[10px] uppercase italic text-gray-800 line-clamp-1">{item.name}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-orange-600 font-black text-sm italic">R$ {item.price?.toFixed(2)}</span>
                  <button className="bg-orange-500 text-white w-7 h-7 rounded-full font-black">+</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 🍔 CARDÁPIO COMPLETO */}
      <section className="mt-10 px-6">
        <h2 className="font-black text-[11px] uppercase italic text-gray-400 mb-6 tracking-[0.2em]">
          Cardápio Completo
        </h2>
        <div className="grid gap-6">
          {cardapio.map(item => (
            <div 
              key={item.id} 
              className="flex items-center gap-5 p-4 bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              <div className="relative">
                 <img src={item.image} className="w-24 h-24 rounded-[30px] object-cover shadow-inner" />
                 {item.popular && (
                   <span className="absolute -top-2 -left-2 bg-red-600 text-white text-[7px] font-black px-2 py-1 rounded-lg uppercase italic shadow-lg">Popular</span>
                 )}
              </div>
              <div className="flex-1 flex flex-col h-24 justify-center">
                <h3 className="font-black text-[13px] uppercase italic text-gray-800 leading-tight">
                  {item.name}
                </h3>
                <p className="text-[9px] text-gray-400 font-bold mt-1 line-clamp-2 leading-none italic uppercase">
                  {item.description || "Ingredientes selecionados de Guapiara"}
                </p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-red-600 font-black text-base italic tracking-tighter">R$ {item.price?.toFixed(2)}</span>
                  <button className="bg-black text-white px-6 py-2 rounded-2xl font-black text-[9px] uppercase italic shadow-lg active:bg-red-600 transition">
                    + Pedir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rodapé Dinâmico com Saldo do Firebase */}
      <RodapeNav 
        saldo={userProfile?.moedas || 0} 
        cartCount={cart.length} 
        router={router} 
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}