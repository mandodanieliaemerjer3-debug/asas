"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase"; 
import { doc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function PerfilUsuario() {
  const [usuario, setUsuario] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        // Monitora os dados do usuário em tempo real (Saldo, Nível, Localização)
        const userRef = doc(db, "users", user.uid);
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) setUsuario({ id: snap.id, ...snap.data() });
        });
      } else {
        router.push("/login"); // Redireciona se não houver usuário
      }
    });
    return () => unsub();
  }, [router]);

  const copiarLink = () => {
    const link = `${window.location.origin}?ref=${usuario.id}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (!usuario) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center font-sans pb-24">
      
      {/* HEADER DE STATUS */}
      <div className="w-full max-w-sm bg-black text-white p-8 rounded-[45px] shadow-2xl mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase opacity-40 mb-1 tracking-widest">Saldo de Moedas</p>
          <h2 className="text-5xl font-black italic tracking-tighter mb-4">
            {usuario.moedas || 0} <span className="text-xs font-bold not-italic opacity-30">MGU</span>
          </h2>
          <div className="flex gap-2">
            <span className="bg-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase italic">
              Nível: {usuario.level || "Iniciante"}
            </span>
            <span className="bg-zinc-800 px-3 py-1 rounded-full text-[8px] font-black uppercase italic">
              {usuario.nivelAtuacao || "Cliente"}
            </span>
          </div>
        </div>
        {/* Efeito visual de fundo */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* PAINEL DINÂMICO DE ACESSO (O CAMINHO PROFISSIONAL) */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        
        {/* BOTÃO DO ENTREGADOR - SÓ APARECE SE FOR ENTREGADOR */}
        {usuario.nivelAtuacao === "entregador" && (
          <div className="bg-white p-6 rounded-[35px] border border-zinc-200 shadow-sm">
            <p className="text-[9px] font-black uppercase text-zinc-400 mb-3 text-center tracking-[0.2em]">Logística Ativa</p>
            <button 
              onClick={() => router.push('/entregador')}
              className="w-full bg-zinc-900 text-white py-5 rounded-3xl font-black uppercase italic text-xs shadow-xl active:scale-95 transition flex items-center justify-center gap-3"
            >
              🚀 Abrir Radar de Entregas
            </button>
            <p className="text-[7px] text-center text-zinc-400 mt-3 uppercase font-bold">
              Última posição: {usuario.ultimaLocalizacao || "Não definida"}
            </p>
          </div>
        )}

        {/* BOTÃO DO RESTAURANTE - SÓ APARECE SE FOR ADMIN OU DONO */}
        {(usuario.nivelAtuacao === "admin" || usuario.nivelAtuacao === "restaurante") && (
          <div className="bg-white p-6 rounded-[35px] border border-zinc-200 shadow-sm">
            <p className="text-[9px] font-black uppercase text-zinc-400 mb-3 text-center tracking-[0.2em]">Gestão de Cozinha</p>
            <button 
              onClick={() => router.push('/restaurante')}
              className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase italic text-xs shadow-xl active:scale-95 transition flex items-center justify-center gap-3"
            >
              👨‍🍳 Painel Restaurante
            </button>
          </div>
        )}
      </div>

      {/* ÁREA DE AFILIADO (CONTEÚDO ORIGINAL) */}
      <div className="w-full max-w-sm bg-white p-8 rounded-[45px] shadow-sm border border-zinc-100 space-y-6">
        <div className="text-center">
          <h3 className="text-[10px] font-black uppercase opacity-40 mb-2">Seu Link de Afiliado</h3>
          <p className="text-[9px] font-bold leading-relaxed text-zinc-500">
            Ganhe moedas em cada compra que seus amigos fizerem através do seu link!
          </p>
        </div>
        
        <button 
          onClick={copiarLink}
          className={`w-full py-5 rounded-3xl font-black uppercase italic text-[10px] transition-all ${copiado ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm'}`}
        >
          {copiado ? "✅ LINK COPIADO!" : "COPIAR MEU LINK DE AFILIADO ➔"}
        </button>
      </div>

      {/* FOOTER DE SAÍDA */}
      <button 
        onClick={() => auth.signOut()}
        className="mt-10 text-[9px] font-black uppercase text-red-600 opacity-50 hover:opacity-100 transition"
      >
        Encerrar Sessão com Segurança
      </button>

    </main>
  );
}