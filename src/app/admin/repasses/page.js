"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment, writeBatch } from "firebase/firestore";

export default function AdminRepasses() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca cliques que ainda não foram pagos
  useEffect(() => {
    const buscarLogs = async () => {
      const q = query(collection(db, "logs_cliques"), where("pago", "==", false));
      const querySnapshot = await getDocs(q);
      const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(lista);
      setLoading(false);
    };
    buscarLogs();
  }, []);

  const liberarPagamento = async (log) => {
    try {
      const batch = writeBatch(db);

      // 1. Move o saldo de "Pendente" para "Moedas Reais" no usuário
      const userRef = doc(db, "users", log.userId);
      batch.update(userRef, {
        saldoPendente: increment(-log.valorMoeda),
        moedas: increment(log.valorMoeda)
      });

      // 2. Marca o log como pago para ele sumir da lista de pendentes
      const logRef = doc(db, "logs_cliques", log.id);
      batch.update(logRef, { pago: true });

      await batch.commit();
      setLogs(logs.filter(l => l.id !== log.id));
      alert("Pagamento liberado com sucesso!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto font-sans">
      <h1 className="text-xl font-black uppercase italic mb-6">💰 Gestão de Repasses</h1>
      {loading ? <p>Carregando cliques...</p> : (
        <div className="flex flex-col gap-4">
          {logs.map(log => (
            <div key={log.id} className="bg-white border p-4 rounded-2xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-gray-400">USER ID: {log.userId}</p>
                <p className="font-black text-xs uppercase italic">Parceiro: {log.parceiroId}</p>
                <p className="text-[10px] text-green-600 font-bold">VALOR: {log.valorMoeda} 🪙</p>
              </div>
              <button 
                onClick={() => liberarPagamento(log)}
                className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase italic"
              >
                PAGAR
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}