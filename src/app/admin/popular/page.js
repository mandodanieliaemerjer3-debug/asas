"use client";

import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase"; 
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function GerenciadorSabores() {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [jsonInput, setJsonInput] = useState("");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const snap = await getDocs(collection(db, "products"));
    setProdutos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  const abrirEditor = (produto) => {
    setProdutoSelecionado(produto);
    // Cria um JSON padrão caso o produto ainda não tenha listaOpcoes
    const estruturaPadrao = produto.listaOpcoes || [
      { nome: "Sabor 1", price: 50, description: "Desc", ativo: true }
    ];
    setJsonInput(JSON.stringify(estruturaPadrao, null, 2));
  };

  const salvarNoFirebase = async () => {
    try {
      const dados = JSON.parse(jsonInput); // Valida se o JSON é válido
      await updateDoc(doc(db, "products", produtoSelecionado.id), {
        listaOpcoes: dados,
        permiteMeioAMeio: true
      });
      alert("Sucesso! Array atualizado.");
      setProdutoSelecionado(null);
      carregarProdutos();
    } catch (e) {
      alert("Erro no JSON: verifique se a formatação está correta.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-6">📦 Produtos: Editar Sabores</h1>
      
      <div className="grid gap-4">
        {produtos.map(p => (
          <button key={p.id} onClick={() => abrirEditor(p)} className="p-4 border rounded text-left hover:bg-gray-50">
            {p.name}
          </button>
        ))}
      </div>

      {produtoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h2 className="font-bold mb-4">Editando: {produtoSelecionado.name}</h2>
            <textarea 
              className="w-full h-64 border p-2 font-mono text-sm"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setProdutoSelecionado(null)} className="flex-1 p-2 bg-gray-200">Cancelar</button>
              <button onClick={salvarNoFirebase} className="flex-1 p-2 bg-black text-white">Salvar JSON</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}