"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function PainelFinanceiroADM() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // Busca pedidos que já enviaram comprovante mas precisam de conferência
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

  const aprovarFinanceiro = async (id) => {
    await updateDoc(doc(db, "orders", id), {
      repasseConfirmado: true,
      status: "Em Preparo" // Libera definitivamente para o restaurante
    });
    alert("💰 Pagamento aprovado e moedas liberadas para processamento!");
  };

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6 font-sans">
      <h1 className="text-xl font-black uppercase italic mb-8 border-b border-white/10 pb-4">
        Controle de <span className="text-emerald-500">Pagamentos</span>
      </h1>

      <div className="grid gap-4">
        {pedidos.map((p) => (
          <div key={p.id} className="bg-zinc-800 p-6 rounded-[30px] border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black opacity-30 uppercase">Cliente</p>
                <h2 className="text-sm font-black uppercase italic">{p.clienteNome}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black opacity-30 uppercase">Valor</p>
                <h2 className="text-lg font-black text-emerald-500 italic">R$ {p.valores.total.toFixed(2)}</h2>
              </div>
            </div>

            {/* SELO DA IA */}
            <div className={`inline-block px-4 py-2 rounded-full mb-6 text-[8px] font-black uppercase ${p.validacaoIA === 'Aprovado' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
              IA: {p.validacaoIA || "Não Analisado"}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button className="bg-zinc-700 py-4 rounded-2xl font-black uppercase italic text-[9px]">Ver Foto</button>
              <button 
                onClick={() => aprovarFinanceiro(p.id)}
                className="bg-emerald-600 py-4 rounded-2xl font-black uppercase italic text-[9px] shadow-lg shadow-emerald-900/20"
              >
                Aprovar Tudo ➔
              </button>
            </div>
          </div>
        ))}

        {pedidos.length === 0 && (
          <div className="py-20 text-center opacity-20 italic font-black uppercase text-xs">
            Nenhum pagamento pendente no momento.
          </div>
        )}
      </div>
    </main>
  );
}