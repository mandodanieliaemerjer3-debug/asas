"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

export default function PagamentoErro({ params }) {
  const router = useRouter();

  // 🔥 NOVO JEITO
  const { id: pedidoId } = use(params);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>
        ❌ Pagamento recusado
      </h1>

      <p style={{ marginTop: 10 }}>
        Pedido: <strong>{pedidoId}</strong>
      </p>

      <p style={{ marginTop: 10 }}>
        Seu pagamento não foi aprovado. Tente novamente.
      </p>

      <button
        onClick={() => router.push(`/pagamento/${pedidoId}`)}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          background: "#ef4444",
          color: "#fff",
          borderRadius: 10,
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
        }}
      >
        🔄 Tentar novamente
      </button>
    </div>
  );
}