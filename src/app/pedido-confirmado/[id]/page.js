"use client";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PedidoConfirmado() {
  const params = useParams();

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center font-sans text-center">
      <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-5xl mb-8 animate-bounce">
        🚀
      </div>
      
      <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4">
        PEDIDO <br/> CONFIRMADO!
      </h1>
      
      <p className="max-w-[250px] text-[10px] font-bold opacity-40 uppercase leading-relaxed mb-10">
        O restaurante já recebeu sua solicitação e está preparando tudo com capricho.
      </p>

      <div className="bg-white/5 border border-white/10 p-6 rounded-[35px] w-full max-w-xs mb-10">
        <p className="text-[8px] font-black opacity-30 uppercase mb-1">Acompanhe pelo código</p>
        <p className="text-lg font-black italic">#{params.id?.slice(-6).toUpperCase()}</p>
      </div>

      <Link href="/" className="bg-white text-black px-12 py-5 rounded-full font-black uppercase italic text-xs shadow-xl">
        VOLTAR PARA O INÍCIO
      </Link>
    </main>
  );
}