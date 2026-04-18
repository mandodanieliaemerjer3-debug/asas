"use client";
import { useState } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function ModalEndereco({ user, aoSalvar }) {
  const [loading, setLoading] = useState(false);
  const [endereco, setEndereco] = useState({
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    referencia: ""
  });

  // Busca automática de endereço pelo CEP
  const buscarCEP = async (cep) => {
    const valor = cep.replace(/\D/g, "");
    setEndereco({ ...endereco, cep: valor });

    if (valor.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${valor}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEndereco(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cep: valor
          }));
        }
      } catch (e) {
        console.error("Erro ao buscar CEP");
      }
    }
  };

  const salvarNoFirebase = async () => {
    if (!endereco.rua || !endereco.numero || !endereco.bairro) {
      alert("Preencha os campos principais!");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        endereco: {
          ...endereco,
          cidade: "Guapiara",
          estado: "SP",
          cadastradoEm: new Date().toISOString()
        }
      });
      aoSalvar(); // Fecha o modal ou segue para os banners
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar endereço.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z- flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="font-black uppercase italic text-2xl text-gray-800 mb-2">Onde entregamos?</h2>
        <p className="text-gray-400 font-bold uppercase text-[10px] mb-6">Mogu Mogu Delivery em Guapiara</p>

        <div className="space-y-4">
          <input 
            type="text" placeholder="CEP (Opcional)"
            value={endereco.cep} onChange={(e) => buscarCEP(e.target.value)}
            className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none focus:border-yellow-400 border-2 border-transparent"
          />
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Rua" value={endereco.rua}
              onChange={(e) => setEndereco({...endereco, rua: e.target.value})}
              className="flex-1 bg-gray-100 p-4 rounded-2xl font-bold outline-none"
            />
            <input 
              type="text" placeholder="Nº" value={endereco.numero}
              onChange={(e) => setEndereco({...endereco, numero: e.target.value})}
              className="w-20 bg-gray-100 p-4 rounded-2xl font-bold outline-none"
            />
          </div>
          <input 
            type="text" placeholder="Bairro" value={endereco.bairro}
            onChange={(e) => setEndereco({...endereco, bairro: e.target.value})}
            className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none"
          />
          <input 
            type="text" placeholder="Ponto de Referência" value={endereco.referencia}
            onChange={(e) => setEndereco({...endereco, referencia: e.target.value})}
            className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none"
          />
        </div>

        <button 
          onClick={salvarNoFirebase}
          disabled={loading}
          className="w-full mt-8 bg-red-600 text-white p-5 rounded-[25px] font-black uppercase italic active:scale-95 transition-all shadow-lg"
        >
          {loading ? "Salvando..." : "Confirmar Endereço"}
        </button>
      </div>
    </div>
  );
}