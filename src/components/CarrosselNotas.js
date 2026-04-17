"use client";

import { useState, useEffect } from "react";

export default function CarrosselNotas({ notas = [] }) {

  const [index, setIndex] = useState(0);

  useEffect(() => {

    if (!notas || notas.length === 0) return;

    const intervalo = setInterval(() => {
      setIndex((prev) => (prev + 1) % notas.length);
    }, 4000);

    return () => clearInterval(intervalo);

  }, [notas]);

  if (!notas || notas.length === 0) return null;

  return (

    <section className="mt-3 mb-5 px-4">

      <div className="relative w-full h-[10vw] overflow-hidden rounded-[20px] shadow-sm border border-gray-50">

        {notas.map((nota, i) => (

          <img
            key={nota.id || i}
            src={nota.imagemUrl}
            alt="Anúncio"
            className={`absolute top-0 left-0 w-full h-full object-fill transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />

        ))}

      </div>

    </section>

  );

}