"use client";
import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase"; //
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  onSnapshot 
} from "firebase/firestore";

export default function MoguMoguTV() {
  const [videos, setVideos] = useState([]);
  const [indice, setIndice] = useState(0);
  const [comentarios, setComentarios] = useState([]);
  const [textoComentario, setTextoComentario] = useState("");
  const [abaComentarios, setAbaComentarios] = useState(false);

  // Emojis fixos para evitar custos com upload de imagens
  const emojisFixos = ["❤️", "🔥", "🙌", "👏", "🤤", "🍔", "🚀", "😂"];

  useEffect(() => {
    async function carregarConteudo() {
      const q = query(collection(db, "mogu_tv"), orderBy("dataCriacao", "desc"));
      const snap = await getDocs(q);
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let listaComAds = [];
      lista.forEach((item, i) => {
        listaComAds.push(item);
        if ((i + 1) % 5 === 0) {
          listaComAds.push({ isAd: true, youtubeId: "ID_VÍDEO_AD", nomeAutor: "Mogu Delivery" });
        }
      });
      setVideos(listaComAds);
    }
    carregarConteudo();
  }, []);

  useEffect(() => {
    if (!videos[indice]?.id || videos[indice].isAd) {
      setComentarios([]);
      return;
    }
    const q = query(collection(db, "mogu_tv", videos[indice].id, "comentarios"), orderBy("data", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setComentarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [indice, videos]);

  const videoAtual = videos[indice];

  const postarComentario = async (textoManual) => {
    const conteudo = textoManual || textoComentario;
    if (!conteudo.trim()) return;

    await addDoc(collection(db, "mogu_tv", videoAtual.id, "comentarios"), {
      texto: conteudo,
      usuario: auth.currentUser?.displayName || "Cliente Mogu",
      foto: auth.currentUser?.photoURL || null,
      data: serverTimestamp()
    });
    setTextoComentario("");
  };

  if (videos.length === 0) return <div className="h-screen bg-black flex items-center justify-center text-red-600 font-black italic">MOGU TV...</div>;

  return (
    <main className="h-screen bg-black text-white flex flex-col items-center overflow-hidden touch-none font-sans">
      <div className="relative w-full max-w-[500px] h-full bg-zinc-950">
        
        <iframe
          key={videoAtual.youtubeId}
          className="w-full h-full pointer-events-none"
          src={`https://www.youtube.com/embed/${videoAtual.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoAtual.youtubeId}&modestbranding=1&rel=0`}
          allow="autoplay; encrypted-media"
          frameBorder="0"
        ></iframe>

        {/* NAVEGAÇÃO VERTICAL */}
        <div className="absolute inset-0 z-10 flex flex-col">
          <div className="h-1/2 w-full" onClick={() => setIndice(prev => (prev > 0 ? prev - 1 : 0))}></div>
          <div className="h-1/2 w-full" onClick={() => setIndice(prev => (prev + 1) % videos.length)}></div>
        </div>

        {/* BOTÕES LATERAIS */}
        <div className="absolute right-4 bottom-32 flex flex-col space-y-6 z-20">
          {!videoAtual.isAd && (
            <>
              <button onClick={() => updateDoc(doc(db, "mogu_tv", videoAtual.id), { likes: increment(1) })} className="flex flex-col items-center group">
                <div className="bg-white/10 backdrop-blur-xl p-4 rounded-full text-2xl group-active:scale-125 transition-all shadow-lg">❤️</div>
                <span className="text-[11px] font-black mt-1">{videoAtual.likes || 0}</span>
              </button>
              <button onClick={() => setAbaComentarios(true)} className="flex flex-col items-center">
                <div className="bg-white/10 backdrop-blur-xl p-4 rounded-full text-2xl">💬</div>
                <span className="text-[11px] font-black mt-1">Chat</span>
              </button>
            </>
          )}
        </div>

        {/* ABA DE COMENTÁRIOS ESTILO INSTAGRAM */}
        {abaComentarios && (
          <div className="absolute bottom-0 w-full h-[75%] bg-white rounded-t-[30px] z-50 flex flex-col shadow-2xl animate-slide-up">
            
            <div className="w-full flex justify-center py-3" onClick={() => setAbaComentarios(false)}>
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full"></div>
            </div>

            <div className="flex justify-between items-center px-6 pb-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-sm italic">Comentários Mogu</h3>
              <button onClick={() => setAbaComentarios(false)} className="text-zinc-400 font-bold px-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {comentarios.map(c => (
                <div key={c.id} className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-100">
                    {c.foto ? <img src={c.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">{c.usuario[0]}</div>}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-zinc-900 leading-none mb-1">{c.usuario}</p>
                    <p className="text-[14px] text-zinc-700 leading-snug">{c.texto}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* BARRA DE EMOJIS RÁPIDOS */}
            <div className="px-4 py-2 border-t border-zinc-100 flex justify-between bg-zinc-50/50">
              {emojisFixos.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => postarComentario(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* INPUT DE TEXTO */}
            <div className="p-4 bg-white pb-10">
              <div className="flex items-center space-x-3 bg-zinc-100 rounded-full px-4">
                <input 
                  value={textoComentario}
                  onChange={(e) => setTextoComentario(e.target.value)}
                  placeholder="Comentar..."
                  className="flex-1 bg-transparent py-3 text-sm text-zinc-900 outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && postarComentario()}
                />
                <button onClick={() => postarComentario()} className="font-bold text-sm text-blue-500">Publicar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}