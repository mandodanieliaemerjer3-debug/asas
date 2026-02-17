"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, Timestamp, getDoc 
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function TerminalLogistico() {
  const { user } = useAuth();
  
  // ESTADOS DE CONTROLE
  const [autenticado, setAutenticado] = useState(false);
  const [tokenDigitado, setTokenDigitado] = useState("");
  const [perfilOperador, setPerfilOperador] = useState(null);
  const [entregaAtiva, setEntregaAtiva] = useState(null);
  const [radarPedidos, setRadarPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ESTADOS DE PERFORMANCE (FINANCEIRO)
  const [ganhosDia, setGanhosDia] = useState(0);
  const [totalEntregas, setTotalEntregas] = useState(0);

  // 1. SINCRONIZAÇÃO DE PERFIL PROFISSIONAL
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "operadores", user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setPerfilOperador({ 
          id: snap.id, 
          ...d, 
          linhas: (d.linhasConhecidas || []).map(l => String(l)) 
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // 2. RADAR ELITE E FINANCEIRO
  useEffect(() => {
    if (!autenticado || !perfilOperador || !perfilOperador.disponibilidade) return;

    // MONITOR DE GANHOS (Busca entregas concluídas hoje por você)
    const qGanhos = query(
      collection(db, "orders"),
      where("operadorId", "==", user.uid),
      where("status", "==", "Entregue")
    );
    const unsubGanhos = onSnapshot(qGanhos, (snap) => {
      const soma = snap.docs.reduce((acc, d) => acc + (d.data().valores?.taxaEntrega || 0), 0);
      setGanhosDia(soma);
      setTotalEntregas(snap.size);
    });

    // RADAR DE NOVAS CARGAS
    const qRadar = query(
      collection(db, "orders"),
      where("status", "==", "Aguardando Entregador"),
      where("rankEntrega", "==", perfilOperador.rank)
    );
    const unsubRadar = onSnapshot(qRadar, (snap) => {
      const aptos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtrados = aptos.filter(p => {
        const idL = String(p.endereco?.linhaId || p.endereco?.linhald || "");
        return perfilOperador.linhas.includes(idL);
      });

      // ACEITE AUTOMÁTICO (OFF-ROAD ROOT)
      if (perfilOperador.rank === "Off-Road Root" && filtrados.length > 0 && !entregaAtiva) {
        vincularOperador(filtrados[0].id);
      }
      setRadarPedidos(filtrados);
    });

    // MONITOR DE ROTA ATIVA
    const qRota = query(
      collection(db, "orders"),
      where("operadorId", "==", user.uid),
      where("status", "==", "Em Rota")
    );
    const unsubRota = onSnapshot(qRota, (snap) => {
      if (!snap.empty) setEntregaAtiva({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setEntregaAtiva(null);
    });

    return () => { unsubGanhos(); unsubRadar(); unsubRota(); };
  }, [autenticado, perfilOperador, entregaAtiva, user]);

  // FUNÇÕES DE OPERAÇÃO
  const vincularOperador = async (id) => {
    await updateDoc(doc(db, "orders", id), { 
      status: "Em Rota", 
      operadorId: user.uid, 
      aceitoEm: Timestamp.now() 
    });
    new Audio("/sons/alerta_nova_rota.mp3").play().catch(() => {});
  };

  const finalizarEntregaFinal = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), { 
        status: "Entregue",
        finalizadoEm: Timestamp.now()
      });
      alert("✓ Rota Concluída! Radar reativado.");
    } catch (e) {
      alert("Erro ao finalizar!");
    }
  };

  // INTERFACE DE CARREGAMENTO / LOGIN
  if (loading) return <div className="p-20 text-center font-black animate-pulse">AUTENTICANDO...</div>;
  if (!autenticado) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-[45px] p-10 w-full max-w-sm text-center">
          <h2 className="text-2xl font-black uppercase italic">Terminal Logístico</h2>
          <input 
            type="password" 
            placeholder="TOKEN DE 8 DÍGITOS"
            className="w-full bg-gray-100 p-5 rounded-3xl mt-8 text-center font-black tracking-widest outline-none"
            onChange={(e) => setTokenDigitado(e.target.value)}
          />
          <button 
            onClick={() => tokenDigitado === perfilOperador?.codigoAcesso ? setAutenticado(true) : alert("Erro!")}
            className="w-full bg-red-600 text-white py-5 rounded-3xl mt-4 font-black uppercase italic"
          >
            Acessar Sistema ➔
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white max-w-md mx-auto p-6 font-sans">
      
      {/* DASHBOARD FINANCEIRO */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-zinc-900 p-5 rounded-[30px] border border-zinc-800">
          <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">Ganhos Dia</p>
          <p className="text-xl font-black italic">R$ {ganhosDia.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900 p-5 rounded-[30px] border border-zinc-800 text-right">
          <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Entregas</p>
          <p className="text-xl font-black italic">{totalEntregas}</p>
        </div>
      </div>

      {/* HEADER STATUS */}
      <header className="mb-8 border-l-4 border-red-600 pl-4">
        <h1 className="text-2xl font-black uppercase italic">{perfilOperador?.nomeOperador}</h1>
        <div className="flex gap-2 mt-2">
          <span className="bg-red-600 text-[8px] px-2 py-1 rounded font-black">{perfilOperador?.rank}</span>
          <span className="bg-zinc-800 text-[8px] px-2 py-1 rounded font-black uppercase">Linhas: {perfilOperador?.linhas.join(", ")}</span>
        </div>
      </header>

      {/* MANIFESTO DE CARGA ATIVA */}
      {entregaAtiva ? (
        <section className="bg-white text-black p-8 rounded-[45px] shadow-2xl animate-in zoom-in duration-300">
          <p className="text-[10px] font-black text-red-600 uppercase mb-2">Carga Vinculada</p>
          <h2 className="text-3xl font-black uppercase leading-none mb-6">{entregaAtiva.clienteNome}</h2>
          <div className="bg-zinc-100 p-5 rounded-3xl mb-8">
            <p className="font-black italic text-sm">{entregaAtiva.endereco?.bairro}</p>
            <p className="text-xs">{entregaAtiva.endereco?.rua}, {entregaAtiva.endereco?.numero}</p>
          </div>
          <button 
            onClick={() => finalizarEntregaFinal(entregaAtiva.id)}
            className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase italic text-xs shadow-xl active:scale-95 transition"
          >
            Finalizar Rota ✓
          </button>
        </section>
      ) : (
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-500 italic mb-6 tracking-widest">Aguardando Carga Rural...</h3>
          {radarPedidos.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[40px] opacity-30">
              <div className="w-12 h-12 border-4 border-t-red-600 border-zinc-800 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[10px] font-black uppercase italic">Varrendo Linhas Habilitadas</p>
            </div>
          ) : (
            radarPedidos.map(pedido => (
              <div key={pedido.id} className="bg-zinc-900 p-6 rounded-[30px] border border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="text-lg font-black uppercase italic">{pedido.endereco?.bairro}</p>
                  <p className="text-[9px] font-bold text-green-500 uppercase">Taxa: R$ {pedido.valores?.taxaEntrega.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* BOTÃO DE EXPEDIENTE */}
      <footer className="mt-12">
        <button 
          onClick={() => updateDoc(doc(db, "operadores", user.uid), { disponibilidade: !perfilOperador.disponibilidade })}
          className={`w-full py-5 rounded-3xl font-black uppercase italic text-[10px] tracking-widest ${
            perfilOperador?.disponibilidade ? "bg-zinc-900 text-red-600 border border-red-900/20" : "bg-red-600 text-white shadow-lg"
          }`}
        >
          {perfilOperador?.disponibilidade ? "Desligar Terminal" : "Entrar em Operação 🚀"}
        </button>
      </footer>
    </main>
  );
}