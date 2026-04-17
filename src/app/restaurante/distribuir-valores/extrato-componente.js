// extrato-componente.js
export default function PaginaExtratoProtegido({ dados }) {
  // Conversão: Moedas valem R$ 0,005 (Meio centavo)
  const valorMoedasReais = (dados.moedasGastasNoTotal || 0) * 0.005;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[45px] shadow-2xl border border-gray-100">
        <h2 className="text-xl font-black uppercase italic mb-6 text-center tracking-tighter">Resumo de Fechamento</h2>
        
        <div className="space-y-4 border-b pb-6">
          <div className="flex justify-between text-[10px] font-black uppercase opacity-40 italic">
            <span>Comissão Mogu (Sobre Lanches)</span>
            <span className="text-black">R$ {dados.comissaoMogu.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-[10px] font-black uppercase opacity-40 italic">
            <span>Taxas de Entrega (Para Repasse)</span>
            <span className="text-black">R$ {dados.fretesBruto.toFixed(2)}</span>
          </div>

          {/* REGRA DAS MOEDAS: ABATIMENTO DA DÍVIDA */}
          <div className="flex justify-between text-[10px] font-black uppercase text-blue-600 italic bg-blue-50 p-3 rounded-2xl border border-blue-100">
            <span>Crédito por Moedas Aceitas 🪙</span>
            <span>- R$ {valorMoedasReais.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-6 text-center">
          <p className="text-[8px] font-black uppercase opacity-30 mb-1 italic">Total Líquido a transferir para plataforma</p>
          <h2 className="text-4xl font-black italic text-green-600 tracking-tighter">
            R$ {(dados.totalPagar - valorMoedasReais).toFixed(2)}
          </h2>
          <p className="text-[7px] font-bold text-zinc-400 mt-2 uppercase">
            *O valor das moedas foi debitado do seu saldo devedor.
          </p>
        </div>
      </div>
    </div>
  );
}