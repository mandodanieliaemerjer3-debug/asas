"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

// DADOS LOCAIS
import itensEspeciais from "../../data/especiais.json";
import bannersData from "../../data/banners.json";

// COMPONENTES
import BannerCarrossel from "../../components/BannerCarrossel";
import PopupReiniciar from "../../components/PopupReiniciar";
import RodapeNav from "../../components/RodapeNav";

export default function EspeciaisPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Alta Gastronomia");
  const [cart, setCart] = useState([]);
  const [animatingImg, setAnimatingImg] = useState(null);

  // Estados para o Popup
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [itemPendente, setItemPendente] = useState(null);

  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // ==========================================
  // NOVA LÓGICA DE VOO (SAINDO DA IMAGEM)
  // ==========================================
  const prepararAdicao = (event, p) => {
    // Identifica o ID da imagem do produto específico
    const imgElement = document.getElementById(`img-${p.id}`);
    
    if (cart.length > 0 && cart[0].restaurantId !== p.restaurantId) {
      setItemPendente({ imgElement, p });
      setMostrarPopup(true);
    } else {
      executarVoo(imgElement, p);
    }
  };

  const executarVoo = (element, p, isRestart = false) => {
    if (!element) return;

    // Pega a posição exata da imagem grande do produto
    const rect = element.getBoundingClientRect();
    
    setAnimatingImg({ 
      src: p.image, 
      top: rect.top, 
      left: rect.left,
      width: rect.width,
      height: rect.height
    });

    setTimeout(() => {
      setAnimatingImg(null);
      const novoCarrinho = isRestart ? [p] : [...cart, p];
      setCart(novoCarrinho);
      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    }, 900); // Aumento leve no tempo para a imagem chegar lá embaixo
  };

  const produtosFiltrados = itensEspeciais.filter(p => p.category === activeTab);

  return (
    <main className="min-h-screen bg-white pb-44 font-sans max-w-md mx-auto shadow-2xl relative border-x border-gray-100 overflow-x-hidden">
      
      <PopupReiniciar 
        isOpen={mostrarPopup} 
        onClose={() => setMostrarPopup(false)} 
        onConfirm={() => {
          localStorage.removeItem("carrinho");
          setCart([]);
          executarVoo(itemPendente.imgElement, itemPendente.p, true);
          setMostrarPopup(false);
        }}
      />

      {/* ELEMENTO QUE VOA (MELHORADO) */}
      {animatingImg && (
        <img 
          src={animatingImg.src} 
          className="fixed z-[9999] rounded-[28px] object-cover animate-product-fly" 
          style={{ 
            top: animatingImg.top, 
            left: animatingImg.left,
            width: animatingImg.width,
            height: animatingImg.height
          }} 
          alt="fly" 
        />
      )}

      {/* HEADER */}
      <header className="p-4 flex items-center justify-between bg-white/80 sticky top-0 z-30 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-xl font-bold text-gray-800">←</button>
          <h1 className="font-black text-sm italic uppercase text-gray-800">Reservas Premium</h1>
        </div>
        <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full italic">
           🪙 {user ? "150" : "0"}
        </span>
      </header>

      <section className="px-4 mt-4">
         <BannerCarrossel imagens={bannersData[activeTab] || []} />
      </section>

      {/* SELETOR */}
      <div className="mt-6 px-4">
        <div className="grid grid-cols-2 gap-2">
          {["Alta Gastronomia", "Festas", "Bolos", "Fitness"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 rounded-[22px] font-black text-[9px] uppercase border-2 transition-all
                ${activeTab === tab ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <section className="px-4 grid gap-4 mt-8">
        {produtosFiltrados.map(p => (
          <div key={p.id} className="bg-white rounded-[35px] flex gap-4 p-3 border border-gray-100 shadow-sm relative">
             <div className="w-24 h-24 flex-shrink-0">
               {/* ID ÚNICO PARA CAPTURAR A POSIÇÃO DA IMAGEM */}
               <img 
                 id={`img-${p.id}`} 
                 src={p.image} 
                 className="w-full h-full rounded-[28px] object-cover" 
                 alt={p.name} 
               />
             </div>
             <div className="flex-1 flex flex-col justify-between">
                <div>
                   <h3 className="font-black text-[11px] uppercase italic text-gray-800">{p.name}</h3>
                   <p className="text-[9px] text-gray-400 font-bold leading-tight line-clamp-2">{p.description}</p>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-red-600 font-black text-xs italic">R$ {p.price.toFixed(2)}</span>
                   <button 
                     onClick={(e) => prepararAdicao(e, p)}
                     className="bg-black text-white px-5 py-2 rounded-xl font-black text-[8px] uppercase italic active:scale-95 transition"
                   >
                     + Adicionar
                   </button>
                </div>
             </div>
          </div>
        ))}
      </section>

      <RodapeNav saldo={150} cartCount={cart.length} router={router} />

      <style jsx global>{`
        @keyframes productFly {
          0% { transform: scale(1); opacity: 1; }
          40% { transform: scale(1.1) rotate(5deg); opacity: 0.9; }
          100% { 
            top: 92vh; 
            left: 50vw; 
            width: 30px; 
            height: 30px; 
            opacity: 0; 
            transform: scale(0.2) rotate(20deg);
          }
        }
        .animate-product-fly { 
          animation: productFly 0.9s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards; 
          pointer-events: none;
        }
      `}</style>
    </main>
  );
}