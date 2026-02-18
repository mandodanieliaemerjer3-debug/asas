"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, storage } from "../../../lib/firebase"; // Importando storage 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage"; // Ferramentas de upload 
import Tesseract from "tesseract.js";

export default function InspecaoAuditoria() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [percentual, setPercentual] = useState(0);
  const [analiseConcluida, setAnaliseConcluida] = useState(false);
  const [relatorioTexto, setRelatorioTexto] = useState("");

  useEffect(() => {
    async function processarEGuardar() {
      if (!orderId) return;

      const imagemBase64 = localStorage.getItem("temp_pix_img");
      if (!imagemBase64) return;

      try {
        // 1. GERA O RELATÓRIO DE APRENDIZAGEM (OCR)
        const result = await Tesseract.recognize(imagemBase64, "por", {
          logger: m => {
            if (m.status === "recognizing text") setPercentual(Math.floor(m.progress * 100));
          }
        });
        
        const textoBruto = result.data.text.toLowerCase();
        setRelatorioTexto(textoBruto);

        // 2. UPLOAD DA IMAGEM PARA O STORAGE
        const storageRef = ref(storage, `auditoria_pix/${orderId}.jpg`);
        const snapshot = await uploadString(storageRef, imagemBase64, 'data_url');
        const urlPublica = await getDownloadURL(snapshot.ref);

        // 3. SALVA TUDO NO FIRESTORE (A "CONTA DE APRENDIZAGEM")
        await updateDoc(doc(db, "orders", orderId), {
          status: "Pendente",
          comprovanteUrl: urlPublica,
          auditoriaIA: {
            textoCompleto: textoBruto,
            dataProcessamento: new Date().toISOString(),
            versaoAlgoritmo: "2.0_relatorio_bruto"
          }
        });

        setAnaliseConcluida(true);
      } catch (e) {
        console.error("Erro no processo de auditoria:", e);
      }
    }
    processarEGuardar();
  }, [orderId]);

  const finalizar = () => {
    localStorage.removeItem("temp_pix_img");
    router.push(`/pedido-confirmado/${orderId}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      {!analiseConcluida ? (
        <div className="text-center">
          <div className="text-6xl font-black text-red-600 animate-pulse">{percentual}%</div>
          <p className="text-[10px] opacity-40 mt-4 uppercase tracking-widest">Registrando Comprovante...</p>
        </div>
      ) : (
        <div className="bg-zinc-900 p-8 rounded-[40px] w-full max-w-sm text-center border border-zinc-800 shadow-2xl">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <span className="text-green-500 text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-black uppercase italic mb-2">Comprovante Enviado</h1>
          <p className="text-[10px] opacity-40 mb-8 uppercase">Aguarde a confirmação no balcão</p>
          
          <button onClick={finalizar} className="w-full bg-red-600 py-5 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-lg shadow-red-900/40">
            ENTRAR NA LOJA ➔
          </button>
        </div>
      )}
    </main>
  );
}