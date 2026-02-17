"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; //
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, Timestamp, getDoc 
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

  // 2. RADAR DE PEDIDOS (Monitora o que precisa de atenção)
  useEffect(() => {
    if (!autenticado || !perfilOperador) return;

    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Aguardando Entregador", "Pendente", "Em Produção", "Pronto para Retirada", "Em Rota"]),
      where("rankEntrega", "==", perfilOperador.rank)
    );

    const unsub = onSnapshot(q, (snap) => {
      const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const grupos = pedidos.reduce((acc, p) => {
        const idL = String(p.endereco?.linhaId || "0");
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

  // 3. CÁLCULO DE GANHO (Linha + Bairros)
  const calcularGanhosOperacao = (pedidos) => {
    const CUSTO_LINHA_FIXO = 40.00; 
    const somaBairrosBruto = pedidos.length * 3.00; 
    return CUSTO_LINHA_FIXO + somaBairrosBruto;
  };

  // 4. ATIVAR ROTA (O GRANDE AJUSTE: COMUNICAÇÃO COM A COZINHA)
  const ativarRotaCombo = async (pedidos, linhaId) => {
    try {
      const promessas = pedidos.map(p => {
        // Se o restaurante não sabia que podia fazer, agora ele sabe!
        if (p.status === "Aguardando Entregador") {
          return updateDoc(doc(db, "orders", p.id), { 
            status: "Pendente", 
            operadorId: user.uid 
          });
        }
        // Se o lanche já está pronto, o entregador assume a carga
        if (p.status === "Pronto para Retirada") {
          return updateDoc(doc(db, "orders", p.id), { 
            status: "Em Rota", 
            operadorId: user.uid,
            saidaLogistica: Timestamp.now() 
          });
        }
        return null;
      }).filter(p => p !== null);

      await Promise.all(promessas);

      // RESET DA LINHA: Libera o rateio para novos clientes
      const hoje = new Date().toISOString().split('T')[0];
      const linhaRef = doc(db, "linhas_do_dia", `${hoje}_linha_${linhaId}`);
      await updateDoc(linhaRef, { pedidosAtivos: 0 });

      alert(`Rota Linha ${linhaId} Confirmada! Cozinha avisada.`);
    } catch (e) {
      alert("Erro ao ativar: " + e.message);
    }
  };

  const confirmarEntregaIndividual = async (id) => {
    await updateDoc(doc(db, "orders", id), { 
        status: "Entregue", 
        finalizadoEm: Timestamp.now() 
    });
    alert("Entrega realizada! ✅");
  };

  if (loading) return <div className="p-20 text-center text-white font-black italic">Sincronizando Radar...</div>;

  if (!autenticado) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <div className="bg-white text-black p-12 rounded-[50px] w-full max-w-sm text-center shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic italic">Acesso Operacional</h2>
            <input 
              type="password" placeholder="TOKEN ELITE" 
              className="w-full bg-zinc-100 p-6 rounded-3xl mt-8 text-center text-2xl font-black outline-none border-4 border-transparent focus:border-red-600 transition" 
              onChange={(e) => setTokenDigitado(e.target.value)} 
            />
            <button 
              onClick={() => tokenDigitado === perfilOperador?.codigoAcesso ? setAutenticado(true) : alert("Token Errado")} 
              className="w-full bg-red-600 text-white py-6 rounded-3xl mt-6 font-black uppercase italic shadow-xl"
            >ENTRAR NO RADAR ➔</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 max-w-md mx-auto font-sans">
      <header className="mb-10 flex justify-between items-end border-b border-zinc-900 pb-6">
        <div>
            <h1 className="text-2xl font-black uppercase italic leading-none">{perfilOperador?.nomeOperador}</h1>
            <p className="text-[9px] font-bold text-red-600 uppercase tracking-[0.3em] mt-2 italic">Rank: {perfilOperador?.rank}</p>
        </div>
        <button onClick={() => setAutenticado(false)} className="text-[10px] font-black opacity-20 uppercase underline">Sair</button>
      </header>

      <section className="space-y-6">
        {Object.keys(combosPorLinha).length === 0 && (
          <div className="py-24 text-center border-4 border-dashed border-zinc-900 rounded-[50px] opacity-20">
            <p className="font-black italic uppercase text-xs">Aguardando Cargas...</p>
          </div>
        )}

        {Object.keys(combosPorLinha).map(linhaId => {
          const pedidos = combosPorLinha[linhaId];
          const valorBruto = calcularGanhosOperacao(pedidos);

          return (
            <div key={linhaId} className="bg-zinc-900 rounded-[45px] overflow-hidden shadow-2xl border border-zinc-800">
              <div className="p-8 bg-zinc-800/50 flex justify-between items-center border-b border-zinc-800">
                <div>
                  <h3 className="text-3xl font-black italic uppercase leading-none">Linha {linhaId}</h3>
                  <p className="text-emerald-500 font-black text-[10px] uppercase mt-2">Ganhos: R$ {valorBruto.toFixed(2)}</p>
                </div>
                <div className="bg-red-600 text-white px-4 py-2 rounded-2xl font-black italic text-lg shadow-lg">
                  {pedidos.length}
                </div>
              </div>

              <div className="p-4 space-y-3">
                {pedidos.map(p => (
                  <div key={p.id} className="bg-zinc-950 p-5 rounded-[30px] border border-zinc-900">
                    <div className="flex justify-between items-center mb-4">
                        <div className="max-w-[70%]">
                            <p className="text-xs font-black uppercase italic leading-none truncate">{p.endereco?.bairro}</p>
                            <p className="text-[8px] font-bold text-zinc-600 uppercase mt-1 italic">{p.clienteNome}</p>
                        </div>
                        <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase italic ${p.status === 'Pronto para Retirada' ? 'bg-green-600 text-white animate-bounce' : 'bg-zinc-800 text-zinc-500'}`}>
                            {p.status === "Aguardando Entregador" ? "Aguardando Vc" : p.status}
                        </span>
                    </div>
                    
                    {p.status === "Em Rota" && (
                        <button 
                            onClick={() => confirmarEntregaIndividual(p.id)}
                            className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase italic text-[10px] shadow-lg"
                        >Finalizar Entrega ✓</button>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => ativarRotaCombo(pedidos, linhaId)}
                className="w-full py-7 font-black uppercase italic text-[11px] bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all"
              >
                Ativar Rota e Avisar Cozinha ➔
              </button>
            </div>
          );
        })}
      </section>
    </main>
  );
}