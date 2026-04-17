"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export default function BannerCarrossel() {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarMoguBanners = async () => {
      try {
        const agora = new Date();
        const diaHoje = agora.getDay(); 
        const horaHoje = agora.getHours();
        
        // Lógica 24h completa: reconhece a Madrugada agora!
        let turnoAtual = "noite";
        if (horaHoje >= 0 && horaHoje < 6) turnoAtual = "madrugada";
        else if (horaHoje >= 6 && horaHoje < 12) turnoAtual = "manha";
        else if (horaHoje >= 12 && horaHoje < 18) turnoAtual = "tarde";

        const qSets = query(
          collection(db, "banners_sets"),
          where("ativo", "==", true),
          where("dias", "array-contains", diaHoje)
        );

        const snapSets = await getDocs(qSets);
        let idCampanhaAtiva = null;
        snapSets.forEach(doc => {
          if (doc.data().turno === turnoAtual) idCampanhaAtiva = doc.id;
        });

        if (idCampanhaAtiva) {
          const qBanners = query(
            collection(db, "banners_sets", idCampanhaAtiva, "banners"),
            where("ativo", "==", true),
            orderBy("ordem", "asc")
          );
          const snapBanners = await getDocs(qBanners);
          setBanners(snapBanners.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) { console.error("Erro:", error); } 
      finally { setLoading(false); }
    };
    carregarMoguBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const intervalo = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 7000); 
    return () => clearInterval(intervalo);
  }, [banners]);

  if (loading) return <div className="w-full h-72 bg-zinc-900 animate-pulse rounded-[45px]" />;
  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-72 overflow-hidden rounded-[45px] bg-black shadow-2xl border border-white/5 group">
      {banners.map((banner, i) => (
        <div key={banner.id} className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out transform ${i === index ? "opacity-100 scale-100" : "opacity-0 scale-110"}`}>
          {/* REMOVIDO: brightness-90 para manter a cor original vibrante */}
          <img src={banner.src} className="w-full h-full object-cover" alt="Destaque Mogu" />
          
          {/* REMOVIDO: O gradiente que criava a sombra escura no rodapé do banner */}
        </div>
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
          {banners.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-1000 ${i === index ? "w-10 bg-orange-500" : "w-2 bg-white/20"}`} />
          ))}
        </div>
      )}
    </div>
  );
}