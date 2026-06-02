"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function DocesClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [doces, setDoces] = useState([]);
  const [moedasIniciais, setMoedasIniciais] = useState(0); 
  const [carrinhoDoces, setCarrinhoDoces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTudo = async () => {
      try {
        setLoading(true);

        // 1. Crédito do frete vindo da URL
        const frete = Number(searchParams.get("credito")) || 0;
        
        // 2. Moedas do perfil
        const moedasPerfil = user?.moedas || 0;
        setMoedasIniciais(frete + moedasPerfil);

        // 3. Busca doces no Firestore
        const snap = await getDocs(collection(db, "doces"));
        const lista = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setDoces(lista);

        // 4. Cache local
        const salvo = localStorage.getItem("docesCarrinho");
        if (salvo) {
          setCarrinhoDoces(JSON.parse(salvo));
        }
      } catch (error) {
        console.error("Erro ao carregar doceria:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarTudo();
  }, [user, searchParams]);

  // Cálculos de memória temporária
  const totalGasto = carrinhoDoces.reduce((acc, doce) => acc + Number(doce.preco || 0), 0);
  const saldoAtual = moedasIniciais - totalGasto;

  const adicionarDoce = (doce) => {
    if (saldoAtual >= doce.preco) {
      const novoCarrinho = [...carrinhoDoces, { ...doce, restaurantId: "doceria_mogu" }];
      setCarrinhoDoces(novoCarrinho);
      localStorage.setItem("docesCarrinho", JSON.stringify(novoCarrinho));
    } else {
      alert("Saldo insuficiente!");
    }
  };

  const removerDoce = (index) => {
    const novoCarrinho = carrinhoDoces.filter((_, i) => i !== index);
    setCarrinhoDoces(novoCarrinho);
    localStorage.setItem("docesCarrinho", JSON.stringify(novoCarrinho));
  };

  if (loading) {
    return <div className="p-10 text-center font-black italic text-pink-500 uppercase">Carregando Mogu Doces...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-40 bg-gray-50 min-h-screen font-sans">
      
      {/* AREA FIXA NO TOPO (SALDO + LISTA DE RESGATES) */}
      <div className="sticky top-0 z-50 -mx-4 px-4 pt-2 bg-gray-50/80 backdrop-blur-md pb-4">
        
        {/* CARD DE SALDO */}
        <div className="bg-pink-500 text-white p-6 rounded-[2.5rem] text-center shadow-lg border-b-4 border-pink-700">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Saldo Disponível</p>
          <h1 className="text-4xl font-black italic">
            M$ {saldoAtual < 0 ? 0 : saldoAtual.toFixed(0)}
          </h1>
        </div>

        {/* LISTA DE RESGATES FIXA LOGO ABAIXO DO SALDO */}
        {carrinhoDoces.length > 0 && (
          <div className="mt-3 bg-white p-3 rounded-[2rem] shadow-md border-2 border-pink-100 max-h-32 overflow-y-auto">
            <p className="text-[9px] font-black text-pink-500 uppercase mb-2 ml-2 tracking-widest">Meus Resgates:</p>
            <div className="flex flex-wrap gap-2">
              {carrinhoDoces.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-200">
                  <span className="text-[10px] font-extrabold text-pink-600 uppercase italic">{item.nome}</span>
                  <button 
                    onClick={() => removerDoce(idx)} 
                    className="bg-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] shadow-sm hover:bg-red-50"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GRADE DE DOCES PARA ESCOLHER */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {doces.map((doce) => (
          <div key={doce.id} className="bg-white p-3 rounded-[2rem] shadow-sm flex flex-col justify-between border-b-4 border-gray-100 hover:border-pink-200 transition-all">
            <div>
              {doce.imagem && (
                <img src={doce.imagem} alt={doce.nome} className="w-full h-24 object-contain rounded-2xl mb-2" />
              )}
              <h2 className="font-extrabold text-[11px] text-zinc-800 line-clamp-1 uppercase">{doce.nome}</h2>
              <p className="text-pink-600 font-black my-1 text-sm italic">{doce.preco} Moedas</p>
            </div>

            <button
              onClick={() => adicionarDoce(doce)}
              disabled={saldoAtual < doce.preco}
              className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase italic transition-all ${
                saldoAtual >= doce.preco 
                ? "bg-zinc-900 text-white active:scale-95 shadow-md" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {saldoAtual >= doce.preco ? "Resgatar" : "Bloqueado"}
            </button>
          </div>
        ))}
      </div>

      {/* BOTÃO FINALIZAR FIXO NO RODAPÉ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent max-w-md mx-auto">
        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-pink-500 text-white p-4 rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all border-b-4 border-pink-700"
        >
          Confirmar e Voltar ao Pedido ➔
        </button>
      </div>
    </div>
  );
}