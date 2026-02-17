"use client";
import { useState, useEffect } from "react";
// CAMINHOS CORRIGIDOS: Saindo de login -> app -> src para alcançar as outras pastas
import { useAuth } from "../../contexts/AuthContext"; 
import { setupRecaptcha } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loginGoogle, loginPhone } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("login"); // 'login' | 'code'

  // Se já estiver logado, manda pra home
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  // Inicializa o Recaptcha invisível
  useEffect(() => {
    setupRecaptcha("recaptcha-container");
  }, []);

  const handleSendCode = async () => {
    if (!phone) return alert("Digite um número!");
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await loginPhone(phone, appVerifier);
      setConfirmationResult(confirmation);
      setStep("code"); 
    } catch (error) {
      alert("Erro ao enviar SMS. Verifique o número (+55...)");
      console.error(error);
    }
  };

  const handleVerifyCode = async () => {
    try {
      await confirmationResult.confirm(verificationCode);
      router.push("/"); 
    } catch (error) {
      alert("Código inválido!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Mestre Mogu Delivery 🛵
        </h1>

        {step === "login" && (
          <div className="space-y-4">
            <button
              onClick={loginGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
              Entrar com Google
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 px-4 text-gray-400 text-sm">ou celular</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Celular (com DDD)</label>
              <input
                type="tel"
                placeholder="+55 11 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleSendCode}
              id="sign-in-button"
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 transition"
            >
              Receber Código SMS
            </button>
            <div id="recaptcha-container"></div>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600">Enviamos um código para</p>
              <p className="font-bold text-gray-800">{phone}</p>
            </div>

            <input
              type="text"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-center text-2xl tracking-widest outline-none focus:border-blue-500"
            />

            <button
              onClick={handleVerifyCode}
              className="w-full rounded-lg bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700 transition"
            >
              Confirmar e Entrar
            </button>
            
            <button
              onClick={() => setStep("login")}
              className="w-full text-sm text-gray-500 hover:underline"
            >
              Voltar / Corrigir número
            </button>
          </div>
        )}
      </div>
    </div>
  );
}