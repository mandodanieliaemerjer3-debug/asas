"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; 
import { doc, getDoc, query, collection, where, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";

export default function PainelRestaurante() {
  const [pedidos, setPedidos] = useState([]);
  const [logado, setLogado] = useState(false);
  const [inputCodigo, setInputCodigo] = useState("");
  const [carregando, setCarregando] = useState(true);

  // 🛡️ Verifica se já estava logado ao carregar a página
  useEffect(() => {
    const sessao = localStorage.getItem("restaurante_logado");
    if (sessao === "true") setLogado(true);
    setCarregando(false);
  }, []);

  // 📡 Monitor de pedidos (só ativa se estiver logado)
  useEffect(() => {
    if (!logado) return;

    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Aguardando Entregador", "Pendente", "Em Produção", "Pronto para Retirada"])
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtra pelo ID do Burger Master
      setPedidos(docs.filter(p => p.itens?.some(i => i.restaurantId === "rest_1")));
    });

    return () => unsub();
  }, [logado]);

  const entrar = async (e) => {
    e.preventDefault();
    try {
      const snap = await getDoc(doc(db, "restaurants", "rest_1"));
      if (snap.exists() && snap.data().codigoAcesso === inputCodigo) {
        localStorage.setItem("restaurante_logado", "true");
        setLogado(true);
      } else {
        alert("Código de acesso incorreto.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const mudarStatus = async (id, novoStatus) => {
    await updateDoc(doc(db, "orders", id), { status: novoStatus });
  };

  if (carregando) return null;

  if (!logado) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
        <form onSubmit={entrar} className="bg-white p-10 rounded-[45px] w-full max-w-sm text-center shadow-2xl">
          <h2 className="text-xl font-black uppercase italic mb-6 text-black tracking-tighter">Painel Cozinha</h2>
          <input 
            type="password" 
            placeholder="CÓDIGO DE ACESSO" 
            value={inputCodigo}
            onChange={(e) => setInputCodigo(e.target.value)}
            className="w-full bg-zinc-100 p-6 rounded-3xl text-center text-black font-black mb-4 outline-none border-4 border-transparent focus:border-red-600 transition-all"
          />
          <button className="w-full bg-red-600 py-6 rounded-3xl font-black uppercase italic shadow-xl">Entrar na Operação ➔</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-black font-sans max-w-md mx-auto">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-[35px] shadow-sm">
        <h1 className="text-lg font-black uppercase italic tracking-tighter">Burger Master 🍔</h1>
        <button onClick={() => { localStorage.removeItem("restaurante_logado"); setLogado(false); }} className="text-[10px] font-black opacity-20 uppercase underline">Sair</button>
      </header>

      <div className="space-y-4">
        {pedidos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-zinc-200">
            <p className="opacity-20 font-black uppercase italic text-xs">Cozinha sem pedidos no momento...</p>
          </div>
        ) : (
          pedidos.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-[40px] shadow-sm border-2 border-zinc-100">
              <div className="flex justify-between mb-4">
                <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">#{p.id.slice(-4)}</span>
                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${p.status === 'Pendente' ? 'bg-red-600 text-white' : 'bg-zinc-100'}`}>{p.status}</span>
              </div>
              
              <div className="font-black italic text-lg mb-6 border-l-4 border-red-600 pl-4">
                {p.itens?.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-red-600 text-xs">x{item.quantity || 1}</span>
                  </div>
                ))}
              </div>

              {p.status === "Aguardando Entregador" && (
                <div className="text-center p-4 bg-orange-50 rounded-3xl border border-orange-100">
                  <p className="text-[8px] font-black uppercase text-orange-600 animate-pulse italic">Aguardando aceite do motorista para liberar preparo...</p>
                </div>
              )}

              {p.status === "Pendente" && (
                <button onClick={() => mudarStatus(p.id, "Em Produção")} className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase italic shadow-lg">🔥 Iniciar Produção</button>
              )}

              {p.status === "Em Produção" && (
                <button onClick={() => mudarStatus(p.id, "Pronto para Retirada")} className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase italic">✅ Lanche Pronto!</button>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}