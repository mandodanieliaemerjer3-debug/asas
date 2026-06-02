import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAUyfLf2GPRJQXscn8j9lEtMYQOCTBTPiA",
  authDomain: "studio-7633049135-6e41d.firebaseapp.com",
  projectId: "studio-7633049135-6e41d",
  storageBucket: "studio-7633049135-6e41d.firebasestorage.app",
  messagingSenderId: "48424855486",
  appId: "1:48424855486:web:2ad8fe8168aa6c86b1fbef"
};

// Inicialização segura para evitar erros e EXPORTADA para o Remote Config usar
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Força a seleção de conta no login Google
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Configuração do Recaptcha para login via Celular
 */
export const setupRecaptcha = (containerId) => {
  if (typeof window !== "undefined") {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: (response) => {
          console.log("Recaptcha verificado");
        }
      });
    }
  }
};