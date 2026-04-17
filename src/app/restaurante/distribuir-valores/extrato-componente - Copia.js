// extrato-componente.js
export default function PaginaExtratoProtegido({ dados }) {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[45px] shadow-2xl border border-gray-100">
        <h2 className="text-xl font-black uppercase italic mb-6 text-center">Extrato de Repasse</h2>
        
        <div className="space-y-4 border-b pb-6">
          <div className="flex justify-between text-[10px] font-black uppercase opacity-40 italic">
            <span>Comissão Mogu (5% Produtos)</span>
            <span className="text-red-600">+ R$ {dados.comissaoMogu.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase opacity-40 italic">
            <span>Repasse Fretes (Integrais)</span>
            <span className="text-black">+ R$ {dados.fretesBruto.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase text-blue-600 italic">
            <span>Crédito Moedas (Reembolso)</span>
            <span>- R$ {dados.moedasDesconto.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-6 text-center">
          <p className="text-[8px] font-black uppercase opacity-30 mb-1 italic">Total a transferir para plataforma</p>
          <h2 className="text-4xl font-black italic text-green-600 tracking-tighter">
            R$ {dados.totalPagar.toFixed(2)}
          </h2>
        </div>
      </div>

      <div className="bg-zinc-900 p-8 rounded-[40px] text-center">
        <p className="text-[8px] font-black uppercase text-zinc-500 mb-4">Chave Pix para Depósito</p>
        <p className="text-white font-mono text-xs mb-6 italic">financeiro@mogumogu.com</p>
        <button className="bg-white text-black px-8 py-3 rounded-2xl font-black uppercase italic text-[10px]">
          Copiar Chave Pix 📋
        </button>
      </div>
    </div>
  );
}