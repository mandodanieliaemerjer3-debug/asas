// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// SUAS CHAVES REAIS (Copiadas do seu painel)
const firebaseConfig = {
  apiKey: "AIzaSyAUyfLf2GPRJQXscn8j9lEtMYQOCTBTPiA",
  authDomain: "studio-7633049135-6e41d.firebaseapp.com",
  projectId: "studio-7633049135-6e41d",
  storageBucket: "studio-7633049135-6e41d.firebasestorage.app",
  messagingSenderId: "48424855486",
  appId: "1:48424855486:web:2ad8fe8168aa6c86b1fbef"
};

// INICIALIZAÇÃO SEGURA
// Verifica se já existe uma conexão para não dar erro ao recarregar a página
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// EXPORTA AS FERRAMENTAS PARA O RESTO DO APP
// É isso que permite você fazer "import { auth } from..." nas outras telas
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * CONFIGURAÇÃO DO RECAPTCHA (Segurança Anti-Robô)
 * O Firebase exige isso para Login por Telefone.
 * Vamos chamar essa função na tela de Login depois.
 */
export const setupRecaptcha = (elementId) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      'size': 'invisible', // Fica invisível, só aparece se suspeitar
      'callback': (response) => {
        // Recaptcha resolvido
      }
    });
  }
};