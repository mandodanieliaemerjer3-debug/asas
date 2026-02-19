"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function PaginaRateio() {
  const router = useRouter();
  const [pedidosNaRota, setPedidosNaRota] = useState(0);
  const [dadosFinanceiros, setDadosFinanceiros] = useState({ produtos: 0, frete: 0, total: 0 });
  const [dadosPreCheckout, setDadosPreCheckout] = useState(null);

  useEffect(() => {
    // 1. Recupera o carrinho e os dados da Balança
    const savedCart = JSON.parse(localStorage.getItem("carrinho") || "[]");
    const savedPre = JSON.parse(localStorage.getItem("pre_checkout") || "{}");
    
    // 2. Calcula o valor total dos produtos
    const valorProdutos = savedCart.reduce((acc, item) => acc + (item.price || 0), 0);
    
    // 3. Define o frete com base no bairro selecionado
    const valorFrete = savedPre.bairro?.frete || 10.00; 

    setDadosFinanceiros({
      produtos: valorProdutos,
      frete: valorFrete,
      total: valorProdutos + valorFrete
    });
    setDadosPreCheckout(savedPre);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "pedidos"), 
      where("status", "==", "aguardando_onda"),
      where("dataEntrega", "==", new Date().toLocaleDateString('pt-BR'))
    );
    const unsub = onSnapshot(q, (snap) => {
      setPedidosNaRota(snap.size + 1); 
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans max-w-md mx-auto shadow-2xl">
      <header className="p-6 border-b border-zinc-100 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-zinc-400">✕</button>
        <h1 className="font-bold text-[10px] uppercase tracking-widest text-zinc-900 italic">Resumo da Linha</h1>
        <div className="w-4"></div>
      </header>

      <div className="flex-1 p-8 flex flex-col items-center">
        {/* EXIBIÇÃO DO VALOR TOTAL (O QUE FALTAVA) */}
        <div className="w-full bg-zinc-900 rounded-[40px] p-8 mb-8 text-center shadow-2xl relative overflow-hidden">
           <p className="text-[10px] font-black text-red-500 uppercase mb-1 tracking-widest">Total a Pagar</p>
           <h2 className="text-4xl font-black italic text-white tracking-tighter">
             R$ {dadosFinanceiros.total.toFixed(2)}
           </h2>
           <div className="flex justify-center gap-4 mt-4 opacity-50 text-[9px] font-bold text-white uppercase">
              <span>Produtos: R$ {dadosFinanceiros.produtos.toFixed(2)}</span>
              <span>Frete: R$ {dadosFinanceiros.frete.toFixed(2)}</span>
           </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-xl font-black italic text-zinc-900 uppercase">Onda das 19:00h 🕒</h3>
          <p className="text-zinc-400 text-[11px] font-bold uppercase mt-1">
            {pedidosNaRota} volumes na rota de {dadosPreCheckout?.bairro?.name}
          </p>
        </div>

        {/* BARRA DE OTIMIZAÇÃO */}
        <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden mb-2">
          <div className="bg-zinc-900 h-full transition-all duration-1000" style={{ width: `${Math.min((pedidosNaRota / 10) * 100, 100)}%` }}></div>
        </div>
        <div className="flex justify-between w-full text-[9px] font-black text-zinc-300 uppercase mb-10">
          <span>Coleta</span>
          <span className="text-zinc-900">Rota Otimizada</span>
        </div>

        <div className="bg-zinc-50 p-6 rounded-[35px] border border-zinc-100 w-full">
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            <strong>Nota da Logística:</strong> O valor do frete foi calculado para a <strong>{dadosPreCheckout?.bairro?.name}</strong>. Após as 19h, se a rota atingir a otimização máxima, a diferença será creditada em sua conta.
          </p>
        </div>
      </div>

      <footer className="p-6 pb-12">
        <button 
          onClick={() => router.push("/checkout/pagamento")}
          className="w-full bg-red-600 text-white py-6 rounded-[35px] font-black italic uppercase tracking-widest shadow-xl shadow-red-200 active:scale-95 transition"
        >
          Confirmar R$ {dadosFinanceiros.total.toFixed(2)} ➔
        </button>
      </footer>
    </main>
  );
}