"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "../../../../lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import listaRestaurantes from "../../../../data/restaurantes.json";

export default function PixCompletoPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [pedido, setPedido] = useState(null);
  const [chavePix, setChavePix] = useState(null);
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "orders", id), (docSnap) => {
      if (docSnap.exists()) {
        const dados = docSnap.data();
        setPedido(dados);
        
        // Busca chave Pix no JSON pelo restaurante do primeiro item
        const restId = dados.itens?.[0]?.restaurantId;
        const restInfo = listaRestaurantes.find(r => r.id === restId);
        setChavePix(restInfo?.chavePix || null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  // FUNÇÃO DE COMPRESSÃO (Reduz imagens de 1MB para ~150KB)
  const comprimirImagem = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1000;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          }, "image/jpeg", 0.7);
        };
      };
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArquivo(file);
      if (file.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
    }
  };

  const copiarChave = () => {
    navigator.clipboard.writeText(chavePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const finalizarPagamento = async () => {
    if (!arquivo) return alert("Anexe o comprovante!");
    setUploading(true);

    try {
      let arquivoFinal = arquivo;
      if (arquivo.type.startsWith("image/")) {
        arquivoFinal = await comprimirImagem(arquivo);
      }

      // Salva em pasta organizada por ID do pedido
      const storageRef = ref(storage, `comprovantes/${id}/${arquivoFinal.name}`);
      await uploadBytes(storageRef, arquivoFinal);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "orders", id), {
        comprovanteUrl: url,
        status: "Aguardando Verificação",
        formaPagamento: "Pix",
        pagoEm: new Date().toISOString()
      });

      alert("Comprovante enviado! Estamos verificando.");
      router.push("/perfil");
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase">Carregando...</div>;

  return (
    <main className="min-h-screen bg-gray-50 max-w-md mx-auto font-sans pb-20">
      <header className="bg-white p-6 rounded-b-[40px] shadow-sm border-b text-center">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">⚡</div>
        <h1 className="font-black italic uppercase text-2xl tracking-tighter">Pagamento Pix</h1>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pedido: {id?.slice(-6)}</p>
      </header>

      <div className="p-4 space-y-6">
        {/* INFO DA CHAVE */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-teal-500 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase italic">Copia e Cola</div>
          
          <p className="text-[10px] font-black text-gray-400 uppercase mb-4">Pague agora para liberar</p>
          <p className="text-4xl font-black text-gray-900 italic mb-6 leading-none">R$ {pedido?.valores?.total.toFixed(2)}</p>
          
          <div onClick={copiarChave} className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer active:scale-95 transition">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Chave do Restaurante</p>
            <p className="font-mono text-xs text-gray-800 break-all">{chavePix || "Indisponível"}</p>
            {copiado && <p className="text-teal-500 text-[8px] font-black uppercase mt-2 animate-bounce">Copiado!</p>}
          </div>
        </section>

        {/* UPLOAD DO COMPROVANTE */}
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
          <h2 className="text-[10px] font-black uppercase text-gray-400 mb-4 text-center tracking-widest">Anexar Comprovante</h2>
          
          <label className="relative flex flex-col items-center justify-center w-full min-h-[160px] bg-gray-50 rounded-[28px] border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            ) : null}
            
            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <span className="text-4xl mb-2">{arquivo ? '✅' : '📁'}</span>
              <p className="text-[10px] font-black text-gray-600 uppercase leading-tight">
                {arquivo ? arquivo.name : "Toque para selecionar imagem ou PDF"}
              </p>
            </div>
            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileSelect} />
          </label>

          <button 
            onClick={finalizarPagamento}
            disabled={uploading || !arquivo}
            className="w-full mt-6 bg-red-600 text-white py-5 rounded-[24px] font-black uppercase italic shadow-xl shadow-red-100 active:scale-95 transition disabled:bg-gray-200"
          >
            {uploading ? "Enviando Dados..." : "Confirmar Pagamento"}
          </button>
        </section>
      </div>
    </main>
  );
}