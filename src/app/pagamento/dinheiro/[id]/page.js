"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

export default function PagamentoDinheiroPage() {
  const { id } = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  
  const [precisaTroco, setPrecisaTroco] = useState(null); 
  const [valorTrocoPara, setValorTrocoPara] = useState("");
  const [aceitaPixSemTroco, setAceitaPixSemTroco] = useState(false);

  useEffect(() => {
    if (!id) return;
    const carregarPedido = async () => {
      const docSnap = await getDoc(doc(db, "orders", id));
      if (docSnap.exists()) {
        setPedido({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    carregarPedido();
  }, [id]);

  const finalizarNoDinheiro = async () => {
    console.log("Tentando finalizar pedido...");
    setProcessando(true);
    
    try {
      const totalPedido = pedido?.valores?.total || 0;
      const valorInput = parseFloat(valorTrocoPara) || 0;

      await updateDoc(doc(db, "orders", id), {
        status: "Pendente",
        metodoPagamento: "dinheiro",
        pago: false,
        detalhesTroco: {
          precisa: precisaTroco,
          levarPara: precisaTroco ? valorInput : totalPedido,
          valorTroco: precisaTroco ? (valorInput - totalPedido).toFixed(2) : 0
        },
        aceitaPixSeSemTroco: aceitaPixSemTroco,
        confirmadoEm: Timestamp.now()
      });

      router.push(`/agradecimento/${id}`);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar: " + error.message);
      setProcessando(false);
    }
  };

  if (loading)
    return <div className="min-h-screen flex items-center justify-center font-black italic">CONECTANDO...</div>;

  return (
    <main className="min-h-screen bg-white p-6 flex flex-col items-center font-sans max-w-md mx-auto">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mb-4">💵</div>
      
      <h1 className="font-black italic uppercase text-xl tracking-tighter text-zinc-900 leading-none">Pagamento em Dinheiro</h1>
      <p className="text-[10px] font-black text-zinc-400 uppercase mt-2 mb-8 tracking-widest">Total: R$ {pedido?.valores?.total?.toFixed(2) || "0.00"}</p>

      <div className="w-full space-y-6 mb-8">
        <p className="text-[11px] font-black uppercase italic text-zinc-800 text-center">Vai precisar de troco?</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setPrecisaTroco(true)} className={`py-5 rounded-3xl font-black uppercase italic text-[10px] border-2 transition-all ${precisaTroco === true ? "bg-zinc-900 border-zinc-900 text-white shadow-xl" : "bg-white border-zinc-100 text-zinc-400"}`}>Sim, preciso</button>
          <button onClick={() => { setPrecisaTroco(false); setValorTrocoPara(""); }} className={`py-5 rounded-3xl font-black uppercase italic text-[10px] border-2 transition-all ${precisaTroco === false ? "bg-zinc-900 border-zinc-900 text-white shadow-xl" : "bg-white border-zinc-100 text-zinc-400"}`}>Dinheiro Contado</button>
        </div>

        {precisaTroco && (
          <input 
            type="number" step="0.01" placeholder="Troco para quanto?"
            value={valorTrocoPara} onChange={(e) => setValorTrocoPara(e.target.value)}
            className="w-full bg-zinc-50 p-6 rounded-[30px] border-2 border-zinc-100 font-black text-center text-xl outline-none focus:border-emerald-500"
          />
        )}
      </div>

      <div className={`p-6 w-full rounded-[35px] border-2 mb-10 ${aceitaPixSemTroco ? "bg-emerald-50 border-emerald-100" : "bg-zinc-50 border-zinc-100"}`}>
        <label className="flex items-start gap-4 cursor-pointer">
          <input type="checkbox" checked={aceitaPixSemTroco} onChange={(e) => setAceitaPixSemTroco(e.target.checked)} className="w-5 h-5 mt-1 accent-emerald-600" />
          <p className="text-[9px] font-black uppercase leading-tight italic text-emerald-900">Se o motoboy não tiver troco, aceito pagar via Pix ✅</p>
        </label>
      </div>

      <button 
        onClick={finalizarNoDinheiro}
        className="w-full py-7 rounded-[35px] font-black uppercase italic text-xs shadow-2xl bg-emerald-600 text-white active:scale-95 transition-all"
      >
        {processando ? "SINCRONIZANDO..." : "FINALIZAR E PEDIR ➔"}
      </button>
    </main>
  );
}