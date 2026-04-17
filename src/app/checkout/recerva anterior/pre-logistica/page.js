"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase"; //
import { collection, query, where, getDocs } from "firebase/firestore";

export default function PreLogisticaMotor() {
  const router = useRouter();
  const [etapa, setEtapa] = useState("Sincronizando Satélite...");
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const calcularDestinoReal = async () => {
      // 1. Pega os dados da Fase 1 (Bairro e Carga)
      const preDados = JSON.parse(localStorage.getItem("pre_checkout") || "{}");
      if (!preDados.bairro) { router.push("/checkout"); return; }

      setProgresso(20);
      const nivel = preDados.bairro.level; 

      try {
        let freteFinal = 0;
        let statusParaOBanco = "Aguardando Entregador";

        // 🛣️ DECISÃO 1: ASFALTO ZERO (Fluxo Direto)
        if (nivel === "Asfalto Zero") {
          setEtapa("Asfalto Zero Detectado: Gerando Frete Direto...");
          freteFinal = 7.00; 
          statusParaOBanco = "Pendente"; // Manda direto para a cozinha
        } 
        
        // 🌲 DECISÃO 2: DESBRAVADORES (Fluxo Intermediário)
        else if (nivel === "Desbravadores") {
          setEtapa("Rota Desbravadora: Calculando Acesso...");
          freteFinal = 15.00;
          statusParaOBanco = "Pendente"; 
        }

        // 🚜 DECISÃO 3: ELITE / OFF-ROAD (Fluxo de Rateio)
        else {
          setEtapa(`Radar Off-Road: Calculando rateio na Linha ${preDados.bairro.linhaId}...`);
          const idLinha = String(preDados.bairro.linhaId || "");
          const valorLinha = 40.00;
          const valorBairro = 3.00;

          const q = query(
            collection(db, "orders"),
            where("endereco.linhaId", "==", idLinha),
            where("status", "in", ["Aguardando Entregador", "Pendente", "Em Produção"])
          );

          const snap = await getDocs(q);
          const totalPedidos = snap.size + 1;
          freteFinal = (valorLinha / totalPedidos) + valorBairro;
        }

        setProgresso(100);

        // 💾 SALVA A DECISÃO PARA O PAGAMENTO
        localStorage.setItem("logistica_final", JSON.stringify({
          taxaEntrega: freteFinal,
          statusInicial: statusParaOBanco, // Salva o status decidido aqui
          pesoTotal: preDados.pontosCarga,
          bairro: preDados.bairro,
          rua: preDados.rua,
          numero: preDados.numero
        }));

        await new Promise(r => setTimeout(r, 800));
        router.push("/checkout/pagamento");

      } catch (e) {
        console.error(e);
        router.push("/checkout");
      }
    };

    calcularDestinoReal();
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-10 font-sans text-white text-center">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-black uppercase italic mb-6">Motor de Decisão</h2>
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mb-4">
          <div className="bg-red-600 h-full transition-all duration-700" style={{ width: `${progresso}%` }}></div>
        </div>
        <p className="text-[10px] font-black uppercase italic animate-pulse">{etapa}</p>
      </div>
    </main>
  );
}