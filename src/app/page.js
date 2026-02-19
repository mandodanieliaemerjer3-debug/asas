"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../lib/firebase"; 
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore"; 
import { useAuth } from "../contexts/AuthContext";

// IMPORTANDO OS DADOS LOCAIS
import comidasLocais from "../data/comidas.json";
import restaurantesLocais from "../data/restaurantes.json"; 
import bannersData from "../data/banners.json";
import BannerCarrossel from "../components/BannerCarrossel";

export default function Home() {
  const { user, loginGoogle } = useAuth();
  const router = useRouter();

  const [restaurants] = useState(restaurantesLocais);
  const [products] = useState(comidasLocais);
  const [cart, setCart] = useState([]);
  const [animatingImg, setAnimatingImg] = useState(null);
  const [saldoReal, setSaldoReal] = useState(0);

  // Categorias Especiais
  const categoriasEspeciais = [
    { name: "Bolos", img: "🎂" },
    { name: "Festas", img: "🎈" },
    { name: "Alta Gastronomia", img: "👨‍🍳" },
    { name: "Fitness", img: "🥗" }
  ];

  // 1. SISTEMA AUTOMÁTICO DE SALDO E CRIAÇÃO DE USUÁRIO
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        setSaldoReal(docSnap.data().saldo || 0);
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          nome: user.displayName,
          email: user.email,
          foto: user.photoURL,
          saldo: 0,
          createdAt: new Date().toISOString()
        });
      }
    });

    return () => unsub();
  }, [user]);

  const addToCart = (product, e) => {
    setCart([...cart, product]);
    
    // Animação de voo para o carrinho
    const rect = e.target.getBoundingClientRect();
    setAnimatingImg({
      src: product.image,
      top: rect.top,
      left: rect.left
    });

    setTimeout(() => setAnimatingImg(null), 800);
  };

  return (
    <div className="min-h-screen pb-40">
      {/* HEADER */}
      <header className="bg-white p-6 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black italic text-gray-900 tracking-tighter uppercase">Mestre Mogu</h1>
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-[3px]">Delivery Express</p>
        </div>
        <div onClick={() => !user && loginGoogle()} className="cursor-pointer">
          {user ? (
            <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-red-500 shadow-md" />
          ) : (
            <div className="bg-gray-100 p-2 rounded-full text-xs font-bold uppercase tracking-widest px-4 border border-gray-200">Login</div>
          )}
        </div>
      </header>

      {/* CARROSSEL DE BANNERS */}
      <BannerCarrossel banners={bannersData.banners} />

      {/* CATEGORIAS ESPECIAIS */}
      <section className="px-6 py-4 overflow-x-auto flex gap-4 no-scrollbar">
        {categoriasEspeciais.map((cat, i) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg border border-gray-100 flex items-center justify-center text-3xl transform hover:scale-110 transition cursor-pointer">
              {cat.img}
            </div>
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">{cat.name}</span>
          </div>
        ))}
      </section>

      {/* LISTA DE PRODUTOS */}
      <section className="px-6 mt-6">
        <h2 className="text-sm font-black italic uppercase text-gray-400 mb-4 tracking-widest">Os mais pedidos</h2>
        <div className="grid grid-cols-2 gap-4">
          {products.map((item) => (
            <div key={item.id} className="bg-white rounded-[32px] p-4 border border-gray-50 shadow-sm relative overflow-hidden group">
              <img src={item.image} className="w-full h-32 object-cover rounded-2xl mb-3 group-hover:scale-105 transition-transform" />
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h3>
              <p className="text-[10px] text-gray-400 font-medium mb-3">R$ {item.price.toFixed(2)}</p>
              <button 
                onClick={(e) => addToCart(item, e)}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-black italic text-[10px] uppercase tracking-widest active:scale-95 transition"
              >
                Adicionar +
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ANIMAÇÃO DE VOO */}
      {animatingImg && (
        <img
          src={animatingImg.src}
          className="fixed w-16 h-16 rounded-full object-cover shadow-2xl z-[100] pointer-events-none"
          style={{
            top: animatingImg.top,
            left: animatingImg.left,
            animation: "fly 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
          }}
        />
      )}

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-gray-100 via-gray-100/90 to-transparent">
        <div className="max-w-lg mx-auto flex items-end justify-between gap-4">
          
          {/* SALDO */}
          <div className="flex-1">
            <div onClick={() => router.push("/carteira")} className="bg-white/80 backdrop-blur-md p-3 rounded-[32px] border border-white shadow-lg active:scale-95 transition cursor-pointer">
              <p className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Seu Saldo</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-gray-900">R$ {saldoReal.toFixed(2)}</span>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* BOTÃO MOGU MOGU TV (CENTRALIZADO) */}
          <div className="flex flex-col items-center mb-1">
            <div 
              onClick={() => router.push("/mogu-tv")} 
              className="group relative cursor-pointer"
            >
              <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-xl group-hover:bg-red-500/40 transition"></div>
              <div className="relative p-4 bg-white rounded-full shadow-xl border-2 border-red-500 active:scale-90 transition flex flex-col items-center">
                <span className="text-2xl">📺</span>
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase text-red-600 tracking-tighter whitespace-nowrap">
                Mogu TV
              </span>
            </div>
          </div>

          {/* CARRINHO */}
          <div className="flex items-center gap-1 mb-1">
            {cart.length > 0 && (
              <div className="flex -space-x-6 bg-white/40 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-lg">
                {cart.slice(-6).map((item, index) => (
                  <img key={index} src={item.image} className="h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-md" style={{ zIndex: index }} />
                ))}
              </div>
            )}
            <div onClick={() => router.push("/checkout")} className="relative cursor-pointer group ml-1">
              <div className="p-4 bg-red-600 rounded-3xl shadow-xl shadow-red-200 active:scale-90 transition">
                <span className="text-3xl text-white">🛒</span>
              </div>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white animate-bounce">
                  {cart.length}
                </span>
              )}
            </div>
          </div>

        </div>
      </nav>

      <style jsx global>{`
        @keyframes fly {
          0% { transform: scale(1); opacity: 1; }
          100% { top: 92vh; left: 80vw; transform: scale(0.2); opacity: 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}