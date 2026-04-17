"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../lib/firebase";
import { doc, onSnapshot, setDoc, collection } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

// Dados Locais
import restaurantesLocais from "../data/restaurantes.json";
import bannersData from "../data/banners.json";

// Componentes Extraídos
import HeaderPrincipal from "../components/HeaderPrincipal";
import BannerPromocional from "../components/BannerPromocional";
import GerenciadorFilas from "../components/GerenciadorFilas";
import ListaDestaques from "../components/ListaDestaques";
import CarrosselNotas from "../components/CarrosselNotas";
import RodapeNav from "../components/RodapeNav";
import PopupReiniciar from "../components/PopupReiniciar";

export default function Home() {
  const { user, loginGoogle } = useAuth();
  const router = useRouter();

  // Estados de Dados
  const [restaurants] = useState(restaurantesLocais || []);
  const [products, setProducts] = useState([]);
  const [notas, setNotas] = useState([]);
  const [cart, setCart] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [animatingImg, setAnimatingImg] = useState(null);
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [itemPendente, setItemPendente] = useState(null);

  const categoriasEspeciais = [
    { name: "Bolos", img: "🎂" }, { name: "Festas", img: "🎈" },
    { name: "Alta Gastronomia", img: "👨‍🍳" }, { name: "Fitness", img: "🥗" }
  ];

  // Sincronização Firebase (Produtos e Notas)
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    const unsubNotas = onSnapshot(collection(db, "notas_anuncios"), (snapshot) => {
      setNotas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubProducts(); unsubNotas(); };
  }, []);

  // Perfil e Carrinho
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });
    const saved = localStorage.getItem("carrinho");
    if (saved) setCart(JSON.parse(saved));
    return () => unsub();
  }, [user]);

  // LÓGICA DE CARRINHO (A única que fica no Líder por enquanto)
  const prepararAdicao = (e, p) => {
    if (cart.length > 0 && cart[0].restaurantId !== p.restaurantId) {
      setItemPendente({ e, p });
      setMostrarPopup(true);
    } else {
      executarVoo(e, p);
    }
  };

  const executarVoo = (e, p, isRestart = false) => {
    const rect = e.target.getBoundingClientRect();
    setAnimatingImg({ src: p.image, top: rect.top, left: rect.left });
    setTimeout(() => {
      setAnimatingImg(null);
      const novoCarrinho = isRestart ? [p] : [...cart, p];
      setCart(novoCarrinho);
      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    }, 800);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse uppercase italic text-[10px]">Sincronizando...</div>;

  return (
    <main className="min-h-screen bg-white pb-44 font-sans max-w-md mx-auto shadow-2xl relative border-x border-gray-100 overflow-x-hidden">
      
      <PopupReiniciar 
        isOpen={mostrarPopup} 
        onClose={() => setMostrarPopup(false)} 
        onConfirm={() => {
          localStorage.removeItem("carrinho");
          setCart([]);
          executarVoo(itemPendente.e, itemPendente.p, true);
          setMostrarPopup(false);
        }}
      />

      <HeaderPrincipal user={user} loginGoogle={loginGoogle} router={router} />

      {/* Botão ADM Flutuante */}
      <button onClick={() => router.push("/portal")} className="fixed bottom-24 right-4 z-[60] w-12 h-12 bg-black text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white active:scale-90 transition-all">⚙️</button>

      {animatingImg && <img src={animatingImg.src} className="fixed z-[9999] w-12 h-12 rounded-full object-cover animate-fly-to-cart" style={{ top: animatingImg.top, left: animatingImg.left }} alt="fly" />}

      <section className="mt-4 px-4">
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {restaurants.map((res) => (
            <div key={res.id} onClick={() => router.push(`/restaurante/${res.id}`)} className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-100 p-0.5 shadow-sm active:scale-90 transition">
                <img src={res.logo} className="w-full h-full rounded-full object-cover" alt={res.name} />
              </div>
              <span className="text-[8px] font-black uppercase text-gray-500 italic">{res.name}</span>
            </div>
          ))}
        </div>
      </section>

      <BannerPromocional bannersData={bannersData.home || []} categorias={categoriasEspeciais} router={router} />

      {userProfile?.preferencias?.length > 0 && <GerenciadorFilas products={products} userProfile={userProfile} router={router} />}

      <div className="mt-8 px-4">
        <h2 className="text-xs font-black uppercase italic mb-4">🔥 Mais Pedidos</h2>
        <ListaDestaques products={products} onAdd={prepararAdicao} router={router} restaurants={restaurants} />
      </div>

      <CarrosselNotas notas={notas} />

      <RodapeNav saldo={userProfile?.moedas || 0} cartCount={cart.length} router={router} />

      <style jsx global>{`
        @keyframes fly { 0% { transform: scale(1); opacity: 1; } 100% { top: 90vh; left: 80vw; transform: scale(0.2); opacity: 0; } }
        .animate-fly-to-cart { animation: fly 0.8s ease-in-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}