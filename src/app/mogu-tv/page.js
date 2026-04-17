"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";

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
  onSnapshot,
  getDoc
} from "firebase/firestore";

import {
  buscarAnunciosPorInteresse,
  inserirAdsNosVideos,
  registrarViewAnuncio,
  registrarCliqueAnuncio
} from "../../lib/ads";

export default function MoguMoguTV() {
  const router = useRouter();

  const [videos, setVideos] = useState([]);
  const [indice, setIndice] = useState(0);
  const [comentarios, setComentarios] = useState([]);
  const [textoComentario, setTextoComentario] = useState("");
  const [abaComentarios, setAbaComentarios] = useState(false);
  const [muted, setMuted] = useState(true);

  const scrollLock = useRef(false);

  const emojisFixos = ["❤️", "🔥", "🙌", "👏", "🤤", "🍔", "🚀", "😂"];

  // 🚀 CARREGAR CONTEÚDO + ADS
  useEffect(() => {
    async function carregarConteudo() {
      try {
        const q = query(collection(db, "mogu_tv"), orderBy("dataCriacao", "desc"));
        const snap = await getDocs(q);
        const listaVideos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const anuncios = await buscarAnunciosPorInteresse([]);
        const listaFinal = inserirAdsNosVideos(listaVideos, anuncios, 5);

        setVideos(listaFinal);

      } catch (err) {
        console.error(err);
      }
    }

    carregarConteudo();
  }, []);

  // 👁️ VIEW ANÚNCIO
  useEffect(() => {
    const atual = videos[indice];
    if (atual?.isAd && atual?.id) {
      registrarViewAnuncio(atual.id);
    }
  }, [indice, videos]);

  // 💬 COMENTÁRIOS
  useEffect(() => {
    if (!videos[indice]?.id || videos[indice].isAd) {
      setComentarios([]);
      return;
    }

    const q = query(
      collection(db, "mogu_tv", videos[indice].id, "comentarios"),
      orderBy("data", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setComentarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [indice, videos]);

  // 🖱️ SCROLL PC
  useEffect(() => {
    const handleWheel = (e) => {
      if (scrollLock.current) return;

      scrollLock.current = true;

      if (e.deltaY > 0) {
        setIndice(prev => (prev + 1) % videos.length);
      } else {
        setIndice(prev => (prev > 0 ? prev - 1 : 0));
      }

      setTimeout(() => {
        scrollLock.current = false;
      }, 600);
    };

    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, [videos]);

  const videoAtual = videos[indice];

  // 🎯 AÇÃO DO ANÚNCIO (AGORA COM EMPRESA)
  const handleAcaoAnuncio = async () => {
    if (!videoAtual.isAd) return;

    await registrarCliqueAnuncio(videoAtual.id);

    try {
      // 🔥 buscar empresa
      const empresaRef = doc(db, "empresas", videoAtual.empresaId);
      const empresaSnap = await getDoc(empresaRef);

      if (!empresaSnap.exists()) {
        alert("Empresa não encontrada");
        return;
      }

      const empresa = empresaSnap.data();

      // 📱 WhatsApp
      if (videoAtual.tipoAcao === "whatsapp") {
        if (!empresa.whatsNumero) {
          alert("Empresa sem WhatsApp");
          return;
        }

        window.open(`https://wa.me/${empresa.whatsNumero}`, "_blank");
      }

      // 🛒 Carrinho
      if (videoAtual.tipoAcao === "carrinho") {
        router.push(`/produto/${videoAtual.produtoId}`);
      }

    } catch (err) {
      console.error(err);
      alert("Erro no anúncio");
    }
  };

  const postarComentario = async (textoManual) => {
    const conteudo = textoManual || textoComentario;
    if (!conteudo.trim() || videoAtual.isAd) return;

    await addDoc(collection(db, "mogu_tv", videoAtual.id, "comentarios"), {
      texto: conteudo,
      usuario: "Cliente",
      data: serverTimestamp()
    });

    setTextoComentario("");
  };

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Carregando...
      </div>
    );
  }

  return (
    <main className="h-screen bg-black text-white flex justify-center">
      <div className="relative w-full max-w-[500px] h-full">

        {/* 🎬 VÍDEO */}
        <iframe
          key={videoAtual.youtubeId + muted}
          className="w-full h-full pointer-events-none"
          src={`https://www.youtube.com/embed/${videoAtual.youtubeId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${videoAtual.youtubeId}`}
          allow="autoplay"
        />

        {/* clique */}
        <div className="absolute inset-0 flex flex-col">
          <div className="h-1/2" onClick={() => setIndice(prev => (prev > 0 ? prev - 1 : 0))}></div>
          <div className="h-1/2" onClick={() => setIndice(prev => (prev + 1) % videos.length)}></div>
        </div>

        {/* 🔥 INFO DO ANÚNCIO */}
        {videoAtual.isAd && (
          <div className="absolute bottom-24 left-4 right-20">
            <p className="font-bold text-lg">{videoAtual.nomeEmpresa || "Anunciante"}</p>
            <p className="text-sm opacity-80">{videoAtual.descricao}</p>
          </div>
        )}

        {/* BOTÕES */}
        <div className="absolute right-4 bottom-32 flex flex-col space-y-5 items-center">

          {/* 🔊 SOM */}
          <button
            onClick={() => setMuted(!muted)}
            className="bg-white/10 p-3 rounded-full"
          >
            {muted ? "🔇" : "🔊"}
          </button>

          {!videoAtual.isAd && (
            <>
              {/* ❤️ LIKE */}
              <button
                onClick={() =>
                  updateDoc(doc(db, "mogu_tv", videoAtual.id), {
                    likes: increment(1)
                  })
                }
                className="flex flex-col items-center"
              >
                <div className="bg-white/10 p-4 rounded-full text-2xl">❤️</div>
                <span className="text-xs">{videoAtual.likes || 0}</span>
              </button>

              {/* 💬 COMENTÁRIOS */}
              <button onClick={() => setAbaComentarios(true)}>
                💬
              </button>
            </>
          )}

          {/* 💰 ANÚNCIO */}
          {videoAtual.isAd && (
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                ANÚNCIO
              </div>

              <button
                onClick={handleAcaoAnuncio}
                className="bg-green-500 px-4 py-2 rounded-full font-bold"
              >
                {videoAtual.tipoAcao === "whatsapp"
                  ? "WhatsApp"
                  : "Pedir agora"}
              </button>
            </div>
          )}
        </div>

        {/* 💬 COMENTÁRIOS */}
        {abaComentarios && !videoAtual.isAd && (
          <div className="absolute bottom-0 w-full h-[75%] bg-white text-black rounded-t-2xl flex flex-col">

            <div className="flex justify-center py-2" onClick={() => setAbaComentarios(false)}>
              <div className="w-10 h-1 bg-gray-300 rounded"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comentarios.map(c => (
                <div key={c.id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {c.usuario?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{c.usuario}</p>
                    <p className="text-sm">{c.texto}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-around border-t p-2">
              {emojisFixos.map(e => (
                <button key={e} onClick={() => postarComentario(e)}>
                  {e}
                </button>
              ))}
            </div>

            <div className="p-3">
              <input
                value={textoComentario}
                onChange={(e) => setTextoComentario(e.target.value)}
                placeholder="Comentar..."
                className="w-full bg-gray-100 p-2 rounded-full"
              />
            </div>

          </div>
        )}

      </div>
    </main>
  );
}