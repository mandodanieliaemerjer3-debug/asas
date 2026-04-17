"use client";
import { useState, useEffect } from "react";

export default function GerenciadorRestaurantes({ restaurants = [], router }) {
  const [listaOrdenada, setListaOrdenada] = useState([]);

  useEffect(() => {
    const agora = new Date();
    const hora = agora.getHours();

    // Lógica de Ordenação Inteligente
    const ordenados = [...restaurants].sort((a, b) => {
      // Prioridade 1: Aberto antes de Fechado
      const statusA = a.aberto !== false ? 1 : 0;
      const statusB = b.aberto !== false ? 1 : 0;
      if (statusA !== statusB) return statusB - statusA;

      // Prioridade 2: Horário (Almoço antes das 14h)
      if (hora < 14) {
        if (a.category === "Almoço" && b.category !== "Almoço") return -1;
      }
      return 0;
    });

    setListaOrdenada(ordenados);
  }, [restaurants]);

  return (
    <section className="mt-4 px-4">
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {listaOrdenada.map((res) => {
          const isAberto = res.aberto !== false; 

          return (
            <div 
              key={res.id} 
              // REDIRECIONAMENTO PARA A PÁGINA DO RESTAURANTE
              onClick={() => isAberto && router.push(`/restaurante/${res.id}`)} 
              className={`flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all ${!isAberto ? 'opacity-40 grayscale' : 'active:scale-90'}`}
            >
              <div className="relative w-20 h-20">
                {/* FOTO DO ESTABELECIMENTO (EM VEZ DE LOGO) */}
                <div className="w-full h-full bg-gray-100 rounded-full border-[3px] border-white shadow-lg overflow-hidden">
                  <img 
                    src={res.logo} // Aqui deve estar o caminho da foto da fachada/interior
                    className="w-full h-full object-cover" 
                    alt={res.name} 
                  />
                </div>
                
                {/* Selo de Fechado */}
                {!isAberto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                    <span className="text-[7px] font-black text-white uppercase italic bg-black/60 px-2 py-1 rounded-md">Fechado</span>
                  </div>
                )}
                
                {/* Indicador de Aberto (Ponto Verde) */}
                {isAberto && (
                  <div className="absolute -bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                )}
              </div>

              <span className="text-[9px] font-black uppercase text-gray-800 italic tracking-tighter text-center w-20 truncate">
                {res.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}