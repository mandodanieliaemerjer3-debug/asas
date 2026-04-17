"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, storage } from "../../../../lib/firebase"; // Certifique-se de ter o storage exportado
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import listaRestaurantes from "../../../../data/restaurantes.json";

export default function PixComprovantePage() {
  const { id } = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState(null);
  const [chaveRestaurante, setChaveRestaurante] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState(null);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "orders", id), (docSnap) => {
      if (docSnap.exists()) {
        const dados = docSnap.data();
        setPedido(dados);
        
        // Busca a chave Pix no JSON pelo ID do restaurante do primeiro item do pedido
        const restId = dados.itens[0]?.restaurantId;
        const restInfo = listaRestaurantes.find(r => r.id === restId);
        setChaveRestaurante(restInfo?.chavePix || null);
      }
    });
    return () => unsub();
  }, [id]);

  const handleUpload = async () => {
    if (!arquivo) return alert("Selecione o comprovante primeiro!");
    setUploading(true);

    try {
      const storageRef = ref(storage, `comprovantes/${id}/${arquivo.name}`);
      await uploadBytes(storageRef, arquivo);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "orders", id), {
        comprovanteUrl: url,
        status: "Comprovante Enviado",
        pagoEm: new Date().toISOString()
      });

      alert("Comprovante enviado com sucesso!");
      router.push("/perfil");
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  };

  if (!chaveRestaurante && pedido) return (
    <div className="p-10 text-center font-black uppercase text-red-500">
      Este restaurante não aceita Pix no momento.
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 max-w-md mx-auto p-6 font-sans">
      <header className="text-center mb-6">
        <h1 className="font-black italic uppercase text-2xl">Pagamento via Pix</h1>
        <p className="text-[10px] font-black text-gray-400">REST: {pedido?.itens[0]?.restaurantId}</p>
      </header>

      <section className="bg-white p-6 rounded-[32px] shadow-sm border mb-6 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase">Copie a chave Pix do restaurante</p>
        <div className="mt-2 p-4 bg-gray-100 rounded-2xl font-mono text-sm break-all select-all">
          {chaveRestaurante}
        </div>
        <p className="mt-4 text-2xl font-black text-red-600 italic">R$ {pedido?.valores?.total.toFixed(2)}</p>
      </section>

      {/* ÁREA DE UPLOAD */}
      <section className="bg-white p-6 rounded-[32px] shadow-sm border border-dashed border-red-200">
        <h2 className="text-xs font-black uppercase text-gray-800 mb-4 text-center">Anexar Comprovante</h2>
        
        <label className="flex flex-col items-center justify-center w-full h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <span className="text-3xl mb-2">📄</span>
            <p className="text-[10px] font-black text-gray-400 uppercase">
              {arquivo ? arquivo.name : "Toque para selecionar PDF ou Imagem"}
            </p>
          </div>
          <input type="file" className="hidden" accept="image/*,application/pdf" 
            onChange={(e) => setArquivo(e.target.files[0])} 
          />
        </label>

        <button 
          onClick={handleUpload}
          disabled={uploading || !arquivo}
          className="w-full mt-6 bg-red-600 text-white py-4 rounded-2xl font-black uppercase italic shadow-lg active:scale-95 transition disabled:bg-gray-300"
        >
          {uploading ? "Enviando..." : "Enviar Comprovante"}
        </button>
      </section>
    </main>
  );
}