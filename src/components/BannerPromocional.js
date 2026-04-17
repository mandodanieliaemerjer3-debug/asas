import BannerCarrossel from "./BannerCarrossel";

export default function BannerPromocional({ bannersData, categorias, router }) {
  return (
    <>
      <section className="px-4 mt-2">
         <BannerCarrossel imagens={bannersData} />
      </section>

      <section className="mt-6 px-4 grid grid-cols-4 gap-2">
         {categorias.map(cat => (
            <button 
              key={cat.name} 
              onClick={() => router.push("/especiais")} 
              className="flex flex-col items-center p-3 rounded-[24px] bg-gray-50 border border-gray-100 active:scale-90 transition"
            >
               <span className="text-2xl mb-1">{cat.img}</span>
               <span className="text-[9px] font-black uppercase text-gray-800">{cat.name}</span>
            </button>
         ))}
      </section>
    </>
  );
}