"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function PixInstrucoes() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [copiado, setCopiado] = useState(false);

  const chavePix = "000.000.000-00"; // COLOQUE SUA CHAVE AQUI

  const copiarPix = () => {
    navigator.clipboard.writeText(chavePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white text-black p-10 rounded-[50px] text-center shadow-2xl">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          📱
        </div>
        <h1 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">Quase lá!</h1>
        <p className="text-[10px] font-bold opacity-40 uppercase mb-8">Pague via Pix para liberar seu pedido</p>

        <div className="bg-zinc-100 p-6 rounded-[35px] mb-8">
          <p className="text-[8px] font-black opacity-30 uppercase mb-2">Chave Pix (CPF/CNPJ)</p>
          <p className="text-sm font-black tracking-tight">{chavePix}</p>
        </div>

        <button 
          onClick={copiarPix}
          className={`w-full py-6 rounded-[30px] font-black uppercase italic text-xs transition-all ${copiado ? 'bg-emerald-600 text-white' : 'bg-black text-white'}`}
        >
          {copiado ? "✅ COPIADO!" : "COPIAR CHAVE PIX"}
        </button>

        <p className="mt-8 text-[9px] font-bold opacity-30 uppercase leading-relaxed">
          Após pagar, seu pedido aparecerá como "Em Preparo" assim que o restaurante validar.
          <br/>ID: {orderId?.slice(-6)}
        </p>
      </div>
    </main>
  );
}