"use client";

import { useRouter } from "next/navigation";

export default function PagamentoErro({ params }) {
  const router = useRouter();
  const pedidoId = params.id;

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>
        ❌ Pagamento recusado
      </h1>

      <p style={{ marginTop: 10 }}>
        Pedido: <strong>{pedidoId}</strong>
      </p>

      <p style={{ marginTop: 10 }}>
        Seu pagamento não foi aprovado. Tente novamente com outro método.
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