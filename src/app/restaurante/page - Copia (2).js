"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; 
import { doc, getDoc, query, collection, where, onSnapshot, updateDoc } from "firebase/firestore";

export default function PainelRestaurante() {
  const [pedidos, setPedidos] = useState([]);
  const [logado, setLogado] = useState(false);
  const [inputCodigo, setInputCodigo] = useState("");
  const [carregando, setCarregando] = useState(true);

  // 🛡️ Verifica sessão do restaurante
  useEffect(() => {
    const sessao = localStorage.getItem("restaurante_logado");
    if (sessao === "true") setLogado(true);
    setCarregando(false);
  }, []);

  // 📡 Monitor de pedidos em tempo real
  useEffect(() => {
    if (!logado) return;

    // Monitora pedidos que precisam de ação do restaurante
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Aguardando Verificação", "Pendente", "Em Produção", "Pronto para Retirada"])
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtra para mostrar apenas os itens do Burger Master (rest_1)
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
          <h2 className="text-xl font-black uppercase italic mb-6 text-black tracking-tighter leading-none">Cozinha Login</h2>
          <input 
            type="password" 
            placeholder="CÓDIGO" 
            value={inputCodigo}
            onChange={(e) => setInputCodigo(e.target.value)}
            className="w-full bg-zinc-100 p-6 rounded-3xl text-center text-black font-black mb-4 border-4 border-transparent focus:border-red-600 transition-all outline-none"
          />
          <button className="w-full bg-red-600 py-6 rounded-3xl font-black uppercase italic shadow-xl active:scale-95 transition">Operação ON ➔</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-black font-sans max-w-md mx-auto pb-20">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-[35px] shadow-sm border border-zinc-100">
        <div>
          <h1 className="text-lg font-black uppercase italic tracking-tighter leading-none">Burger Master</h1>
          <p className="text-[8px] font-black text-gray-400 uppercase mt-1">Guapiara Operation</p>
        </div>
        <button onClick={() => { localStorage.removeItem("restaurante_logado"); setLogado(false); }} className="text-[9px] font-black opacity-30 uppercase">Sair</button>
      </header>

      <div className="space-y-4">
        {pedidos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-zinc-200">
            <p className="opacity-20 font-black uppercase italic text-xs">Sem pedidos na chapa...</p>
          </div>
        ) : (
          pedidos.map(p => (
            <div key={p.id} className="bg-white p-7 rounded-[40px] shadow-sm border border-zinc-100 overflow-hidden relative">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[9px] font-black opacity-30 uppercase">Pedido #{p.id.slice(-4)}</span>
                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${p.status === 'Aguardando Verificação' ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'}`}>
                  {p.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-8">
                {p.itens?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-zinc-50 pb-2">
                    <span className="font-black italic text-sm uppercase tracking-tighter">{item.name}</span>
                    <span className="text-red-600 font-black text-xs">x{item.quantity || 1}</span>
                  </div>
                ))}
              </div>

              {/* LÓGICA DE APROVAÇÃO DE COMPROVANTE (PIX) */}
              {p.status === "Aguardando Verificação" && (
                <div className="space-y-3">
                  <a href={p.comprovanteUrl} target="_blank" rel="noreferrer" className="block w-full text-center py-3 border-2 border-zinc-900 rounded-2xl text-[9px] font-black uppercase italic hover:bg-zinc-900 hover:text-white transition">Ver Comprovante</a>
                  <button onClick={() => mudarStatus(p.id, "Pendente")} className="w-full bg-green-600 text-white py-4 rounded-3xl font-black uppercase italic text-xs shadow-lg shadow-green-100">Aprovar Pagamento</button>
                </div>
              )}

              {p.status === "Pendente" && (
                <button onClick={() => mudarStatus(p.id, "Em Produção")} className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase italic shadow-xl">🔥 Começar a Fritar</button>
              )}

              {p.status === "Em Produção" && (
                <button onClick={() => mudarStatus(p.id, "Pronto para Retirada")} className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase italic">✅ Pedido Pronto!</button>
              )}

              {p.status === "Pronto para Retirada" && (
                <button onClick={() => mudarStatus(p.id, "Aguardando Entregador")} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase italic shadow-lg shadow-blue-100">🚀 Chamar Entregador Elite</button>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}