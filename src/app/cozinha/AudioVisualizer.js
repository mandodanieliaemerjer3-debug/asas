"use client";

import { useEffect, useRef } from "react";

export function AudioVisualizer({ ativo }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!ativo) return;

    let audioContext = null;
    let analyser = null;
    let source = null;
    let animationId = null;
    let stream = null;

    const iniciar = async () => {
      try {
        console.log("🎤 Tentando acessar microfone");

        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        console.log("✅ Microfone permitido");

        audioContext = new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

        analyser = audioContext.createAnalyser();

        source =
          audioContext.createMediaStreamSource(
            stream
          );

        source.connect(analyser);

        analyser.fftSize = 64;

        const bufferLength =
          analyser.frequencyBinCount;

        const dataArray =
          new Uint8Array(bufferLength);

        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        const desenhar = () => {
          animationId =
            requestAnimationFrame(desenhar);

          analyser.getByteFrequencyData(
            dataArray
          );

          ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          let x = 0;

          const barWidth =
            (canvas.width / bufferLength) * 1.5;

          for (
            let i = 0;
            i < bufferLength;
            i++
          ) {
            const barHeight =
              dataArray[i] / 3;

            ctx.fillStyle = "#f97316";

            ctx.fillRect(
              x,
              canvas.height - barHeight,
              barWidth,
              barHeight
            );

            x += barWidth + 1;
          }
        };

        desenhar();

      } catch (err) {
        console.log(
          "❌ ERRO MICROFONE:",
          err
        );

        alert(
          "Microfone bloqueado ou não suportado"
        );
      }
    };

    iniciar();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      if (audioContext) {
        audioContext.close();
      }

      if (stream) {
        stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [ativo]);

  return (
    <canvas
      ref={canvasRef}
      width="80"
      height="30"
      className="opacity-80"
    />
  );
}