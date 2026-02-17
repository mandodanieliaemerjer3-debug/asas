"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Tesseract from "tesseract.js"; //

export default function InspecaoPix() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [percentual, setPercentual] = useState(0);
  const [analise, setAnalise] = useState({ temPalavras: false, valorConfere: false, finalizado: false });

  useEffect(() => {
    async function analisar() {
      const imagem = localStorage.getItem("temp_pix_img");
      const snap = await getDoc(doc(db, "orders", orderId));
      const valorPedido = snap.data().valores.total.toString().replace('.', ',');

      Tesseract.recognize(imagem, 'por', {
        logger: m => m.status === 'recognizing text' && setPercentual(Math.floor(m.progress * 100))
      }).then(({ data: { text } }) => {
        const txt = text.toLowerCase();
        setAnalise({
          temPalavras: txt.includes("comprovante") || txt.includes("pix") || txt.includes("pagamento"),
          valorConfere: txt.includes(valorPedido),
          finalizado: true
        });
      });
    }
    analisar();
  }, [orderId]);

  const finalizar = async () => {
    await updateDoc(doc(db, "orders", orderId), {
      status: "Pendente",
      validacaoIA: analise.temPalavras && analise.valorConfere ? "Aprovado" : "Alerta de Fraude"
    });
    router.push(`/pedido-confirmado/${orderId}`);
  };

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-black italic uppercase mb-10">Inspecionando <br/> Comprovante</h1>
      
      <div className="w-full max-w-xs bg-zinc-900 p-8 rounded-[40px] border border-white/10">
        {!analise.finalizado ? (
          <>
            <div className="text-4xl font-black italic mb-4">{percentual}%</div>
            <p className="text-[10px] uppercase font-bold opacity-40">Procurando evidências de falsificação...</p>
          </>
        ) : (
          <div className="space-y-6">
             <div className="text-left space-y-2">
                <p className={`text-[10px] font-black uppercase ${analise.temPalavras ? 'text-emerald-500' : 'text-red-500'}`}>
                   {analise.temPalavras ? "✅ Formato Identificado" : "❌ Documento Inválido"}
                </p>
                <p className={`text-[10px] font-black uppercase ${analise.valorConfere ? 'text-emerald-500' : 'text-red-500'}`}>
                   {analise.valorConfere ? "✅ Valor Identificado" : "❌ Valor não encontrado"}
                </p>
             </div>
             
             {(!analise.temPalavras || !analise.valorConfere) && (
               <p className="bg-red-600/20 text-red-500 p-4 rounded-2xl text-[9px] font-black uppercase italic">
                 Atenção: A imagem não parece um comprovante válido. O restaurante fará uma análise rigorosa.
               </p>
             )}

             <button onClick={finalizar} className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase italic text-xs">
               CONFIRMAR ENVIO ➔
             </button>
             <button onClick={() => router.back()} className="text-[10px] font-black uppercase opacity-30 underline">Tentar outra foto</button>
          </div>
        )}
      </div>
    </main>
  );
}