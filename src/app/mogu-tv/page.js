"use client";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase"; //
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  increment 
} from "firebase/firestore";

export default function MoguMoguTV() {
  const [videos, setVideos] = useState([]);
  const [indice, setIndice] = useState(0);

  // 1. Carrega os vídeos e anúncios do Firebase
  useEffect(() => {
    async function carregarConteudo() {
      const q = query(collection(db, "mogu_tv"), orderBy("dataCriacao", "desc"));
      const snap = await getDocs(q);
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Lógica para injetar anúncios a cada 5 vídeos
      let listaComAds = [];
      lista.forEach((item, i) => {
        listaComAds.push(item);
        if ((i + 1) % 5 === 0) {
          listaComAds.push({ isAd: true, youtubeId: "ID_DO_VIDEO_ANUNCIO", nomeAutor: "Patrocinado" });
        }
      });
      
      setVideos(listaComAds);
    }
    carregarConteudo();
  }, []);

  const handleLike = async () => {
    if (!videos[indice]?.id) return;
    const ref = doc(db, "mogu_tv", videos[indice].id);
    await updateDoc(ref, { likes: increment(1) }); // Salva o like no seu app
    
    const novosVideos = [...videos];
    novosVideos[indice].likes = (novosVideos[indice].likes || 0) + 1;
    setVideos(novosVideos);
  };

  if (videos.length === 0) return <div className="h-screen bg-black flex items-center justify-center text-red-600 font-black">CARREGANDO MOGU TV...</div>;

  const atual = videos[indice];

  return (
    <main className="h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-[450px] h-full shadow-2xl">
        
        {/* Player estilo Shorts */}
        <iframe
          key={atual.youtubeId}
          className="w-full h-full pointer-events-none"
          src={`https://www.youtube.com/embed/${atual.youtubeId}?autoplay=1&controls=0&loop=1&playlist=${atual.youtubeId}&modestbranding=1&rel=0&mute=0`}
          allow="autoplay; encrypted-media"
          frameBorder="0"
        ></iframe>

        {/* Botões Laterais (Interação do App) */}
        <div className="absolute right-4 bottom-32 flex flex-col space-y-6 z-10">
          {!atual.isAd && (
            <>
              <button onClick={handleLike} className="flex flex-col items-center group">
                <div className="bg-white/10 backdrop-blur-lg p-4 rounded-full group-active:scale-125 transition-all">❤️</div>
                <span className="text-[10px] font-bold mt-1">{atual.likes || 0}</span>
              </button>
              <button className="flex flex-col items-center">
                <div className="bg-white/10 backdrop-blur-lg p-4 rounded-full">💬</div>
                <span className="text-[10px] font-bold mt-1">Chat</span>
              </button>
            </>
          )}
        </div>

        {/* Legendas e Autor */}
        <div className="absolute left-6 bottom-12 z-10 pr-20">
          <p className="text-red-600 font-black italic uppercase text-xs mb-1">
            {atual.isAd ? "ANÚNCIO MOGU" : `@${atual.nomeAutor}`}
          </p>
          <p className="text-xs text-zinc-300 leading-tight">{atual.descricao || "Confira essa novidade!"}</p>
        </div>

        {/* Navegação */}
        <div className="absolute inset-y-0 flex items-center justify-between w-full px-2">
            <button onClick={() => setIndice(prev => (prev > 0 ? prev - 1 : 0))} className="opacity-20 hover:opacity-100 text-2xl">◀</button>
            <button onClick={() => setIndice(prev => (prev + 1) % videos.length)} className="opacity-20 hover:opacity-100 text-2xl">▶</button>
        </div>
      </div>
    </main>
  );
}