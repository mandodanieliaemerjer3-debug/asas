"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Simulando a base de dados de comidas (você pode carregar do seu comidas.json)
const COMIDAS_MOCK = [
  { id: 1, restaurantId: "rest_1", name: "X-Burger Artesanal", price: 28.9, category: "Lanches", image: "🍔" },
  { id: 2, restaurantId: "rest_1", name: "Batata Suprema", price: 15.0, category: "Acompanhamentos", image: "🍟" },
  { id: 3, restaurantId: "rest_2", name: "Pizza Calabresa", price: 45.0, category: "Pizzas", image: "🍕" },
  { id: 4, restaurantId: "rest_especial", name: "Bolo de Festa G", price: 120.0, category: "Festas", requiresCar: true, image: "🎂" }
];

export default function CardapioCliente({ params }) {
  const router = useRouter();
  const { id } = params; // ID do restaurante vindo da URL
  const [itensRestaurante, setItensRestaurante] = useState([]);
  const [carrinho, setCarrinho] = useState([]);

  useEffect(() => {
    // Filtra os itens que pertencem a este restaurante específico
    const filtrados = COMIDAS_MOCK.filter(item => item.restaurantId === id);
    setItensRestaurante(filtrados);

    // Carrega carrinho existente
    const salvo = localStorage.getItem("carrinho");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, [id]);

  const adicionarAoCarrinho = (item) => {
    const novoCarrinho = [...carrinho, item];
    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    alert(`${item.name} adicionado! 😋`);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-32 font-sans max-w-md mx-auto border-x border-gray-100">
      {/* HEADER DO RESTAURANTE */}
      <header className="bg-white p-6 rounded-b-[40px] shadow-sm mb-6">
        <button onClick={() => router.push("/")} className="text-gray-400 font-black mb-4">← VOLTAR</button>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Cardápio Digital</h1>
        <p className="text-[10px] font-bold text-orange-600 uppercase italic">Restaurante: {id}</p>
      </header>

      {/* LISTA DE PRODUTOS */}
      <div className="px-4 space-y-4">
        {itensRestaurante.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-[30px] shadow-sm flex items-center gap-4 border border-gray-50">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">
              {item.image}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase italic leading-none">{item.name}</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{item.category}</p>
              <p className="text-sm font-black text-green-600 mt-2">R$ {item.price.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => adicionarAoCarrinho(item)}
              className="bg-red-600 text-white w-10 h-10 rounded-full font-black text-xl shadow-lg active:scale-90 transition"
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* BOTÃO FLUTUANTE DO CARRINHO */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-[400px] mx-auto">
          <button 
            onClick={() => router.push("/checkout")}
            className="w-full bg-black text-white py-5 rounded-[25px] font-black uppercase italic shadow-2xl flex justify-between px-8 items-center border-2 border-white/20"
          >
            <span>Ver Sacola ({carrinho.length})</span>
            <span>Ir para Checkout →</span>
          </button>
        </div>
      )}
    </main>
  );
}