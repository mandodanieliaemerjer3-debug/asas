// src/app/cozinha/voz-cozinha.js

export class VozCozinha {
  constructor(onWakeWordDetected, onComandoDetectado) {
    this.onWakeWordDetected = onWakeWordDetected;
    this.onComandoDetectado = onComandoDetectado;

    this.recognition = null;
    this.isListening = false;
    this.restartTimeout = null;
  }

  iniciar() {
    // EVITA DUPLICAR
    if (this.isListening) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("SpeechRecognition não suportado");
      return;
    }

    this.recognition = new SpeechRecognition();

    // CONFIG
    this.recognition.lang = "pt-BR";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    // START
    this.recognition.onstart = () => {
      console.log("🎤 Mogu ouvindo...");
      this.isListening = true;
    };

    // RESULTADOS
    this.recognition.onresult = (event) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript + " ";
      }

      const texto = transcript
        .toLowerCase()
        .trim();

      console.log("📝 Detectado:", texto);

      // WAKE WORDS
      const acordou =
        texto.includes("mogu mogu") ||
        texto.includes("mogo mogo") ||
        texto.includes("mongo mongo") ||
        texto.includes("mugu mugu");

      if (acordou) {
        console.log("🔥 Wake word detectada");

        this.onWakeWordDetected();

        let comando = texto;

        comando = comando.replace("mogu mogu", "");
        comando = comando.replace("mogo mogo", "");
        comando = comando.replace("mongo mongo", "");
        comando = comando.replace("mugu mugu", "");

        comando = comando.trim();

        if (comando.length > 0) {
          console.log("📦 Comando:", comando);

          this.onComandoDetectado(comando);
        }
      }
    };

    // ERROS
    this.recognition.onerror = (event) => {
      console.log(
        "❌ Erro reconhecimento:",
        event.error
      );

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        this.isListening = false;
      }
    };

    // FINALIZAÇÃO
    this.recognition.onend = () => {
      console.log("🔄 Reconhecimento encerrado");

      if (this.isListening) {
        clearTimeout(this.restartTimeout);

        this.restartTimeout = setTimeout(() => {
          try {
            console.log(
              "♻️ Reiniciando reconhecimento..."
            );

            this.recognition.start();
          } catch (e) {
            console.log(
              "⚠️ Falha ao reiniciar:",
              e
            );
          }
        }, 800);
      }
    };

    // INICIAR
    try {
      this.recognition.start();
    } catch (e) {
      console.log("⚠️ Erro ao iniciar:", e);
    }
  }

  parar() {
    console.log("🛑 Parando reconhecimento");

    this.isListening = false;

    clearTimeout(this.restartTimeout);

    if (this.recognition) {
      try {
        this.recognition.onend = null;

        this.recognition.stop();
      } catch (e) {
        console.log("Erro ao parar:", e);
      }

      this.recognition = null;
    }
  }
}