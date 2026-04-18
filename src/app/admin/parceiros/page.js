"use client";

import { useEffect, useState } from "react";

export default function PainelLojista({ parceiroId = "parceiro_rute" }) {
  const [linkValidacao, setLinkValidacao] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/validar/${parceiroId}`;
      setLinkValidacao(link);
    }
  }, [parceiroId]);

  const copiarLink = () => {
    if (!linkValidacao) return;

    navigator.clipboard.writeText(linkValidacao);
    alert("Link copiado! Cole no seu grupo do WhatsApp.");
  };

  return (
    <div className="p-6 bg-white rounded-[30px] shadow-xl">
      <h2 className="font-black uppercase italic text-xs mb-4">
        📢 Link da Semana
      </h2>

      <p className="text-[10px] text-gray-400 mb-4 uppercase font-bold">
        Envie este link no grupo para validar quem ainda está lá:
      </p>

      <div className="bg-gray-50 p-4 rounded-2xl break-all text-[10px] font-mono border border-dashed border-gray-300">
        {linkValidacao || "Carregando link..."}
      </div>

      <button
        onClick={copiarLink}
        disabled={!linkValidacao}
        className="mt-4 w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase italic text-[10px] disabled:bg-gray-400"
      >
        📋 Copiar Link para o Zap
      </button>
    </div>
  );
}