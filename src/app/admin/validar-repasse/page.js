"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, Timestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function PainelAdmFinanceiro() {
  const [pendentes, setPendentes] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [userLogado, setUserLogado] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  // 🔑 SEU UID DE ADMINISTRADOR (CPF DO FIREBASE)
  const MEU_UID_ADM = "Z6gb5DxENWY33I884LwtMH0kTKs1"; 

  // 📡 1. Verifica quem está tentando acessar a página
  useEffect(() => {
    const auth = getAuth();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUserLogado(user);
      setCarregandoAuth(false);
    });
    return () => unsubAuth();
  }, []);

  // 📡 2. Monitor de Comprovantes (Só ativa se for você)
  useEffect(() => {
    if (!userLogado || userLogado.uid !== MEU_UID_ADM) return;

    const q = query(
      collection(db, "fechamentos_pendentes"),
      where("status", "==", "Em Análise")
    );

    const unsubSnap = onSnapshot(q, (snap) => {
      setPendentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubSnap();
  }, [userLogado]);

  const confirmarPagamento = async (fechamento) => {
    if (!confirm(`Confirmar recebimento de R$ ${fechamento.valorPago.toFixed(2)}?`)) return;
    setProcessando(true);
    const batch = writeBatch(db); 
    try {
      fechamento.pedidosIds.forEach((id) => {
        batch.update(doc(db, "orders", id), { repasseConfirmado: true });
      });
      batch.update(doc(db, "fechamentos_pendentes", fechamento.id), { 
        status: "Confirmado",
        dataConfirmacao: Timestamp.now()
      });
      await batch.commit(); 
      alert("✅ Dívida Quitada com Sucesso!");
    } catch (e) { alert("Erro: " + e.message); }
    finally { setProcessando(false); }
  };

  // 🧱 TELA DE BLOQUEIO AUTOMÁTICA
  if (carregandoAuth) return <div className="min-h-screen bg-black" />;

  if (!userLogado || userLogado.uid !== MEU_UID_ADM) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-10 text-center">
        <div>
          <h1 className="text-white font-black uppercase italic text-2xl mb-4">ACESSO NEGADO</h1>
          <p className="text-red-600 font-bold text-[10px] uppercase">Apenas o Administrador Master pode acessar esta área financeira.</p>
          <button onClick={() => window.location.href="/"} className="mt-8 text-white underline text-[10px] uppercase opacity-30">Voltar para a Home</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-8 font-sans max-w-4xl mx-auto">
      <h1 className="text-2xl font-black uppercase italic mb-10 border-b border-zinc-800 pb-4">Validar Repasses <span className="text-red-600">ADM</span></h1>
      <div className="grid gap-6">
        {pendentes.map((f) => (
          <div key={f.id} className="bg-zinc-800 p-8 rounded-[40px] border border-zinc-700 shadow-xl">
            <h2 className="text-4xl font-black italic text-emerald-500 mb-6 text-center">R$ {f.valorPago.toFixed(2)}</h2>
            <button 
              onClick={() => confirmarPagamento(f)}
              disabled={processando}
              className="w-full bg-emerald-600 py-6 rounded-3xl font-black uppercase italic text-xs shadow-lg"
            >
              {processando ? "PROCESSANDO..." : "CONFIRMAR E QUITAR ➔"}
            </button>
          </div>
        ))}
        {pendentes.length === 0 && <p className="opacity-20 italic text-center py-20 uppercase font-black">Nenhum pagamento pendente.</p>}
      </div>
    </main>
  );
}