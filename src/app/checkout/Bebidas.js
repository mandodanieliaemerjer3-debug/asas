"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase"; 
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export default function Bebidas({ onAdd, userId }) {
  const [bebidas, setBebidas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarDados = async () => {
      setLoading(true);
      try {
        // 1. Identifica o usuário (usa o Armando como padrão se não vier ID)
        const idFinal = userId || "qALhcgk3B9cEiix7W35sjNvcYou2"; 
        
        // 2. Busca interesses
        let interessesUsuario = [];
        const userSnap = await getDoc(doc(db, "users", idFinal));
        if (userSnap.exists()) {
          interessesUsuario = (userSnap.data().interesses || []).map(i => i.toLowerCase().trim());
        }

        // 3. Busca bebidas
        const snap = await getDocs(collection(db, "bebidas"));
        let lista = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 4. 🔥 Ordenação por Relevância (Nome e Tags)
        lista.sort((a, b) => {
          const nomeA = a.nome?.toLowerCase() || "";
          const nomeB = b.nome?.toLowerCase() || "";
          const tagsA = (a.tags || []).map(t => t.toLowerCase().trim());
          const tagsB = (b.tags || []).map(t => t.toLowerCase().trim());

          // Match no nome dá bônus alto
          const matchNomeA = interessesUsuario.some(i => nomeA.includes(i)) ? 50 : 0;
          const matchNomeB = interessesUsuario.some(i => nomeB.includes(i)) ? 50 : 0;
          
          // Match nas tags dá bônus acumulativo
          const matchTagsA = tagsA.filter(t => interessesUsuario.includes(t)).length * 10;
          const matchTagsB = tagsB.filter(t => interessesUsuario.includes(t)).length * 10;

          return (matchNomeB + matchTagsB) - (matchNomeA + matchTagsA);
        });

        setBebidas(lista);
      } catch (error) {
        console.error("Erro ao carregar recomendações:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarDados();
  }, [userId]);

  if (loading && bebidas.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 ml-1">
        <span className="text-lg">🥤</span>
        <p className="font-bold text-white/80 text-sm">Recomendados para você</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
        {bebidas.map(b => (
          <div 
            key={b.id} 
            className="min-w-[150px] max-w-[150px] bg-white p-3 rounded-3xl shadow-lg flex flex-col items-center justify-between transition-transform active:scale-95"
          >
            <div className="w-full">
              {b.imagem ? (
                <img src={b.imagem} alt={b.nome} className="w-full h-24 object-contain rounded-xl" />
              ) : (
                <div className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center text-[10px] text-gray-400">sem foto</div>
              )}

              <div className="mt-3 px-1">
                <p className="text-[12px] font-extrabold text-zinc-900 line-clamp-2 h-9 leading-tight">
                  {b.nome}
                </p>
                <p className="text-sm text-green-600 font-black mt-1">
                  R$ {Number(b.preco).toFixed(2)}
                </p>
              </div>
            </div>

            <button
              onClick={() => onAdd(b)}
              className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-black py-2.5 rounded-2xl shadow-orange-200 shadow-md transition-colors"
            >
              Adicionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}