"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PaginaPagamento() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [metodo, setMetodo] = useState("pix");
  const [usarMoedas, setUsarMoedas] = useState(false);
  const [dadosFinanceiros, setDadosFinanceiros] = useState({
    totalOriginal: 0,
    cashbackDisponivel: 0
  });

  const [criando, setCriando] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      const savedPre = JSON.parse(localStorage.getItem("pre_checkout") || "{}");
      const totalOriginal =
        (savedPre.freteFinal || 0) + (savedPre.totalProdutos || 0);

      let cashback = 0;
      if (user) {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        if (uSnap.exists()) {
          cashback = uSnap.data().recompensa?.moedasCashback || 0;
        }
      }

      setDadosFinanceiros({
        totalOriginal,
        cashbackDisponivel: cashback
      });
    };

    carregarDados();
  }, [user]);

  const valorFinal = usarMoedas
    ? Math.max(
        dadosFinanceiros.totalOriginal - dadosFinanceiros.cashbackDisponivel,
        0
      )
    : dadosFinanceiros.totalOriginal;

  const confirmarPedido = async () => {
    if (!user || criando) return;

    setCriando(true);

    try {
      const dadosPre = JSON.parse(
        localStorage.getItem("pre_checkout") || "{}"
      );

      const carrinho = JSON.parse(
        localStorage.getItem("carrinho") || "[]"
      );

      const docRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        itens: carrinho,

        status: metodo === "pix" ? "aguardando_pix" : "confirmado",

        metodoPagamento: metodo,

        dataCriacao: serverTimestamp(),

        linhaId: dadosPre.bairro?.linhaId || "geral",

        rankEntrega:
          dadosPre.bairro?.tipo === "offroad"
            ? "Off-Road Root"
            : "Asfalto Zero",

        valores: {
          subtotal: Number(dadosPre.totalProdutos) || 0,
          taxaEntrega: Number(dadosPre.freteFinal) || 0,
          totalOriginal: Number(dadosFinanceiros.totalOriginal) || 0,
          totalFinal: Number(valorFinal) || 0,
          usouMoedas: usarMoedas
        },

        endereco: {
          rua: dadosPre.rua || "Não informada",
          numero: dadosPre.numero || "S/N",
          bairro: dadosPre.bairro?.name || "Não informado"
        }
      });

      if (metodo === "pix") {
        router.push(`/checkout/pix?orderId=${docRef.id}`);
      } else {
        router.push(`/checkout/sucesso?orderId=${docRef.id}`);
      }

    } catch (e) {
      console.error("Erro ao criar pedido:", e);
      alert("Erro ao criar pedido.");
    } finally {
      setCriando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans max-w-md mx-auto shadow-2xl">
      <header className="p-8 text-center bg-white rounded-b-[45px] shadow-sm mb-6">
        <h1 className="text-xl font-black italic uppercase text-zinc-900">
          Forma de Pagamento
        </h1>
      </header>

      <div className="px-6 space-y-3 flex-1">
        {["PIX", "DINHEIRO", "CARTÃO (MAQUININHA)"].map((op) => (
          <button
            key={op}
            onClick={() => setMetodo(op.toLowerCase())}
            className={`w-full p-6 rounded-[30px] font-black italic uppercase text-sm transition-all border-2 ${
              metodo === op.toLowerCase()
                ? "border-red-600 bg-white text-red-600 shadow-lg shadow-red-50"
                : "border-transparent bg-white text-zinc-300"
            }`}
          >
            {op}
          </button>
        ))}

        <div
          className={`p-6 rounded-[35px] border-2 transition-all mt-6 ${
            usarMoedas
              ? "border-yellow-400 bg-yellow-50"
              : "border-transparent bg-zinc-100 opacity-60"
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-black uppercase text-yellow-700">
              Usar Saldo de Moedas
            </p>
            <input
              type="checkbox"
              checked={usarMoedas}
              onChange={() => setUsarMoedas(!usarMoedas)}
              className="w-5 h-5 accent-yellow-600"
            />
          </div>
          <p className="text-sm font-black text-yellow-900">
            🪙 {dadosFinanceiros.cashbackDisponivel} disponíveis
          </p>
        </div>

        <div className="mt-10 bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">
            Valor Final
          </p>
          <h2 className="text-4xl font-black italic">
            R$ {valorFinal.toFixed(2)}
          </h2>

          {usarMoedas && (
            <p className="text-[9px] text-green-400 font-bold uppercase mt-2 italic">
              Desconto de moedas aplicado!
            </p>
          )}
        </div>
      </div>

      <footer className="p-6 pb-12">
        <button
          onClick={confirmarPedido}
          disabled={criando}
          className="w-full bg-red-600 text-white py-6 rounded-[40px] font-black italic uppercase tracking-widest shadow-xl shadow-red-200 active:scale-95 transition disabled:opacity-50"
        >
          {criando ? "Criando pedido..." : "Confirmar e Pedir ➔"}
        </button>
      </footer>
    </main>
  );
}