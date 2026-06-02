"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import soundManager from "../lib/sounds"; //

export default function CarrinhoGlobal() {
  const router = useRouter(); //

  const [cart, setCart] = useState([]); //
  const [mostrar, setMostrar] = useState(false); //

  // Função para carregar o carrinho atualizado do LocalStorage
  const atualizarCarrinhoLocal = () => {
    const saved = localStorage.getItem("carrinho"); //
    if (saved) {
      setCart(JSON.parse(saved)); //
    } else {
      setCart([]); //
    }
  };

  useEffect(() => {
    atualizarCarrinhoLocal(); //
    
    // Escuta atualizações do carrinho vindas de outras páginas/componentes
    window.addEventListener("storage", atualizarCarrinhoLocal); //
    const interval = setInterval(atualizarCarrinhoLocal, 1000); // Garante sincronia rápida
    
    return () => {
      window.removeEventListener("storage", atualizarCarrinhoLocal); //
      clearInterval(interval); //
    };
  }, []);

  const remover = (index) => {
    soundManager.play("remove"); //

    const novo = cart.filter((_, i) => i !== index); //
    setCart(novo); //
    localStorage.setItem("carrinho", JSON.stringify(novo)); //

    if (novo.length === 0) setMostrar(false); //
  };

  return (
    <>
      {/* BOTÃO FLUTUANTE DE SACOLA - z- garante visibilidade na listagem comum */}
      {cart.length > 0 && (
        <button
          onClick={() => setMostrar(true)} //
          className="fixed bottom-24 right-4 z- bg-black text-white px-5 py-3 rounded-2xl font-black shadow-xl uppercase italic text-xs tracking-wider animate-bounce"
        >
          🍔 Sacola ({cart.length}) {/* */}
        </button>
      )}

      {/* POPUP DA SACOLA - z- para sobrepor tudo na hora do checkout manual */}
      {mostrar && (
        <div className="fixed inset-0 z- bg-black/70 flex items-end backdrop-blur-sm"> {/* */}
          <div className="absolute inset-0" onClick={() => setMostrar(false)}></div> {/* */}
          
          <div className="bg-white text-black w-full rounded-t-[40px] p-6 relative z-10 max-h-[80vh] flex flex-col justify-between"> {/* */}
            
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <h2 className="font-black uppercase italic text-lg">Sua Sacola</h2> {/* */}
                <button 
                  onClick={() => setMostrar(false)} //
                  className="w-8 h-8 bg-gray-100 rounded-full font-bold text-gray-500 text-sm flex items-center justify-center" //
                >
                  ✕
                </button>
              </div>

              {/* LISTA DE ITENS DENTRO DA SACOLA */}
              <div className="overflow-y-auto max-h-[45vh] space-y-3 pr-1"> {/* */}
                {cart.map((item, i) => ( //
                  <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded-2xl bg-gray-50/50"> {/* */}
                    <div className="flex-1 pr-3">
                      <span className="font-black text-xs block text-gray-800 leading-tight">{item.name}</span> {/* */}
                      {item.escolhasAjustadas && ( //
                        <span className="text-[10px] text-red-600 font-bold block mt-0.5">
                          ✓ {item.escolhasAjustadas.join(", ")} {/* */}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xs text-emerald-600 font-mono">
                        R$ {item.price?.toFixed(2)} {/* */}
                      </span>
                      <button 
                        onClick={() => remover(i)} //
                        className="w-6 h-6 bg-red-50 text-red-500 rounded-lg flex items-center justify-center text-xs hover:bg-red-100 transition-all" //
                      >
                        ❌ {/* */}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTÃO IR PARA O PAGAMENTO */}
            <div className="mt-6 border-t border-gray-100 pt-4"> {/* */}
              <button
                onClick={() => {
                  setMostrar(false); //
                  router.push("/checkout"); //
                }}
                className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase italic text-xs tracking-wider shadow-xl hover:bg-gray-900 transition-all text-center block" //
              >
                Fechar Pedido e Pagar ➔
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}