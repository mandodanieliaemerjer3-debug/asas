"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function EspeciaisPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Alta Gastronomia");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Banners dinâmicos que mudam conforme o selo selecionado
  const bannersEspeciais = {
    "Alta Gastronomia": "https://img.freepik.com/fotos-premium/chef-preparando-prato-gourmet-em-restaurante-de-luxo_181206-3820.jpg",
    "Festas": "https://img.freepik.com/fotos-premium/mesa-de-festa-com-salgados-e-doces-decorados_181206-3820.jpg",
    "Bolos": "https://img.freepik.com/fotos-premium/bolo-confeitado-luxuoso-para-eventos_181206-3820.jpg",
    "Fitness": "https://img.freepik.com/fotos-premium/preparacao-de-marmitas-saudaveis-para-a-semana_181206-3820.jpg"
  };

  useEffect(() => {
    const loadEspeciais = async () => {
      const pSnap = await getDocs(collection(db, "products"));
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    loadEspeciais();
  }, []);

  // Filtra apenas produtos que tenham o selo/categoria selecionada
  const produtosFiltrados = products.filter(p => p.category === activeTab);

  return (
    <main className="min-h-screen bg-gray-900 text-white pb-20">
      
      {/* HEADER LUXO */}
      <header className="p-4 flex items-center gap-4 bg-black/20 sticky top-0 z-20 backdrop-blur-md">
        <button onClick={() => router.push("/")} className="text-2xl">←</button>
        <h1 className="font-black text-xl italic tracking-tighter">ENCOMENDAS PREMIUM</h1>
      </header>

      {/* BANNER DINÂMICO COM SELO */}
      <div className="relative h-60 w-full overflow-hidden">
        <img src={bannersEspeciais[activeTab]} className="w-full h-full object-cover opacity-60 transition-all duration-700" />
        <div className="absolute inset-0 flex flex-col justify-center px-6">
           <span className="bg-yellow-500 text-black font-black text-[10px] px-3 py-1 rounded-full w-fit mb-2 uppercase shadow-lg">
             Selo {activeTab}
           </span>
           <h2 className="text-3xl font-black leading-none uppercase">Experiência<br/>{activeTab}</h2>
           <p className="text-xs mt-2 text-gray-300">Reserve com antecedência para garantir qualidade.</p>
        </div>
      </div>

      {/* SELETOR DE CATEGORIAS (FILTROS) */}
      <div className="flex gap-2 overflow-x-auto p-4 scrollbar-hide">
        {["Alta Gastronomia", "Festas", "Bolos", "Fitness"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-2xl font-bold text-xs whitespace-nowrap transition-all border
              ${activeTab === tab ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-transparent text-gray-500 border-gray-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LISTA DE PRODUTOS ESPECIAIS */}
      <section className="px-4 grid gap-6 mt-4">
        {loading ? <p className="text-center py-10">Carregando menu exclusivo...</p> : null}
        
        {produtosFiltrados.length === 0 && !loading && (
          <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-3xl">
            <p className="text-gray-500 text-sm">Nenhum item de {activeTab} disponível para reserva hoje.</p>
          </div>
        )}

        {produtosFiltrados.map(p => (
          <div key={p.id} className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-[32px] overflow-hidden flex gap-4 p-2 border border-gray-700">
             <img src={p.image} className="w-28 h-28 rounded-[24px] object-cover shadow-2xl" />
             <div className="flex-1 py-2 flex flex-col justify-between pr-2">
                <div>
                   <h3 className="font-bold text-sm">{p.name}</h3>
                   <p className="text-[10px] text-gray-400 line-clamp-2 mt-1">{p.description}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                   <div className="flex flex-col">
                      <span className="text-yellow-500 font-black text-sm">R$ {p.price}</span>
                      <span className="text-[8px] text-gray-500 uppercase font-bold">Reserva 48h</span>
                   </div>
                   <button className="bg-white text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg">Reservar</button>
                </div>
             </div>
          </div>
        ))}
      </section>

    </main>
  );
}