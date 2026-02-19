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
    if (!user) {
      setSaldoReal(0);
      return;
    }

    const userRef = doc(db, "users", user.uid);

    // Monitora o saldo em tempo real
    const unsubSaldo = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        setSaldoReal(docSnap.data().moedas || 0);
      } else {
        // Se a coleção 'users' não existir, cria o seu perfil agora
        try {
          await setDoc(userRef, {
            nome: user.displayName || "Usuário Novo",
            email: user.email,
            moedas: 0,
            criadoEm: new Date().toISOString()
          });
          console.log("Perfil criado automaticamente no Firestore!");
        } catch (error) {
          console.error("Erro ao criar perfil:", error);
        }
      }
    });

    return () => unsubSaldo();
  }, [user]);

  // Carregar carrinho do LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const animarVoo = (e, p) => {
    if (cart.length > 0 && cart[0].restaurantId !== p.restaurantId) {
      const trocarLoja = window.confirm("Sua sacola já tem itens de outro restaurante. Deseja LIMPAR?");
      if (trocarLoja) { setCart([]); localStorage.removeItem("carrinho"); } 
      else return;
    }
    const rect = e.target.getBoundingClientRect();
    setAnimatingImg({ src: p.image, top: rect.top, left: rect.left });
    setTimeout(() => {
      setAnimatingImg(null);
      const currentCart = localStorage.getItem("carrinho") ? JSON.parse(localStorage.getItem("carrinho")) : [];
      const newCart = [...currentCart, p];
      setCart(newCart);
      localStorage.setItem("carrinho", JSON.stringify(newCart));
    }, 800);
  };

  return (
    <main className="min-h-screen bg-white pb-44 font-sans max-w-md mx-auto shadow-2xl relative border-x border-gray-100 overflow-x-hidden">
      
      {/* IMAGEM VOADORA */}
      {animatingImg && (
        <img 
          src={animatingImg.src}
          className="fixed z-[9999] w-12 h-12 rounded-full object-cover shadow-2xl border-2 border-white animate-fly-to-cart"
          style={{ top: animatingImg.top, left: animatingImg.left }}
        />
      )}

      {/* HEADER */}
      <header className="p-4 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
         <div className="flex items-center gap-3">
            {!user ? (
              <button onClick={loginGoogle} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold italic">IN</button>
            ) : (
              <div onClick={() => router.push("/perfil")} className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold shadow-md cursor-pointer uppercase">
                {user.displayName ? user.displayName[0] : "U"}
              </div>
            )}
            <div>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter leading-none">Entrega em</p>
               <h3 className="font-black text-gray-800 text-xs italic uppercase">📍 Guapiara, SP</h3>
            </div>
         </div>
      </header>

      {/* RESTAURANTES NO TOPO */}
      <section className="mt-4 px-4">
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {restaurants.map(res => (
            <div key={res.id} onClick={() => router.push(`/restaurante/${res.id}`)} className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group">
              <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-100 p-0.5 shadow-sm group-active:scale-90 transition transform">
                <img src={res.logo} className="w-full h-full rounded-full object-cover" alt={res.name} />
              </div>
              <span className="text-[8px] font-black uppercase text-gray-500 truncate w-16 text-center italic">{res.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* BANNERS ABAIXO DOS RESTAURANTES */}
      <section className="px-4 mt-2">
         <BannerCarrossel imagens={bannersData.home} />
      </section>

      {/* CATEGORIAS */}
      <section className="mt-6 px-4 grid grid-cols-4 gap-2">
         {categoriasEspeciais.map(cat => (
            <button key={cat.name} onClick={() => router.push("/especiais")} className="flex flex-col items-center p-3 rounded-[24px] bg-gray-50 border border-gray-100 active:scale-90 transition">
               <span className="text-2xl mb-1">{cat.img}</span>
               <span className="text-[9px] font-black uppercase text-gray-800">{cat.name}</span>
            </button>
         ))}
      </section>

      {/* FEED DE PRODUTOS */}
      <section className="mt-8 px-4">
         <h2 className="font-black text-gray-900 text-lg mb-4 italic uppercase tracking-tighter decoration-red-600 underline decoration-4">Destaques 🍔</h2>
         <div className="grid grid-cols-2 gap-4">
            {products.map(p => (
               <div key={p.id} className="bg-white rounded-[32px] border border-gray-100 p-2 shadow-sm flex flex-col">
                  <div onClick={() => router.push(`/restaurante/${p.restaurantId}`)} className="h-32 bg-gray-50 rounded-[24px] overflow-hidden relative cursor-pointer">
                    <img src={p.image} className="w-full h-full object-cover" alt={p.name}/>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-between">
                     <div>
                        <h4 className="font-bold text-[11px] text-gray-800 line-clamp-1">{p.name}</h4>
                        <p className="text-[7px] font-black text-red-500 uppercase italic">Ver Loja</p>
                     </div>
                     <div className="flex justify-between items-center mt-2">
                        <span className="font-black text-green-600 text-sm italic">R$ {p.price.toFixed(2)}</span>
                        <button onClick={(e) => animarVoo(e, p)} className="w-9 h-9 bg-red-600 text-white rounded-2xl font-black shadow-lg active:scale-90 transition">+</button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* RODAPÉ COM SALDO REAL */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-6 flex justify-between items-end rounded-t-[45px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
           <div className="bg-gray-900 px-5 py-3 rounded-full flex items-center gap-2 shadow-xl border-2 border-white/10 active:scale-95 transition mb-2">
              <span className="text-lg">🪙</span>
              <div className="flex flex-col text-white font-black leading-none">
                 <span className="text-[8px] text-yellow-400 uppercase tracking-tighter">Saldo Real</span>
                 <span className="text-sm">{saldoReal}</span>
              </div>
           </div>
           <div className="flex items-center gap-1 mb-1">
              {cart.length > 0 && (
                <div className="flex -space-x-6 bg-white/40 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-lg">
                  {cart.slice(-6).map((item, index) => (
                    <img key={index} src={item.image} className="h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-md" style={{ zIndex: index }} />
                  ))}
                </div>
              )}
              <div onClick={() => router.push("/checkout")} className="relative cursor-pointer group ml-1">
                <div className="p-4 bg-red-600 rounded-3xl shadow-xl shadow-red-200 active:scale-90 transition"><span className="text-3xl text-white">🛒</span></div>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white animate-bounce">{cart.length}</span>
                )}
              </div>
           </div>
        </div>
      </nav>

      <style jsx global>{`
        @keyframes fly { 0% { transform: scale(1); opacity: 1; } 100% { top: 88vh; left: 75vw; transform: scale(0.2); opacity: 0; } }
        .animate-fly-to-cart { animation: fly 0.8s ease-in-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}