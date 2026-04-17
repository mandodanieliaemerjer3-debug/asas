"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { collection, addDoc, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PagamentoFinal() {
  const { user } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [logistica, setLogistica] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarFinal = () => {
      const savedCart = localStorage.getItem("carrinho");
      const savedLog = localStorage.getItem("logistica_final");

      if (!savedCart || !savedLog) {
        router.push("/checkout");
        return;
      }

      setCart(JSON.parse(savedCart));
      setLogistica(JSON.parse(savedLog));
    };
    carregarFinal();
  }, [router]);

  const subtotal = cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0);

  const finalizarTudo = async () => {
    if (!logistica) return;
    setLoading(true);

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const idLinha = String(logistica.bairro.linhaId || logistica.bairro.linhald || "");

      const novoPedido = {
        clienteId: user?.uid || "anonimo",
        clienteNome: user?.displayName || "Cliente Guapiara",
        itens: cart,
        valores: {
          subtotal,
          taxaEntrega: logistica.taxaEntrega,
          total: subtotal + logistica.taxaEntrega
        },
        pesoTotal: logistica.pesoTotal, // ⚖️ Grava o peso para o Operador ver
        formaPagamento,
        rankEntrega: logistica.bairro.level || "Off-Road Root",
        endereco: {
          bairro: logistica.bairro.name,
          bairroId: logistica.bairro.id,
          linhaId: idLinha,
          rua: logistica.rua,
          numero: logistica.numero
        },
        status: "Aguardando Entregador",
        repasseConfirmado: false, // 💰 Trava financeira para o seu Dashboard
        criadoEm: new Date().toISOString()
      };

      // 1. Grava o pedido no banco
      await addDoc(collection(db, "orders"), novoPedido);

      // 2. Atualiza o contador da linha para o próximo cliente (Fila)
      if (idLinha) {
        const linhaRef = doc(db, "linhas_do_dia", `${hoje}_linha_${idLinha}`);
        const linhaSnap = await getDoc(linhaRef);

        if (linhaSnap.exists()) {
          await updateDoc(linhaRef, { pedidosAtivos: linhaSnap.data().pedidosAtivos + 1 });
        } else {
          await setDoc(linhaRef, { data: hoje, linhaId: idLinha, pedidosAtivos: 1 });
        }
      }

      // Limpeza e Sucesso
      localStorage.removeItem("carrinho");
      localStorage.removeItem("logistica_final");
      localStorage.removeItem("pre_checkout");
      
      alert("🚀 Pedido Elite enviado com sucesso!");
      router.push("/");
    } catch (e) {
      alert("Erro ao gravar pedido: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!logistica) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 font-sans max-w-md mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Fase 3: Pagamento</h1>
        <p className="text-[9px] font-bold text-zinc-500 uppercase mt-2">Logística e Valores Confirmados</p>
      </header>

      {/* RESUMO DE VALORES */}
      <div className="bg-white text-black p-8 rounded-[45px] shadow-2xl mb-6">
        <div className="flex justify-between mb-2 opacity-40 font-bold text-[10px] uppercase">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-4 text-blue-600 font-black text-[10px] uppercase italic">
          <span>Frete Inteligente ({logistica.pesoTotal} pts)</span>
          <span>R$ {logistica.taxaEntrega.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-3xl font-black italic">
          <span>TOTAL</span>
          <span>R$ {(subtotal + logistica.taxaEntrega).toFixed(2)}</span>
        </div>
      </div>

      {/* MÉTODOS DE PAGAMENTO */}
      <div className="space-y-3 mb-8">
        {["Pix", "Cartão (Entregador)", "Dinheiro"].map((metodo) => (
          <button
            key={metodo}
            onClick={() => setFormaPagamento(metodo)}
            className={`w-full p-5 rounded-3xl font-black uppercase italic text-xs border-2 transition ${
              formaPagamento === metodo ? "border-red-600 bg-red-600/10" : "border-zinc-800 bg-zinc-900 opacity-40"
            }`}
          >
            {metodo}
          </button>
        ))}
      </div>

      <button
        onClick={finalizarTudo}
        disabled={loading}
        className="w-full bg-red-600 py-6 rounded-[35px] font-black uppercase italic text-sm shadow-xl active:scale-95 transition"
      >
        {loading ? "Gravando Pedido..." : "Finalizar Pedido ➔"}
      </button>
    </main>
  );
}