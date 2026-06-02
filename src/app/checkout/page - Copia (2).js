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

// 🔥 COMPONENTE GLOBAL
import CarrinhoGlobal from "../components/CarrinhoGlobal"; 

export default function Home() {
  const { user, loginGoogle } = useAuth(); 
  const router = useRouter(); 

  const [restaurants, setRestaurants] = useState([]); 
  const [products, setProducts] = useState([]); 
  const [notas, setNotas] = useState([]); 
  const [userProfile, setUserProfile] = useState(null); 
  const [cart, setCart] = useState([]); 

  // Estados do Popup de Reinício de Sacola
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [itemPendente, setItemPendente] = useState(null);
  const [animatingImg, setAnimatingImg] = useState(null);

  // Categorias fixas para os filtros rápidos
  const categoriasEspeciais = [
    { id: "all", label: "Tudo", icon: "🍽️" },
    { id: "burgers", label: "Burgers", icon: "🍔" },
    { id: "pizza", label: "Pizzas", icon: "🍕" },
    { id: "sushi", label: "Japa", icon: "🍣" },
    { id: "doces", label: "Doces", icon: "🍰" },
    { id: "drinks", label: "Bebidas", icon: "🥤" },
  ];

  // 1. Escuta em tempo real os restaurantes e produtos do Firestore
  useEffect(() => {
    const unsubRest = onSnapshot(collection(db, "restaurants"), (snap) => {
      setRestaurants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubProd = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubNotas = onSnapshot(collection(db, "notas_comunidade"), (snap) => {
      setNotas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubRest();
      unsubProd();
      unsubNotas();
    };
  }, []);

  // 2. Escuta dados do perfil do utilizador (Moedas/Cashback)
  useEffect(() => {
    if (!user?.uid) return;
    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });
    return () => unsubProfile();
  }, [user]);

  // 3. Sincronização do Contador do Carrinho local
  useEffect(() => {
    const carregarContador = () => {
      const saved = localStorage.getItem("carrinho");
      setCart(saved ? JSON.parse(saved) : []);
    };
    carregarContador();
    const interval = setInterval(carregarContador, 1000);
    return () => clearInterval(interval);
  }, []);

  // 4. Intercetor do Botão de Adição (Validação Protetiva)
  const prepararAdicao = (e, p) => {
    const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho") || "[]");

    // 🔴 CORREÇÃO: Acede ao restaurante de dentro do primeiro item real contido no array
    const idNoCarrinho = carrinhoAtual.length > 0 ? String(carrinhoAtual[0].restaurantId) : null;
    const idNovoItem = String(p.restaurantId);

    // RESTAURANTE DIFERENTE? Dispara o popup protetivo
    if (idNoCarrinho && idNoCarrinho !== idNovoItem) {
      setItemPendente({ e, p });
      setMostrarPopup(true);
    } else {
      executarVoo(e, p);
    }
  };

  // 5. Executa a animação de voo e adiciona o produto à sacola
  const executarVoo = (e, p) => {
    soundManager.play("add");

    const rect = e.target.getBoundingClientRect();
    setAnimatingImg({
      src: p.imagem,
      top: rect.top,
      left: rect.left
    });

    setTimeout(() => setAnimatingImg(null), 900);

    const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho") || "[]");
    const novoCarrinho = [...carrinhoAtual, { ...p, idUnico: Math.random().toString(36) }];
    
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    setCart(novoCarrinho);
  };

  // 6. Confirmação do Popup: Limpa a sacola antiga e força a entrada no novo restaurante
  const confirmarReiniciarSacola = () => {
    if (!itemPendente) return;
    localStorage.removeItem("carrinho"); // Reseta o storage de comida
    setMostrarPopup(false);
    executarVoo(itemPendente.e, itemPendente.p);
    setItemPendente(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-28 text-zinc-900 font-sans antialiased">
      
      {/* CABEÇALHO */}
      <HeaderPrincipal user={user} onLogin={loginGoogle} />

      {/* COMPONENTE DE FILAS ATIVAS */}
      <GerenciadorFilas user={user} />

      {/* POPUP DE VALIDAÇÃO DE RESTAURANTE DIFERENTE */}
      {mostrarPopup && (
        <PopupReiniciar
          onClose={() => {
            setMostrarPopup(false);
            setItemPendente(null);
          }}
          onConfirm={confirmarReiniciarSacola}
        />
      )}

      {/* 🔧 ANIMAÇÃO DE VOO DO PRODUTO */}
      {animatingImg && (
        <img
          src={animatingImg.src}
          className="fixed z-50 w-12 h-12 rounded-full object-cover animate-fly-to-cart"
          style={{ top: animatingImg.top, left: animatingImg.left }}
          alt="fly"
        />
      )}

      {/* SELECÇÃO DE RESTAURANTES */}
      <GerenciadorRestaurantes restaurants={restaurants} router={router} /> 

      {/* CARROSSEL DE BANNERS E CATEGORIAS */}
      <BannerPromocional
        bannersData={bannersData.home || []} 
        categorias={categoriasEspeciais} 
        router={router} 
      />

      {/* DESTAQUES DA CIDADE */}
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

      {/* NAVEGAÇÃO DO RODAPÉ */}
      <RodapeNav
        saldo={userProfile?.moedas || 0} 
        cartCount={cart.length} 
        router={router} 
      />

      {/* SACCOLA FLUTUANTE GLOBAL */}
      <CarrinhoGlobal /> 

      <style jsx global>{`
        @keyframes fly {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.9; }
          100% { top: 90vh; left: 50vw; transform: scale(0.2); opacity: 0; }
        }
        .animate-fly-to-cart {
          animation: fly 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}