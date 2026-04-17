"use client";
import { useState, useEffect } from "react";
import { db, storage } from "../../../lib/firebase";
import { 
  collection, getDocs, doc, setDoc, addDoc, serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";

export default function AdminBannersCompleto() {
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState("");
  const [file, setFile] = useState(null);
  const [type, setType] = useState("image");
  const [loading, setLoading] = useState(false);

  // Estados para nova campanha
  const [novoNome, setNovoNome] = useState("");
  const [turno, setTurno] = useState("noite"); 
  const [diaSemana, setDiaSemana] = useState(0);

  const carregarCampanhas = async () => {
    const snap = await getDocs(collection(db, "banners_sets"));
    setSets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { carregarCampanhas(); }, []);

  const criarCampanha = async () => {
    if (!novoNome) return alert("Dê um nome!");
    let hInicio, hFim;
    // Lógica de horários incluindo Madrugada
    if (turno === "manha") { hInicio = 6; hFim = 11; }
    else if (turno === "tarde") { hInicio = 12; hFim = 17; }
    else if (turno === "noite") { hInicio = 18; hFim = 23; }
    else { hInicio = 0; hFim = 5; } 

    const idLimpo = novoNome.toLowerCase().replace(/\s+/g, '_');
    await setDoc(doc(db, "banners_sets", idLimpo), {
      nome: novoNome,
      ativo: true,
      tipo: "weekly_time",
      dias: [Number(diaSemana)],
      horaInicio: hInicio,
      horaFim: hFim,
      turno: turno
    });
    alert("Campanha criada!");
    setNovoNome("");
    carregarCampanhas();
  };

  const handleUploadBanner = async () => {
    if (!file || !selectedSet) return alert("Selecione arquivo e campanha!");
    setLoading(true);
    try {
      let arquivoFinal = file;
      if (type === "image") {
        const opcoes = { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true };
        arquivoFinal = await imageCompression(file, opcoes);
      }
      const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, arquivoFinal);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "banners_sets", selectedSet, "banners"), {
        type: type,
        src: url,
        ordem: 1,
        ativo: true,
        criadoEm: serverTimestamp()
      });
      alert("Sucesso!");
      setFile(null);
    } catch (e) { console.error(e); alert("Erro!"); }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white font-sans pb-20">
      <h1 className="text-4xl font-black italic uppercase text-orange-500 mb-2">Central de Banners</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-10">
        <section className="bg-zinc-900 p-10 rounded-[45px] border border-white/5">
          <h2 className="text-xl font-black italic mb-8 uppercase text-zinc-400">1. Nova Campanha</h2>
          <div className="space-y-6">
            <input type="text" placeholder="Nome da Campanha" value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full bg-black p-5 rounded-2xl font-bold" />
            <div className="grid grid-cols-2 gap-4">
              <select value={diaSemana} onChange={e => setDiaSemana(e.target.value)} className="bg-black p-5 rounded-2xl font-bold">
                <option value="0">Domingo</option><option value="1">Segunda</option><option value="2">Terça</option>
                <option value="3">Quarta</option><option value="4">Quinta</option><option value="5">Sexta</option><option value="6">Sábado</option>
              </select>
              <select value={turno} onChange={e => setTurno(e.target.value)} className="bg-black p-5 rounded-2xl font-bold">
                <option value="manha">☀️ Manhã</option><option value="tarde">⛅ Tarde</option>
                <option value="noite">🌙 Noite</option><option value="madrugada">🦇 Madrugada</option>
              </select>
            </div>
            <button onClick={criarCampanha} className="w-full bg-orange-500 py-5 rounded-[25px] font-black italic uppercase">Criar Campanha ➔</button>
          </div>
        </section>

        <section className="bg-zinc-900 p-10 rounded-[45px] border border-white/5">
          <h2 className="text-xl font-black italic mb-8 uppercase text-zinc-400">2. Enviar Mídia</h2>
          <div className="space-y-6">
            <select onChange={e => setSelectedSet(e.target.value)} className="w-full bg-black p-5 rounded-2xl font-bold">
              <option value="">Selecione a Campanha...</option>
              {sets.map(s => <option key={s.id} value={s.id}>{s.nome} ({s.turno})</option>)}
            </select>
            <div className="flex gap-4">
              <button onClick={() => setType("image")} className={`flex-1 py-4 rounded-2xl font-black italic ${type==='image'?'bg-emerald-500':'bg-black opacity-30'}`}>FOTO</button>
              <button onClick={() => setType("video")} className={`flex-1 py-4 rounded-2xl font-black italic ${type==='video'?'bg-emerald-500':'bg-black opacity-30'}`}>VÍDEO</button>
            </div>
            <input type="file" onChange={e => setFile(e.target.files[0])} className="w-full bg-black/50 p-8 rounded-[30px] border-2 border-dashed border-white/10 text-xs font-bold" />
            <button onClick={handleUploadBanner} disabled={loading} className="w-full bg-white text-black py-6 rounded-[30px] font-black uppercase italic shadow-2xl disabled:opacity-20 transition active:scale-95">
              {loading ? "PROCESSANDO..." : "SUBIR PARA O APP ➔"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}