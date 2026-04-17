"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import RodapeNav from "../../components/RodapeNav";

export default function VerTodosFeed() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagFiltro = searchParams.get("tag") || "#marmita"; // Pega a tag da URL

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca apenas os produtos que contêm a tag clicada
    const q = query(collection(db, "products"));
    
    const unsub = onSnapshot(q, (snap) => {
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filtra manualmente para garantir que a tag esteja dentro da string de tags
      const filtrados = todos.filter(p => p.tags?.includes(tagFiltro));
      
      setProducts(filtrados);
      setLoading(false);
    });

    return () => unsub();
  }, [tagFiltro]);

  return (
    <main className="min-h-screen bg-gray-50 pb-32 max-w-md mx-auto relative font-sans">
      {/* HEADER FIXO COM VOLTAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-2xl text-gray-800 font-black">←</button>
        <h1 className="font-black uppercase italic text-sm text-red-600 tracking-widest">
          Explorar: {tagFiltro.replace("#", "")}
        </h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-96 font-black text-gray-300 animate-pulse uppercase text-xs">
          Buscando o melhor para você...
        </div>
      ) : (
        <div className="flex flex-col gap-6 p-4">
          {products.map((p) => (
            <div 
              key={p.id} 
              className="bg-white rounded-[40px] shadow-2xl border border-gray-50 overflow-hidden active:scale-[0.98] transition-all"
              onClick={() => router.push(p.videoId ? `/mogu-tv?v=${p.videoId}` : `/detalhes/${p.id}`)}
            >
              {/* IMAGEM GRANDE (FULL WIDTH) */}
              <div className="h-72 w-full relative">
                <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                {p.coinPrice > 0 && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-[10px] font-black px-4 py-2 rounded-full shadow-lg">
                    🪙 {p.coinPrice} CASHBACK
                  </div>
                )}
              </div>

              {/* INFO DO PRODUTO */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      {p.tags?.split("#")[1] || "Destaque"}
                    </p>
                    <h2 className="text-xl font-black text-gray-900 uppercase italic leading-none">
                      {p.name}
                    </h2>
                  </div>
                  <span className="text-2xl font-black text-green-600 italic">R$ {p.price.toFixed(2)}</span>
                </div>

                <p className="text-gray-500 text-sm font-medium line-clamp-2 mb-4 leading-tight">
                  {p.description || "Sem descrição disponível para este lanche."}
                </p>

                <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase italic shadow-xl shadow-red-100">
                  Pedir agora
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RODAPÉ PADRÃO */}
      <RodapeNav saldo={0} cartCount={0} router={router} />
    </main>
  );
}