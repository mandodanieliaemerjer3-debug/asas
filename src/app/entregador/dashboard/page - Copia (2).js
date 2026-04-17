"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc
} from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function DashboardEntregador() {
  const { user } = useAuth();
  const router = useRouter();

  const [perfil, setPerfil] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Perfil do entregador
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setPerfil(snap.data());
      }
    });

    return () => unsub();
  }, [user]);

  // 🔹 HISTÓRICO (SEM QUEBRAR COM ÍNDICE)
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "orders"),
      where("entregadorId", "==", user.uid),
      where("status", "==", "Finalizado"),
      limit(25) // 🔥 sem orderBy evita erro de índice
    );

    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 🔥 ordenação feita no FRONT (evita índice)
      lista.sort((a, b) => {
        const da = a.finalizadoEm?.seconds || 0;
        const db = b.finalizadoEm?.seconds || 0;
        return db - da;
      });

      setHistorico(lista);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // 🔥 GANHOS DO DIA
  const hoje = new Date().toLocaleDateString();

  const ganhosHoje = historico
    .filter(item => {
      if (!item.finalizadoEm) return false;
      const data = item.finalizadoEm.toDate().toLocaleDateString();
      return data === hoje;
    })
    .reduce((acc, item) => acc + (item.valores?.taxaEntrega || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">

      {/* 🔥 HEADER */}
      <header className="bg-gradient-to-br from-orange-500 to-orange-400 text-white p-6 pt-10 rounded-b-[40px] shadow-xl">

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/20 rounded-full"
          >
            ←
          </button>

          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
            Painel do Entregador
          </span>

          <div className="w-8" />
        </div>

        <div className="text-center">
          <p className="text-xs uppercase font-black opacity-80">
            Ganhos de hoje
          </p>

          <h1 className="text-5xl font-black italic mt-2">
            R$ {ganhosHoje.toFixed(2)}
          </h1>

          <p className="text-[10px] opacity-80 mt-1">
            {historico.length} entregas finalizadas
          </p>
        </div>
      </header>

      {/* 🚀 AÇÃO */}
      <div className="p-4">
        <button
          onClick={() => router.push("/entregador")}
          className="w-full bg-black text-white py-4 rounded-3xl font-black text-sm shadow-lg active:scale-95 transition"
        >
          🚚 Ir para pedidos disponíveis
        </button>
      </div>

      {/* 📦 HISTÓRICO */}
      <section className="flex-1 px-4 pb-28">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-black uppercase text-gray-400">
            Histórico
          </h2>
        </div>

        <div className="space-y-3">
          {historico.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center">

                <div>
                  <p className="text-sm font-black text-gray-800">
                    {item.endereco?.bairro}
                  </p>

                  <p className="text-xs text-gray-400">
                    {item.endereco?.rua}, {item.endereco?.numero}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-green-600">
                    R$ {Number(item.valores?.taxaEntrega || 0).toFixed(2)}
                  </p>

                  <p className="text-[10px] text-gray-400">
                    entregue
                  </p>
                </div>
              </div>
            </div>
          ))}

          {historico.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-bold text-sm">
              Nenhuma entrega ainda
            </div>
          )}
        </div>
      </section>

      {/* 🔥 BOTÃO FIXO */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t">
        <button
          onClick={() => router.push("/entregador")}
          className="w-full bg-orange-500 text-white py-4 rounded-3xl font-black shadow-xl"
        >
          VOLTAR AO TRABALHO 🚀
        </button>
      </div>
    </main>
  );
}