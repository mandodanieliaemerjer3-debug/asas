"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function DocesClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [doces, setDoces] = useState([]);
  const [moedasUser, setMoedasUser] = useState(0);
  const [creditoExtra, setCreditoExtra] = useState(0);
  const [carrinhoDoces, setCarrinhoDoces] = useState([]);

  useEffect(() => {
    const carregar = async () => {
      try {
        const snap = await getDocs(collection(db, "doces"));
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDoces(lista);

        if (user) {
          setMoedasUser(user.moedas || 0);
        }

        const credito = Number(searchParams.get("credito")) || 0;
        setCreditoExtra(credito);

        const saved = localStorage.getItem("docesCarrinho");
        if (saved) setCarrinhoDoces(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };

    carregar();
  }, [user, searchParams]);

  const totalDisponivel = moedasUser + creditoExtra;

  const totalCarrinho = carrinhoDoces.reduce(
    (acc, item) => acc + item.preco,
    0
  );

  const adicionarDoce = (doce) => {
    const novoTotal = totalCarrinho + doce.preco;

    if (novoTotal > totalDisponivel) {
      alert("Sem moedas suficientes");
      return;
    }

    const novoCarrinho = [...carrinhoDoces, doce];
    setCarrinhoDoces(novoCarrinho);
    localStorage.setItem("docesCarrinho", JSON.stringify(novoCarrinho));
  };

  const finalizar = () => {
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-pink-50 max-w-md mx-auto p-4 pb-32">
      <h1 className="text-2xl font-black mb-4">🍬 Loja de Doces</h1>

      <div className="bg-white p-4 rounded-2xl mb-4 shadow">
        <p className="font-bold text-pink-600">
          💰 Disponível: {totalDisponivel} moedas
        </p>
        <p className="text-xs text-zinc-500">
          (Inclui crédito do frete)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {doces.map((doce) => (
          <div key={doce.id} className="bg-white p-3 rounded-2xl shadow">
            {doce.imagem && (
              <img
                src={doce.imagem}
                className="w-full h-24 object-cover rounded-xl mb-2"
              />
            )}

            <h2 className="font-bold text-sm">{doce.nome}</h2>

            <p className="text-xs text-zinc-500 mb-2">
              {doce.descricao}
            </p>

            <p className="font-black text-pink-600 mb-2">
              {doce.preco} moedas
            </p>

            <button
              onClick={() => adicionarDoce(doce)}
              className="w-full bg-pink-500 text-white p-2 rounded-xl text-sm font-bold"
            >
              Adicionar
            </button>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white max-w-md mx-auto">
        <div className="flex justify-between mb-2 font-bold">
          <span>Total:</span>
          <span>{totalCarrinho} moedas</span>
        </div>

        <button
          onClick={finalizar}
          className="w-full bg-black text-white p-4 rounded-2xl font-black"
        >
          Continuar Pedido ➔
        </button>
      </div>
    </div>
  );
}