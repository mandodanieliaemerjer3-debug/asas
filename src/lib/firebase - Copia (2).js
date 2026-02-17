import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Suas chaves de configuração (extraídas do seu arquivo enviado)
const firebaseConfig = {
  apiKey: "AIzaSyAUyfLf2GPRJQXscn8j9lEtMYQOCTBTPiA",
  authDomain: "studio-7633049135-6e41d.firebaseapp.com",
  projectId: "studio-7633049135-6e41d",
  storageBucket: "studio-7633049135-6e41d.firebasestorage.app",
  messagingSenderId: "48424855486",
  appId: "1:48424855486:web:2ad8fe8168aa6c86b1fbef"
};

// Inicialização segura para Next.js (evita erro de múltiplas instâncias)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportações essenciais para o seu app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configurações opcionais para melhorar o login do Google
googleProvider.setCustomParameters({ prompt: 'select_account' });