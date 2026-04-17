// src/lib/sounds.js

class SoundManager {
  constructor() {
    this.sounds = {
      click: typeof Audio !== "undefined" ? new Audio("/sounds/click.mp3") : null,
      add: typeof Audio !== "undefined" ? new Audio("/sounds/add.mp3") : null,
      remove: typeof Audio !== "undefined" ? new Audio("/sounds/remove.mp3") : null,
    };

    // volume padrão
    Object.values(this.sounds).forEach((sound) => {
      if (sound) sound.volume = 0.5;
    });
  }

  play(name) {
    const sound = this.sounds[name];
    if (!sound) return;

    try {
      sound.currentTime = 0;
      sound.play();
    } catch (e) {
      // evita erro de autoplay bloqueado
      console.log("Som bloqueado pelo navegador");
    }
  }
}

const soundManager = new SoundManager();

export default soundManager;