"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function AgradecimentoPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [pedido, setPedido] = useState(null);
  const [ganhouCashback, setGanhouCashback] = useState(false);
  const [mensagemUser, setMensagemUser] = useState("Dá uma olhada no que acabei de pedir! A experiência foi incrível. ✨🍟");

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "orders", id), (docSnap) => {
      if (docSnap.exists()) setPedido({ id: docSnap.id, ...docSnap.data() });
    });
    return () => unsub();
  }, [id]);

  // Cálculo de bônus por compartilhamento (3%)
  const totalMoedasProdutos = pedido?.itens?.reduce((acc, item) => acc + (item.coinPrice || 0), 0) || 0;
  const moedasPremio = Math.floor(totalMoedasProdutos * 0.03);

  const handleShare = async (plataforma) => {
    const linkAfiliado = `http://localhost:3000?ref=${user?.uid}`;
    const textoFinal = `${mensagemUser}\n\nConheça também: ${linkAfiliado}`;
    
    const url = plataforma === 'wa' 
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(textoFinal)}`
      : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkAfiliado)}`;

    window.open(url, '_blank');

    if (!ganhouCashback && !pedido?.cashbackResgatado && moedasPremio > 0) {
      try {
        await updateDoc(doc(db, "users", user.uid), { moedas: increment(moedasPremio) });
        await updateDoc(doc(db, "orders", id), { cashbackResgatado: true });
        setGanhouCashback(true);
      } catch (e) { console.error("Erro ao creditar moedas:", e); }
    }
  };

  return (
    <main className="min-h-screen bg-white max-w-md mx-auto flex flex-col p-6 font-sans pb-20">
      
      {/* ANIMAÇÃO MOGU MOGU */}
      <div className="flex flex-col items-center pt-6 mb-8 text-center">
        <div className="w-48 h-48 rounded-[60px] overflow-hidden shadow-2xl mb-6 border-4 border-gray-50 bg-gray-100">
          <img 
            src="/images/mogu-fun.gif" 
            alt="Mogu Mogu Animation" 
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="font-black italic uppercase text-3xl text-gray-900 tracking-tighter leading-none">Bon Appétit!</h1>
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mt-3 italic">O sabor de Guapiara está a caminho</p>
      </div>

      {/* STATUS DO PEDIDO EM TEMPO REAL */}
      <section className="bg-gray-50 p-6 rounded-[35px] border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Status Atual</p>
          <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase animate-pulse italic">
            {pedido?.status || "Confirmando..."}
          </span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xl">⏳</span>
           <p className="text-xs font-bold text-gray-700 uppercase italic tracking-tighter">Chegada em: <span className="text-gray-900">30-45 min</span></p>
        </div>
      </section>

      {/* ÁREA DO EMBAIXADOR (CASHBACK) */}
      <section className="bg-white p-7 rounded-[45px] border-2 border-gray-50 shadow-2xl shadow-gray-200/40 mb-10">
        <div className="text-center mb-6">
          <h3 className="font-black uppercase italic text-gray-900 text-lg leading-none">Bônus de Compartilhamento</h3>
          <p className="text-[9px] font-bold text-gray-400 uppercase mt-2">Compartilhe e ganhe moedas de bônus</p>
        </div>

        <div className="mb-6">
          <textarea 
            className="w-full p-5 bg-gray-50 rounded-[28px] border-none text-[11px] font-semibold text-gray-600 focus:ring-2 focus:ring-yellow-400 transition"
            rows="3"
            value={mensagemUser}
            onChange={(e) => setMensagemUser(e.target.value)}
          />
          <div className="flex justify-end items-center gap-1 mt-3">
             <span className="text-[12px]">🪙</span>
             <p className="text-[9px] font-black text-yellow-600 uppercase italic">Prêmio VIP: {moedasPremio} moedas</p>
          </div>
        </div>

        {!ganhouCashback && !pedido?.cashbackResgatado ? (
          <div className="flex gap-3">
            <button onClick={() => handleShare('wa')} className="flex-1 bg-black text-white py-4.5 rounded-[22px] font-black uppercase italic text-[10px] active:scale-95 transition shadow-lg shadow-gray-200">WhatsApp</button>
            <button onClick={() => handleShare('fb')} className="flex-1 bg-gray-100 text-gray-400 py-4.5 rounded-[22px] font-black uppercase italic text-[10px] active:scale-95 transition">Facebook</button>
          </div>
        ) : (
          <div className="bg-green-50 py-4 rounded-[22px] text-center border border-green-100">
            <p className="text-green-600 font-black uppercase italic text-[10px] tracking-widest leading-none">Créditos Confirmados no Perfil ✅</p>
          </div>
        )}
      </section>

      {/* AÇÕES DE NAVEGAÇÃO */}
      <div className="space-y-4">
        <button 
          onClick={() => router.push('/perfil')} 
          className="w-full bg-red-600 text-white py-5 rounded-[28px] font-black uppercase italic shadow-2xl shadow-red-200 active:scale-95 transition"
        >
          Ver Detalhes no Perfil
        </button>
        
        {/* ALTERADO: De "Continuar Comprando" para "Voltar ao Início" */}
        <button 
          onClick={() => router.push('/')} 
          className="w-full bg-zinc-100 text-zinc-900 py-5 rounded-[28px] font-black uppercase italic text-[10px] tracking-widest active:scale-95 transition border border-zinc-200"
        >
          Voltar ao Início ➔
        </button>
      </div>

      <footer className="mt-16 opacity-10 italic font-black text-[8px] uppercase text-center tracking-[0.4em]">
        Mogu Mogu • Premium Delivery Experience
      </footer>
    </main>
  );
}