"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../lib/firebase";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [listaBairros, setListaBairros] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    cpf: "",
    genero: "",
    profissao: "",
    rua: "",
    numero: "",
    bairroId: "",
    referencia: "",
    termos: false
  });

  useEffect(() => {
    const fetchBairros = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "neighborhoods"));
        const bairrosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().name
        }));
        setListaBairros(bairrosData);
      } catch (error) {
        console.error("Erro ao buscar bairros:", error);
      }
    };
    fetchBairros();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.termos) {
      return alert("Você precisa aceitar os termos para continuar.");
    }

    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return alert("CPF inválido! Use 11 números.");
    }

    setLoading(true);

    try {
      const bairroSelecionado = listaBairros.find(b => b.id === formData.bairroId);

      const dadosCompletos = {
        uid: user.uid,
        displayName: user.displayName || "Usuário Mogu",
        email: user.email || "",
        photoURL: user.photoURL || "",

        cpf: cpfLimpo,
        genero: formData.genero,
        profissao: formData.profissao,

        endereco: {
          rua: formData.rua,
          numero: formData.numero,
          bairroId: formData.bairroId,
          bairroNome: bairroSelecionado?.nome || "",
          referencia: formData.referencia,
          cidade: "Guapiara",
          estado: "SP"
        },

        moedas: 0,

        termos: {
          aceito: true,
          data: new Date().toISOString(),
          versao: "2026.1"
        },

        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", user.uid), dadosCompletos);
      setUser(dadosCompletos);

      router.push("/");

    } catch (error) {
      console.error(error);
      alert("Erro ao salvar cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 pb-20">
      <div className="max-w-md mx-auto">

        <header className="mb-8 text-center">
          <div className="text-5xl mb-4">🛵</div>
          <h1 className="text-3xl font-black italic uppercase text-gray-800">
            Mestre Mogu
          </h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase mt-2">
            Finalize seu perfil para pedir em Guapiara
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* PESSOAL */}
          <div className="space-y-3">
            <h3 className="font-black text-red-600 uppercase text-xs ml-2">
              Quem é você?
            </h3>

            <input
              required
              type="text"
              placeholder="CPF (000.000.000-00)"
              value={formData.cpf}
              onChange={e => setFormData({ ...formData, cpf: e.target.value })}
              className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-500"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                required
                value={formData.genero}
                onChange={e => setFormData({ ...formData, genero: e.target.value })}
                className="bg-gray-100 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-500"
              >
                <option value="">Gênero</option>
                <option value="Masculino">Homem</option>
                <option value="Feminino">Mulher</option>
                <option value="NaoInformar">Ocultar</option>
              </select>

              <input
                type="text"
                placeholder="Profissão"
                value={formData.profissao}
                onChange={e => setFormData({ ...formData, profissao: e.target.value })}
                className="bg-gray-100 p-4 rounded-2xl font-bold outline-none"
              />
            </div>
          </div>

          {/* ENDEREÇO */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="font-black text-red-600 uppercase text-xs ml-2">
              Onde entregamos?
            </h3>

            <div className="flex gap-2">
              <input
                required
                type="text"
                placeholder="Sua Rua"
                className="flex-1 bg-gray-100 p-4 rounded-2xl font-bold outline-none"
                value={formData.rua}
                onChange={e => setFormData({ ...formData, rua: e.target.value })}
              />
              <input
                required
                type="text"
                placeholder="Nº"
                className="w-20 bg-gray-100 p-4 rounded-2xl font-bold outline-none"
                value={formData.numero}
                onChange={e => setFormData({ ...formData, numero: e.target.value })}
              />
            </div>

            <select
              required
              value={formData.bairroId}
              onChange={e => setFormData({ ...formData, bairroId: e.target.value })}
              className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none"
            >
              <option value="">Selecione seu bairro...</option>
              {listaBairros.map(b => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Ponto de Referência"
              className="w-full bg-gray-100 p-4 rounded-2xl font-bold outline-none"
              value={formData.referencia}
              onChange={e => setFormData({ ...formData, referencia: e.target.value })}
            />
          </div>

          {/* TERMOS */}
          <label className="flex items-start gap-3 p-3 cursor-pointer bg-gray-50 rounded-2xl">
            <input
              type="checkbox"
              required
              className="mt-1"
              checked={formData.termos}
              onChange={e => setFormData({ ...formData, termos: e.target.checked })}
            />

            <span className="text-[9px] font-bold text-gray-500 uppercase leading-tight">
              Eu li e aceito os{" "}
              <span
                onClick={() => router.push("/termos-de-uso")}
                className="text-red-600 underline cursor-pointer"
              >
                termos de uso
              </span>{" "}
              e a{" "}
              <span
                onClick={() => router.push("/privacidade")}
                className="text-red-600 underline cursor-pointer"
              >
                política de privacidade
              </span>.
            </span>
          </label>

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white p-5 rounded-[25px] font-black uppercase italic shadow-lg active:scale-95 transition-all"
          >
            {loading ? "Processando..." : "Finalizar e Começar"}
          </button>

        </form>
      </div>
    </div>
  );
}