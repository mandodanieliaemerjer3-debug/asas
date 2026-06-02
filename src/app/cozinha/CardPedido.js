// src/app/cozinha/CardPedido.js
export function CardPedido({ pedido, onClick }) {
  return (
    <div 
      onClick={() => onClick(pedido)}
      className={`flex items-center p-5 rounded-[25px] border-l-[18px] shadow-lg transition-all active:scale-[0.98] cursor-pointer bg-white border-y border-r border-gray-100 ${
        pedido.status === "Pendente" ? "border-l-[#B91C1C] hover:bg-red-50" : "border-l-[#D97706] hover:bg-amber-50"
      }`}
    >
      {/* HORA E ID DO PEDIDO */}
      <div className="w-40 shrink-0">
        <p className="text-[10px] font-black text-gray-400 uppercase leading-none">
          {pedido.confirmadoEm?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </p>
        <span className="text-4xl font-black italic text-gray-900 tracking-tighter">
          #{pedido.id.slice(-4).toUpperCase()}
        </span>
      </div>

      {/* LISTA DE PRODUTOS E SABORES MELHORADA */}
      <div className="flex-1 flex flex-col gap-3 px-8 border-l border-gray-100">
        {pedido.itens?.map((item, i) => {
          const nomeCompleto = item.name || "";
          
          // Busca a posição exata onde começam e terminam os parênteses dos sabores
          const inicioParenteses = nomeCompleto.indexOf("(");
          const fimParenteses = nomeCompleto.lastIndexOf(")");

          // 🟢 SE ENCONTROU OS PARÊNTESES DE FORMA SEGURA:
          if (inicioParenteses !== -1 && fimParenteses !== -1) {
            // Corta o nome do produto limpo
            const nomePrincipal = nomeCompleto.slice(0, inicioParenteses).trim();
            
            // Corta apenas o texto dos sabores de dentro dos parênteses
            const textoSabores = nomeCompleto.slice(inicioParenteses + 1, fimParenteses);
            
            // Agora sim damos o split de forma 100% segura em uma String pura!
            const listaSabores = textoSabores.split(" / ");

            return (
              <div key={i} className="bg-gray-50/70 p-4 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col w-full max-w-xl">
                {/* Título Principal do Combo/Pizza */}
                <div className="flex items-center gap-2 font-black text-[14px] uppercase italic text-gray-900 border-b border-gray-200/60 pb-1.5">
                  <span className={`text-xl font-mono ${pedido.status === "Pendente" ? "text-[#B91C1C]" : "text-[#D97706]"}`}>
                    {item.quantity || 1}x
                  </span>
                  {nomePrincipal}
                </div>
                
                {/* Lista Destacada de Sabores para a Cozinha */}
                <div className="mt-2 pl-3 space-y-1 border-l-2 border-red-500">
                  {listaSabores.map((sabor, sIdx) => (
                    <p key={sIdx} className="text-[12px] font-black uppercase text-red-600 tracking-wide">
                      ➔ {sabor.trim()}
                    </p>
                  ))}
                </div>
              </div>
            );
          }

          // FLUXO PADRÃO: Para lanches secos e produtos comuns sem seleção de sabor
          return (
            <div key={i} className="bg-white px-4 py-3 rounded-xl text-[13px] font-black uppercase italic border-2 border-gray-50 text-gray-800 shadow-sm flex items-center gap-2 self-start">
              <span className={`text-lg font-mono ${pedido.status === "Pendente" ? "text-[#B91C1C]" : "text-[#D97706]"}`}>
                {item.quantity || 1}x
              </span>
              {item.name}
            </div>
          );
        })}
      </div>

      {/* STATUS DO PEDIDO */}
      <div className="flex items-center gap-6 shrink-0">
         <div className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase italic text-white ${
           pedido.status === "Pendente" ? "bg-[#B91C1C]" : "bg-[#D97706]"
         }`}>
           {pedido.status}
         </div>
         <span className="text-3xl text-gray-200">➔</span>
      </div>
    </div>
  );
}