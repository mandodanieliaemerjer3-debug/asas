"use client";
// Exemplo simples para o lojista copiar o link de validação
export default function PainelLojista({ parceiroId = "parceiro_rute" }) {
  const linkValidacao = `${window.location.origin}/validar/${parceiroId}`;

  return (
    <div className="p-6 bg-white rounded-[30px] shadow-xl">
      <h2 className="font-black uppercase italic text-xs mb-4">📢 Link da Semana</h2>
      <p className="text-[10px] text-gray-400 mb-4 uppercase font-bold">
        Envie este link no grupo para validar quem ainda está lá:
      </p>
      <div className="bg-gray-50 p-4 rounded-2xl break-all text-[10px] font-mono border border-dashed border-gray-300">
        {linkValidacao}
      </div>
      <button 
        onClick={() => {
          navigator.clipboard.writeText(linkValidacao);
          alert("Link copiado! Cole no seu grupo do WhatsApp.");
        }}
        className="mt-4 w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase italic text-[10px]"
      >
        📋 Copiar Link para o Zap
      </button>
    </div>
  );
}