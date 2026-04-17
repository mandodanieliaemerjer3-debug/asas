"use client";
import { useState, useEffect } from "react";
import { db, storage } from "../../../lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";

export default function AdminBanners() {
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState("");
  const [file, setFile] = useState(null);
  const [type, setType] = useState("image");
  const [loading, setLoading] = useState(false);

  // 1. Carrega os conjuntos de campanhas (domingo, natal, etc)
  useEffect(() => {
    const loadSets = async () => {
      const snap = await getDocs(collection(db, "banners_sets"));
      setSets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadSets();
  }, []);

  const handleUpload = async () => {
    if (!file || !selectedSet) return alert("Selecione o arquivo e a campanha!");
    setLoading(true);

    try {
      let fileToUpload = file;

      // 2. Lógica de Compressão de Imagem
      if (type === "image") {
        const options = {
          maxSizeMB: 0.2, // Reduz para no máximo 200kb (muito leve!)
          maxWidthOrHeight: 1280,
          useWebWorker: true
        };
        fileToUpload = await imageCompression(file, options);
      }

      // 3. Upload para o Storage na pasta banners/
      const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, fileToUpload);
      const url = await getDownloadURL(storageRef);

      // 4. Cadastro Automático no Firestore
      await addDoc(collection(db, "banners_sets", selectedSet, "banners"), {
        type: type,
        src: url,
        ordem: 1,
        ativo: true,
        criadoEm: serverTimestamp()
      });

      alert("Banner cadastrado com sucesso!");
      setFile(null);
    } catch (e) {
      console.error(e);
      alert("Erro no upload.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-black italic uppercase text-orange-500">Gerenciador de Banners</h1>
        <p className="text-[10px] font-bold opacity-30 uppercase">Upload & Otimização Mogu Mogu</p>
      </header>

      <section className="max-w-xl bg-zinc-900 p-10 rounded-[40px] border border-white/5 space-y-6">
        {/* Escolha da Campanha */}
        <div>
          <label className="text-[10px] font-black uppercase opacity-40 ml-2 italic">1. Escolha a Campanha (Conjunto)</label>
          <select 
            onChange={(e) => setSelectedSet(e.target.value)}
            className="w-full bg-black p-5 rounded-2xl border-none font-bold mt-2"
          >
            <option value="">Selecione...</option>
            {sets.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>

        {/* Tipo de Mídia */}
        <div>
          <label className="text-[10px] font-black uppercase opacity-40 ml-2 italic">2. Tipo de Mídia</label>
          <div className="flex gap-4 mt-2">
            <button onClick={() => setType("image")} className={`flex-1 py-4 rounded-2xl font-black italic ${type === 'image' ? 'bg-orange-500' : 'bg-black opacity-30'}`}>IMAGEM</button>
            <button onClick={() => setType("video")} className={`flex-1 py-4 rounded-2xl font-black italic ${type === 'video' ? 'bg-orange-500' : 'bg-black opacity-30'}`}>VÍDEO</button>
          </div>
        </div>

        {/* Arquivo */}
        <div>
          <label className="text-[10px] font-black uppercase opacity-40 ml-2 italic">3. Selecionar Arquivo</label>
          <input 
            type="file" 
            accept={type === 'image' ? 'image/*' : 'video/*'}
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full mt-2 bg-black/50 p-10 rounded-[30px] border-2 border-dashed border-white/10 text-xs font-bold"
          />
        </div>

        <button 
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-white text-black py-6 rounded-[30px] font-black uppercase italic shadow-2xl active:scale-95 transition disabled:opacity-20"
        >
          {loading ? "COMPRIMINDO & SUBINDO..." : "CADASTRAR BANNER ➔"}
        </button>
      </section>
    </main>
  );
}