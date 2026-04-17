export default function RodapeNav({ saldo, cartCount, router }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
      {/* Fundo com desfoque e borda superior brilhante */}
      <div className="bg-white/90 backdrop-blur-2xl border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] px-6 py-3 flex justify-between items-center">
        
        {/* BOTÃO CARTEIRA / SALDO */}
        <button 
          onClick={() => router.push("/carteira")} 
          className="flex flex-col items-center gap-1 group active:scale-95 transition"
        >
          <div className="relative">
            <span className="text-2xl">🪙</span>
            <span className="absolute -top-1 -right-2 bg-yellow-400 text-[7px] font-black px-1 rounded-full border border-white">
              {saldo}
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Carteira</span>
        </button>

        {/* MOGU TV (DESTAQUE CENTRAL) */}
        <button 
          onClick={() => router.push("/mogu-tv")} 
          className="relative -mt-8 flex flex-col items-center group"
        >
          <div className="bg-red-600 p-4 rounded-2xl shadow-xl shadow-red-200 border-4 border-white transform group-active:scale-90 transition">
             <span className="text-2xl">📺</span>
          </div>
          <span className="text-[10px] font-black text-red-600 uppercase mt-1 tracking-widest">Mogu TV</span>
        </button>

        {/* BOTÃO CARRINHO */}
        <button 
          onClick={() => router.push("/checkout")} 
          className="flex flex-col items-center gap-1 group active:scale-95 transition"
        >
          <div className="relative">
            <span className="text-2xl text-gray-700">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black border border-white">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Sacola</span>
        </button>

      </div>
      {/* Espaçamento para iPhones/Androids com barra de navegação inferior */}
      <div className="bg-white h-6 w-full"></div>
    </footer>
  );
}