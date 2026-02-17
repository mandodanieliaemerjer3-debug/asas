import { Inter } from "next/font/google";
// import "./globals.css";  <-- REMOVE A LINHA QUE DAVA ERRO
import { AuthProvider } from "../contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Delivery App",
  description: "O melhor delivery da região",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* TRUQUE: Puxa o estilo (Tailwind) direto da internet para não dar erro */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}