"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs, 
  Timestamp, 
  increment 
} from "firebase/firestore";

export default function PainelUrbana({ perfil }) {
  const router = useRouter();
  const [pedidoSugerido, setPedidoSugerido] = useState(null);
  const [pedidoAtivo, setPedidoAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bairrosDB, setBairrosDB] = useState([]);

  // 1. CARREGA LISTA DE BAIRROS PARA O CÁLCULO DO IMÃ
  useEffect(() => {
    const carregarBairros = async () => {
      try {
        const snap = await getDocs(collection(db, "neighborhoods"));
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBairrosDB(lista);
      } catch (err) { console.error(err); }
    };
    carregarBairros();
  }, []);

  // 2. MONITOR DE STATUS: RADAR VS ENTREGA ATIVA
  useEffect(() => {
    if (!perfil?.uid || bairrosDB.length === 0) return;

    const q = query(
      collection(db, "orders"), 
      where("status", "in", ["Aguardando Entregador", "Em Rota"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const emCurso = todos.find(p => p.entregadorId === perfil.uid && p.status === "Em Rota");
      
      if (emCurso) {
        setPedidoAtivo(emCurso);
        setPedidoSugerido(null);
        setLoading(false);
        return;
      }

      setPedidoAtivo(null);
      const disponiveis = todos.filter(p => p.status === "Aguardando Entregador" && p.level === perfil.level);

      if (disponiveis.length === 0) {
        setPedidoSugerido(null);
        setLoading(false);
        return;
      }

      const meuBairroData = bairrosDB.find(b => b.name === (perfil.ultimaLocalizacao || "Centro"));
      const meuNumRef = meuBairroData?.numero || 1;

      const ordenados = disponiveis.sort((a, b) => {
        const nA = bairrosDB.find(n => n.name === a.endereco?.bairro)?.numero || 999;
        const nB = bairrosDB.find(n => n.name === b.endereco?.bairro)?.numero || 999;
        return Math.abs(nA - meuNumRef) - Math.abs(nB - meuNumRef);
      });

      setPedidoSugerido(ordenados[0]);
      setLoading(false);
    });
    return () => unsub();
  }, [perfil?.uid, perfil?.level, perfil?.ultimaLocalizacao, bairrosDB]);

  const aceitarCorrida = async () => {
    if (!pedidoSugerido) return;
    await updateDoc(doc(db, "orders", pedidoSugerido.id), {
      status: "Em Rota",
      entregadorId: perfil.uid,
      aceitoEm: Timestamp.now()
    });
  };

  const finalizarEntrega = async () => {
    if (!pedidoAtivo) return;
    const taxa = pedidoAtivo.valores?.taxaEntrega || 0;
    await updateDoc(doc(db, "orders", pedidoAtivo.id), {
      status: "Finalizado",
      finalizadoEm: Timestamp.now()
    });
    await updateDoc(doc(db, "users", perfil.uid), {
      entregasHoje: increment(1), // Marcador de vazão
      ultimaLocalizacao: pedidoAtivo.endereco?.bairro || "Centro"
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
       <p className="font-black italic animate-pulse uppercase text-[10px]">Sincronizando Radar...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col p-6 text-white font-sans">
      
      {/* HEADER DE OPERAÇÃO (Focado apenas no Radar) */}
      {!pedidoAtivo && (
        <header className="flex justify-between items-center mb-10">
          <div className="bg-white/5 px-6 py-4 rounded-[25px] border border-white/10 flex-1 mr-3">
             <p className="text-[8px] font-black uppercase opacity-40 tracking-widest leading-none">Vazão Hoje</p>
             <h3 className="text-xl font-black italic">{perfil?.entregasHoje || 0} <span className="text-[10px] opacity-20 not-italic uppercase">Cargas</span></h3>
          </div>
          <button 
            onClick={() => router.push('/entregador/dashboard')}
            className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center shadow-lg shadow-blue-900/20"
          >
            <span className="text-xl">📊</span>
          </button>
        </header>
      )}

      {/* TELA DE ENTREGA ATIVA */}
      {pedidoAtivo ? (
        <div className="flex-1 flex flex-col justify-between py-4">
          <div className="text-center">
            <span className="bg-green-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase italic animate-pulse">Em Rota de Entrega</span>
            <h1 className="text-5xl font-black uppercase italic mt-6 leading-none tracking-tighter">{pedidoAtivo.endereco?.bairro}</h1>
          </div>
          <div className="bg-white text-black p-8 rounded-[45px] shadow-2xl">
            <p className="text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest">Endereço de Destino</p>
            <p className="text-2xl font-black uppercase italic leading-tight mb-6">{pedidoAtivo.endereco?.rua}, {pedidoAtivo.endereco?.numero}</p>
            <div className="border-t border-zinc-100 pt-6">
               <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Cliente</p>
               <p className="font-bold text-lg">{pedidoAtivo.clienteNome}</p>
            </div>
          </div>
          <button onClick={finalizarEntrega} className="w-full bg-white text-black py-8 rounded-[35px] font-black uppercase italic text-lg shadow-xl active:scale-95 transition">Finalizar Entrega ✅</button>
        </div>
      ) : (
        /* RADAR DE BUSCA */
        <div className="flex-1 flex flex-col items-center justify-center">
          {!pedidoSugerido ? (
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Rastreando Cargas {perfil.level}...</p>
            </div>
          ) : (
            <div className="w-full bg-white text-black p-8 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-widest">Carga Disponível</span>
                <p className="font-black text-2xl italic text-zinc-900">R$ {pedidoSugerido.valores?.taxaEntrega?.toFixed(2)}</p>
              </div>
              <h2 className="text-4xl font-black uppercase italic leading-none mb-2 text-zinc-900">{pedidoSugerido.endereco?.bairro}</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase mb-8 italic">{pedidoSugerido.endereco?.rua}, {pedidoSugerido.endereco?.numero}</p>
              <button onClick={aceitarCorrida} className="w-full bg-green-600 text-white py-6 rounded-[32px] font-black uppercase italic text-sm shadow-xl active:scale-95 transition">Aceitar Corrida</button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}