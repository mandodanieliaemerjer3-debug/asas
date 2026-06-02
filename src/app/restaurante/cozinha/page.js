"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function PainelCozinha() {
  const [pedidos, setPedidos] = useState([]);
  const restId = typeof window !== "undefined" ? sessionStorage.getItem("restauranteId") : null;

  useEffect(() => {
    if (!restId) return;

    // Escuta em tempo real pedidos que NÃO foram entregues ainda
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", restId),
      where("status", "in", ["Pendente", "Preparando", "Aguardando Entregador"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordena por tempo (mais antigos primeiro para evitar atrasos)
      setPedidos(lista.sort((a, b) => a.timestamp - b.timestamp));
    });

    return () => unsubscribe();
  }, [restId]);

  const alterarStatus = async (pedidoId, novoStatus) => {
    const confirmacao = window.confirm(`Mudar pedido para: ${novoStatus}?`);
    if (confirmacao) {
      await updateDoc(doc(db, "orders", pedidoId), { status: novoStatus });
    }
  };

  return (
    <main className="p-4 bg-black min-h-screen text-white font-sans">
      <header className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-black italic">COZINHA MOGU MOGU</h1>
        <div className="text-xs opacity-50">ID: {restId}</div>
      </header>

      {/* Grid adaptável: 1 coluna no celular, 3 no tablet, 4+ na TV */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {pedidos.map((pedido) => (
          <div 
            key={pedido.id}
            onClick={() => alterarStatus(pedido.id, "Aguardando Entregador")}
            className={`p-6 rounded-[30px] border-2 cursor-pointer transition-all active:scale-95 ${
              pedido.status === "Aguardando Entregador" ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-zinc-900"
            }`}
          >
            <div className="flex justify-between mb-2">
              <span className="font-black text-xl">#{pedido.id.slice(-4)}</span>
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full uppercase">
                {pedido.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              {pedido.items?.map((item, i) => (
                <p key={i} className="font-bold text-lg leading-tight">
                  {item.quantity}x <span className="text-orange-400">{item.name}</span>
                </p>
              ))}
            </div>

            <div className="pt-4 border-t border-white/5 text-[10px] font-bold opacity-50 uppercase">
              Toque para chamar o entregador ➔
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}