"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function PaginaRateio() {
  const router = useRouter();
  const [pedidosNaRota, setPedidosNaRota] = useState(0);
  const [dadosPreCheckout, setDadosPreCheckout] = useState(null);

  // 1. Recupera os dados de endereço salvos na Balança (Fase 1)
  useEffect(() => {
    const saved = localStorage.getItem("pre_checkout");
    if (saved) setDadosPreCheckout(JSON.parse(saved));
  }, []);

  // 2. Monitora quantos pedidos estão entrando na mesma "onda"
  useEffect(() => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const q = query(
      collection(db, "pedidos"), 
      where("status", "==", "aguardando_onda"),
      where("dataEntrega", "==", hoje)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      // +1 para incluir o pedido atual do cliente na contagem
      setPedidosNaRota(snap.size + 1); 
    });
    return () => unsub();
  }, []);

  const prosseguirParaPagamento = () => {
    // Segue para a fase de carregamento e confirmação final
    router.push("/checkout/pre-logistica");
  };

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans max-w-md mx-auto shadow-2xl overflow-x-hidden">
      {/* HEADER DISCRETO */}
      <header className="p-6 border-b border-zinc-50 flex items-center justify-between bg-white sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-zinc-400 p-2">✕</button>
        <h1 className="font-black text-[10px] uppercase tracking-[3px] text-zinc-900 italic">Logística de Linha</h1>
        <div className="w-8"></div>
      </header>

      <div className="flex-1 p-8 flex flex-col items-center text-center">
        {/* ÍCONE DE LOGÍSTICA */}
        <div className="w-24 h-24 bg-zinc-900 rounded-[35px] flex items-center justify-center text-4xl mb-8 shadow-xl shadow-zinc-200">
          <span className="animate-pulse">📦</span>
        </div>

        <h2 className="text-2xl font-black italic text-zinc-900 uppercase leading-tight mb-3 tracking-tighter">
          Seu pedido entra na <br/> <span className="text-red-600 underline decoration-4 underline-offset-4">onda das 19:00h</span>
        </h2>
        
        <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-tight mb-10 px-4">
          Estamos agrupando sua entrega com outros <strong className="text-zinc-900">{pedidosNaRota} volumes</strong> na região de {dadosPreCheckout?.bairro?.name || "Acesso Remoto"}.
        </p>

        {/* BARRA DE OTIMIZAÇÃO DE ROTA (SEM MENÇÃO A FRETE GRÁTIS) */}
        <div className="w-full max-w-[280px]">
            <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden mb-3 border border-zinc-200/50">
              <div 
                className="bg-zinc-900 h-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min((pedidosNaRota / 10) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between w-full text-[9px] font-black text-zinc-300 uppercase tracking-widest px-1">
              <span>Coleta</span>
              <span className="text-zinc-900">Rota Otimizada</span>
            </div>
        </div>

        {/* INFO DE FECHAMENTO PONTUAL */}
        <div className="w-full bg-zinc-900 rounded-[40px] p-8 mt-12 mb-8 text-left relative overflow-hidden shadow-2xl">
          <div className="absolute -top-4 -right-4 opacity-10 text-8xl rotate-12 text-white font-black">19</div>
          <p className="text-[10px] font-black text-red-500 uppercase mb-2 tracking-[2px]">Saída da Linha</p>
          <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">19:00h</h3>
          <p className="text-[9px] text-zinc-400 mt-5 uppercase font-bold leading-relaxed max-w-[200px]">
            As linhas fecham automaticamente. O entregador Off-Road inicia a rota com todos os volumes do setor.
          </p>
        </div>

        <div className="bg-zinc-50 p-6 rounded-[30px] border border-zinc-100 text-left w-full">
          <p className="text-[11px] text-zinc-600 leading-snug font-medium italic">
            <strong>Bairro identificado:</strong> {dadosPreCheckout?.bairro?.name || "Consultando..."}<br/>
            <strong>Referência:</strong> {dadosPreCheckout?.numero || "Não informada"}
          </p>
        </div>
      </div>

      <footer className="p-6 pb-12 bg-white">
        <button 
          onClick={prosseguirParaPagamento}
          className="w-full bg-red-600 text-white py-6 rounded-[35px] font-black italic uppercase tracking-widest shadow-2xl shadow-red-200 active:scale-95 transition-all"
        >
          Confirmar e Seguir ➔
        </button>
      </footer>
    </main>
  );
}