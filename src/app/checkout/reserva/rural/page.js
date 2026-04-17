"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function CheckoutRural() {
  const { user } = useAuth();
  const [taxaFinal, setTaxaFinal] = useState(0);
  const [infoLinha, setInfoLinha] = useState(null);

  // FUNÇÃO SECRETA DE CÁLCULO (Não revelada na UI)
  const calcularLogisticaOculta = async (bairro) => {
    if (!bairro.linha) {
      setTaxaFinal(bairro.fee); // Bairro comum, sem linha
      return;
    }

    // Busca quantos pedidos ativos existem nesta linha agora
    const q = query(
      collection(db, "orders"),
      where("endereco.linhaId", "==", bairro.linha),
      where("status", "in", ["Aguardando Entregador", "Em Produção"])
    );
    
    const snap = await getDocs(q);
    const totalPedidos = snap.size + 1; // +1 que é o pedido atual

    // REGRA DE EQUILÍBRIO: Linha Base (40) / Pedidos + Taxa fixa (3)
    const valorBaseLinha = 40;
    const taxaDesvio = 3;
    const calculo = (valorBaseLinha / totalPedidos) + taxaDesvio;

    setTaxaFinal(calculo);
    setInfoLinha({ id: bairro.linha, totalAnterior: snap.size });
  };

  // ... (Restante da lógica de envio de pedido)
  
  return (
    <main className="min-h-screen bg-white p-6 font-sans">
      <div className="bg-gray-900 p-8 rounded-[40px] text-white italic">
        <p className="text-[10px] font-black uppercase text-orange-500">Logística Elite</p>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Checkout Rural</h2>
        
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400">Entrega Especial:</span>
            <span className="font-black text-xl">R$ {taxaFinal.toFixed(2)}</span>
          </div>
          <p className="text-[8px] text-gray-500 mt-2 uppercase">Valor calculado com base na rota de entrega atual em Guapiara.</p>
        </div>

        <button className="w-full bg-orange-600 mt-10 py-5 rounded-3xl font-black uppercase italic shadow-xl shadow-orange-900/20">
          Confirmar Reserva Rural 🚜
        </button>
      </div>
    </main>
  );
}