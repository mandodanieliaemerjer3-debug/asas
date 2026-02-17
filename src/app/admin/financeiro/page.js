"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function PainelFinanceiroADM() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // Escuta pedidos que estão aguardando conferência do comprovante
    const q = query(
      collection(db, "orders"),
      where("comprovanteEnviado", "==", true),
      where("repasseConfirmado", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const aprovarPagamento = async (id) => {
    await updateDoc(doc(db, "orders", id), {
      repasseConfirmado: true,
      status: "Em Preparo" // Libera para a cozinha
    });
    alert("💰 Pagamento validado com sucesso!");
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <h1 className="text-xl font-black uppercase italic tracking-tighter">
          Auditoria <span className="text-emerald-500">Financeira</span>
        </h1>
        <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full text-[8px] font-black uppercase">
          {pedidos.length} Pendentes
        </div>
      </header>

      <div className="grid gap-6">
        {pedidos.map((p) => (
          <div key={p.id} className="bg-zinc-900 border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black opacity-30 uppercase mb-1">Cliente</p>
                <h2 className="text-sm font-black uppercase italic">{p.clienteNome}</h2>
                <p className="text-[8px] font-bold opacity-20 uppercase">{p.id.slice(-6)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black opacity-30 uppercase mb-1">Valor do Pedido</p>
                <h2 className="text-xl font-black text-white italic">R$ {p.valores.total.toFixed(2)}</h2>
              </div>
            </div>

            {/* STATUS DA IA */}
            <div className="bg-black/40 rounded-[30px] p-6 mb-8 border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[8px] font-black opacity-30 uppercase mb-1">Detectado pela IA</p>
                <h3 className={`text-lg font-black italic ${p.validacaoIA === 'Aprovado' ? 'text-emerald-500' : 'text-red-500'}`}>
                   R$ {p.valorDetectadoIA?.toFixed(2) || "0.00"}
                </h3>
              </div>
              <div className={`px-4 py-2 rounded-full text-[7px] font-black uppercase ${p.validacaoIA === 'Aprovado' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                {p.validacaoIA}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="bg-zinc-800 text-white py-5 rounded-3xl font-black uppercase italic text-[9px] active:scale-95 transition">
                Ver Comprovante
              </button>
              <button 
                onClick={() => aprovarPagamento(p.id)}
                className="bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase italic text-[9px] shadow-lg shadow-emerald-900/20 active:scale-95 transition"
              >
                Confirmar Recebimento ➔
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}