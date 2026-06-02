"use client";

import { useState, useEffect, useRef } from "react";

export default function Transcritor() {
  const [textoExibido, setTextoExibido] = useState("Iniciando escuta...");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setTextoExibido("Navegador não suporta transcrição.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Escuta sem parar
    recognition.interimResults = true; // Mostra o texto enquanto fala
    recognition.lang = "pt-BR";

    recognition.onresult = (event) => {
      let transcricaoCompleta = "";
      
      // Itera sobre todos os resultados
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcricaoCompleta += event.results[i][0].transcript;
      }

      // Pega as últimas 4 palavras
      const palavras = transcricaoCompleta.trim().split(/\s+/);
      const ultimasQuatro = palavras.slice(-4).join(" ");
      
      setTextoExibido(ultimasQuatro || "...");
    };

    // Reinício automático caso o navegador pare
    recognition.onend = () => {
      try {
        recognition.start();
      } catch (e) {
        console.log("Reiniciando...");
      }
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => recognitionRef.current?.stop();
  }, []);

  return (
    <div className="bg-black text-green-400 p-6 rounded-xl border border-green-800 font-mono">
      <h3 className="text-[10px] uppercase tracking-widest text-green-700">Transcrição em Tempo Real</h3>
      <p className="text-3xl font-black mt-2">{textoExibido}</p>
    </div>
  );
}