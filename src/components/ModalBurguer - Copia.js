"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export default function ModalBurguer({ produto, onClose, onConfirm }) {
  const listaSabores = Array.isArray(produto?.listaOpcoes?.listaOpcoes) ? produto.listaOpcoes.listaOpcoes : [];
  const adicionais = Array.isArray(produto?.adicionais) ? produto.adicionais : [];
  
  const [saborSelecionado, setSaborSelecionado] = useState(null);
  const [ingredientesAtivos, setIngredientesAtivos] = useState({});
  const [adicionaisEscolhidos, setAdicionaisEscolhidos] = useState([]);

  const selecionarSabor = (sabor) => {
    setSaborSelecionado(sabor);
    const estadoIng = {};
    (sabor.ingredientesPadrao || []).forEach(ing => estadoIng[ing] = true);
    setIngredientesAtivos(estadoIng);
  };

  const toggleIngrediente = (ing) => setIngredientesAtivos(prev => ({ ...prev, [ing]: !prev[ing] }));

  const toggleAdicional = (add) => {
    setAdicionaisEscolhidos(prev => 
      prev.find(a => a.nome === add.nome) 
        ? prev.filter(a => a.nome !== add.nome) 
        : [...prev, add]
    );
  };

  const confirmar = () => {
    if (!saborSelecionado) return alert("Escolha um sabor!");
    
    const removidos = (saborSelecionado.ingredientesPadrao || []).filter(ing => !ingredientesAtivos[ing]);
    const precoAdicionais = adicionaisEscolhidos.reduce((acc, curr) => acc + curr.price, 0);
    
    onConfirm({
      ...produto,
      name: `${produto.name} (${saborSelecionado.nome})`,
      price: saborSelecionado.price + precoAdicionais,
      observacaoSabores: `${saborSelecionado.nome} | Sem: ${removidos.join(", ")} | Adds: ${adicionaisEscolhidos.map(a => a.nome).join(", ")}`
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* FAIXA DO VÍDEO */}
        <div className="w-full h-24 bg-gray-900 overflow-hidden">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
            <source src="/video-burguer.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="p-6 overflow-y-auto">
          <h2 className="font-black text-lg">{produto.name}</h2>
          
          {!saborSelecionado ? (
            <div className="grid gap-2 mt-4">
              {listaSabores.map((s, i) => (
                <button key={i} onClick={() => selecionarSabor(s)} className="p-3 border rounded-2xl text-xs font-bold text-left">{s.nome} (+R$ {s.price})</button>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mt-4">Retirar (Ingredientes):</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {saborSelecionado.ingredientesPadrao?.map(ing => (
                  <button key={ing} onClick={() => toggleIngrediente(ing)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${ingredientesAtivos[ing] ? 'bg-black text-white' : 'bg-red-50 text-red-500 line-through'}`}>{ing}</button>
                ))}
              </div>

              <p className="text-[10px] uppercase font-bold text-gray-400 mt-6">Adicionar (Pagos):</p>
              <div className="grid gap-2 mt-2">
                {adicionais.map(add => (
                  <button key={add.nome} onClick={() => toggleAdicional(add)} className={`p-2 border rounded-xl flex justify-between text-[10px] font-bold ${adicionaisEscolhidos.find(a => a.nome === add.nome) ? 'bg-black text-white' : ''}`}>
                    <span>{add.nome}</span> <span>+R$ {add.price}</span>
                  </button>
                ))}
              </div>

              <button onClick={confirmar} className="w-full mt-6 bg-black text-white py-4 rounded-2xl font-black text-xs uppercase">Adicionar ao Carrinho</button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}