"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, Timestamp, getDoc, setDoc 
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function TerminalLogistico() {
  const { user } = useAuth();
  const [autenticado, setAutenticado] = useState(false);
  const [tokenDigitado, setTokenDigitado] = useState("");
  const [perfilOperador, setPerfilOperador] = useState(null);
  const [entregaAtiva, setEntregaAtiva] = useState(null);
  const [radarPedidos, setRadarPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. SINCRONIZAÇÃO DE PERFIL
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "operadores", user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setPerfilOperador({ id: snap.id, ...d, linhas: (d.linhasConhecidas || []).map(l => String(l)) });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // 2. RADAR COM LÓGICA DE SINERGIA (ELITE VS URBANO)
  useEffect(() => {
    if (!autenticado || !perfilOperador || !perfilOperador.disponibilidade) return;

    const qRadar = query(
      collection(db, "orders"),
      where("status", "==", "Aguardando Entregador"), // Nome padrão que vem do Checkout
      where("rankEntrega", "==", perfilOperador.rank)
    );

    const unsubRadar = onSnapshot(qRadar, (snap) => {
      const aptos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtrados = aptos.filter(p => {
        const idL = String(p.endereco?.linhaId || p.endereco?.linhald || "");
        return perfilOperador.linhas.includes(idL);
      });

      // ACEITE AUTOMÁTICO PARA OFF-ROAD ROOT
      if (perfilOperador.rank === "Off-Road Root" && filtrados.length > 0 && !entregaAtiva) {
        aceitarCargaElite(filtrados[0]);
      }
      setRadarPedidos(filtrados);
    });

    // MONITOR DE ROTA ATIVA (Considera 'Em Rota' ou 'Aguardando Restaurante')
    const qRota = query(
      collection(db, "orders"),
      where("operadorId", "==", user.uid),
      where("status", "in", ["Em Rota", "Aguardando Restaurante"])
    );
    const unsubRota = onSnapshot(qRota, (snap) => {
      if (!snap.empty) setEntregaAtiva({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setEntregaAtiva(null);
    });

    return () => { unsubRadar(); unsubRota(); };
  }, [autenticado, perfilOperador, entregaAtiva, user]);

  // 3. FUNÇÃO DE ACEITE ELITE (Muda status para o Restaurante começar)
  const aceitarCargaElite = async (pedido) => {
    const ref = doc(db, "orders", pedido.id);
    await updateDoc(ref, {
      status: "Aguardando Restaurante", // Gatilho para o Restaurante
      operadorId: user.uid,
      aceitoEm: Timestamp.now()
    });
    
    // Opcional: Criar/Atualizar a "Linha do Dia" para dividir fretes futuros
    atualizarLinhaDoDia(pedido.endereco?.linhaId);
  };

  const atualizarLinhaDoDia = async (linhaId) => {
    if (!linhaId) return;
    const hoje = new Date().toISOString().split('T')[0];
    const linhaRef = doc(db, "linhas_do_dia", `${hoje}_linha_${linhaId}`);
    const snap = await getDoc(linhaRef);
    
    if (snap.exists()) {
      await updateDoc(linhaRef, { pedidosAtivos: snap.data().pedidosAtivos + 1 });
    } else {
      await setDoc(linhaRef, { linhaId, pedidosAtivos: 1, data: hoje });
    }
  };

  const finalizarEntrega = async (id) => {
    await updateDoc(doc(db, "orders", id), { 
      status: "Entregue",
      finalizadoEm: Timestamp.now()
    });
    alert("Entrega concluída com sucesso!");
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">CARREGANDO...</div>;

  if (!autenticado) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-white rounded-[45px] p-10 w-full max-w-sm text-center">
          <h2 className="text-2xl font-black uppercase italic">Login Logístico</h2>
          <input 
            type="password" 
            placeholder="CÓDIGO DE ACESSO"
            className="w-full bg-gray-100 p-5 rounded-3xl mt-8 text-center font-black outline-none border-2 border-transparent focus:border-red-600 transition"
            onChange={(e) => setTokenDigitado(e.target.value)}
          />
          <button 
            onClick={() => tokenDigitado === perfilOperador?.codigoAcesso ? setAutenticado(true) : alert("Código Errado")}
            className="w-full bg-red-600 text-white py-5 rounded-3xl mt-4 font-black uppercase italic"
          >
            Acessar Radar ➔
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white max-w-md mx-auto p-6 font-sans">
      <header className="mb-8 border-l-4 border-red-600 pl-4">
        <h1 className="text-2xl font-black uppercase italic">{perfilOperador?.nomeOperador}</h1>
        <p className="text-[10px] font-bold text-zinc-500 uppercase">{perfilOperador?.rank} - Linhas: {perfilOperador?.linhas.join(", ")}</p>
      </header>

      {entregaAtiva ? (
        <section className="bg-white text-black p-8 rounded-[45px] shadow-2xl">
          <p className="text-[10px] font-black text-red-600 uppercase mb-2">
            {entregaAtiva.status === "Aguardando Restaurante" ? "⌛ Aguardando Preparo" : "🚚 Em Rota de Entrega"}
          </p>
          <h2 className="text-3xl font-black uppercase leading-none mb-4">{entregaAtiva.clienteNome}</h2>
          <div className="bg-zinc-100 p-5 rounded-3xl mb-8">
             <p className="font-black italic text-sm">{entregaAtiva.endereco?.bairro}</p>
             <p className="text-xs">{entregaAtiva.endereco?.rua}, nº {entregaAtiva.endereco?.numero}</p>
          </div>
          
          {entregaAtiva.status === "Em Rota" && (
            <button 
              onClick={() => finalizarEntrega(entregaAtiva.id)}
              className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase italic text-xs shadow-xl"
            >
              Confirmar Entrega Final ✓
            </button>
          )}
        </section>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-zinc-500 italic">Radar de Demandas</h3>
          {radarPedidos.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[40px] opacity-40">
              <p className="text-[10px] font-black uppercase">Procurando pedidos rurais...</p>
            </div>
          ) : (
            radarPedidos.map(p => (
              <div key={p.id} className="bg-zinc-900 p-6 rounded-[30px] border border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="text-lg font-black uppercase italic">{p.endereco?.bairro}</p>
                  <p className="text-[9px] font-bold text-green-500 uppercase italic">Frete: R$ {p.valores?.taxaEntrega.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}