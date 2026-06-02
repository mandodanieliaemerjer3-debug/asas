"use client";

import { useEffect, useState } from "react";
import { db, remoteConfig } from "../../lib/firebase"; 
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { fetchAndActivate, getValue } from "firebase/remote-config";
import { useAuth } from "../../contexts/AuthContext"; 

export default function Bebidas({ onAdd }) {
  const { user } = useAuth(); 
  const [bebidas, setBebidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    titulo_secao: "Bebidas da Adega",
    tags_prioritarias: []
  });

  useEffect(() => {
    const carregarTudo = async () => {
      if (!remoteConfig) return;

      try {
        setLoading(true);

        // 1. Sincroniza as Regras de Inteligência (Remote Config)
        await fetchAndActivate(remoteConfig);
        const configRaw = getValue(remoteConfig, "estrategia_bebidas").asString();
        const estrategia = JSON.parse(configRaw || "{}");

        // 2. Busca Interesses Reais do Usuário (Firestore)
        let interessesDoUser = [];
        if (user?.uid) {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            // Garante que pegamos a lista de strings convertida para minúsculo
            interessesDoUser = (userSnap.data().interesses || []).map(i => String(i).toLowerCase().trim());
          }
        }

        // 3. Busca todas as Bebidas do Banco
        const snap = await getDocs(collection(db, "bebidas"));
        let lista = snap.docs.map(docItem => ({
          id: docItem.id,
          ...docItem.data(),
          restaurantId: "adega_geral"
        }));

        // 4. LÓGICA DE RANKING PERSONALIZADO
        const mapeamento = estrategia.mapeamento_interesses || {};
        const tagsDestaque = (estrategia.tags_prioritarias || []).map(t => String(t).toLowerCase().trim());

        lista.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          // Garante que o array de tags exista e esteja todo em minúsculo para o match ser perfeito
          const tagsA = (a.tags || []).map(t => String(t).toLowerCase().trim());
          const tagsB = (b.tags || []).map(t => String(t).toLowerCase().trim());

          // Pontuação por Interesse (Peso Alto: +50)
          interessesDoUser.forEach(interesse => {
            const tagsAlvo = (mapeamento[interesse] || []).map(t => String(t).toLowerCase().trim());
            if (tagsA.some(t => tagsAlvo.includes(t))) scoreA += 50;
            if (tagsB.some(t => tagsAlvo.includes(t))) scoreB += 50;
          });

          // Pontuação por Tags Prioritárias do Remote Config (Peso Médio: +20)
          if (tagsA.some(t => tagsDestaque.includes(t))) scoreA += 20;
          if (tagsB.some(t => tagsDestaque.includes(t))) scoreB += 20;

          // Desempate pelas tags prioritárias mais frequentes
          const matchA = tagsA.filter(t => tagsDestaque.includes(t)).length;
          const matchB = tagsB.filter(t => tagsDestaque.includes(t)).length;

          return (scoreB + matchB) - (scoreA + matchA); 
        });

        setConfig({
          titulo_secao: estrategia.titulo_secao || "Geladas da Adega",
          tags_prioritarias: tagsDestaque
        });

        setBebidas(lista.slice(0, estrategia.limite_exibicao || 15));

      } catch (error) {
        console.error("Erro na Adega Mogu:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarTudo();
  }, [user]); 

  if (loading || bebidas.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 ml-1">
        <span className="text-lg">🧊</span>
        <p className="font-black text-white/90 text-sm uppercase italic tracking-tighter">
          {config.titulo_secao}
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
        {bebidas.map((b) => {
          // Normaliza as tags do produto atual para verificar se ganha o Badge
          const pTags = (b.tags || []).map(t => String(t).toLowerCase().trim());
          const isTop = pTags.some(t => config.tags_prioritarias.includes(t));

          return (
            <div
              key={b.id}
              className="min-w-[150px] bg-white p-3 rounded-[2.5rem] shadow-xl flex flex-col justify-between transition-transform active:scale-95 border-b-4 border-gray-100"
            >
              <div className="relative">
                {isTop && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-[8px] text-white font-black px-2 py-1 rounded-full shadow-md z-10 animate-pulse">
                    TOP
                  </span>
                )}
                
                <img
                  src={b.imagem}
                  alt={b.nome}
                  className="w-full h-24 object-contain rounded-2xl"
                />
              </div>

              <div className="mt-2 px-1">
                <p className="text-[11px] font-extrabold text-zinc-900 line-clamp-2 h-7 leading-none uppercase">
                  {b.nome}
                </p>

                <p className="text-sm text-green-600 font-black mt-1">
                  R$ {Number(b.preco || 0).toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => onAdd(b)}
                className="mt-3 w-full bg-zinc-900 text-white text-[10px] font-black py-3 rounded-2xl shadow-lg active:bg-black transition-colors"
              >
                ADICIONAR
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}