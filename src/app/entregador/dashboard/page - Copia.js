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

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setPerfil(snap.data());
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "orders"),
      where("entregadorId", "==", user.uid),
      where("status", "==", "Finalizado"),
      orderBy("finalizadoEm", "desc"),
      limit(25)
    );

    const unsub = onSnapshot(q, (snap) => {
      const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistorico(dados);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Cálculo de ganhos em R$ (Baseado nas taxas de entrega acumuladas)
  const ganhosHoje = historico
    .filter(item => {
      const hoje = new Date().toLocaleDateString();
      const dataItem = item.finalizadoEm?.toDate().toLocaleDateString();
      return hoje === dataItem;
    })
    .reduce((acc, item) => acc + (item.valores?.taxaEntrega || 0), 0);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-white font-sans flex flex-col">
      {/* HEADER MOBILE-FIRST (Estilo App de Logística) */}
      <header className="bg-zinc-950 text-white p-6 pt-10 rounded-b-[40px] shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full">
            <span className="text-xs">❮</span>
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Painel do Parceiro</span>
          <div className="w-8" />
        </div>

        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em]">Total a Receber Hoje</p>
          <h1 className="text-6xl font-black italic tracking-tighter">
            R$ {ganhosHoje.toFixed(2)}
          </h1>
          <p className="text-[9px] font-bold text-zinc-500 uppercase italic">Referente a {perfil?.entregasHoje || 0} entregas</p>
        </div>
      </header>

      {/* LISTA DE ENTREGAS (Design para Smartphone) */}
      <section className="flex-1 p-5 overflow-y-auto">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-[11px] font-black uppercase text-zinc-900 italic tracking-wider">Histórico de Repasses</h3>
          <span className="text-[8px] font-bold text-zinc-400">Últimas 25</span>
        </div>
        
        <div className="space-y-4">
          {historico.map((item) => (
            <div key={item.id} className="bg-zinc-50 p-5 rounded-[28px] border border-zinc-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <span className="text-lg">📦</span>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-black uppercase italic text-xs text-zinc-800 leading-none">
                    {item.endereco?.bairro}
                  </h4>
                  <p className="text-emerald-600 font-black italic text-xs">R$ {item.valores?.taxaEntrega?.toFixed(2)}</p>
                </div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1">Finalizado às {item.finalizadoEm?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                
                <div className="mt-2 flex items-center gap-1">
                  <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-[7px] font-black text-amber-600 uppercase">Aguardando Repasse Diário</span>
                </div>
              </div>
            </div>
          ))}

          {historico.length === 0 && (
            <div className="py-20 text-center opacity-20">
              <p className="font-black italic uppercase text-xs">Sem atividade recente</p>
            </div>
          )}
        </div>
      </section>

      {/* BOTÃO FLUTUANTE DE VOLTA AO TRABALHO (Foco no Polegar) */}
      <div className="p-6 bg-gradient-to-t from-white via-white to-transparent sticky bottom-0">
        <button 
          onClick={() => router.push('/entregador')}
          className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase italic text-[11px] shadow-2xl active:scale-95 transition tracking-widest"
        >
          Voltar para o Radar ➔
        </button>
      </div>
    </main>
  );
}