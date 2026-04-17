"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  doc,
  getDoc,
  getDocs
} from "firebase/firestore";

import RodapeNav from "../../components/RodapeNav";

export default function VerTodosFeed(){

  const searchParams = useSearchParams();
  const router = useRouter();

  const tagFiltro = searchParams.get("tag") || "#marmita";

  const [products,setProducts] = useState([]);
  const [videoStats,setVideoStats] = useState({});
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    const q = query(collection(db,"products"));

    const unsub = onSnapshot(q, async (snap)=>{

      const lista = snap.docs.map(d=>({
        id:d.id,
        ...d.data()
      }));

      const filtrados = lista.filter(p =>
        p.tags?.includes(tagFiltro)
      );

      setProducts(filtrados);

      let mapa = {};

      for(const p of filtrados){

        if(p.moguVideoId){

          try{

            const videoRef = doc(db,"mogu_tv",p.moguVideoId);
            const videoSnap = await getDoc(videoRef);

            let likes = 0;
            let comentarios = 0;

            if(videoSnap.exists()){

              likes = videoSnap.data().likes || 0;

              const comSnap = await getDocs(
                collection(db,"mogu_tv",p.moguVideoId,"comentarios")
              );

              comentarios = comSnap.size;

            }

            mapa[p.moguVideoId] = { likes, comentarios };

          }catch{
            mapa[p.moguVideoId] = { likes:0, comentarios:0 };
          }

        }

      }

      setVideoStats(mapa);
      setLoading(false);

    });

    return ()=>unsub();

  },[tagFiltro]);

  const abrirProduto = (p)=>{

    if(p.moguVideoId){
      router.push(`/mogu-tv?v=${p.moguVideoId}`);
    }else{
      router.push(`/detalhes/${p.id}`);
    }

  };

  return(

    <main className="min-h-screen bg-gray-50 pb-32 max-w-md mx-auto relative font-sans">

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100">

        <button
          onClick={()=>router.back()}
          className="text-2xl font-black"
        >
          ←
        </button>

        <h1 className="font-black uppercase italic text-sm text-red-600 tracking-widest">
          Explorar: {tagFiltro.replace("#","")}
        </h1>

      </header>

      {loading ? (

        <div className="flex items-center justify-center h-96 text-gray-300 font-black">
          Carregando...
        </div>

      ) : (

        <div className="flex flex-col gap-6 p-4">

          {products.map(p => {

            const stats = videoStats[p.moguVideoId] || {
              likes:0,
              comentarios:0
            };

            return(

              <div
                key={p.id}
                onClick={()=>abrirProduto(p)}
                className="bg-white rounded-[40px] shadow-xl overflow-hidden active:scale-[0.98] transition cursor-pointer"
              >

                <div className="h-72 w-full relative">

                  <img
                    src={p.image}
                    className="w-full h-full object-cover"
                  />

                  {p.coinPrice > 0 && (

                    <div className="absolute top-4 right-4 bg-yellow-400 text-[10px] font-black px-4 py-2 rounded-full">
                      🪙 {p.coinPrice}
                    </div>

                  )}

                </div>

                <div className="p-6">

                  <div className="flex justify-between items-start">

                    <div>

                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        {p.tags?.split("#")[1] || "Destaque"}
                      </p>

                      <h2 className="text-xl font-black uppercase italic">
                        {p.name}
                      </h2>

                    </div>

                    <span className="text-2xl font-black text-green-600">
                      R$ {p.price.toFixed(2)}
                    </span>

                  </div>

                  <p className="text-gray-500 text-sm mt-2">
                    {p.description || "Sem descrição."}
                  </p>

                  {p.moguVideoId && (

                    <div className="flex gap-4 mt-4 text-xs font-black text-gray-500">
                      <span>📺 Mogu TV</span>
                      <span>❤️ {stats.likes}</span>
                      <span>💬 {stats.comentarios}</span>
                    </div>

                  )}

                </div>

              </div>

            )

          })}

        </div>

      )}

      <RodapeNav saldo={0} cartCount={0} router={router}/>

    </main>

  )

}