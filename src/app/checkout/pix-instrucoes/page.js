"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PixInstrucoes() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [valor, setValor] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const CHAVE_PIX = "SUA_CHAVE_AQUI"; // Substitua pela sua chave real

  useEffect(() => {
    if (orderId) {
      getDoc(doc(db, "orders", orderId)).then((snap) => {
        if (snap.exists()) {
          setValor(snap.data()?.valores?.total || 0);
        }
      });
    }
  }, [orderId]);

  const copiarChave = () => {
    navigator.clipboard.writeText(CHAVE_PIX);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleUploadImagem = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Salva temporariamente para a Perícia ler na próxima tela
        localStorage.setItem("temp_pix_img", reader.result);
        router.push(`/checkout/inspecao-pix?orderId=${orderId}`);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-8 space-y-8 text-center border border-zinc-800">
        <header>
          <h1 className="text-2xl font-black uppercase">Pagamento Pix</h1>
          <p className="text-zinc-500 text-sm mt-2">Finalize seu pedido de R$ {valor.toFixed(2)}</p>
        </header>

        {/* Player de Vídeo Estilo Shorts que discutimos */}
        <div className="aspect-[9/16] w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-red-600 shadow-lg shadow-red-900/20">
             <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/VÍDEO_ID_AQUI?autoplay=1&loop=1&playlist=VÍDEO_ID_AQUI&controls=0&mute=1`}
                title="Aguardando Pagamento"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                className="pointer-events-none"
              ></iframe>
        </div>

        <div className="space-y-4">
          <div className="bg-black p-4 rounded-2xl border border-zinc-800">
            <p className="text-[10px] uppercase text-zinc-500 mb-1">Chave Pix (CNPJ/E-mail)</p>
            <code className="text-red-500 font-bold block mb-3">{CHAVE_PIX}</code>
            <button 
              onClick={copiarChave}
              className="text-xs bg-zinc-800 px-4 py-2 rounded-lg font-bold hover:bg-zinc-700 transition-colors"
            >
              {copiado ? "✓ COPIADO" : "COPIAR CHAVE"}
            </button>
          </div>

          <div className="pt-4">
            <label className="block w-full bg-red-600 py-4 rounded-2xl font-black cursor-pointer hover:bg-red-700 transition-colors">
              ENVIAR COMPROVANTE
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleUploadImagem}
              />
            </label>
            <p className="text-[10px] text-zinc-500 mt-3 uppercase tracking-widest">
              A IA validará seu pagamento em segundos
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}