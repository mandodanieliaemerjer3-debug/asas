"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function PedidoEmAndamento({ user, router }) {
  const [pedidosAtivos, setPedidosAtivos] = useState([]);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const todos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const ativos = todos.filter(p =>
        (p.clienteId === user.uid || p.userId === user.uid) &&
        p.statusEntrega !== "entregue"
      );

      ativos.sort((a, b) => {
        const dataA = new Date(a.criadoEm || 0).getTime();
        const dataB = new Date(b.criadoEm || 0).getTime();
        return dataB - dataA;
      });

      setPedidosAtivos(ativos);
    });

    return () => unsub();
  }, [user]);

  if (pedidosAtivos.length === 0) return null;

  const statusTexto = {
    aguardando: "🧾 Aguardando confirmação",
    preparando: "👨‍🍳 Em preparo",
    saiu_entrega: "🚚 Saiu para entrega",
    entregue: "✅ Entregue"
  };

  return (
    <div className="px-4 mt-6 space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 italic">
        Acompanhe seus pedidos
      </h2>

      {pedidosAtivos.map((pedido) => {
        const total = pedido.valores?.total || 0;

        return (
          <div
            key={pedido.id}
            className="bg-black text-white rounded-3xl p-5 shadow-2xl border-b-4 border-pink-500 active:scale-95 transition-all"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-[10px] text-pink-400 uppercase font-black">
                  Status
                </p>

                {/* CORREÇÃO CERTA AQUI */}
                <h3 className="text-lg font-black uppercase italic">
                  {pedido.restaurantName || pedido.itens?.[0]?.name || "Seu Pedido"}
                </h3>
              </div>

              <span className="text-xl">🦖</span>
            </div>

            <p className="text-sm mt-2 text-gray-300 font-bold">
              {statusTexto[pedido.statusEntrega] || "Processando..."}
            </p>

            <div className="flex justify-between items-center mt-4">
              <span className="text-lg font-black">
                R$ {Number(total).toFixed(2)}
              </span>

              <button
                onClick={() => router.push(`/pedido/${pedido.id}`)}
                className="bg-white text-black px-4 py-2 rounded-2xl text-xs font-black"
              >
                VER ➔
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}