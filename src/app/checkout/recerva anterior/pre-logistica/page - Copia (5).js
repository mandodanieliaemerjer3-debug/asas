"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function PreLogisticaMotor() {
  const router = useRouter();
  const [etapa, setEtapa] = useState("Iniciando Radar de Linha...");
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const calcularRateioReal = async () => {
      // 1. Pega os dados brutos da Fase 1
      const preDados = JSON.parse(localStorage.getItem("pre_checkout") || "{}");
      if (!preDados.bairro) { router.push("/checkout"); return; }

      setProgresso(30);
      setEtapa(`Buscando pedidos na Linha ${preDados.bairro.linhaId}...`);

      try {
        const idLinha = String(preDados.bairro.linhaId || "");
        const valorLinha = 40.00; // Valor fixo da linha
        const valorBairro = 3.00; // Taxa fixa do bairro
        let freteFinal = valorLinha + valorBairro; // Caso seja o primeiro

        if (idLinha) {
          // 📡 BUSCA REAL: Quantos pedidos existem agora nesta linha que ainda não foram entregues?
          const q = query(
            collection(db, "orders"),
            where("endereco.linhaId", "==", idLinha),
            where("status", "in", ["Aguardando Entregador", "Aguardando Restaurante", "Em Rota", "Pendente"])
          );

          const snap = await getDocs(q);
          const totalPedidosNaLinha = snap.size + 1; // Pedidos existentes + o que está sendo feito agora

          // 🧮 A SUA FÓRMULA:
          // valor de rateio = valor da linha / numero de pedidos atualmente
          const valorRateio = valorLinha / totalPedidosNaLinha;
          
          // frete = valor de rateio + valor do bairro
          freteFinal = valorRateio + valorBairro;

          setEtapa(`Rateio calculado para ${totalPedidosNaLinha} entregas.`);
        }

        setProgresso(100);

        // 💾 SALVA PARA A FASE 3
        localStorage.setItem("logistica_final", JSON.stringify({
          taxaEntrega: freteFinal,
          pesoTotal: preDados.pontosCarga,
          bairro: preDados.bairro,
          rua: preDados.rua,
          numero: preDados.numero
        }));

        await new Promise(r => setTimeout(r, 1000));
        router.push("/checkout/pagamento");

      } catch (e) {
        console.error(e);
        router.push("/checkout");
      }
    };

    calcularRateioReal();
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-10 font-sans text-white">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-black uppercase italic mb-6 tracking-tighter">Motor Logístico</h2>
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mb-4">
          <div 
            className="bg-red-600 h-full transition-all duration-500 shadow-[0_0_10px_#dc2626]"
            style={{ width: `${progresso}%` }}
          ></div>
        </div>
        <p className="text-[10px] font-black uppercase italic animate-pulse">{etapa}</p>
        
        <div className="mt-16 opacity-20 text-[7px] font-bold uppercase tracking-[0.3em]">
          Fórmula: (Linha / Pedidos) + Bairro
        </div>
      </div>
    </main>
  );
}