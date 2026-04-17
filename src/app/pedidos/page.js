"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function PedidosClientePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const meusPedidos = lista.filter(p => p.clienteId === user.uid);

      meusPedidos.sort((a, b) => {
        const dataA = new Date(a.criadoEm || 0).getTime();
        const dataB = new Date(b.criadoEm || 0).getTime();
        return dataB - dataA;
      });

      setPedidos(meusPedidos);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  const statusTexto = {
    aguardando: "Aguardando",
    preparando: "Preparando",
    saiu_entrega: "Saiu para entrega",
    entregue: "Entregue"
  };

  const statusCor = {
    aguardando: "bg-yellow-100 text-yellow-600",
    preparando: "bg-blue-100 text-blue-600",
    saiu_entrega: "bg-orange-100 text-orange-600",
    entregue: "bg-green-100 text-green-600"
  };

  const confirmarRecebimento = async (pedidoId) => {
    const confirmar = confirm("Confirmar recebimento?");
    if (!confirmar) return;

    await updateDoc(doc(db, "orders", pedidoId), {
      statusEntrega: "entregue"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-black text-orange-500 animate-pulse">MOGU carregando...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white max-w-md mx-auto p-4 pb-32">
      <h1 className="text-2xl font-black mb-6 italic text-orange-600">
        🍔 Meus Pedidos
      </h1>

      {pedidos.length === 0 && (
        <div className="text-center text-gray-400 font-bold mt-20">
          Nenhum pedido ainda
        </div>
      )}

      <div className="space-y-5">
        {pedidos.map((pedido) => (
          <div
            key={pedido.id}
            className="bg-white rounded-3xl p-5 shadow-lg border border-orange-100"
          >
            {/* TOPO */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-black text-gray-800">
                {pedido.restaurantName || pedido.itens?.[0]?.name || "Pedido"}
              </h2>

              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${statusCor[pedido.statusEntrega] || "bg-gray-100 text-gray-500"}`}>
                {statusTexto[pedido.statusEntrega] || "..."}
              </span>
            </div>

            {/* CÓDIGO */}
            <div className="text-xs font-bold text-orange-500 mb-1">
              🔐 Código: {pedido.codigoEntrega || "—"}
            </div>

            {/* ENDEREÇO */}
            <div className="text-xs text-gray-500 mb-3">
              📍 {pedido.endereco?.bairro} — {pedido.endereco?.rua}, {pedido.endereco?.numero}
            </div>

            {/* ITENS */}
            <div className="space-y-1 border-t border-dashed pt-3">
              {pedido.itens?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-700">
                  <span>{item.name}</span>
                  <span className="font-bold">R$ {Number(item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* RODAPÉ */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-lg font-black text-orange-600">
                R$ {Number(pedido.valores?.total || 0).toFixed(2)}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/pedido/${pedido.id}`)}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-black"
                >
                  VER
                </button>

                {pedido.statusEntrega !== "entregue" && (
                  <button
                    onClick={() => confirmarRecebimento(pedido.id)}
                    className="bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-black"
                  >
                    RECEBI
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
