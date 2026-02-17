"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
// IMPORTANDO OS DADOS LOCAIS
import itensEspeciais from "../../data/especiais.json";
import bannersData from "../../data/banners.json";
import BannerCarrossel from "../../components/BannerCarrossel";

export default function EspeciaisPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Alta Gastronomia");
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const addToCart = (p) => {
    const newCart = [...cart, p];
    setCart(newCart);
    localStorage.setItem("carrinho", JSON.stringify(newCart));
  };

  const produtosFiltrados = itensEspeciais.filter(p => p.category === activeTab);

  return (
    <main className="min-h-screen bg-gray-900 text-white pb-32 font-sans max-w-md mx-auto shadow-2xl relative border-x border-gray-800 overflow-x-hidden">
      
      {/* HEADER PREMIUM */}
      <header className="p-4 flex items-center justify-between bg-black/40 sticky top-0 z-30 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-2xl active:scale-110 transition">←</button>
          <h1 className="font-black text-lg italic tracking-tighter uppercase">Reservas Premium</h1>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-yellow-500">🪙 {user ? "150" : "0"}</span>
        </div>
      </header>

      {/* CARROSSEL AUTOMÁTICO */}
      <section className="px-4 mt-4">
         <BannerCarrossel imagens={bannersData[activeTab] || []} />
      </section>

      {/* SELETOR EM DUAS FILEIRAS (PARA CABER TUDO SEM ROLAGEM) */}
      <div className="mt-6 px-4">
        <div className="grid grid-cols-2 gap-2">
          {["Alta Gastronomia", "Festas", "Bolos", "Fitness"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 rounded-2xl font-black text-[9px] uppercase transition-all border-2
                ${activeTab === tab 
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                  : 'bg-transparent text-gray-500 border-gray-800'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE PRODUTOS PREMIUM */}
      <section className="px-4 grid gap-4 mt-6">
        {produtosFiltrados.map(p => (
          <div key={p.id} className="bg-white/5 rounded-[32px] overflow-hidden flex gap-4 p-2 border border-white/10 backdrop-blur-md hover:bg-white/10 transition">
             <div className="w-24 h-24 flex-shrink-0">
               <img src={p.image} className="w-full h-full rounded-[24px] object-cover" alt={p.name} />
             </div>
             <div className="flex-1 py-1 flex flex-col justify-between">
                <div>
                   <h3 className="font-bold text-[11px] leading-tight line-clamp-1">{p.name}</h3>
                   <p className="text-[9px] text-gray-500 line-clamp-2 mt-1 leading-tight">{p.description}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                   <span className="text-yellow-500 font-black text-xs italic">R$ {p.price.toFixed(2)}</span>
                   <button 
                     onClick={() => addToCart(p)}
                     className="bg-white text-black px-4 py-2 rounded-xl font-black text-[9px] uppercase active:scale-90 transition shadow-sm"
                   >
                     + Adicionar
                   </button>
                </div>
             </div>
          </div>
        ))}
      </section>

      {/* CARRINHO FLUTUANTE */}
      {cart.length > 0 && (
        <div 
          onClick={() => router.push("/checkout")}
          className="fixed bottom-6 left-4 right-4 max-w-[360px] mx-auto bg-red-600 text-white p-4 rounded-[24px] shadow-2xl flex justify-between items-center z-50 cursor-pointer border-4 border-white/10"
        >
           <div className="flex items-center gap-3">
              <div className="bg-white text-red-600 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs">{cart.length}</div>
              <span className="font-black text-[10px] uppercase tracking-widest">Ver Sacola</span>
           </div>
           <span className="font-black text-sm">R$ {cart.reduce((a, b) => a + Number(b.price), 0).toFixed(2)}</span>
        </div>
      )}
    </main>
  );
}