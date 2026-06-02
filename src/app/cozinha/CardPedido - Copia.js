// src/app/cozinha/CardPedido.js
export function CardPedido({ pedido, onClick }) {
  return (
    <div 
      onClick={() => onClick(pedido)}
      className={`flex items-center p-5 rounded-[25px] border-l-[18px] shadow-lg transition-all active:scale-[0.98] cursor-pointer bg-white border-y border-r border-gray-100 ${
        pedido.status === "Pendente" ? "border-l-[#B91C1C] hover:bg-red-50" : "border-l-[#D97706] hover:bg-amber-50"
      }`}
    >
      <div className="w-40">
        <p className="text-[10px] font-black text-gray-400 uppercase leading-none">
          {pedido.confirmadoEm?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </p>
        <span className="text-4xl font-black italic text-gray-900 tracking-tighter">#{pedido.id.slice(-4).toUpperCase()}</span>
      </div>
      <div className="flex-1 flex flex-wrap gap-3 px-8 border-l border-gray-100">
        {pedido.itens?.map((item, i) => (
          <span key={i} className="bg-white px-4 py-2 rounded-xl text-[13px] font-black uppercase italic border-2 border-gray-50 text-gray-800 shadow-sm flex items-center gap-2">
            <span className={`text-lg ${pedido.status === "Pendente" ? "text-[#B91C1C]" : "text-[#D97706]"}`}>
              {item.quantity || 1}x
            </span>
            {item.name}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-6">
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