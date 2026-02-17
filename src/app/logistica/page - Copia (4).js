"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, Timestamp 
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function TerminalLogistico() {
  const { user } = useAuth();
  const [perfilOperador, setPerfilOperador] = useState(null);
  const [combosPorLinha, setCombosPorLinha] = useState({});
  const [autenticado, setAutenticado] = useState(false);
  const [tokenDigitado, setTokenDigitado] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. SINCRONIZAÇÃO DO PERFIL ELITE
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

  // 2. RADAR DE COMBOS E AUTO-SCAN (BUSCA POR LINHAID)
  useEffect(() => {
    if (!autenticado || !perfilOperador) return;

    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Aguardando Entregador", "Aguardando Restaurante", "Em Rota"]),
      where("rankEntrega", "==", perfilOperador.rank)
    );

    const unsub = onSnapshot(q, (snap) => {
      const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const grupos = pedidos.reduce((acc, p) => {
        const idL = String(p.endereco?.linhaId || p.endereco?.linhald || "0");
        if (perfilOperador.linhas.includes(idL)) {
          if (!acc[idL]) acc[idL] = [];
          acc[idL].push(p);
        }
        return acc;
      }, {});
      setCombosPorLinha(grupos);
    });

    return () => unsub();
  }, [autenticado, perfilOperador]);

  // 3. CÁLCULO DE GANHO BRUTO (INDESPENDENTE DO VALOR DO CLIENTE)
  const calcularGanhosOperacao = (pedidos) => {
    const CUSTO_LINHA_FIXO = 40.00; // Valor fixo da logística de Guapiara
    
    // Soma apenas os valores individuais de cada bairro cadastrados no banco
    // Aqui simulamos a busca do valor individual (ex: R$ 3,00) ignorando o rateio
    const somaBairrosBruto = pedidos.length * 3.00; // Ajuste para puxar do doc.bairro se necessário
    
    return CUSTO_LINHA_FIXO + somaBairrosBruto;
  };

  // 4. AÇÕES LOGÍSTICAS
  const ativarRotaCombo = async (pedidos) => {
    const prontos = pedidos.filter(p => p.status === "Em Rota");
    const promessas = prontos.map(p => updateDoc(doc(db, "orders", p.id), { 
        status: "Em Rota", 
        saidaLogistica: Timestamp.now() 
    }));
    await Promise.all(promessas);
    alert("Combo em movimento! 🚀");
  };

  const confirmarEntregaIndividual = async (id) => {
    await updateDoc(doc(db, "orders", id), { 
        status: "Entregue", 
        finalizadoEm: Timestamp.now() 
    });
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">Sincronizando...</div>;

  if (!autenticado) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <div className="bg-white text-black p-10 rounded-[45px] w-full max-w-sm text-center">
            <h2 className="text-2xl font-black uppercase italic">Terminal Elite</h2>
            <input type="password" placeholder="TOKEN" className="w-full bg-gray-100 p-6 rounded-3xl mt-6 text-center font-black" onChange={(e) => setTokenDigitado(e.target.value)} />
            <button onClick={() => tokenDigitado === perfilOperador?.codigoAcesso ? setAutenticado(true) : alert("Erro")} className="w-full bg-red-600 text-white py-5 rounded-3xl mt-4 font-black uppercase italic tracking-tighter">Autenticar ➔</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 max-w-md mx-auto pb-24 font-sans">
      <header className="mb-10 border-l-4 border-red-600 pl-4 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-black uppercase italic leading-none">{perfilOperador?.nomeOperador}</h1>
            <p className="text-[10px] font-bold text-zinc-500 italic mt-1 uppercase tracking-widest">Operação Off-Road Ativa</p>
        </div>
        <button onClick={() => setAutenticado(false)} className="text-[8px] font-black opacity-20 underline">LOGOUT</button>
      </header>

      <section className="space-y-8">
        {Object.keys(combosPorLinha).map(linhaId => {
          const pedidos = combosPorLinha[linhaId];
          const prontos = pedidos.filter(p => p.status === "Em Rota").length;
          const valorBruto = calcularGanhosOperacao(pedidos);

          return (
            <div key={linhaId} className="bg-zinc-900 rounded-[45px] border border-zinc-800 overflow-hidden shadow-2xl">
              {/* HEADER DO COMBO COM VALOR BRUTO */}
              <div className="p-6 bg-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black italic uppercase leading-none">Linha {linhaId}</h3>
                  <p className="text-[10px] font-black text-green-500 uppercase mt-2 tracking-tighter">Receber Bruto: R$ {valorBruto.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black italic text-red-600 leading-none">{prontos}/{pedidos.length}</p>
                    <p className="text-[8px] font-bold uppercase opacity-50">Prontos</p>
                </div>
              </div>

              {/* LISTA DE ENTREGAS INDIVIDUAIS */}
              <div className="p-4 space-y-2">
                {pedidos.map(p => (
                  <div key={p.id} className="bg-zinc-950 p-5 rounded-3xl border border-zinc-900">
                    <div className="flex justify-between items-center mb-4">
                        <div className="max-w-[70%]">
                            <p className="text-sm font-black uppercase italic truncate leading-none">{p.endereco?.bairro}</p>
                            <p className="text-[10px] font-bold text-zinc-700 uppercase italic truncate mt-1">{p.clienteNome}</p>
                        </div>
                        <span className={`text-[8px] font-black px-3 py-1 rounded-full ${p.status === "Em Rota" ? "bg-green-600 text-white animate-pulse" : "bg-zinc-800 text-zinc-600"}`}>
                            {p.status === "Em Rota" ? "PRONTO" : "COZINHA"}
                        </span>
                    </div>
                    
                    {/* Botão de Finalização Individual (Baixa um a um) */}
                    {p.status === "Em Rota" && (
                        <button 
                            onClick={() => confirmarEntregaIndividual(p.id)}
                            className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase italic text-[10px] active:scale-95 transition"
                        >
                            Confirmar Entrega ✓
                        </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Ação de Início de Rota Coletiva */}
              <button 
                onClick={() => ativarRotaCombo(pedidos)}
                className="w-full py-6 font-black uppercase italic text-xs bg-red-600 text-white shadow-inner active:bg-red-700 transition"
              >
                Ativar Rota da Linha ➔
              </button>
            </div>
          );
        })}
      </section>
    </main>
  );
}