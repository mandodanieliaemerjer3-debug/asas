"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; 
import { doc, getDoc, query, collection, where, onSnapshot } from "firebase/firestore";

export default function PainelCozinhaSimples() {
  const [pedidos, setPedidos] = useState([]);
  const [logado, setLogado] = useState(false);
  const [inputCodigo, setInputCodigo] = useState("");

  const entrar = async (e) => {
    e.preventDefault();
    // 🛡️ Login usando o código 1234 que você definiu
    const snap = await getDoc(doc(db, "restaurants", "rest_1"));
    if (snap.exists() && snap.data().codigoAcesso === inputCodigo) {
      setLogado(true);
      
      // 📡 Monitora TODOS os estágios iniciais para o restaurante não ficar no escuro
      const q = query(
        collection(db, "orders"),
        where("status", "in", ["Aguardando Entregador", "Pendente", "Em Produção"])
      );

      onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filtra para garantir que só apareçam pedidos do Burger Master
        setPedidos(docs.filter(p => p.itens?.some(i => i.restaurantId === "rest_1")));
      });
    } else {
      alert("Código incorreto");
    }
  };

  if (!logado) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <form onSubmit={entrar} className="bg-white p-10 rounded-[45px] w-full max-w-sm text-center">
          <h2 className="text-xl font-black uppercase italic mb-6 text-black">Cozinha Burger Master</h2>
          <input 
            type="password" 
            placeholder="CÓDIGO" 
            value={inputCodigo}
            onChange={(e) => setInputCodigo(e.target.value)}
            className="w-full bg-gray-100 p-5 rounded-3xl text-center text-black font-black mb-4 outline-none"
          />
          <button className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase italic">Entrar ➔</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-black font-sans max-w-md mx-auto">
      <h1 className="text-xl font-black uppercase italic mb-6">Pedidos no Radar</h1>
      <div className="space-y-4">
        {pedidos.length === 0 ? (
          <p className="text-center opacity-30 font-bold py-10">Nenhum pedido chegando...</p>
        ) : (
          pedidos.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-[40px] shadow-sm border-2 border-zinc-100">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] font-black uppercase opacity-30">Linha {p.endereco?.linhaId}</span>
                <span className="text-[10px] font-bold bg-zinc-100 px-3 py-1 rounded-full">{p.status}</span>
              </div>
              
              {/* Mostra os itens sem erro de undefined */}
              <div className="font-black italic text-sm mb-4">
                {p.itens?.map((item, i) => (
                  <div key={i}>{item.name}</div>
                ))}
              </div>

              {/* Lógica Off-Road: Restaurante só trabalha se o status for 'Pendente' (Entregador aceitou) */}
              {p.status === "Aguardando Entregador" ? (
                <div className="text-[9px] font-black uppercase text-orange-600 animate-pulse">
                  ⚠️ Aguardando entregador aceitar a rota para liberar preparo...
                </div>
              ) : (
                <button className="w-full bg-black text-white py-4 rounded-3xl font-black uppercase italic text-[10px]">
                  Iniciar Produção Agora ➔
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}