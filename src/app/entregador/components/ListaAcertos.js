"use client";

export default function ListaAcertos({ dividas }) {
  return (
    <section className="mt-10">
      <h3 className="text-[11px] font-black uppercase text-gray-400 mb-4 tracking-widest italic">Acerto com Lojas</h3>
      <div className="space-y-3">
        {dividas.length === 0 && (
          <p className="text-center py-10 opacity-20 text-[10px] font-black uppercase">Tudo em dia!</p>
        )}
        {dividas.map(d => (
          <div key={d.id} className={`p-5 rounded-2xl flex justify-between items-center border ${d.pagoPeloRestaurante ? 'bg-gray-100 opacity-40' : 'bg-white border-blue-200 shadow-sm'}`}>
            <div>
              <p className="text-[9px] font-black text-blue-600 uppercase">Pedido #{d.id.slice(-4)}</p>
              <p className="text-[12px] font-black italic uppercase">{d.pagamento}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-bold text-gray-400 uppercase">Taxa</p>
              <p className="text-sm font-black text-gray-900">R$ {d.valores?.taxaEntrega?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}