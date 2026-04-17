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
  const [aceitaTrocoPix, setAceitaTrocoPix] = useState(false);

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
    if (!aceitaTrocoPix) return;
    setProcessando(true);
    
    try {
      const pedidoRef = doc(db, "orders", id);
      await updateDoc(pedidoRef, {
        status: "Aguardando Entregador",
        metodoPagamento: "dinheiro",
        pago: false,
        aceitaTrocoViaPix: true, // Registra que o cliente aceita receber troco digital
        confirmadoEm: Timestamp.now()
      });

      // Redireciona para o agradecimento que já funciona
      window.location.href = `/agradecimento/${id}`;

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao processar o pedido.");
    } finally {
      setProcessando(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black italic animate-pulse">CARREGANDO...</div>;

  return (
    <main className="min-h-screen bg-white p-6 flex flex-col items-center justify-center font-sans max-w-md mx-auto">
      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[30px] flex items-center justify-center text-4xl mb-6">💵</div>
      
      <h1 className="font-black italic uppercase text-2xl tracking-tighter text-zinc-900 leading-none mb-2">Troco Digital</h1>
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-10 text-center">
        Total do lanche: <span className="text-zinc-900">R$ {pedido?.valores?.total.toFixed(2)}</span>
      </p>

      {/* PERGUNTA SOBRE O TROCO EM PIX */}
      <div className={`p-8 rounded-[40px] border-2 transition-all mb-8 ${aceitaTrocoPix ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-500'}`}>
        <label className="flex items-center gap-5 cursor-pointer">
          <input 
            type="checkbox" 
            checked={aceitaTrocoPix}
            onChange={(e) => setAceitaTrocoPix(e.target.checked)}
            className="w-6 h-6 rounded-full accent-white"
          />
          <div className="text-left">
            <p className="text-[11px] font-black uppercase italic leading-tight">Aceito Troco via Pix</p>
            <p className="text-[9px] font-bold opacity-70 uppercase mt-1">
              Se o motoboy não tiver notas, ele pode me enviar o troco por Pix agora mesmo.
            </p>
          </div>
        </label>
      </div>

      <button 
        onClick={finalizarNoDinheiro}
        disabled={!aceitaTrocoPix || processando}
        className={`w-full py-7 rounded-[35px] font-black uppercase italic text-xs shadow-2xl transition active:scale-95 ${(!aceitaTrocoPix || processando) ? 'bg-zinc-100 text-zinc-300' : 'bg-zinc-900 text-white shadow-zinc-200'}`}
      >
        {processando ? "SINCRONIZANDO..." : "FINALIZAR PEDIDO ➔"}
      </button>

      {!aceitaTrocoPix && (
        <p className="mt-6 text-[8px] font-black uppercase text-red-500 italic text-center px-4">
          Para sua segurança e agilidade, confirme que aceita o troco via Pix caso falte notas.
        </p>
      )}
    </main>
  );
}