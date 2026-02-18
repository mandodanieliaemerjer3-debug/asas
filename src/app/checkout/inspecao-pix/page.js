"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";
import { useRouter, useSearchParams } from "next/navigation";

export default function InspecaoPixPage() {
  const [progresso, setProgresso] = useState(0);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");

  async function analisarImagem(file) {
    setProcessando(true);
    setProgresso(0);

    try {
      const { data } = await Tesseract.recognize(file, "por", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgresso(Math.round(m.progress * 100));
          }
        },
      });

      setResultado(data.text);
      setProcessando(false);

      // aqui você pode depois salvar esse resultado no pedido
      // usando Firestore se quiser

    } catch (err) {
      console.error(err);
      alert("Erro ao analisar o comprovante.");
      setProcessando(false);
    }
  }

  function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    analisarImagem(file);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <h2 style={{ marginBottom: 20 }}>PERÍCIA DIGITAL PIX</h2>

      {!processando && (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
          />

          {!orderId && (
            <p style={{ marginTop: 10, color: "orange" }}>
              Atenção: pedido não identificado.
            </p>
          )}
        </>
      )}

      {processando && (
        <div
          style={{
            marginTop: 30,
            background: "#111",
            padding: 30,
            borderRadius: 16,
            textAlign: "center",
            minWidth: 200,
          }}
        >
          <div style={{ fontSize: 40, color: "red" }}>{progresso}%</div>
          <div style={{ marginTop: 10, fontSize: 12 }}>
            ESCANEANDO PADRÕES FINANCEIROS...
          </div>
        </div>
      )}

      {resultado && (
        <div
          style={{
            marginTop: 30,
            background: "#111",
            padding: 20,
            borderRadius: 12,
            maxWidth: 600,
            width: "100%",
            whiteSpace: "pre-wrap",
            fontSize: 12,
          }}
        >
          <strong>Texto encontrado:</strong>
          <br />
          <br />
          {resultado}
        </div>
      )}

      <button
        onClick={() => router.back()}
        style={{
          marginTop: 30,
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
        }}
      >
        Voltar
      </button>
    </div>
  );
}
