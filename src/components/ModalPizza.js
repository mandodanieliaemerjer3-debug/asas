"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export default function ModalPizza({ produto, onClose, onConfirm }) {
  // Estrutura: Sabores dentro de listaOpcoes.listaOpcoes
  const listaSabores = produto?.listaOpcoes?.listaOpcoes || [];
  const bordas = produto?.listaOpcoes?.bordasDisponiveis || [];
  const limiteSabores = produto?.listaOpcoes?.configuracao?.limiteSabores || 1;
  
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [bordaSelecionada, setBordaSelecionada] = useState(bordas[0] || null);
  const [ingredientesAtivos, setIngredientesAtivos] = useState({});

  const toggleSabor = (sabor) => {
    const jaExiste = saboresSelecionados.find((s) => s.nome === sabor.nome);
    
    if (jaExiste) {
      setSaboresSelecionados(prev => prev.filter(s => s.nome !== sabor.nome));
    } else {
      if (saboresSelecionados.length >= limiteSabores) return alert(`Limite de ${limiteSabores} sabor(es) atingido.`);
      setSaboresSelecionados(prev => [...prev, sabor]);
      
      // Inicializa ingredientes deste sabor
      const novoEstado = { ...ingredientesAtivos };
      (sabor.ingredientesPadrao || []).forEach(ing => {
        novoEstado[`${sabor.nome}-${ing}`] = true;
      });
      setIngredientesAtivos(novoEstado);
    }
  };

  const toggleIngrediente = (saborNome, ing) => {
    setIngredientesAtivos(prev => ({ 
      ...prev, 
      [`${saborNome}-${ing}`]: !prev[`${saborNome}-${ing}`] 
    }));
  };

  const confirmar = () => {
    if (saboresSelecionados.length === 0) return alert("Escolha pelo menos um sabor!");
    
    const maiorPreco = Math.max(...saboresSelecionados.map(s => s.price || 0));
    const precoBorda = bordaSelecionada?.price || 0;
    
    const descSabores = saboresSelecionados.map(s => {
      const removidos = (s.ingredientesPadrao || []).filter(ing => !ingredientesAtivos[`${s.nome}-${ing}`]);
      return `${s.nome}${removidos.length > 0 ? ` (Sem ${removidos.join(", ")})` : ""}`;
    }).join(" / ");

    onConfirm({
      ...produto,
      name: `${produto.name} (${saboresSelecionados.map(s => s.nome).join(" & ")})`,
      price: maiorPreco + precoBorda,
      observacaoSabores: `${descSabores} | Borda: ${bordaSelecionada?.nome || "Nenhuma"}`
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* FAIXA DE VÍDEO */}
        <div className="w-full h-24 bg-red-900 overflow-hidden">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
            <source src="/video-pizza.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="p-6 overflow-y-auto">
          <h2 className="font-black text-lg mb-4">{produto.name}</h2>
          
          {/* SELEÇÃO DE SABORES */}
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Selecione até {limiteSabores} sabores:</p>
          <div className="grid gap-2 mb-6">
            {listaSabores.map((s, i) => {
              const selecionado = saboresSelecionados.find(sel => sel.nome === s.nome);
              return (
                <div key={i}>
                  <button onClick={() => toggleSabor(s)} className={`w-full p-3 border-2 rounded-2xl text-left font-bold text-xs transition-all ${selecionado ? 'border-black bg-black text-white' : 'border-gray-100'}`}>
                    {s.nome} - R$ {s.price.toFixed(2)}
                  </button>
                  {selecionado && s.ingredientesPadrao && (
                    <div className="flex flex-wrap gap-1 mt-2 px-1">
                      {s.ingredientesPadrao.map(ing => (
                        <button key={ing} onClick={() => toggleIngrediente(s.nome, ing)} className={`px-2 py-1 rounded-md text-[9px] font-bold ${ingredientesAtivos[`${s.nome}-${ing}`] ? 'bg-gray-200' : 'bg-red-50 text-red-500 line-through'}`}>
                          {ing}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* BORDAS */}
          {bordas.length > 0 && (
            <>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Borda:</p>
              <div className="flex gap-2 mb-6">
                {bordas.map(b => (
                  <button key={b.nome} onClick={() => setBordaSelecionada(b)} className={`px-3 py-2 rounded-xl font-bold text-[10px] border-2 transition-all ${bordaSelecionada?.nome === b.nome ? 'border-black' : 'border-gray-100'}`}>
                    {b.nome} (+R$ {b.price.toFixed(2)})
                  </button>
                ))}
              </div>
            </>
          )}

          <button onClick={confirmar} className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg">
            Adicionar ao Pedido
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}