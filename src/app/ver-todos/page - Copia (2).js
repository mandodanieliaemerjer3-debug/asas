"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  getDocs 
} from "firebase/firestore";
import RodapeNav from "../../components/RodapeNav";

export default function VerTodosFeed() {

  const searchParams = useSearchParams();
  const router = useRouter();

  const tagFiltro = searchParams.get("tag") || "#marmita";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comentariosCount, setComentariosCount] = useState({});

  useEffect(() => {

    const q = query(collection(db, "products"));

    const unsub = onSnapshot(q, async (snap) => {

      const todos = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      const filtrados = todos.filter(p => p.tags?.includes(tagFiltro));

      setProducts(filtrados);
      setLoading(false);

      // BUSCAR CONTAGEM DE COMENTÁRIOS DOS VÍDEOS
      let mapa = {};

      for (let p of filtrados) {

        if (p.videoId) {

          try {

            const snapComentarios = await getDocs(
              collection(db, "mogu_tv", p.videoId, "comentarios")
            );

            mapa[p.videoId] = snapComentarios.size;

          } catch {

            mapa[p.videoId] = 0;

          }

        }

      }

      setComentariosCount(mapa);

    });

    return () => unsub();

  }, [tagFiltro]);



  function abrirConteudo(produto){

    if(produto.videoId){

      router.push(`/mogu-tv?v=${produto.videoId}`);

    }else{

      router.push(`/detalhes/${produto.id}`);

    }

  }



  return (

    <main className="min-h-screen bg-gray-50 pb-32 max-w-md mx-auto relative font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100">
        
        <button
          onClick={() => router.back()}
          className="text-2xl text-gray-800 font-black"
        >
          ←
        </button>

        <h1 className="font-black uppercase italic text-sm text-red-600 tracking-widest">
          Explorar: {tagFiltro.replace("#", "")}
        </h1>

      </header>



      {loading ? (

        <div className="flex items-center justify-center h-96 font-black text-gray-300 animate-pulse uppercase text-xs">
          Buscando o melhor para você...
        </div>

      ) : (

        <div className="flex flex-col gap-6 p-4">

          {products.map((p) => (

            <div
              key={p.id}
              className="bg-white rounded-[40px] shadow-2xl border border-gray-50 overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
              onClick={() => abrirConteudo(p)}
            >

              {/* IMAGEM */}
              <div className="h-72 w-full relative">

                <img
                  src={p.image}
                  className="w-full h-full object-cover"
                  alt={p.name}
                />

                {p.coinPrice > 0 && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-[10px] font-black px-4 py-2 rounded-full shadow-lg">
                    🪙 {p.coinPrice} CASHBACK
                  </div>
                )}

              </div>



              {/* INFO PRODUTO */}
              <div className="p-6 flex flex-col gap-3">

                <div className="flex justify-between items-start">

                  <div>

                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      {p.tags?.split("#")[1] || "Destaque"}
                    </p>

                    <h2 className="text-xl font-black text-gray-900 uppercase italic leading-none">
                      {p.name}
                    </h2>

                  </div>

                  <span className="text-2xl font-black text-green-600 italic">
                    R$ {p.price.toFixed(2)}
                  </span>

                </div>



                {/* DESCRIÇÃO COMPLETA (SEM CORTE) */}
                <p className="text-gray-500 text-sm font-medium leading-tight">
                  {p.description || "Sem descrição disponível para este lanche."}
                </p>



                {/* INFO DO VIDEO */}
                {p.videoId && (

                  <div className="flex items-center gap-4 text-xs font-bold text-gray-500">

                    <span>📺 Mogu TV</span>

                    <span>
                      💬 {comentariosCount[p.videoId] ?? 0} comentários
                    </span>

                  </div>

                )}



                <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase italic shadow-xl shadow-red-100">
                  Pedir agora
                </button>

              </div>

            </div>

          ))}

        </div>

      )}



      <RodapeNav saldo={0} cartCount={0} router={router} />

    </main>

  );

}