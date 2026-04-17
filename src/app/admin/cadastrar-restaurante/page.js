"use client";
import { useState } from "react";
import { db, storage } from "../../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function GerenciarRestaurante() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // CORREÇÃO: Todos os campos iniciam com "" para evitar o erro de 'uncontrolled'
  const [form, setForm] = useState({
    id: "",
    name: "",
    category: "",
    logo: "",      // Foto da Fachada/Círculo
    banner: "",    // Foto da Equipe (Página Interna)
    aberto: true,
    chavePix: ""
  });

  // FUNÇÃO: UPLOAD RÁPIDO PARA O STORAGE
  const handleUpload = async (file, tipo) => {
    if (!file) return;
    if (!form.id) {
      alert("Por favor, digite o ID do restaurante ANTES de escolher a foto.");
      return;
    }
    
    setLoading(true);
    try {
      // Cria a pasta no Storage baseada no ID do restaurante
      const storageRef = ref(storage, `restaurantes/${form.id}/${tipo}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // Atualiza o formulário com o link real do Firebase
      setForm(prev => ({ ...prev, [tipo]: url }));
      alert(`${tipo.toUpperCase()} carregado com sucesso!`);
    } catch (err) {
      console.error(err);
      alert("Erro ao subir imagem. Verifique se você é Admin nas regras.");
    } finally {
      setLoading(false);
    }
  };

  // BUSCAR DADOS (Para editar um que já existe)
  const buscarRestaurante = async () => {
    if (!form.id) return alert("Digite um ID para buscar.");
    const docSnap = await getDoc(doc(db, "restaurants", form.id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Garante que campos inexistentes no banco não fiquem undefined
      setForm({
        id: form.id,
        name: data.name || "",
        category: data.category || "",
        logo: data.logo || "",
        banner: data.banner || "",
        aberto: data.aberto ?? true,
        chavePix: data.chavePix || ""
      });
      alert("Dados carregados!");
    } else {
      alert("ID disponível para novo cadastro.");
    }
  };

  const salvarNoBanco = async () => {
    if (!form.id || !form.name) return alert("ID e Nome são obrigatórios!");
    setLoading(true);
    try {
      await setDoc(doc(db, "restaurants", form.id), form);
      alert("Restaurante salvo com sucesso no PapáCash!");
    } catch (err) {
      console.error(err);
      alert("Erro de Permissão: Verifique se você adicionou 'isAdmin: true' no seu perfil do Firestore.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto font-sans bg-white min-h-screen pb-20">
      <header className="mb-8">
        <button onClick={() => router.back()} className="text-gray-400 font-bold mb-4">← Voltar</button>
        <h1 className="font-black uppercase italic text-2xl leading-none">⚙️ Gestão de<br/>Parceiros</h1>
      </header>
      
      <div className="flex flex-col gap-5">
        {/* BUSCA/ID */}
        <div className="flex gap-2">
          <input 
            placeholder="ID (ex: rute_gastronomia)" 
            className="flex-1 p-4 bg-gray-50 rounded-3xl border-2 border-gray-100 font-bold text-xs"
            value={form.id || ""}
            onChange={e => setForm({...form, id: e.target.value.toLowerCase().replace(/ /g, "_")})}
          />
          <button onClick={buscarRestaurante} className="bg-black text-white px-4 rounded-3xl text-[10px] font-black italic uppercase">Buscar</button>
        </div>

        <input 
          placeholder="Nome do Estabelecimento" 
          className="p-4 bg-gray-100 rounded-3xl font-bold" 
          value={form.name || ""} 
          onChange={e => setForm({...form, name: e.target.value})} 
        />
        
        <select 
          className="p-4 bg-gray-100 rounded-3xl font-bold text-xs appearance-none" 
          value={form.category || ""} 
          onChange={e => setForm({...form, category: e.target.value})}
        >
           <option value="">Selecione a Categoria</option>
           <option value="Almoço">Almoço (Guapiara)</option>
           <option value="Lanches">Lanches</option>
           <option value="Alta Gastronomia">Alta Gastronomia</option>
           <option value="Bolos">Bolos & Doces</option>
        </select>

        {/* UPLOADS DE FOTOS */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black uppercase italic text-gray-400 ml-2">📸 Fachada (Logo)</label>
            <input type="file" className="hidden" id="inputLogo" onChange={e => handleUpload(e.target.files[0], 'logo')} />
            <label htmlFor="inputLogo" className="cursor-pointer bg-blue-50 border-2 border-dashed border-blue-200 p-6 rounded-[35px] text-center flex flex-col items-center min-h-[120px] justify-center">
               {form.logo ? <img src={form.logo} className="w-16 h-16 rounded-full object-cover shadow-md" /> : <span className="text-[30px]">🏬</span>}
               <span className="text-[8px] font-black mt-2 uppercase">{loading ? 'Subindo...' : 'Trocar Foto'}</span>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black uppercase italic text-gray-400 ml-2">👥 Equipe (Banner)</label>
            <input type="file" className="hidden" id="inputBanner" onChange={e => handleUpload(e.target.files[0], 'banner')} />
            <label htmlFor="inputBanner" className="cursor-pointer bg-purple-50 border-2 border-dashed border-purple-200 p-6 rounded-[35px] text-center flex flex-col items-center min-h-[120px] justify-center">
               {form.banner ? <img src={form.banner} className="w-16 h-10 rounded-xl object-cover shadow-md" /> : <span className="text-[30px]">👨‍👩‍👧‍👦</span>}
               <span className="text-[8px] font-black mt-2 uppercase">{loading ? 'Subindo...' : 'Trocar Banner'}</span>
            </label>
          </div>
        </div>

        <input 
          placeholder="Chave PIX para Recebimento" 
          className="p-4 bg-gray-100 rounded-3xl font-bold" 
          value={form.chavePix || ""} 
          onChange={e => setForm({...form, chavePix: e.target.value})} 
        />

        <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[35px] mt-2 border border-gray-100">
          <span className="font-black italic uppercase text-[10px] text-gray-400">Status no App:</span>
          <button 
            onClick={() => setForm({...form, aberto: !form.aberto})}
            className={`px-8 py-3 rounded-full font-black text-[10px] shadow-sm transition-all ${form.aberto ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {form.aberto ? 'ESTÁ ABERTO' : 'ESTÁ FECHADO'}
          </button>
        </div>

        <button 
          onClick={salvarNoBanco}
          disabled={loading}
          className="mt-6 bg-red-600 text-white p-7 rounded-[40px] font-black uppercase italic shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Salvando Dados...' : '🚀 Finalizar Cadastro'}
        </button>
      </div>
    </div>
  );
}