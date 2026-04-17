"use client";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs 
} from "firebase/firestore";

export default function CerebroMogu() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // 1. Identifica o dia de hoje para o rateio
    const hoje = new Date().toISOString().split('T')[0];
    
    // 2. OUVINTE ATIVO: Dispara toda vez que um pedido novo surgir
    const q = query(collection(db, "orders"), where("criadoEm", "==", hoje));

    const unsub = onSnapshot(q, async (snap) => {
      const pedidosPorLinha = {};
      
      // Conta os pedidos por linha na memória
      snap.docs.forEach(doc => {
        const linhaId = doc.data().endereco?.linhaId;
        if (linhaId) {
          pedidosPorLinha[linhaId] = (pedidosPorLinha[linhaId] || 0) + 1;
        }
      });

      // 3. Atualiza os preços no Firebase
      const linhasSnap = await getDocs(collection(db, "lines"));
      
      linhasSnap.forEach(async (linhaDoc) => {
        const dados = linhaDoc.data();
        const qtd = pedidosPorLinha[linhaDoc.id] || 0;
        
        // Lógica de Rateio: Preço Base / (Pessoas + 1)
        // Ex: 100 / (0+1) = 100 | 100 / (1+1) = 50
        const novoPreco = Math.ceil(dados.basePrice / (qtd + 1));

        if (novoPreco !== dados.price) {
          await updateDoc(doc(db, "lines", linhaDoc.id), { price: novoPreco });
          setLogs(prev => [`Linha ${linhaDoc.id}: R$ ${novoPreco} (${qtd} pedidos)`, ...prev].slice(0, 10));
        }
      });
    }, (err) => console.error("Erro no Cérebro:", err));

    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-10 font-mono">
      <div className="border border-orange-500/30 p-10 rounded-[40px] max-w-2xl mx-auto text-center">
        <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-4 animate-ping"></div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-orange-500">Cérebro Logístico</h1>
        <p className="text-[10px] opacity-40 uppercase font-bold mt-2">Processando Rateio Dinâmico - Mogu Mogu</p>
        
        <div className="mt-12 space-y-2 text-left bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
          <p className="text-[9px] font-black opacity-20 uppercase mb-4 tracking-widest text-center">Monitor de Atividades</p>
          {logs.map((log, i) => (
            <p key={i} className="text-xs text-emerald-500">{`> ${log}`}</p>
          ))}
          {logs.length === 0 && <p className="text-xs opacity-20 text-center italic">Aguardando primeiro pedido do dia...</p>}
        </div>
      </div>
    </main>
  );
}