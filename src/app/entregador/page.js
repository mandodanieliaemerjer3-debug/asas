"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import soundManager from "../../lib/sounds";

export default function MaestroEntregadorCompleto() {
  const [todosOperadores, setTodosOperadores] = useState([]);
  const [buscaNome, setBuscaNome] = useState("");
  const [operadoresFiltrados, setOperadoresFiltrados] = useState([]);
  const [operadorSelecionado, setOperadorSelecionado] = useState(null);
  
  const [perfil, setPerfil] = useState(null);
  const [pedidoDisponivel, setPedidoDisponivel] = useState(null);
  const [pedidoEmAndamento, setPedidoEmAndamento] = useState(null); 
  const [tempoRestante, setTempoRestante] = useState(20);
  const [loading, setLoading] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [tokenDigitado, setTokenDigitado] = useState("");

  const timerRef = useRef(null);

  // 1. CARREGA TODOS OS OPERADORES DISPONÍVEIS
  useEffect(() => {
    const q = query(collection(db, "operadores"), where("disponibilidade", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodosOperadores(lista);
    });
    return () => unsub();
  }, []);

  // 2. FILTRA OS OPERADORES CONFORME DIGITA O NOME
  useEffect(() => {
    if (!buscaNome.trim()) {
      setOperadoresFiltrados([]);
      return;
    }
    const filtrados = todosOperadores.filter(op => 
      op.nomeOperador?.toLowerCase().includes(buscaNome.toLowerCase())
    );
    setOperadoresFiltrados(filtrados);
  }, [buscaNome, todosOperadores]);

  // 3. VALIDAÇÃO DA SENHA DO OPERADOR
  const handleLoginPorToken = () => {
    if (!operadorSelecionado) {
      alert("Selecione um operador na lista primeiro!");
      return;
    }
    if (tokenDigitado.trim() === operadorSelecionado.codigoAcesso) {
      const perfilCompleto = {
        ...operadorSelecionado,
        uid: operadorSelecionado.uid || operadorSelecionado.id
      };
      setPerfil(perfilCompleto);
      setAutenticado(true);
    } else {
      alert("Código de acesso incorreto!");
    }
  };

  // 4. RADAR INTELIGENTE E MONITOR DE ROTA EM ANDAMENTO
  useEffect(() => {
    if (!autenticado || !perfil) return;

    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Aguardando Entregador", "Em Rota"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const todosPedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // VERIFICA SE ELE JÁ TEM ROTA ATIVA
      const rotaAtiva = todosPedidos.find(p => p.status === "Em Rota" && p.operadorId === perfil.uid);
      if (rotaAtiva) {
        setPedidoEmAndamento(rotaAtiva);
        setPedidoDisponivel(null);
        return;
      } else {
        setPedidoEmAndamento(null);
      }

      if (pedidoDisponivel) return;

      const agora = Date.now();

      // ESTEIRA DE FILTROS PARA NOVAS OFERTAS
      const pedidoIdeal = todosPedidos.find(pedido => {
        if (pedido.status !== "Aguardando Entregador") return false;

        const linhaPedido = String(pedido.endereco?.linhaId || "Sem Linha");
        const conheceLinha = perfil.linhasConhecidas?.includes(linhaPedido);
        if (!conheceLinha) return false;

        const pesoTotal = pedido.itens?.reduce((acc, i) => acc + (i.peso || 0), 0) || 0;
        if (pesoTotal > (perfil.limitePeso || 400)) return false;

        if (pedido.rejeitadoPor && pedido.rejeitadoPor[perfil.uid]) {
          const tempoRejeicao = pedido.rejeitadoPor[perfil.uid].seconds * 1000;
          if (agora - tempoRejeicao < 5 * 60 * 1000) return false; 
        }

        const temBolo = pedido.itens?.some(i => i.isBolo === true);
        if (temBolo && perfil.especialidades?.bolo !== true) return false;

        if (pedido.perguntaGas === "sim" && perfil.especialidades?.gas !== true) return false;

        return true;
      });

      if (pedidoIdeal) {
        setPedidoDisponivel(pedidoIdeal);
        setTempoRestante(20);
        soundManager.play("novoPedido"); 
      }
    });

    return () => unsub();
  }, [autenticado, perfil, pedidoDisponivel]);

  // 5. CRONÔMETRO DE 20 SEGUNDOS
  useEffect(() => {
    if (!pedidoDisponivel) return;

    timerRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          rejeitarCargaAutomatico(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [pedidoDisponivel]);

  const aceitarCarga = async () => {
    clearInterval(timerRef.current);
    soundManager.play("click");
    try {
      await updateDoc(doc(db, "orders", pedidoDisponivel.id), {
        status: "Em Rota",
        operadorId: perfil.uid,
        saidaLogistica: Timestamp.now()
      });
    } catch (e) { alert(e.message); }
  };

  const finalizarEntregaComSucesso = async () => {
    if (!pedidoEmAndamento) return;
    soundManager.play("click");
    try {
      await updateDoc(doc(db, "orders", pedidoEmAndamento.id), {
        status: "Entregue",
        finalizadoEm: Timestamp.now()
      });
      alert("Perfeito! Carga entregue. Voltando ao radar.");
      setPedidoEmAndamento(null);
    } catch (e) { alert(e.message); }
  };

  const jsonRejeicao = () => ({ [`rejeitadoPor.${perfil.uid}`]: Timestamp.now() });

  const rejeitarCargaManual = async () => {
    clearInterval(timerRef.current);
    soundManager.play("remove");
    try {
      await updateDoc(doc(db, "orders", pedidoDisponivel.id), jsonRejeicao());
      setPedidoDisponivel(null);
    } catch (e) { console.error(e); }
  };

  const rejeitarCargaAutomatico = async () => {
    soundManager.play("remove");
    if (!pedidoDisponivel) return;
    try {
      await updateDoc(doc(db, "orders", pedidoDisponivel.id), jsonRejeicao());
      setPedidoDisponivel(null);
    } catch (e) { console.error(e); }
  };

  const logoutOperador = () => {
    setPerfil(null);
    setAutenticado(false);
    setPedidoDisponivel(null);
    setPedidoEmAndamento(null);
    setTokenDigitado("");
    setBuscaNome("");
    setOperadorSelecionado(null);
  };

  // INTERFACE 1: ENTRADA POR NOME + SENHA
  if (!autenticado) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <div className="bg-white text-black p-8 rounded-[45px] w-full max-w-sm text-center shadow-2xl">
          <h2 className="text-2xl font-black uppercase italic">Portão Logístico</h2>
          <p className="text-[10px] text-gray-400 uppercase font-bold mt-1 mb-6">Selecione seu perfil operador</p>

          {!operadorSelecionado ? (
            <div className="text-left relative">
              <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 pl-2">Quem está entrando?</label>
              <input 
                type="text" 
                placeholder="Comece a digitar seu nome..." 
                className="w-full bg-zinc-100 p-4 rounded-2xl mt-1 text-sm font-bold outline-none border-2 border-transparent focus:border-orange-500 transition"
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
              />
              
              {operadoresFiltrados.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl max-h-40 overflow-y-auto shadow-xl z-50 p-2 space-y-1">
                  {operadoresFiltrados.map(op => (
                    <button
                      key={op.id}
                      onClick={() => { setOperadorSelecionado(op); setBuscaNome(op.nomeOperador); }}
                      className="w-full text-left p-3 rounded-xl text-xs font-black uppercase tracking-tight hover:bg-orange-50 hover:text-orange-600 transition-colors block"
                    >
                      👤 {op.nomeOperador}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in text-left">
              <div className="bg-orange-50 border-2 border-orange-100 p-4 rounded-3xl flex justify-between items-center mb-6">
                <div>
                  <p className="text-[8px] font-black text-orange-400 uppercase leading-none">Operador Selecionado</p>
                  <p className="text-sm font-black uppercase text-orange-600 mt-1">{operadorSelecionado.nomeOperador}</p>
                </div>
                <button onClick={() => setOperadorSelecionado(null)} className="text-[10px] font-black text-gray-400 underline">Trocar</button>
              </div>

              <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 pl-2">Insira sua Senha Operacional</label>
              <input 
                type="password" 
                maxLength={8}
                placeholder="••••••••" 
                className="w-full bg-zinc-100 p-5 rounded-2xl mt-1 text-center text-xl font-black outline-none border-2 border-transparent focus:border-red-600 transition tracking-widest" 
                onChange={(e) => setTokenDigitado(e.target.value)} 
                value={tokenDigitado}
              />
              
              <button 
                onClick={handleLoginPorToken}
                className="w-full bg-zinc-900 text-white py-5 rounded-2xl mt-4 font-black uppercase italic text-xs shadow-xl active:scale-95 transition-transform"
              >
                AUTENTICAR TURNO ➔
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  // INTERFACE 2: TERMINAL EM OPERAÇÃO
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 max-w-md mx-auto font-sans flex flex-col justify-between">
      <header className="flex justify-between items-end border-b border-zinc-900 pb-4">
        <div>
          <h1 className="text-lg font-black uppercase italic leading-none">{perfil.nomeOperador}</h1>
          <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[0.2em] mt-1 italic">RANK: {perfil.rank}</p>
        </div>
        <button onClick={logoutOperador} className="text-[10px] font-black opacity-30 uppercase underline">Sair</button>
      </header>

      <section className="flex-1 flex items-center justify-center py-4">
        
        {/* 🟢 TELA DE VIAGEM ATIVA (O QUE ELE VÊ DEPOIS DE ACEITAR) */}
        {pedidoEmAndamento ? (
          <div className="bg-zinc-900 w-full rounded-[35px] p-6 border-2 border-emerald-500 flex flex-col text-center relative overflow-hidden shadow-2xl animate-fade-in">
            <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest bg-emerald-950/80 py-1.5 px-4 rounded-full mx-auto border border-emerald-800 mb-2">
              🚚 ROTA EM ANDAMENTO
            </span>
            
            <span className="text-white font-black text-4xl italic my-2">#{pedidoEmAndamento.id.slice(-4).toUpperCase()}</span>
            <h3 className="text-xl font-black uppercase italic text-emerald-400">{pedidoEmAndamento.endereco?.bairro}</h3>
            
            <div className="my-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-850 text-left space-y-4">
              {/* BLOCO RETIRADA (RESTAURANTE) */}
              <div className="border-l-4 border-orange-500 pl-3">
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-wider">PONTO A: RETIRAR NA COZINHA</p>
                <p className="text-sm font-black text-white uppercase mt-0.5">🏪 {pedidoEmAndamento.restaurantId?.replace('_', ' ').toUpperCase() || "RESTAURANTE MOGU"}</p>
              </div>

              {/* BLOCO PRODUTOS COMPLETO */}
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter mb-2">CONFERERÊNCIA DE ITENS DO BAÚ</p>
                <div className="space-y-1">
                  {pedidoEmAndamento.itens?.map((it, idx) => (
                    <p key={idx} className="text-xs font-bold text-zinc-300 flex justify-between">
                      <span>📦 {it.name}</span>
                      <span className="text-zinc-500 font-black">x1</span>
                    </p>
                  ))}
                  {pedidoEmAndamento.bebidas?.map((b, idx) => (
                    <p key={`b-${idx}`} className="text-xs font-bold text-blue-400 flex justify-between">
                      <span>🥤 {b.nome}</span>
                      <span className="text-zinc-500 font-black">x{b.qtd || 1}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* BLOCO ENTREGA (CLIENTE) */}
              <div className="border-l-4 border-blue-500 pl-3">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">PONTO B: ENTREGAR AO CLIENTE</p>
                <p className="text-xs font-bold text-zinc-400 mt-1">👤 Recebedor: <span className="text-white font-black">{pedidoEmAndamento.clienteNome}</span></p>
                <p className="text-xs font-bold text-zinc-400">📍 Endereço: <span className="text-white font-black">{pedidoEmAndamento.endereco?.rua}, {pedidoEmAndamento.endereco?.numero}</span></p>
              </div>
            </div>

            <button 
              onClick={finalizarEntregaComSucesso}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase italic text-xs transition-all shadow-lg shadow-emerald-500/10"
            >
              Concluir Entrega e Liberar ✓
            </button>
          </div>
        ) : 

        /* 🟠 TELA DE PROPOSTA RECEBIDA (O QUE ELE VÊ NA HORA DE ACEITAR) */
        pedidoDisponivel ? (
          <div className="bg-zinc-900 w-full rounded-[35px] p-6 border border-zinc-800 flex flex-col text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 h-1.5 bg-orange-500 transition-all duration-1000" style={{ width: `${(tempoRestante / 20) * 100}%` }}></div>
            
            <span className="text-orange-500 font-black text-5xl italic my-2">#{pedidoDisponivel.id.slice(-4).toUpperCase()}</span>
            <h3 className="text-2xl font-black uppercase italic text-white">{pedidoDisponivel.endereco?.bairro}</h3>
            <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest mb-2">Linha {pedidoDisponivel.endereco?.linhaId}</p>

            <div className="my-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-850 text-left space-y-3">
              {/* MOSTRA O ORIGEM E DESTINO NA PROPOSTA */}
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase">Loja Coleta:</p>
                <p className="text-xs font-black text-orange-400 uppercase">🏪 {pedidoDisponivel.restaurantId?.replace('_', ' ') || "Restaurante Mogu"}</p>
              </div>
              
              {/* VISUALIZAÇÃO DOS PRODUTOS NA PROPOSTA */}
              <div className="border-t border-zinc-850 pt-2">
                <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Produtos no Carrinho:</p>
                <div className="max-h-20 overflow-y-auto space-y-1 pr-1">
                  {pedidoDisponivel.itens?.map((it, idx) => (
                    <p key={idx} className="text-xs font-bold text-zinc-300">🍔 {it.name}</p>
                  ))}
                  {pedidoDisponivel.bebidas?.map((b, idx) => (
                    <p key={`b-${idx}`} className="text-xs font-bold text-blue-400">🥤 {b.nome}</p>
                  ))}
                </div>
              </div>

              {/* REQUISITOS ESPECIAIS */}
              <div className="flex gap-1 flex-wrap pt-1 border-t border-zinc-850">
                {pedidoDisponivel.itens?.some(i => i.isBolo) && <span className="bg-pink-950 text-pink-400 text-[7px] font-black uppercase px-2 py-0.5 rounded-md border border-pink-900">🍰 Cuidado: Bolo</span>}
                {pedidoDisponivel.perguntaGas === "sim" && <span className="bg-blue-950 text-blue-400 text-[7px] font-black uppercase px-2 py-0.5 rounded-md border border-blue-900">🔥 Peso: Gás</span>}
              </div>
            </div>

            <p className="text-xs font-black text-red-500 animate-pulse uppercase italic mb-4">Expira em: {tempoRestante}s</p>
            <div className="flex gap-3">
              <button onClick={rejeitarCargaManual} className="flex-1 bg-zinc-800 text-zinc-400 py-4 rounded-xl font-black uppercase text-xs active:scale-95 transition-all">Recusar</button>
              <button onClick={aceitarCarga} className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-black uppercase italic text-xs active:scale-95 transition-all shadow-lg">Aceitar Rota ➔</button>
            </div>
          </div>
        ) : (
          /* ⚪ MODO ESPERA */
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-t-white border-zinc-800 rounded-full animate-spin mb-4"></div>
            <p className="font-black italic uppercase tracking-widest text-[10px]">Aguardando liberação de rotas...</p>
          </div>
        )}
      </section>

      <footer className="text-center text-[7px] font-bold text-zinc-700 uppercase tracking-widest">
        Mogu Mogu Despacho Inteligente Ativo
      </footer>
    </main>
  );
}