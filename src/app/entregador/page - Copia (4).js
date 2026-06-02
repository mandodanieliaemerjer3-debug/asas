"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase";
import { doc, onSnapshot, collection, query, where, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import soundManager from "../../lib/sounds";

export default function MaestroEntregadorAprimorado() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [pedidoDisponivel, setPedidoDisponivel] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(20);
  const [loading, setLoading] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [tokenDigitado, setTokenDigitado] = useState("");

  const timerRef = useRef(null);

  // 1. CARREGAR PERFIL OPERADOR (Coleção operadores isolada dos dados pessoais)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "operadores", user.uid), (snap) => {
      if (snap.exists()) {
        setPerfil({ uid: snap.id, ...snap.data() });
      } else {
        setPerfil(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // 2. RADAR INTELIGENTE - FILTROS DA SUPERFÓRMULA
  useEffect(() => {
    if (!autenticado || !perfil) return;

    // Buscamos apenas pedidos que estão aguardando entregador
    const q = query(
      collection(db, "orders"),
      where("status", "==", "Aguardando Entregador")
    );

    const unsub = onSnapshot(q, (snap) => {
      const todosPedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Se o entregador já está com uma carga na tela rodando o tempo, não muda
      if (pedidoDisponivel) return;

      const agora = Date.now();

      // Aplicando a esteira de filtros inteligente
      const pedidoIdeal = todosPedidos.find(pedido => {
        const linhaPedido = String(pedido.endereco?.linhaId || "Sem Linha");
        
        // FILTRO 1: A linha do pedido está nas linhas conhecidas do entregador?
        const conheceLinha = perfil.linhasConhecidas?.includes(linhaPedido);
        if (!conheceLinha) return false;

        // FILTRO 2: O peso do pedido respeita o limite do entregador?
        const pesoTotal = pedido.itens?.reduce((acc, i) => acc + (i.peso || 0), 0) || 0;
        if (pesoTotal > (perfil.limitePeso || 400)) return false;

        // FILTRO 3: O entregador rejeitou esse pedido nos últimos 5 minutos?
        if (pedido.rejeitadoPor && pedido.rejeitadoPor[perfil.uid]) {
          const tempoRejeicao = pedido.rejeitadoPor[perfil.uid].seconds * 1000;
          if (agora - tempoRejeicao < 5 * 60 * 1000) return false; // Bloqueia por 5 min
        }

        // FILTRO 4: Especialidade de BOLO (Se o pedido pede bolo, entregador deve aceitar bolo)
        const temBolo = pedido.itens?.some(i => i.isBolo === true);
        if (temBolo && perfil.especialidades?.bolo !== true) return false;

        // FILTRO 5: Especialidade de GÁS
        if (pedido.perguntaGas === "sim" && perfil.especialidades?.gas !== true) return false;

        // FILTRO 6: Especialidade de COMPRAS
        if (pedido.perguntaCompras === "sim" && perfil.especialidades?.compras !== true) return false;

        return true; // Passou em todas as defesas!
      });

      if (pedidoIdeal) {
        setPedidoDisponivel(pedidoIdeal);
        setTempoRestante(20);
        soundManager.play("novoPedido"); // Alerta sonoro de carga na tela
      }
    });

    return () => unsub();
  }, [autenticado, perfil, pedidoDisponivel]);

  // 3. CONTROLE DO CRONÔMETRO DE 20 SEGUNDOS
  useEffect(() => {
    if (!pedidoDisponivel) return;

    timerRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          rejeitarCargaAutomatico(); // Derruba por falta de resposta
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [pedidoDisponivel]);

  // ACCÕES DO PROCESSO
  const aceitarCarga = async () => {
    clearInterval(timerRef.current);
    soundManager.play("click");
    try {
      await updateDoc(doc(db, "orders", pedidoDisponivel.id), {
        status: "Em Rota",
        operadorId: perfil.uid,
        saidaLogistica: Timestamp.now()
      });
      alert("Rota iniciada! Vá até a cozinha retirar.");
      setPedidoDisponivel(null); // Limpa a tela para o próximo
    } catch (e) {
      alert("Erro ao aceitar: " + e.message);
    }
  };

  const rejeitarCargaManual = async () => {
    clearInterval(timerRef.current);
    soundManager.play("remove");
    try {
      // Adiciona o ID do entregador na lista negra do pedido com o timestamp atual
      await updateDoc(doc(db, "orders", pedidoDisponivel.id), {
        [`rejeitadoPor.${perfil.uid}`]: Timestamp.now()
      });
      setPedidoDisponivel(null);
    } catch (e) {
      console.error(e);
    }
  };

  const rejeitarCargaAutomatico = async () => {
    soundManager.play("remove");
    if (!pedidoDisponivel) return;
    try {
      await updateDoc(doc(db, "orders", pedidoDisponivel.id), {
        [`rejeitadoPor.${perfil.uid}`]: Timestamp.now()
      });
      setPedidoDisponivel(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 font-black italic text-white">VERIFICANDO CREDENCIAIS ELITE...</div>;

  if (!perfil) return <div className="p-20 text-center font-black uppercase text-red-600">PERFIL OPERADOR NÃO ENCONTRADO NO FIRESTORE</div>;

  // TELA DE TOKEN OPERACIONAL (Usando o codigoAcesso do banco)
  if (!autenticado) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <div className="bg-white text-black p-12 rounded-[50px] w-full max-w-sm text-center shadow-2xl">
          <h2 className="text-2xl font-black uppercase italic">Acesso Operacional</h2>
          <p className="text-[9px] text-gray-400 uppercase font-bold mt-2">Olá, {perfil.nomeOperador}</p>
          <input 
            type="password" 
            placeholder="TOKEN DE ACESSO" 
            className="w-full bg-zinc-100 p-6 rounded-3xl mt-8 text-center text-2xl font-black outline-none border-4 border-transparent focus:border-red-600 transition" 
            onChange={(e) => setTokenDigitado(e.target.value)} 
          />
          <button 
            onClick={() => tokenDigitado === perfil.codigoAcesso ? setAutenticado(true) : alert("Token Inválido")} 
            className="w-full bg-red-600 text-white py-6 rounded-3xl mt-6 font-black uppercase italic shadow-xl"
          >ENTRAR NO RADAR ➔</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 max-w-md mx-auto font-sans flex flex-col justify-between">
      
      {/* HEADER DO ENTREGADOR */}
      <header className="flex justify-between items-end border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-xl font-black uppercase italic leading-none">{perfil.nomeOperador}</h1>
          <p className="text-[8px] font-bold text-red-600 uppercase tracking-[0.2em] mt-2 italic">RANK: {perfil.rank}</p>
        </div>
        <button onClick={() => setAutenticado(false)} className="text-[10px] font-black opacity-30 uppercase underline">Sair</button>
      </header>

      {/* ÁREA CENTRAL - SISTEMA DE CARGA ÚNICA */}
      <section className="flex-1 flex items-center justify-center py-10">
        {pedidoDisponivel ? (
          
          /* 📦 CARD DE CARGA DISPONÍVEL COLETADA VIA FILTROS */
          <div className="bg-zinc-900 w-full rounded-[45px] p-8 border border-zinc-800 flex flex-col text-center relative overflow-hidden animate-fade-in shadow-2xl">
            
            {/* BARRA DO PROGRESSO DO TIMER */}
            <div className="absolute top-0 left-0 h-2 bg-orange-500 transition-all duration-1000" style={{ width: `${(tempoRestante / 20) * 100}%` }}></div>

            <span className="text-orange-500 font-black text-6xl italic my-4">#{pedidoDisponivel.id.slice(-4).toUpperCase()}</span>
            
            <h3 className="text-2xl font-black uppercase italic mt-2">{pedidoDisponivel.endereco?.bairro || "Bairro Não Mapeado"}</h3>
            <p className="text-zinc-500 font-bold uppercase text-[10px] mt-1 tracking-widest">Linha {pedidoDisponivel.endereco?.linhaId}</p>

            <div className="my-6 bg-zinc-950 p-4 rounded-3xl border border-zinc-850 text-left space-y-2">
              <p className="text-xs font-bold text-zinc-400">👤 Cliente: <span className="text-white font-black">{pedidoDisponivel.clienteNome}</span></p>
              <p className="text-xs font-bold text-zinc-400">📍 Destino: <span className="text-white font-black">{pedidoDisponivel.endereco?.rua}, {pedidoDisponivel.endereco?.numero}</span></p>
              
              {/* INDICADORES ESPECIAIS CASO HAJA BOLO OU GÁS */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {pedidoDisponivel.itens?.some(i => i.isBolo) && <span className="bg-pink-900/40 text-pink-400 border border-pink-800 text-[8px] font-black uppercase px-3 py-1 rounded-full">🍰 Contém Bolo</span>}
                {pedidoDisponivel.perguntaGas === "sim" && <span className="bg-blue-900/40 text-blue-400 border border-blue-800 text-[8px] font-black uppercase px-3 py-1 rounded-full">🔥 Carga de Gás</span>}
              </div>
            </div>

            {/* CRONÔMETRO VISÍVEL */}
            <p className="text-xs font-black text-red-500 animate-pulse uppercase italic mb-6">Tempo para aceitar: {tempoRestante}s</p>

            {/* BOTÕES DE DECISÃO */}
            <div className="flex gap-4">
              <button onClick={rejeitarCargaManual} className="flex-1 bg-zinc-800 text-zinc-400 py-5 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all">Recusar</button>
              <button onClick={aceitarCarga} className="flex-1 bg-orange-500 text-white py-5 rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all">Aceitar Rota ➔</button>
            </div>

          </div>
        ) : (
          
          /* TELA DE ESPERA PADRÃO SEM ENCHER DADOS */
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-white border-zinc-800 rounded-full animate-spin mb-4"></div>
            <p className="font-black italic uppercase tracking-widest text-xs">Mogu procurando cargas na sua linha...</p>
          </div>
        )}
      </section>

      {/* FOOTER DA OPERAÇÃO DE SEGURANÇA */}
      <footer className="text-center text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
        Mogu Mogu Logística Automática • V3.2
      </footer>
    </main>
  );
}