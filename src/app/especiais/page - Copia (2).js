"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
// IMPORTANDO O JSON DE ESPECIAIS
import itensEspeciais from "../../data/especiais.json";

export default function EspeciaisPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Alta Gastronomia");
  const [cart, setCart] = useState([]);

  // Banners que mudam conforme a categoria
  const bannersEspeciais = {
    "Alta Gastronomia": "https://img.freepik.com/fotos-premium/chef-preparando-prato-gourmet-em-restaurante-de-luxo_181206-3820.jpg",
    "Festas": "https://img.freepik.com/fotos-premium/mesa-de-festa-com-salgados-e-doces-decorados_181206-3820.jpg",
    "Bolos": "https://img.freepik.com/fotos-premium/bolo-confeitado-luxuoso-para-eventos_181206-3820.jpg",
    "Fitness": "https://img.freepik.com/fotos-premium/preparacao-de-marmitas-saudaveis-para-a-semana_181206-3820.jpg"
  };

  // Carrega o carrinho existente ao abrir a página
  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Função para adicionar à sacola (mesma lógica da Home)
  const addToCart = (p) => {
    const newCart = [...cart, p];
    setCart(newCart);
    localStorage.setItem("carrinho", JSON.stringify(newCart));
  };

  const produtosFiltrados = itensEspeciais.filter(p => p.category === activeTab);

  return (
    <main className="min-h-screen bg-gray-900 text-white pb-32 font-sans">
      
      {/* HEADER PREMIUM */}
      <header className="p-4 flex items-center justify-between bg-black/40 sticky top-0 z-30 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-2xl hover:scale-110 transition">←</button>
          <h1 className="font-black text-lg italic tracking-tighter uppercase">Reservas Premium</h1>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-yellow-500">🪙 {user ? "150" : "0"}</span>
        </div>
      </header>

      {/* BANNER DINÂMICO */}
      <div className="relative h-72 w-full overflow-hidden">
        <img src={bannersEspeciais[activeTab]} className="w-full h-full object-cover opacity-40 transition-all duration-1000" alt="Banner" />
        <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-gray-900 via-transparent">
           <span className="bg-yellow-500 text-black font-black text-[9px] px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-widest shadow-xl">Menu Especial</span>
           <h2 className="text-5xl font-black uppercase leading-none italic">{activeTab}</h2>
           <p className="text-gray-400 text-xs mt-3 max-w-xs font-medium">Produtos exclusivos sob encomenda com alto padrão de qualidade.</p>
        </div>
      </div>

      {/* SELETOR DE CATEGORIAS (FILTROS) */}
      <div className="flex gap-3 overflow-x-auto p-6 scrollbar-hide">
        {["Alta Gastronomia", "Festas", "Bolos", "Fitness"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 rounded-3xl font-black text-[10px] uppercase whitespace-nowrap transition-all border-2
              ${activeTab === tab ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LISTA DE PRODUTOS PREMIUM */}
      <section className="px-6 grid gap-6">
        {produtosFiltrados.length === 0 ? (
          <div className="py-20 text-center text-gray-600 border-2 border-dashed border-gray-800 rounded-[40px]">
            <p className="text-sm font-bold">Nenhum item disponível nesta categoria.</p>
          </div>
        ) : (
          produtosFiltrados.map(p => (
            <div key={p.id} className="bg-white/5 rounded-[40px] overflow-hidden flex flex-col sm:flex-row gap-4 p-3 border border-white/10 backdrop-blur-md group hover:bg-white/10 transition-all">
               <div className="w-full sm:w-32 h-32 rounded-[32px] overflow-hidden flex-shrink-0">
                  <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
               </div>
               <div className="flex-1 py-2 flex flex-col justify-between">
                  <div>
                     <h3 className="font-bold text-base leading-tight">{p.name}</h3>
                     <p className="text-[11px] text-gray-500 mt-2 font-medium">{p.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                     <div className="flex flex-col">
                        <span className="text-green-400 font-black text-lg italic">R$ {p.price.toFixed(2)}</span>
                        <span className="text-[9px] text-yellow-500 font-black uppercase tracking-tighter">Reserva Antecipada</span>
                     </div>
                     <button 
                        onClick={() => addToCart(p)}
                        className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[11px] uppercase shadow-lg active:scale-90 transition-all"
                     >
                        + Adicionar
                     </button>
                  </div>
               </div>
            </div>
          ))
        )}
      </section>

      {/* CARRINHO FLUTUANTE (SACOLA) - SÓ APARECE SE TIVER ITENS */}
      {cart.length > 0 && (
        <div 
          onClick={() => router.push("/checkout")}
          className="fixed bottom-8 left-8 right-8 bg-red-600 text-white p-5 rounded-[32px] shadow-[0_20px_40px_rgba(220,38,38,0.3)] flex justify-between items-center z-50 animate-slide-up cursor-pointer hover:bg-red-700 transition-all border-4 border-white/10"
        >
           <div className="flex items-center gap-4">
              <div className="bg-white text-red-600 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm">{cart.length}</div>
              <span className="font-black text-sm uppercase tracking-widest">Ver Sacola</span>
           </div>
           <span className="font-black text-lg italic">R$ {cart.reduce((a, b) => a + Number(b.price), 0).toFixed(2)}</span>
        </div>
      )}

    </main>
  );
}