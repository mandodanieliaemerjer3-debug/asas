"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function PedidoDetalhePage() {
  const { id } = useParams();
  const router = useRouter();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "orders", id);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setPedido({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  const confirmarRecebimento = async () => {
    const confirmar = confirm("Confirmar que recebeu o pedido?");
    if (!confirmar) return;

    await updateDoc(doc(db, "orders", id), {
      statusEntrega: "entregue"
    });
  };

  const statusTexto = {
    aguardando: "🧾 Aguardando confirmação",
    preparando: "👨‍🍳 Em preparo",
    saiu_entrega: "🚚 Saiu para entrega",
    entregue: "✅ Entregue"
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-black text-orange-500">Carregando pedido...</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="p-10 text-center font-bold text-gray-400">
        Pedido não encontrado
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white max-w-md mx-auto p-4 pb-32">

      {/* VOLTAR */}
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm font-bold text-gray-500"
      >
        ← Voltar
      </button>

      {/* HEADER */}
      <div className="bg-white rounded-3xl p-5 shadow mb-4">
        <h1 className="text-xl font-black text-gray-800">
          {pedido.restaurantName || pedido.itens?.[0]?.name || "Pedido"}
        </h1>

        <p className="text-sm mt-2 font-bold text-orange-600">
          {statusTexto[pedido.statusEntrega] || "Processando..."}
        </p>

        <p className="text-xs text-gray-400 mt-2">
          🔐 Código: {pedido.codigoEntrega || "—"}
        </p>
      </div>

      {/* ENDEREÇO */}
      <div className="bg-white rounded-3xl p-5 shadow mb-4">
        <p className="text-xs font-black text-gray-400 uppercase mb-2">
          Endereço de entrega
        </p>

        <p className="text-sm font-bold text-gray-700">
          📍 {pedido.endereco?.bairro} — {pedido.endereco?.rua}, {pedido.endereco?.numero}
        </p>
      </div>

      {/* ITENS */}
      <div className="bg-white rounded-3xl p-5 shadow mb-4">
        <p className="text-xs font-black text-gray-400 uppercase mb-3">
          Itens do pedido
        </p>

        <div className="space-y-2">
          {pedido.itens?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span className="font-bold">
                R$ {Number(item.price).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* VALORES */}
      <div className="bg-white rounded-3xl p-5 shadow mb-4">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>R$ {pedido.valores?.subtotal?.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>Entrega</span>
          <span>R$ {pedido.valores?.taxaEntrega?.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-lg font-black mt-2 text-orange-600">
          <span>Total</span>
          <span>R$ {pedido.valores?.total?.toFixed(2)}</span>
        </div>
      </div>

      {/* BOTÃO FINAL */}
      {pedido.statusEntrega !== "entregue" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t max-w-md mx-auto">
          <button
            onClick={confirmarRecebimento}
            className="w-full bg-orange-500 text-white p-4 rounded-3xl font-black"
          >
            CONFIRMAR RECEBIMENTO
          </button>
        </div>
      )}
    </main>
  );
}