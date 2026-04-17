"use client";
import { useRouter } from "next/navigation";

export default function PortalDashboard() {
  const router = useRouter();

  const ferramentas = [
    {
      titulo: "Novo Item (Tags)",
      desc: "Cadastrar lanches com gavetas de horários e países",
      rota: "/admin/cadastro",
      cor: "bg-red-600",
      icone: "🍔"
    },
    {
      titulo: "Gestão de Cardápio",
      desc: "Editar preços (venda/interno) e excluir produtos",
      rota: "/admin/cardapio",
      cor: "bg-blue-600",
      icone: "📝"
    },
    {
      titulo: "Cérebro do App",
      desc: "Configurar inteligência de horários e preferências",
      rota: "/admin/cerebro",
      cor: "bg-purple-600",
      icone: "🧠"
    },
    {
      titulo: "Mogu TV Admin",
      desc: "Gerenciar vídeos e postar novos conteúdos",
      rota: "/admin/postar-video",
      cor: "bg-orange-600",
      icone: "📺"
    },
    {
      titulo: "Histórico de Vendas",
      desc: "Ver pedidos e validar repasses",
      rota: "/admin/historico",
      cor: "bg-green-600",
      icone: "📊"
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans max-w-md mx-auto pb-20">
      <header className="mb-10 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <p className="text-[10px] font-black uppercase text-red-600 italic tracking-widest">Acesso Restrito</p>
        </div>
        <h1 className="text-3xl font-black text-gray-900 uppercase italic leading-none">
          Portal <span className="text-red-600 italic">PapáCash</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {ferramentas.map((f) => (
          <button
            key={f.titulo}
            onClick={() => router.push(f.rota)}
            className="group relative overflow-hidden bg-white p-6 rounded-[35px] border border-gray-100 shadow-xl flex items-center gap-5 active:scale-95 transition-all text-left"
          >
            <div className={`${f.cor} w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg transform group-hover:rotate-12 transition-transform`}>
              {f.icone}
            </div>
            
            <div className="flex-1">
              <h3 className="font-black text-gray-800 uppercase italic text-sm tracking-tighter leading-none">{f.titulo}</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1 leading-tight">{f.desc}</p>
            </div>

            <span className="text-gray-200 text-2xl font-black group-hover:translate-x-1 transition-transform">→</span>
          </button>
        ))}
      </div>

      <footer className="mt-12 text-center">
        <button 
          onClick={() => router.push("/")}
          className="text-[10px] font-black uppercase text-gray-500 border-2 border-gray-200 px-8 py-4 rounded-full hover:bg-gray-100 transition active:scale-90"
        >
          Sair para o App Cliente
        </button>
      </footer>
    </main>
  );
}