"use client";
import { useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginRestaurante() {
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const validarAcesso = async () => {
    if (!codigo) return;
    setCarregando(true);

    try {
      // Busca o restaurante pelo código de acesso
      const q = query(collection(db, "restaurants"), where("codigoAcesso", "==", codigo));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const docRes = snap.docs[0];
        // Salva na sessão para a página da chapa ler
        sessionStorage.setItem("restauranteId", docRes.id);
        sessionStorage.setItem("restauranteNome", docRes.data().name);
        router.push("/restaurante");
      } else {
        alert("Código Inválido! Tente novamente.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-sm bg-zinc-900/50 p-10 rounded-[50px] border border-white/5 text-center shadow-2xl">
        <h1 className="font-black italic text-2xl uppercase mb-2 tracking-tighter">Acesso Lojista</h1>
        <p className="text-[9px] font-bold opacity-30 uppercase mb-10 tracking-[0.2em]">Mogu Mogu Delivery</p>
        
        <input 
          type="password" 
          placeholder="CÓDIGO"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="w-full bg-black border border-white/10 p-6 rounded-[25px] text-center font-black text-3xl tracking-[0.4em] mb-6 outline-none focus:border-orange-500 transition-all"
        />
        
        <button 
          onClick={validarAcesso}
          disabled={carregando}
          className="w-full bg-white text-black py-6 rounded-[25px] font-black uppercase italic text-xs active:scale-95 transition-transform"
        >
          {carregando ? "VERIFICANDO..." : "ABRIR CHAPA ➔"}
        </button>
      </div>
    </main>
  );
}