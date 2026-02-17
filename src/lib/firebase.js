import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Suas chaves de configuração vinculadas ao projeto studio-7633049135-6e41d
const firebaseConfig = {
  apiKey: "AIzaSyAUyfLf2GPRJQXscn8j9lEtMYQOCTBTPiA",
  authDomain: "studio-7633049135-6e41d.firebaseapp.com",
  projectId: "studio-7633049135-6e41d",
  storageBucket: "studio-7633049135-6e41d.firebasestorage.app",
  messagingSenderId: "48424855486",
  appId: "1:48424855486:web:2ad8fe8168aa6c86b1fbef"
};

// Inicialização segura para Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportações essenciais
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configurações do Google Provider
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Função para configurar o Recaptcha invisível necessária para o login por celular
 *
 */
export const setupRecaptcha = (containerId) => {
  if (typeof window !== "undefined") {
    // Garante que o verifier só seja criado uma vez para evitar erros de duplicidade
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: (response) => {
          // reCAPTCHA resolvido
        },
        'expired-callback': () => {
          // Lógica para quando o recaptcha expira
        }
      });
    }
  }
};