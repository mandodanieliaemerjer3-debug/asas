"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase"; //

export default function CheckoutBalanca() {
  const router = useRouter();
  const [pontoEntrega, setPontoEntrega] = useState("Morro do Sabão");
  const [carregando, setCarregando] = useState(false);

  // Simulação do cálculo de volume da carga (Balança)
  const volumeCarga = "2 PONTOS"; 

  const handleAnalise = () => {
    setCarregando(true);
    
    // Simula o tempo de processamento da IA de logística
    setTimeout(() => {
      setCarregando(false);
      // 🚀 REDIRECIONA PARA A NOVA PÁGINA DE RATEIO
      router.push("/checkout/rateio"); 
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans max-w-md mx-auto shadow-2xl">
      {/* HEADER DA FASE */}
      <header className="p-10 text-center">
        <h1 className="text-xl font-black italic uppercase tracking-tighter text-zinc-900">
          Fase 1: Balança
        </h1>
      </header>

      <div className="px-6 flex-1 space-y-6">
        {/* CARD DE VOLUME (ESTILO PRETO) */}
        <div className="bg-zinc-900 rounded-[40px] p-8 relative overflow-hidden shadow-xl">
           <div className="absolute top-4 right-6 bg-green-500 text-[8px] font-black text-white px-3 py-1 rounded-full uppercase">
             Carga Leve
           </div>
           <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Volume da Carga</p>
           <h2 className="text-3xl font-black italic text-white uppercase">{volumeCarga}</h2>
        </div>

        {/* SELETOR DE PONTO DE ENTREGA */}
        <div className="space-y-4">
          <div className="relative">
            <select 
              value={pontoEntrega}
              onChange={(e) => setPontoEntrega(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-[24px] text-sm font-bold appearance-none outline-none focus:border-red-600 transition-all"
            >
              <option>Morro do Sabão</option>
              <option>Vila Rural</option>
              <option>Centro (Off-Road)</option>
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-xs">▼</div>
          </div>

          <input 
            placeholder="Ponto de Referência"
            className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-[24px] text-sm outline-none focus:border-red-600"
          />
          
          <input 
            placeholder="Observações do Pedido"
            className="w-full bg-zinc-50 border border-zinc-100 p-5 rounded-[24px] text-sm outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* BOTÃO DE AÇÃO */}
      <footer className="p-6 pb-10">
        <button 
          onClick={handleAnalise}
          disabled={carregando}
          className={`w-full py-6 rounded-[30px] font-black italic uppercase tracking-[2px] transition-all shadow-xl ${
            carregando ? "bg-zinc-200 text-zinc-400" : "bg-red-600 text-white shadow-red-200 active:scale-95"
          }`}
        >
          {carregando ? "Calculando Rota..." : "Analisar Logística ➔"}
        </button>
      </footer>
    </main>
  );
}