"use client";
import { useState } from "react";
import { db, auth } from "../../../lib/firebase"; //
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PainelPostagemMogu() {
  const [url, setUrl] = useState("");
  const [descricao, setDescricao] = useState("");
  const [autorPersonalizado, setAutorPersonalizado] = useState("");
  const [carregando, setCarregando] = useState(false);

  // 🔍 NOVA FUNÇÃO DE EXTRAÇÃO BLINDADA (Aceita Shorts e Links Curtos)
  const extrairId = (url) => {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
  };

  const postar = async () => {
    const videoId = extrairId(url);
    
    if (!videoId) {
      alert("❌ Link do YouTube inválido! Tente copiar o link oficial do vídeo ou short.");
      return;
    }

    setCarregando(true);

    try {
      // 🚀 SALVA NO FIREBASE (Sua conta de aprendizagem de vídeos)
      await addDoc(collection(db, "mogu_tv"), {
        youtubeId: videoId,
        descricao: descricao,
        nomeAutor: autorPersonalizado || auth.currentUser?.displayName || "Admin Mogu",
        autorId: auth.currentUser?.uid || "admin_manual", // Registra o ID de quem postou
        likes: 0,
        dataCriacao: serverTimestamp(),
        tipo: "video" // Pode mudar para "anuncio" se for propaganda
      });

      alert("✅ VÍDEO PUBLICADO COM SUCESSO NA MOGU TV!");
      setUrl("");
      setDescricao("");
      setAutorPersonalizado("");
    } catch (error) {
      console.error("Erro ao postar:", error);
      alert("Erro ao conectar com o Firebase.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-10 flex flex-col items-center font-sans">
      <div className="w-full max-w-xl bg-zinc-900 p-10 rounded-[40px] border border-zinc-800 shadow-2xl">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-black italic text-red-600 uppercase tracking-tighter">Mogu TV Admin</h1>
          <p className="text-[10px] opacity-40 uppercase mt-2">Alimente o sistema de Shorts do App</p>
        </header>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase opacity-30 ml-2">Link do YouTube / Shorts</label>
            <input 
              placeholder="https://www.youtube.com/shorts/..." 
              className="w-full bg-black p-5 rounded-2xl border border-zinc-800 mt-2 focus:border-red-600 outline-none transition-all"
              value={url} onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase opacity-30 ml-2">Nome do Autor (Ex: @chef_mogu)</label>
            <input 
              placeholder="Deixe vazio para usar seu nome de login" 
              className="w-full bg-black p-5 rounded-2xl border border-zinc-800 mt-2 focus:border-red-600 outline-none transition-all"
              value={autorPersonalizado} onChange={(e) => setAutorPersonalizado(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase opacity-30 ml-2">Legenda do Vídeo</label>
            <textarea 
              placeholder="Descreva o que acontece no vídeo..." 
              className="w-full bg-black p-5 rounded-2xl border border-zinc-800 mt-2 h-32 focus:border-red-600 outline-none transition-all"
              value={descricao} onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <button 
            onClick={postar} 
            disabled={carregando}
            className={`w-full py-6 rounded-3xl font-black uppercase italic text-sm tracking-widest transition-all ${
              carregando ? "bg-zinc-800 opacity-50" : "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
            }`}
          >
            {carregando ? "PUBLICANDO..." : "LANÇAR NA MOGU TV ➔"}
          </button>
        </div>
      </div>
    </main>
  );
}