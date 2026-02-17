"use client";
import { useState, useEffect } from "react";

export default function BannerCarrossel({ imagens }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (imagens.length <= 1) return;
    
    // Troca a foto a cada 4 segundos
    const intervalo = setInterval(() => {
      setIndex((prev) => (prev + 1) % imagens.length);
    }, 4000);

    return () => clearInterval(intervalo);
  }, [imagens]);

  return (
    <div className="relative w-full h-44 overflow-hidden rounded-3xl shadow-lg border border-gray-100">
      {imagens.map((banner, i) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <img src={banner.image} className="w-full h-full object-cover" alt="Banner" />
        </div>
      ))}
      
      {/* Indicadores (Bolinhas) */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {imagens.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}