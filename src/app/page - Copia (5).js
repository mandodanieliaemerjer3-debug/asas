"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../lib/firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

// Dados Locais
import bannersData from "../data/banners.json";
import parceirosData from "../data/parceiros.json";

// Componentes
import HeaderPrincipal from "../components/HeaderPrincipal";
import BannerPromocional from "../components/BannerPromocional";
import GerenciadorFilas from "../components/GerenciadorFilas";
import ListaDestaques from "../components/ListaDestaques";
import CarrosselNotas from "../components/CarrosselNotas";
import RodapeNav from "../components/RodapeNav";
import PopupReiniciar from "../components/PopupReiniciar";
import ParceirosLocais from "../components/ParceirosLocais";
import GerenciadorRestaurantes from "../components/GerenciadorRestaurantes";

export default function Home() {
  const { user, loginGoogle } = useAuth();
  const router = useRouter();

  const [restaurants, setRestaurants] = useState([]);
  const [products, setProducts] = useState([]);
  const [notas, setNotas] = useState([]);
  const [cart, setCart] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [animatingImg, setAnimatingImg] = useState(null);
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [itemPendente, setItemPendente] = useState(null);

  const categoriasEspeciais = [
    { name: "Bolos", img: "🎂" },
    { name: "Festas", img: "🎈" },
    { name: "Alta Gastronomia", img: "👨‍🍳" },
    { name: "Fitness", img: "🥗" }
  ];

  // 🔄 Firebase tempo real
  useEffect(() => {
    const unsubRes = onSnapshot(collection(db, "restaurants"), (snapshot) => {
      setRestaurants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubNotas = onSnapshot(collection(db, "notas_anuncios"), (snapshot) => {
      setNotas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubRes();
      unsubProducts();
      unsubNotas();
    };
  }, []);

  // 👤 Usuário + carrinho
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setUserProfile({ uid: user.uid, ...snap.data() });
      }
    });

    const saved = localStorage.getItem("carrinho");
    if (saved) setCart(JSON.parse(saved));

    return () => unsub();
  }, [user]);

  // 🛒 Carrinho seguro
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black text-orange-500 italic">
        MOGU carregando...
      </div>
    );
  }

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

      {/* BOTÃO ADMIN */}
      <button
        onClick={() => router.push("/portal")}
        className="fixed bottom-24 right-4 z-[60] w-12 h-12 bg-black text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white"
      >
        ⚙️
      </button>

      {/* ANIMAÇÃO */}
      {animatingImg && (
        <img
          src={animatingImg.src}
          className="fixed z-[9999] w-12 h-12 rounded-full object-cover animate-fly-to-cart"
          style={{ top: animatingImg.top, left: animatingImg.left }}
          alt="fly"
        />
      )}

      <GerenciadorRestaurantes restaurants={restaurants} router={router} />

      <BannerPromocional
        bannersData={bannersData.home || []}
        categorias={categoriasEspeciais}
        router={router}
      />

      {/* 🔥 BOTÃO VER PEDIDOS */}
      <div className="px-4 mt-6">
        <div
          onClick={() => router.push("/pedidos")}
          className="bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-3xl p-5 shadow-xl flex justify-between items-center active:scale-95 transition-all cursor-pointer"
        >
          <div>
            <p className="text-xs uppercase font-black opacity-80">
              Acompanhar pedido
            </p>
            <h2 className="text-lg font-black italic">
              📦 Ver meus pedidos
            </h2>
          </div>
          <span className="text-2xl">➔</span>
        </div>
      </div>

      {/* FILAS */}
      {userProfile?.preferencias?.length > 0 && (
        <GerenciadorFilas
          products={products}
          userProfile={userProfile}
          router={router}
        />
      )}

      {/* PRODUTOS */}
      <div className="mt-8 px-4">
        <h2 className="text-xs font-black uppercase italic mb-4">
          🔥 Mais Pedidos
        </h2>

        <ListaDestaques
          products={products}
          onAdd={prepararAdicao}
          router={router}
          restaurants={restaurants}
        />
      </div>

      <div className="h-4 w-full bg-white"></div>

      <CarrosselNotas notas={notas} />

      <ParceirosLocais parceiros={parceirosData} userProfile={userProfile} />

      <RodapeNav
        saldo={userProfile?.moedas || 0}
        cartCount={cart.length}
        router={router}
      />

      <style jsx global>{`
        @keyframes fly {
          0% { transform: scale(1); opacity: 1; }
          100% { top: 90vh; left: 80vw; transform: scale(0.2); opacity: 0; }
        }
        .animate-fly-to-cart {
          animation: fly 0.8s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}