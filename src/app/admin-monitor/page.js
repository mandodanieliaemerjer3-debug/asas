"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function MonitorGeral() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // Monitora TODOS os pedidos do banco, sem filtro de restaurante
    const q = query(collection(db, "orders"), orderBy("confirmadoEm", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPedidos(lista);
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black italic text-orange-500 uppercase">Monitor Global</h1>
          <p className="text-xs opacity-50 font-bold uppercase tracking-widest">Controle total Mogu Mogu Delivery</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black">{pedidos.length}</p>
          <p className="text-[10px] opacity-50 uppercase">Pedidos Totais</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-zinc-900/50 rounded-[30px] border border-white/5 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase font-black opacity-40">
              <th className="p-6">ID Pedido</th>
              <th className="p-6">Restaurante</th>
              <th className="p-6">Status</th>
              <th className="p-6">Itens</th>
              <th className="p-6">Total</th>
              <th className="p-6">Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pedidos.map((p) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="p-6 font-mono text-xs opacity-60">#{p.id.slice(-6)}</td>
                <td className="p-6">
                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {p.restaurantId}
                  </span>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    p.status === 'Pendente' ? 'bg-zinc-700' : 'bg-green-600'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-6">
                  <div className="text-[10px] font-bold">
                    {p.itens?.map((item, i) => (
                      <div key={i}>{item.quantity}x {item.name}</div>
                    ))}
                  </div>
                </td>
                <td className="p-6 font-black text-orange-500 text-lg">
                  R$ {p.valores?.total || 0}
                </td>
                <td className="p-6">
                    <p className="text-[10px] font-bold uppercase opacity-60">{p.formaPagamento}</p>
                    <p className={`text-[9px] font-black ${p.pago ? 'text-green-400' : 'text-red-400'}`}>
                        {p.pago ? "PAGO" : "PENDENTE"}
                    </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}