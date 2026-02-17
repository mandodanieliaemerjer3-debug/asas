"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, Timestamp } from "firebase/firestore";

export default function PainelAdmFinanceiro() {
  const [pendentes, setPendentes] = useState([]);
  const [processando, setProcessando] = useState(false);
  
  // 🔐 ESTADOS PARA A TRAVA DE SEGURANÇA
  const [senhaAdm, setSenhaAdm] = useState("");
  const [logadoAdm, setLogadoAdm] = useState(false);

  // 📡 MONITOR DE PAGAMENTOS EM ANÁLISE
  useEffect(() => {
    if (!logadoAdm) return; // Só busca dados se você estiver logado

    const q = query(
      collection(db, "fechamentos_pendentes"),
      where("status", "==", "Em Análise")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPendentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [logadoAdm]);

  // ⚡ FUNÇÃO MESTRA: QUITAR DÍVIDA DEFINITIVAMENTE
  const confirmarPagamento = async (fechamento) => {
    if (!confirm(`Confirmar recebimento de R$ ${fechamento.valorPago.toFixed(2)}? Isso limpará a dívida do restaurante.`)) return;
    
    setProcessando(true);
    const batch = writeBatch(db); 

    try {
      // 1. Marca cada pedido contido no fechamento como 'Quitado'
      fechamento.pedidosIds.forEach((pedidoId) => {
        const pedidoRef = doc(db, "orders", pedidoId);
        batch.update(pedidoRef, { repasseConfirmado: true });
      });

      // 2. Atualiza o status do fechamento para 'Confirmado'
      const fechamentoRef = doc(db, "fechamentos_pendentes", fechamento.id);
      batch.update(fechamentoRef, { 
        status: "Confirmado",
        dataConfirmacao: Timestamp.now()
      });

      await batch.commit(); 
      alert("✅ Sucesso! A dívida foi quitada e o saldo do restaurante foi zerado.");
    } catch (e) {
      alert("Erro crítico ao quitar: " + e.message);
    } finally {
      setProcessando(false);
    }
  };

  // 🧱 TELA DE BLOQUEIO (CHAVE MESTRA)
  if (!logadoAdm) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-black">
        <div className="bg-white p-12 rounded-[50px] w-full max-w-sm text-center shadow-2xl">
          <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tighter">Acesso Master ADM</h2>
          <input 
            type="password" 
            placeholder="SENHA DE ADMINISTRADOR" 
            className="w-full bg-zinc-100 p-6 rounded-[30px] text-center text-2xl font-black outline-none border-4 border-transparent focus:border-red-600 transition mb-6"
            onChange={(e) => setSenhaAdm(e.target.value)}
          />
          <button 
            onClick={() => senhaAdm === "1234" ? setLogadoAdm(true) : alert("Senha Master Incorreta!")} // Mude '1234' para sua senha real
            className="w-full bg-red-600 text-white py-6 rounded-[30px] font-black uppercase italic shadow-lg"
          >
            LIBERAR PAINEL ➔
          </button>
        </div>
      </main>
    );
  }

  // 🖥️ PAINEL PRINCIPAL (SÓ APARECE SE LOGAR)
  return (
    <main className="min-h-screen bg-zinc-900 text-white p-8 font-sans max-w-4xl mx-auto">
      <header className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase italic leading-none">Validação de Repasses</h1>
          <p className="text-[10px] font-bold text-red-600 uppercase mt-2 tracking-widest italic">Área Administrativa Mogu Mogu</p>
        </div>
        <button onClick={() => setLogadoAdm(false)} className="text-[10px] font-black opacity-20 uppercase underline">Bloquear</button>
      </header>

      <div className="grid gap-8">
        {pendentes.length === 0 ? (
          <div className="py-20 text-center border-4 border-dashed border-zinc-800 rounded-[50px] opacity-20">
             <p className="font-black italic uppercase text-xs">Nenhum comprovante pendente para análise.</p>
          </div>
        ) : (
          pendentes.map((f) => (
            <div key={f.id} className="bg-zinc-800 p-8 rounded-[45px] border border-zinc-700 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[9px] font-black uppercase opacity-40 mb-1">Restaurante: {f.restauranteId}</p>
                  <h2 className="text-5xl font-black italic text-emerald-500 tracking-tighter">R$ {f.valorPago.toFixed(2)}</h2>
                </div>
                <div className="bg-orange-500 text-white px-5 py-2 rounded-2xl text-[9px] font-black uppercase italic animate-pulse">
                  {f.status}
                </div>
              </div>

              {/* ÁREA DO COMPROVANTE (SIMULAÇÃO) */}
              <div className="bg-black/40 p-6 rounded-[35px] mb-8 border border-zinc-700/50 flex flex-col items-center">
                 <p className="text-[9px] font-bold opacity-30 uppercase mb-4 italic">Arquivo: {f.nomeArquivoOriginal || "comprovante.jpg"}</p>
                 <div className="w-full aspect-video bg-zinc-900 rounded-3xl flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase italic opacity-10">Visualização do Comprovante</span>
                 </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => confirmarPagamento(f)}
                  disabled={processando}
                  className="flex-1 bg-emerald-600 py-6 rounded-[30px] font-black uppercase italic text-xs shadow-xl active:scale-95 transition disabled:opacity-50"
                >
                  {processando ? "PROCESSANDO..." : "CONFIRMAR E QUITAR DÍVIDA ➔"}
                </button>
                <button className="px-8 bg-zinc-700 py-6 rounded-[30px] font-black uppercase italic text-[10px] opacity-30">
                  Recusar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}