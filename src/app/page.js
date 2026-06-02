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
import CarrinhoGlobal from "../components/CarrinhoGlobal"; 

export default function Home() {
  const { user, loginGoogle } = useAuth(); 
  const router = useRouter(); 

  const [restaurants, setRestaurants] = useState([]); 
  const [products, setProducts] = useState([]); 
  const [cart, setCart] = useState([]); 
  const [userProfile, setUserProfile] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [animatingImg, setAnimatingImg] = useState(null); 
  const [mostrarPopup, setMostrarPopup] = useState(false); 
  const [itemPendente, setItemPendente] = useState(null); 

  useEffect(() => {
    const unsubRes = onSnapshot(collection(db, "restaurants"), (snapshot) => {
      setRestaurants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
    });

    async function carregarProdutosDoJson() {
      try {
        const resposta = await fetch("/catalogo.json");
        const dados = await resposta.json();
        let todosOsProdutos = [];

        dados.restaurantes.forEach((restaurante) => {
          if (restaurante.produtos) {
            const produtosFormatados = restaurante.produtos.map(produto => {
              let caminhoImagem = produto.img || produto.image;
              if (caminhoImagem && !caminhoImagem.startsWith('http')) caminhoImagem = `/produtos/${caminhoImagem}`;
              
              let categoriaDetectada = "";
              const tagsTexto = produto.t || "";
              if (produto.pizza || tagsTexto.includes("pizza")) categoriaDetectada = "pizza";
              else if (produto.burguer || tagsTexto.includes("lanche") || tagsTexto.includes("hamburguer")) categoriaDetectada = "lanche";
              else if (tagsTexto.includes("marmita") || tagsTexto.includes("almoco")) categoriaDetectada = "marmita";

              return { ...produto, name: produto.n || produto.name, description: produto.d || produto.description, price: produto.p || produto.price, image: caminhoImagem, restaurantId: restaurante.id, category: categoriaDetectada, tags: tagsTexto };
            });
            todosOsProdutos = [...todosOsProdutos, ...produtosFormatados];
          }
        });
        setProducts(todosOsProdutos);
        setLoading(false);
      } catch (error) { console.error(error); setLoading(false); }
    }
    carregarProdutosDoJson();
    return () => unsubRes(); 
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

  // 🔥 LÓGICA DE TRANSIÇÃO INTELIGENTE
  const prepararAdicao = (e, p) => {
    soundManager.play("click"); 

    // 1. SE EXIGE SELEÇÃO (MODAL), APENAS RESERVA E VAI PARA O RESTAURANTE
    if (p.forma === "selecao_sabor" || p.category === "lanche" || p.category === "pizza" || p.category === "marmita" || p.category === "sorvete") {
      sessionStorage.setItem("produto_pendente_configuracao", JSON.stringify(p));
      router.push(`/restaurante/${p.restaurantId}`);
      return;
    }

    // 2. SE É PRODUTO SIMPLES (ADD DIRETO)
    const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho") || "[]"); 
    const idNoCarrinho = String(carrinhoAtual[0]?.restaurantId || ""); 

    if (carrinhoAtual.length > 0 && idNoCarrinho !== String(p.restaurantId)) {
      setItemPendente({ e, p }); 
      setMostrarPopup(true); 
    } else {
      executarVoo(e, p); 
      setTimeout(() => router.push(`/restaurante/${p.restaurantId}`), 800); 
    }
  };

  const executarVoo = (e, p, isRestart = false) => {
    soundManager.play("add"); 
    const rect = e.target.getBoundingClientRect(); 
    setAnimatingImg({ src: p.image, top: rect.top, left: rect.left }); 
    setTimeout(() => {
      setAnimatingImg(null); 
      const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho") || "[]"); 
      const novoCarrinho = isRestart ? [p] : [...carrinhoAtual, p]; 
      setCart(novoCarrinho); 
      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho)); 
    }, 800); 
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-orange-500 italic uppercase">MOGU carregando...</div>; 

  return (
    <main className="relative z-0 min-h-screen bg-white pb-44 font-sans max-w-md mx-auto shadow-2xl border-x border-gray-100 overflow-x-hidden"> 
      <PopupReiniciar
        isOpen={mostrarPopup} 
        onClose={() => setMostrarPopup(false)} 
        onConfirm={() => {
          localStorage.removeItem("carrinho");
          setCart([]);
          executarVoo(itemPendente.e, itemPendente.p, true);
          setMostrarPopup(false);
          router.push(`/restaurante/${itemPendente.p.restaurantId}`);
        }}
      />
      <HeaderPrincipal user={user} loginGoogle={loginGoogle} router={router} /> 
      {animatingImg && <img src={animatingImg.src} className="fixed z-50 w-12 h-12 rounded-full object-cover animate-fly-to-cart" style={{ top: animatingImg.top, left: animatingImg.left }} alt="fly" />}
      <GerenciadorRestaurantes restaurants={restaurants} router={router} /> 
      <BannerPromocional bannersData={bannersData.home || []} categorias={[]} router={router} />
      <div className="mt-8 px-4">
        <h2 className="text-xs font-black uppercase italic mb-4 text-black text-center">🔥 Destaques da Cidade</h2> 
        <ListaDestaques products={products} onAdd={prepararAdicao} router={router} restaurants={restaurants} />
      </div>
      <RodapeNav saldo={userProfile?.moedas || 0} cartCount={cart.length} router={router} />
      <CarrinhoGlobal /> 
      <style jsx global>{`
        @keyframes fly { 0% { transform: scale(1); opacity: 1; } 100% { top: 90vh; left: 80vw; transform: scale(0.2); opacity: 0; } }
        .animate-fly-to-cart { animation: fly 0.8s ease-in-out forwards; }
      `}</style> 
    </main>
  );
}