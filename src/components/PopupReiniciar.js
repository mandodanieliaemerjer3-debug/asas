export default function PopupReiniciar({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full rounded-[40px] p-10 shadow-2xl relative z-10 text-center animate-scale-up border border-gray-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">⚠️</div>
        <h2 className="text-xl font-black uppercase italic text-gray-900 leading-tight">Esvaziar <span className="text-red-600">Sacola?</span></h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 leading-relaxed">Sua sacola já contém itens de outro restaurante. Deseja limpar tudo?</p>
        <div className="mt-10 flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full py-5 bg-red-600 text-white rounded-[25px] font-black uppercase italic text-xs shadow-xl active:scale-95 transition-all">🔄 Sim, Reiniciar Agora</button>
          <button onClick={onClose} className="w-full py-5 bg-gray-50 text-gray-400 rounded-[25px] font-black uppercase italic text-[10px] active:scale-95 transition-all">Cancelar</button>
        </div>
      </div>
    </div>
  );
}