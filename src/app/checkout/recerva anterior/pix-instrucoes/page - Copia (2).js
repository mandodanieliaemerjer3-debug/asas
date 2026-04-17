"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { db } from "../../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function PixInstrucoes() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  
  const [arquivo, setArquivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const chavePix = "SUA_CHAVE_AQUI"; //

  const copiarPix = () => {
    navigator.clipboard.writeText(chavePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarComprovante = async () => {
    if (!arquivo) return alert("Por favor, selecione o comprovante.");
    if (!orderId) return alert("Erro: ID do pedido não encontrado.");

    setEnviando(true);
    try {
      // 🚀 DESTRAVA O PEDIDO: Muda de "Aguardando Pagamento" para "Pendente"
      // O restaurante agora verá o pedido na tela de produção
      const pedidoRef = doc(db, "orders", orderId);
      await updateDoc(pedidoRef, {
        status: "Pendente",
        comprovanteEnviado: true,
        nomeArquivoComprovante: arquivo.name // Simulação até configurar o Storage
      });

      alert("🚀 Comprovante enviado! Seu pedido já está na cozinha.");
      router.push(`/pedido-confirmado/${orderId}`);
    } catch (e) {
      alert("Erro ao enviar: " + e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white text-black p-10 rounded-[50px] text-center shadow-2xl">
        <h1 className="text-2xl font-black uppercase italic mb-2 tracking-tighter text-emerald-600">Pagar Pix</h1>
        <p className="text-[9px] font-bold opacity-40 uppercase mb-8 leading-tight">
          Seu pedido está reservado, mas só <br/> será preparado após o comprovante.
        </p>

        <div className="bg-zinc-100 p-6 rounded-[35px] mb-6 border-2 border-zinc-200">
          <p className="text-[8px] font-black opacity-30 uppercase mb-1">Chave Pix</p>
          <p className="text-xs font-black select-all">{chavePix}</p>
        </div>

        <button 
          onClick={copiarPix}
          className={`w-full py-4 rounded-2xl font-black uppercase italic text-[10px] mb-8 transition ${copiado ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white'}`}
        >
          {copiado ? "✅ Chave Copiada" : "Copiar Chave Pix"}
        </button>

        {/* 📎 ÁREA DE ANEXO */}
        <div className="border-4 border-dashed border-zinc-100 rounded-[35px] p-6 mb-6">
          <input 
            type="file" 
            accept="image/*,.pdf" 
            className="hidden" 
            id="file-pix"
            onChange={(e) => setArquivo(e.target.files[0])}
          />
          <label htmlFor="file-pix" className="cursor-pointer">
            {arquivo ? (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-emerald-600 uppercase">✅ Pronto para enviar</span>
                <span className="text-[8px] font-bold opacity-40 truncate max-w-[150px]">{arquivo.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-40">
                <span className="text-2xl mb-1">📸</span>
                <span className="text-[9px] font-black uppercase italic text-center">Anexar Comprovante <br/> (Foto ou PDF)</span>
              </div>
            )}
          </label>
        </div>

        <button 
          onClick={enviarComprovante}
          disabled={!arquivo || enviando}
          className={`w-full py-6 rounded-[30px] font-black uppercase italic text-sm shadow-xl transition-all ${arquivo ? 'bg-red-600 text-white active:scale-95' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
        >
          {enviando ? "ENVIANDO..." : "LIBERAR MEU PEDIDO ➔"}
        </button>
      </div>
    </main>
  );
}