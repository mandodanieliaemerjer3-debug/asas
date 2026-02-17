"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";

export default function DashboardOperador() {
  const { user } = useAuth();
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("operadorId", "==", user.uid),
      where("status", "==", "Entregue"),
      where("repasseConfirmado", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // 🚀 SOMA CORRETA: Soma exatamente o que o Checkout gravou em cada pedido
      const somaCalculada = lista.reduce((acc, p) => acc + (p.valores?.taxaEntrega || 0), 0);

      setSaldoTotal(somaCalculada);
      setPedidosPendentes(lista);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-white uppercase italic">Sincronizando Ganhos...</div>;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 font-sans max-w-md mx-auto">
      
      <section className="bg-white text-black p-10 rounded-[45px] shadow-2xl mb-8 text-center relative overflow-hidden">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 italic">Saldo Real a Receber</p>
        {/* AQUI MOSTRA A SOMA TOTAL DAS PENDÊNCIAS */}
        <h2 className="text-5xl font-black italic tracking-tighter">R$ {saldoTotal.toFixed(2)}</h2>
        
        <Link href="/logistica">
          <button className="mt-8 bg-zinc-900 text-white px-10 py-4 rounded-3xl font-black uppercase italic text-[10px] hover:bg-red-600 transition shadow-lg">
            Voltar para Entregas ➔
          </button>
        </Link>
      </section>

      <h3 className="text-xs font-black uppercase italic text-zinc-600 mb-6 px-4 tracking-widest text-center">
        Pendências por Entrega (Valor do Pedido)
      </h3>

      <div className="space-y-4">
        {pedidosPendentes.map((p) => (
          <div key={p.id} className="bg-zinc-900 p-6 rounded-[35px] border border-zinc-800 flex justify-between items-center shadow-xl">
            <div>
              <p className="text-[8px] font-black text-red-600 uppercase mb-1">Repasse Pendente</p>
              <p className="text-sm font-black uppercase italic leading-none">{p.endereco?.bairro}</p>
              <p className="text-[9px] text-zinc-500 mt-2 uppercase font-bold italic opacity-50">ID: {p.id.slice(-4)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black italic text-green-500">R$ {p.valores?.taxaEntrega?.toFixed(2)}</p>
              <span className="text-[7px] font-black bg-zinc-800 px-2 py-1 rounded text-zinc-500 uppercase italic">Aguardando Restaurante</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}