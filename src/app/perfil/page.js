"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; 
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function PerfilAfiliado() {
  const [usuario, setUsuario] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        // Monitora o saldo de moedas em tempo real
        const userRef = doc(db, "users", user.uid);
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) setUsuario({ id: snap.id, ...snap.data() });
        });
      }
    });
    return () => unsub();
  }, []);

  const copiarLink = () => {
    const link = `${window.location.origin}?ref=${usuario.id}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (!usuario) return <div className="min-h-screen bg-black" />;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-sm bg-white p-8 rounded-[45px] shadow-2xl mt-10 text-black border border-zinc-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-zinc-100 rounded-full mb-4 flex items-center justify-center text-3xl">👤</div>
          <h1 className="text-xl font-black uppercase italic tracking-tighter">{usuario.nome || "Explorador"}</h1>
          <p className="text-[10px] font-bold opacity-30 uppercase">Membro Mogu Mogu</p>
        </div>

        {/* 🪙 SALDO DE MOEDAS */}
        <div className="bg-zinc-950 p-6 rounded-[35px] text-center mb-8 shadow-xl shadow-zinc-200">
          <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Seu Saldo Total</p>
          <h2 className="text-4xl font-black italic text-yellow-500 tracking-tighter">
            {usuario.moedas || 0} <span className="text-xs">MOEDAS</span>
          </h2>
          <p className="text-[7px] font-bold text-zinc-400 mt-2 uppercase italic">100 Moedas = R$ 0,50 de Desconto</p>
        </div>

        {/* 🔗 ÁREA DE INDICAÇÃO */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase opacity-40 text-center">Ganhe Moedas Indicando</h3>
          <p className="text-center text-[9px] font-bold leading-relaxed px-4">
            Compartilhe seu link. Você ganha moedas em cada compra que seus amigos fizerem!
          </p>
          
          <button 
            onClick={copiarLink}
            className={`w-full py-5 rounded-3xl font-black uppercase italic text-[10px] transition-all ${copiado ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white shadow-lg shadow-red-100'}`}
          >
            {copiado ? "✅ LINK COPIADO!" : "COPIAR MEU LINK DE AFILIADO ➔"}
          </button>
        </div>
      </div>

      {/* HISTÓRICO SIMPLIFICADO */}
      <div className="w-full max-w-sm mt-8 space-y-3">
         <div className="flex justify-between px-6 items-center">
            <span className="text-[10px] font-black uppercase opacity-30">Ganhos Recentes</span>
            <span className="text-[9px] font-black text-red-600 uppercase underline">Ver tudo</span>
         </div>
         <div className="bg-white/60 p-5 rounded-[30px] border border-white flex justify-between items-center text-black">
            <span className="text-[10px] font-black italic uppercase opacity-60">Bônus de Indicação</span>
            <span className="text-xs font-black text-emerald-600">+56 🪙</span>
         </div>
      </div>
    </main>
  );
}