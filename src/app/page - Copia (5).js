"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../lib/firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

import soundManager from "../lib/sounds";
import bannersData from "../data/banners.json";
import parceirosData from "../data/parceiros.json";

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
  const [mostrarRevisao, setMostrarRevisao] = useState(false);
  const [itemPendente, setItemPendente] = useState(null);

  const categoriasEspeciais = [
    { name: "Bolos", img: "🎂" },
    { name: "Festas", img: "🎈" },
    { name: "Alta Gastronomia", img: "👨‍🍳" },
    { name: "Fitness", img: "🥗" }
  ];

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

  useEffect(() => {
    const saved = localStorage.getItem("carrinho");
    if (saved) setCart(JSON.parse(saved));

    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserProfile({ uid: user.uid, ...snap.data() });
    });

    return () => unsub();
  }, [user]);

  const prepararAdicao = (e, p) => {
    soundManager.play("click");

    if (!p.restaurantId) {
      console.error("Produto sem restaurantId:", p);
      return;
    }

    const idNoCarrinho = cart.length > 0 ? String(cart[0].restaurantId) : null;
    const idNovoItem = String(p.restaurantId);

    if (idNoCarrinho && idNoCarrinho !== idNovoItem) {
      setItemPendente({ e, p });
      setMostrarPopup(true);
    } else {
      executarVoo(e, p);
    }
  };

  const executarVoo = (e, p, isRestart = false) => {
    soundManager.play("add");

    const rect = e.target.getBoundingClientRect();
    setAnimatingImg({ src: p.image, top: rect.top, left: rect.left });

    setTimeout(() => {
      setAnimatingImg(null);

      const novoCarrinho = isRestart ? [p] : [...cart, p];

      setCart(novoCarrinho);
      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    }, 800);
  };

  const removerDoCarrinho = (index) => {
    soundManager.play("remove");

    const novo = cart.filter((_, i) => i !== index);
    setCart(novo);
    localStorage.setItem("carrinho", JSON.stringify(novo));

    if (novo.length === 0) setMostrarRevisao(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black text-orange-500 italic uppercase">
        MOGU carregando...
      </div>
    );
  }

  return (
    <main className="relative z-0 min-h-screen bg-white pb-44 font-sans max-w-md mx-auto shadow-2xl border-x border-gray-100 overflow-x-hidden">

      {/* 🔥 POPUP (AGORA NO TOPO DE TUDO) */}
      {mostrarRevisao && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end">
          <div className="bg-white w-full rounded-t-[40px] p-8 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black italic uppercase text-xl text-black">
                Sua Sacola
              </h3>
              <button onClick={() => setMostrarRevisao(false)} className="text-gray-400 font-bold">
                FECHAR
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto mb-6 space-y-4">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-12 h-12 rounded-xl object-cover" />
                    <p className="font-bold text-sm uppercase italic text-black">
                      {item.name}
                    </p>
                  </div>
                  <button onClick={() => removerDoCarrinho(i)} className="text-lg">
                    ❌
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-black text-white p-6 rounded-[25px] font-black uppercase italic shadow-xl"
            >
              Finalizar Pedido ➔
            </button>
          </div>
        </div>
      )}

      <PopupReiniciar
        isOpen={mostrarPopup}
        onClose={() => setMostrarPopup(false)}
        onConfirm={() => {
          soundManager.play("remove");
          localStorage.removeItem("carrinho");
          setCart([]);
          executarVoo(itemPendente.e, itemPendente.p, true);
          setMostrarPopup(false);
        }}
      />

      <HeaderPrincipal user={user} loginGoogle={loginGoogle} router={router} />

      {/* 🔧 IMAGEM ANIMADA (AGORA ABAIXO DO POPUP) */}
      {animatingImg && (
        <img
          src={animatingImg.src}
          className="fixed z-[50] w-12 h-12 rounded-full object-cover animate-fly-to-cart"
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

      <div className="mt-8 px-4">
        <h2 className="text-xs font-black uppercase italic mb-4 text-black text-center">
          🔥 Destaques da Cidade
        </h2>

        <ListaDestaques
          products={products}
          onAdd={prepararAdicao}
          router={router}
          restaurants={restaurants}
        />
      </div>

      <RodapeNav
        saldo={userProfile?.moedas || 0}
        cartCount={cart.length}
        router={{
          ...router,
          push: (path) => {
            if (path === "/checkout") {
              if (cart.length > 0) setMostrarRevisao(true);
            } else {
              router.push(path);
            }
          }
        }}
      />

      <style jsx global>{`
        @keyframes fly {
          0% { transform: scale(1); opacity: 1; }
          100% { top: 90vh; left: 80vw; transform: scale(0.2); opacity: 0; }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .animate-fly-to-cart {
          animation: fly 0.8s ease-in-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </main>
  );
}