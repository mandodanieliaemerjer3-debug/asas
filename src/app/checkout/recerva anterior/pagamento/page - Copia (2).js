"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { collection, addDoc, doc, updateDoc, getDoc, setDoc, increment } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PagamentoFinalElite() {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [logistica, setLogistica] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    const savedLog = localStorage.getItem("logistica_final");
    if (!savedCart || !savedLog) { router.push("/checkout"); return; }
    setCart(JSON.parse(savedCart));
    setLogistica(JSON.parse(savedLog));
  }, [router]);

  const finalizarPedido = async () => {
    if (!logistica || loading) return;
    setLoading(true);

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const idLinha = String(logistica.bairro.linhaId || "");

      const dadosPedido = {
        clienteId: user?.uid || "anonimo",
        clienteNome: user?.displayName || "Cliente Guapiara",
        itens: cart,
        valores: {
          subtotal: cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0),
          taxaEntrega: logistica.taxaEntrega,
          total: cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0) + logistica.taxaEntrega
        },
        pesoTotal: Number(logistica.pesoTotal) || 0, // ⚖️ Registro do peso
        formaPagamento,
        rankEntrega: logistica.bairro.level || "Off-Road Root",
        endereco: {
          bairro: logistica.bairro.name,
          linhaId: idLinha,
          rua: logistica.rua,
          numero: logistica.numero
        },
        status: "Aguardando Entregador",
        repasseConfirmado: false, // 💰 Para o seu Dashboard
        criadoEm: new Date().toISOString()
      };

      // 1. Grava o pedido
      await addDoc(collection(db, "orders"), dadosPedido);

      // 2. ATUALIZAÇÃO ATÔMICA DA LINHA (Evita erro de rateio)
      if (idLinha) {
        const linhaRef = doc(db, "linhas_do_dia", `${hoje}_linha_${idLinha}`);
        const linhaSnap = await getDoc(linhaRef);

        if (linhaSnap.exists()) {
          // Incrementa contador e soma o peso ao que já existia
          await updateDoc(linhaRef, {
            pedidosAtivos: increment(1),
            pesoTotal: increment(Number(logistica.pesoTotal) || 0)
          });
        } else {
          // Cria a linha do zero se for o primeiro
          await setDoc(linhaRef, {
            data: hoje,
            linhaId: idLinha,
            pedidosAtivos: 1,
            pesoTotal: Number(logistica.pesoTotal) || 0
          });
        }
      }

      localStorage.removeItem("carrinho");
      localStorage.removeItem("logistica_final");
      alert("✅ Pedido e Logística registrados!");
      router.push("/");
    } catch (e) {
      alert("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!logistica) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 font-sans max-w-md mx-auto">
      <h1 className="text-xl font-black uppercase italic mb-8 text-center">Finalizar Pagamento</h1>
      
      <div className="bg-white text-black p-8 rounded-[40px] mb-8 shadow-xl">
        <div className="flex justify-between text-[10px] font-black uppercase opacity-30 mb-2">
          <span>Frete ({logistica.pesoTotal} pts)</span>
          <span>R$ {logistica.taxaEntrega.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-2xl font-black italic border-t pt-4">
          <span>TOTAL</span>
          <span>R$ {(cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0) + logistica.taxaEntrega).toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-3 mb-10">
        {["Pix", "Cartão"].map(m => (
          <button key={m} onClick={() => setFormaPagamento(m)} className={`w-full py-5 rounded-3xl font-black uppercase italic text-xs border-2 ${formaPagamento === m ? "border-red-600 bg-red-600/10" : "border-zinc-800 opacity-40"}`}>
            {m}
          </button>
        ))}
      </div>

      <button onClick={finalizarPedido} className="w-full bg-red-600 py-6 rounded-full font-black uppercase italic shadow-2xl">
        {loading ? "Processando..." : "Confirmar Pedido ➔"}
      </button>
    </main>
  );
}