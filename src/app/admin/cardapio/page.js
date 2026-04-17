"use client";
import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import restaurantesLocais from "../../../data/restaurantes.json";

export default function GestaoCardapio() {

  const [products, setProducts] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");

  // =========================
  // BUSCAR PRODUTOS
  // =========================

  useEffect(() => {

    const unsub = onSnapshot(collection(db,"products"),(snap)=>{

      const lista = [];

      snap.forEach(doc => {
        lista.push({id:doc.id,...doc.data()});
      });

      setProducts(lista);
      setLoading(false);

    });

    return () => unsub();

  },[]);

  // =========================
  // EXTRAIR ID YOUTUBE
  // =========================

  const extrairId = (url)=>{

    const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;

    const match = url.match(regExp);

    return match && match[1] ? match[1] : null;

  };

  // =========================
  // SALVAR EDIÇÃO
  // =========================

  const handleUpdate = async (e)=>{

    e.preventDefault();

    try{

      let moguVideoId = editingItem.moguVideoId || null;

      // se tiver link de vídeo novo
      if(videoUrl){

        const youtubeId = extrairId(videoUrl);

        if(!youtubeId){
          alert("Link YouTube inválido");
          return;
        }

        const docVideo = await addDoc(collection(db,"mogu_tv"),{

          youtubeId: youtubeId,
          descricao: editingItem.name,
          likes: 0,
          dataCriacao: serverTimestamp(),
          tipo: "video"

        });

        moguVideoId = docVideo.id;

      }

      await updateDoc(doc(db,"products",editingItem.id),{

        name: editingItem.name,
        price: parseFloat(editingItem.price),
        precoInterno: parseFloat(editingItem.precoInterno || 0),
        category: editingItem.category || "",
        moguVideoId: moguVideoId

      });

      alert("Produto atualizado!");

      setEditingItem(null);
      setVideoUrl("");

    }catch(err){

      console.error(err);
      alert("Erro ao atualizar");

    }

  };

  // =========================
  // EXCLUIR
  // =========================

  const handleDelete = async (id)=>{

    if(confirm("Tem certeza que deseja apagar este item?")){
      await deleteDoc(doc(db,"products",id));
    }

  };

  const getRestauranteNome = (id)=>{

    const res = restaurantesLocais.find(r => r.id === id);

    return res ? res.name : "Desconhecido";

  };

  return (

    <main className="min-h-screen bg-gray-50 p-4 font-sans pb-20 max-w-2xl mx-auto">

      <header className="flex justify-between items-center mb-8">

        <h1 className="font-black text-xl uppercase italic text-gray-800">
          Gestão de Itens
        </h1>

        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black italic uppercase">
          ADM
        </span>

      </header>

      {loading ? (

        <p className="text-center py-20 font-bold text-gray-400">
          Carregando Itens...
        </p>

      ) : (

        <div className="flex flex-col gap-3">

          {products.map(item => (

            <div 
              key={item.id}
              className="bg-white p-3 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between"
            >

              <div className="flex items-center gap-3">

                <img
                  src={item.image}
                  className="w-12 h-12 rounded-2xl object-cover bg-gray-100"
                />

                <div>

                  <p className="text-[8px] font-black text-red-600 uppercase">
                    {getRestauranteNome(item.restaurantId)}
                  </p>

                  <h3 className="font-bold text-sm text-gray-800 uppercase">
                    {item.name}
                  </h3>

                  <div className="flex gap-2 mt-1">

                    <span className="text-[10px] font-black text-green-600">
                      Venda: R${item.price.toFixed(2)}
                    </span>

                    <span className="text-[10px] font-bold text-gray-400">
                      Int: R${item.precoInterno || 0}
                    </span>

                    {item.moguVideoId && (
                      <span className="text-[10px] text-purple-600 font-bold">
                        📺 vídeo
                      </span>
                    )}

                  </div>

                </div>

              </div>

              <div className="flex gap-2">

                <button
                  onClick={()=>setEditingItem(item)}
                  className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl"
                >
                  📝
                </button>

                <button
                  onClick={()=>handleDelete(item.id)}
                  className="w-10 h-10 bg-red-50 text-red-600 rounded-xl"
                >
                  🗑️
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* MODAL EDIÇÃO */}

      {editingItem && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">

          <div className="bg-white w-full max-w-md rounded-[35px] p-8">

            <h2 className="font-black text-xl mb-6">
              Editar Produto
            </h2>

            <form onSubmit={handleUpdate} className="flex flex-col gap-4">

              <input
                value={editingItem.name}
                onChange={(e)=>setEditingItem({...editingItem,name:e.target.value})}
                className="p-4 bg-gray-100 rounded-xl"
              />

              <input
                type="number"
                value={editingItem.price}
                onChange={(e)=>setEditingItem({...editingItem,price:e.target.value})}
                className="p-4 bg-gray-100 rounded-xl"
              />

              <input
                type="number"
                value={editingItem.precoInterno || ""}
                onChange={(e)=>setEditingItem({...editingItem,precoInterno:e.target.value})}
                className="p-4 bg-gray-100 rounded-xl"
              />

              <input
                placeholder="Link do vídeo do lanche (YouTube / Shorts)"
                value={videoUrl}
                onChange={(e)=>setVideoUrl(e.target.value)}
                className="p-4 bg-gray-100 rounded-xl"
              />

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={()=>setEditingItem(null)}
                  className="flex-1 p-4 bg-gray-200 rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 p-4 bg-red-600 text-white rounded-xl"
                >
                  Salvar
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>

  );

}