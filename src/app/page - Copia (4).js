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

// 🔥 NOVO COMPONENTE GLOBAL
import CarrinhoGlobal from "../components/CarrinhoGlobal"; 

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

  useEffect(() => {
    // 1. MANTÉM OS RESTAURANTES NO FIREBASE
    const unsubRes = onSnapshot(collection(db, "restaurants"), (snapshot) => {
      setRestaurants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
    });

    // 2. MANTÉM AS NOTAS E ANÚNCIOS NO FIREBASE
    const unsubNotas = onSnapshot(collection(db, "notas_anuncios"), (snapshot) => {
      setNotas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
    });

    // 3. BUSCA SOMENTE OS PRODUTOS DO JSON (COM FILTROS CORRIGIDOS)
    async function carregarProdutosDoJson() {
      try {
        const resposta = await fetch("/catalogo.json");
        const dados = await resposta.json();

        let todosOsProdutos = [];

        dados.restaurantes.forEach((restaurante) => {
          if (restaurante.produtos) {
            const produtosFormatados = restaurante.produtos.map(produto => {
              
              // Tratamento da imagem
              let caminhoImagem = produto.img || produto.image;
              if (caminhoImagem && !caminhoImagem.startsWith('http')) {
                caminhoImagem = `/produtos/${caminhoImagem}`;
              }

              // 🔥 LÓGICA DE DETECÇÃO DE CATEGORIA PARA O FILTRO FUNCIONAR
              let categoriaDetectada = "";
              const tagsTexto = produto.t || "";

              if (produto.pizza || tagsTexto.includes("pizza")) {
                categoriaDetectada = "pizza";
              } else if (produto.burguer || tagsTexto.includes("lanche") || tagsTexto.includes("hamburguer")) {
                categoriaDetectada = "lanche";
              } else if (tagsTexto.includes("marmita") || tagsTexto.includes("almoco")) {
                categoriaDetectada = "marmita";
              }

              // Mapeia os dados do JSON para o formato completo que o componente espera
              return {
                ...produto,
                name: produto.n || produto.name,
                description: produto.d || produto.description,
                price: produto.p || produto.price,
                image: caminhoImagem,
                restaurantId: restaurante.id,
                
                // Injeta os campos padronizados de categoria e tags
                category: categoriaDetectada,
                categoria: categoriaDetectada,
                tags: tagsTexto
              };
            });
            
            todosOsProdutos = [...todosOsProdutos, ...produtosFormatados];
          }
        });

        setProducts(todosOsProdutos);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar os produtos do JSON:", error);
        setLoading(false);
      }
    }

    carregarProdutosDoJson();

    return () => {
      unsubRes(); 
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

  // 🔥 LÓGICA INTELIGENTE AJUSTADA COM TRAVA DE SABORES
  const prepararAdicao = (e, p) => {
    soundManager.play("click"); 

    if (!p.restaurantId) {
      console.error("Produto sem restaurantId:", p); 
      return; 
    }

    // 🛑 SE O PRODUTO EXIGE SELEÇÃO DE SABOR:
    if (p.forma === "selecao_sabor") {
      localStorage.setItem("produto_pendente_sabor", JSON.stringify(p));
      router.push(`/restaurante/${p.restaurantId}`);
      return;
    }

    const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho") || "[]"); 

    // 🟢 PRIMEIRO ITEM COMUM → ADD + REDIRECIONA PRO RESTAURANTE
    if (carrinhoAtual.length === 0) {
      executarVoo(e, p, true); 

      setTimeout(() => {
        router.push(`/restaurante/${p.restaurantId}`); 
      }, 800); 

      return; 
    }

    const idNoCarrinho = String(carrinhoAtual[0]?.restaurantId || carrinhoAtual.restaurantId); 
    const idNovoItem = String(p.restaurantId); 

    // 🔴 RESTAURANTE DIFERENTE
    if (idNoCarrinho !== idNovoItem) {
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

      const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho") || "[]"); 
      const novoCarrinho = isRestart ? [p] : [...carrinhoAtual, p]; 

      setCart(novoCarrinho); 
      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho)); 
    }, 800); 
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

      {/* 🔥 POPUP TROCA DE RESTAURANTE */}
      <PopupReiniciar
        isOpen={mostrarPopup} 
        onClose={() => setMostrarPopup(false)} 
        onConfirm={() => {
          soundManager.play("remove"); 
          
          if (itemPendente.p.forma === "selecao_sabor") {
            localStorage.removeItem("carrinho");
            setCart([]);
            localStorage.setItem("produto_pendente_sabor", JSON.stringify(itemPendente.p));
            router.push(`/restaurante/${itemPendente.p.restaurantId}`);
          } else {
            localStorage.removeItem("carrinho"); 
            setCart([]); 
            executarVoo(itemPendente.e, itemPendente.p, true); 

            setTimeout(() => {
              router.push(`/restaurante/${itemPendente.p.restaurantId}`); 
            }, 800); 
          }

          setMostrarPopup(false); 
        }}
      />

      <HeaderPrincipal user={user} loginGoogle={loginGoogle} router={router} /> 

      {/* 🔧 ANIMAÇÃO */}
      {animatingImg && (
        <img
          src={animatingImg.src} 
          className="fixed z-50 w-12 h-12 rounded-full object-cover animate-fly-to-cart" 
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
        router={router} 
      />

      {/* 🔥 CARRINHO GLOBAL */}
      <CarrinhoGlobal /> 

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