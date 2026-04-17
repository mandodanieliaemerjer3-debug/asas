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
    if (precisaTroco === null || !aceitaPixSemTroco) return;
    setProcessando(true);
    
    try {
      const totalPedido = pedido?.valores?.total || 0;
      const trocoCalculado = precisaTroco ? (parseFloat(valorTrocoPara) - totalPedido) : 0;

      // SALVANDO O PEDIDO NO FIREBASE
      await updateDoc(doc(db, "orders", id), {
        status: "Aguardando Entregador",
        metodoPagamento: "dinheiro",
        pago: false,
        detalhesTroco: {
          precisa: precisaTroco,
          levarPara: precisaTroco ? parseFloat(valorTrocoPara) : totalPedido,
          valorTroco: trocoCalculado > 0 ? trocoCalculado : 0
        },
        aceitaPixSeSemTroco: true,
        confirmadoEm: Timestamp.now()
      });

      // REDIRECIONAMENTO APÓS SALVAR
      window.location.href = `/agradecimento/${id}`;

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao enviar pedido. Tente novamente!");
      setProcessando(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black italic">CONECTANDO...</div>;

  return (
    <main className="min-h-screen bg-white p-6 flex flex-col items-center font-sans max-w-md mx-auto">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mb-4">💵</div>
      
      <h1 className="font-black italic uppercase text-xl tracking-tighter text-zinc-900 leading-none">Pagamento em Dinheiro</h1>
      <p className="text-[10px] font-black text-zinc-400 uppercase mt-2 mb-8 tracking-widest">Total: R$ {pedido?.valores?.total.toFixed(2)}</p>

      <div className="w-full space-y-6 mb-8">
        <p className="text-[11px] font-black uppercase italic text-zinc-800 text-center">Vai precisar de troco?</p>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setPrecisaTroco(true)}
            className={`py-5 rounded-3xl font-black uppercase italic text-[10px] border-2 transition-all ${precisaTroco === true ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-200' : 'bg-white border-zinc-100 text-zinc-400'}`}
          >Sim, preciso</button>
          
          <button 
            onClick={() => { setPrecisaTroco(false); setValorTrocoPara(""); }}
            className={`py-5 rounded-3xl font-black uppercase italic text-[10px] border-2 transition-all ${precisaTroco === false ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-200' : 'bg-white border-zinc-100 text-zinc-400'}`}
          >Dinheiro Contado</button>
        </div>

        {precisaTroco && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[9px] font-bold text-zinc-400 uppercase mb-2 ml-4">Troco para quanto?</p>
            <input 
              type="number" 
              placeholder="Ex: 50.00"
              value={valorTrocoPara}
              onChange={(e) => setValorTrocoPara(e.target.value)}
              className="w-full bg-zinc-50 p-6 rounded-[30px] border-2 border-zinc-100 font-black text-center text-xl outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        )}
      </div>

      <div className={`p-6 rounded-[35px] border-2 mb-10 transition-colors ${aceitaPixSemTroco ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
        <label className="flex items-start gap-4 cursor-pointer">
          <input type="checkbox" checked={aceitaPixSemTroco} onChange={(e) => setAceitaPixSemTroco(e.target.checked)} className="w-5 h-5 mt-1 accent-emerald-600" />
          <p className="text-[9px] font-black uppercase leading-tight italic">Se o motoboy não tiver troco na hora, aceito pagar via Pix ✅</p>
        </label>
      </div>

      <button 
        onClick={finalizarNoDinheiro}
        disabled={precisaTroco === null || (precisaTroco && !valorTrocoPara) || !aceitaPixSemTroco || processando}
        className={`w-full py-7 rounded-[35px] font-black uppercase italic text-xs shadow-2xl transition-all active:scale-95 ${(!aceitaPixSemTroco || processando) ? 'bg-zinc-100 text-zinc-300' : 'bg-emerald-600 text-white shadow-emerald-200'}`}
      >
        {processando ? "SINCRONIZANDO..." : "FINALIZAR E PEDIR ➔"}
      </button>
    </main>
  );
}