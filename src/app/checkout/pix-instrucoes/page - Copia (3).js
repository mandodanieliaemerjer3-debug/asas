"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function PixInstrucoesSimples() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [arquivo, setArquivo] = useState(null);

  const irParaInspecao = () => {
    if (!arquivo) return alert("Anexe o comprovante primeiro!");
    
    // Salva a imagem temporariamente para a próxima página ler
    const reader = new FileReader();
    reader.onload = (e) => {
      localStorage.setItem("temp_pix_img", e.target.result);
      router.push(`/checkout/inspecao-pix?orderId=${orderId}`);
    };
    reader.readAsDataURL(arquivo);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white text-black p-10 rounded-[50px] text-center shadow-2xl">
        <h1 className="text-xl font-black uppercase italic mb-6">Pagar via Pix</h1>
        <div className="bg-zinc-100 p-6 rounded-[35px] mb-8 select-all">
          <p className="text-[8px] font-black opacity-30 uppercase">Chave Pix</p>
          <p className="text-xs font-black italic uppercase">SUA_CHAVE_AQUI</p>
        </div>
        <div className="border-4 border-dashed border-zinc-100 rounded-[35px] p-10 mb-8">
          <input type="file" accept="image/*" className="hidden" id="f" onChange={(e) => setArquivo(e.target.files[0])} />
          <label htmlFor="f" className="cursor-pointer font-black uppercase italic text-[10px] opacity-40">
            {arquivo ? "✅ Arquivo Selecionado" : "Anexar Comprovante"}
          </label>
        </div>
        <button onClick={irParaInspecao} className="w-full bg-red-600 text-white py-6 rounded-[35px] font-black uppercase italic">
          AVANÇAR PARA ANÁLISE ➔
        </button>
      </div>
    </main>
  );
}