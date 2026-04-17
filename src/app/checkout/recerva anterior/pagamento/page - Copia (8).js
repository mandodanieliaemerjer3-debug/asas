"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { collection, addDoc, doc, updateDoc, getDoc, setDoc, increment } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";

export default function PagamentoMestreMogu() {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [logistica, setLogistica] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState("Pix"); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("carrinho");
    const savedLog = localStorage.getItem("logistica_final");
    if (savedCart && savedLog) {
      setCart(JSON.parse(savedCart));
      setLogistica(JSON.parse(savedLog));
    } else { router.push("/checkout"); }
  }, [router]);

  const finalizarPedido = async () => {
    if (!logistica || loading) return;
    setLoading(true);

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const idAfiliado = localStorage.getItem("afiliado_origem");
      const idLinha = String(logistica.bairro.linhaId || "");

      // 🪙 Moedas e Cashback (Mantido do arquivo anterior)
      const moedasCashbackCliente = cart.reduce((acc, item) => {
        const comissao = (Number(item.price) || 0) * 0.01;
        return acc + Math.floor(comissao * 200); 
      }, 0);

      const moedasParaAfiliado = cart.reduce((acc, item) => {
        return acc + (Number(item.coinAfiliado) || 0);
      }, 0);

      const dadosPedido = {
        clienteId: user?.uid || "anonimo",
        clienteNome: user?.displayName || "Cliente Guapiara",
        itens: cart.map(item => ({ ...item, restaurantId: item.restaurantId || "rest_1" })),
        valores: {
          subtotal: cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0),
          taxaEntrega: logistica.taxaEntrega,
          total: cart.reduce((acc, i) => acc + (Number(i.price) || 0), 0) + logistica.taxaEntrega
        },
        // 🛠️ Logística do Elite
        pesoTotal: Number(logistica.pesoTotal) || 0,
        rankEntrega: logistica.bairro.level || "Off-Road Root",
        formaPagamento: formaPagamento,
        endereco: {
          bairro: logistica.bairro.name,
          linhaId: idLinha,
          rua: logistica.rua,
          numero: logistica.numero
        },
        afiliadoId: idAfiliado || null,
        recompensa: { moedasAfiliado: moedasParaAfiliado, moedasCashback: moedasCashbackCliente },
        status: "Pendente", 
        repasseConfirmado: false,
        criadoEm: hoje 
      };

      const docRef = await addDoc(collection(db, "orders"), dadosPedido);

      // 🚀 Atualiza Linhas (Logística Crítica)
      if (idLinha && logistica.statusInicial === "Aguardando Entregador") {
        const linhaRef = doc(db, "linhas_do_dia", `${hoje}_linha_${idLinha}`);
        const linhaSnap = await getDoc(linhaRef);
        if (linhaSnap.exists()) {
          await updateDoc(linhaRef, { pedidosAtivos: increment(1), pesoTotal: increment(Number(logistica.pesoTotal) || 0) });
        } else {
          await setDoc(linhaRef, { data: hoje, linhaId: idLinha, pedidosAtivos: 1, pesoTotal: Number(logistica.pesoTotal) || 0 });
        }
      }

      localStorage.removeItem("carrinho");

      // 🧭 Redirecionamento Final
      if (formaPagamento === "Gateway") {
        router.push(`/checkout/gateway?orderId=${docRef.id}`);
      } else if (formaPagamento === "Pix") {
        router.push(`/checkout/pix-instrucoes?orderId=${docRef.id}`);
      } else {
        router.push(`/pedido-confirmado/${docRef.id}`);
      }

    } catch (e) {
      alert("Erro ao finalizar: " + e.message);
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-6 flex flex-col items-center justify-center">
      <div className="bg-white text-black p-8 rounded-[40px] w-full max-w-sm">
        <h2 className="text-center font-black italic uppercase mb-6 tracking-tighter">Forma de Pagamento</h2>
        
        <div className="grid grid-cols-1 gap-2 mb-8">
          {["Pix", "Dinheiro", "Cartão (Maquininha)", "Gateway", "Moedas"].map((t) => (
            <button key={t} onClick={() => setFormaPagamento(t)}
              className={`py-4 rounded-2xl font-black uppercase italic text-[10px] border-2 transition ${formaPagamento === t ? 'border-red-600 bg-red-50' : 'border-zinc-50'}`}>
              {t}
            </button>
          ))}
        </div>

        <button onClick={finalizarPedido} disabled={loading} className="w-full bg-red-600 text-white py-6 rounded-[30px] font-black uppercase italic shadow-xl">
          {loading ? "PROCESSANDO..." : "FINALIZAR E PEDIR ➔"}
        </button>
      </div>
    </main>
  );
}