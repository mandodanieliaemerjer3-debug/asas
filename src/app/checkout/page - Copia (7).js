"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs, getDoc, doc, addDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [cart, setCart] = useState([]);
  const [docesCart, setDocesCart] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBairro, setSelectedBairro] = useState(null);
  const [taxaFinal, setTaxaFinal] = useState(0);
  const [address, setAddress] = useState({ rua: "", numero: "" });
  const [editandoEndereco, setEditandoEndereco] = useState(false);
  const [mostrarBairros, setMostrarBairros] = useState(false);

  useEffect(() => {
    const init = async () => {
      const savedCart = localStorage.getItem("carrinho");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedDoces = localStorage.getItem("docesCarrinho");
      if (savedDoces) setDocesCart(JSON.parse(savedDoces));

      const querySnap = await getDocs(collection(db, "neighborhoods"));
      const bairrosList = querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNeighborhoods(bairrosList);

      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.endereco) {
            setAddress({
              rua: userData.endereco.rua || "",
              numero: userData.numero || ""
            });

            if (userData.endereco.bairroId) {
              const bairroSalvo = bairrosList.find(
                b => b.id === userData.endereco.bairroId
              );
              if (bairroSalvo) {
                setSelectedBairro(bairroSalvo);
                setTaxaFinal(bairroSalvo.fee || 0);
              }
            }
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const selecionarBairro = (bairro) => {
    setSelectedBairro(bairro);
    setTaxaFinal(bairro.fee || 0);
    setMostrarBairros(false);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price || 0), 0);
  const totalDoces = docesCart.reduce((acc, item) => acc + (item.preco || 0), 0);
  const moedasPrevistas = Math.floor(taxaFinal);
  const totalGeral = subtotal + taxaFinal;

  const confirmarPedido = async () => {
    if (!selectedBairro || !address.rua) return alert("Verifique o endereço.");
    if (cart.length === 0) return alert("Carrinho vazio!");

    if (docesCart.length === 0) {
      const confirmar = confirm("Você não escolheu sobremesa. Tem certeza que quer perder esse benefício?");
      if (!confirmar) return;
    }
    
    setLoading(true);

    try {
      // ✨ LIMPEZA: Pegamos apenas o essencial para o histórico, removendo descrições e tags
      const itensLimpos = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image, // Mantém a foto para o charme do histórico
        quantidade: item.quantidade || 1
      }));

      const novoPedido = {
        clienteNome: user?.displayName || "Cliente",
        clienteId: user?.uid || "anonimo",
        endereco: { 
          ...address, 
          bairro: selectedBairro.name, 
          bairroId: selectedBairro.id 
        },
        itens: itensLimpos,
        doces: docesCart,
        moedas: {
          usadas: totalDoces,
          geradas: moedasPrevistas
        },
        valores: { 
          subtotal, 
          taxaEntrega: taxaFinal, 
          total: totalGeral 
        },
        // 🔥 NOVOS STATUS SEPARADOS
        statusPagamento: "pendente",
        statusEntrega: "aguardando",
        pago: false,
        criadoEm: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "orders"), novoPedido);

      localStorage.removeItem("carrinho");
      localStorage.removeItem("docesCarrinho");

      router.push(`/pagamento/${docRef.id}`);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar o pedido.");
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-pink-500">Carregando Mogu Mogu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto p-4 pb-40 font-sans">
      <h1 className="font-black text-2xl mb-4 italic">Revisar Pedido</h1>

      {/* BANNER ESTILO MOGU */}
      <img src="/banner-doces.png" className="w-full h-24 object-cover rounded-2xl mb-4 shadow-sm" />

      {/* CARD DE BENEFÍCIO FRETE/DOCES */}
      <div className="bg-pink-100 border-2 border-pink-200 p-4 rounded-3xl mb-4">
        <p className="font-black text-pink-700 text-lg">🍰 Ganhe 100% do frete</p>
        <p className="text-sm text-pink-600 font-medium">Use até {moedasPrevistas} moedas em sobremesas</p>
        <button
          onClick={() => router.push(`/doces?credito=${moedasPrevistas}`)}
          className="mt-3 w-full bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-2xl font-black transition-all"
        >
          ESCOLHER SOBREMESA
        </button>
      </div>

      {/* ENDEREÇO + BAIRRO */}
      <div className="bg-white p-5 rounded-3xl mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <p className="font-black text-gray-800">📍 Onde entregamos?</p>
          <button onClick={() => setEditandoEndereco(!editandoEndereco)} className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
            {editandoEndereco ? "FECHAR" : "ALTERAR"}
          </button>
        </div>

        {editandoEndereco ? (
          <div className="space-y-2">
            <input
              value={address.rua}
              onChange={e => setAddress({ ...address, rua: e.target.value })}
              placeholder="Sua rua"
              className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-black outline-none transition-all"
            />
            <input
              value={address.numero}
              onChange={e => setAddress({ ...address, numero: e.target.value })}
              placeholder="Número / Complemento"
              className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-black outline-none transition-all"
            />

            <button
              onClick={() => setMostrarBairros(!mostrarBairros)}
              className="w-full bg-gray-50 border-2 border-dashed border-gray-200 p-3 rounded-xl font-bold text-gray-600"
            >
              {selectedBairro ? `Bairro: ${selectedBairro.name}` : "Selecionar bairro"}
            </button>

            {mostrarBairros && (
              <div className="mt-2 max-h-40 overflow-auto border-2 border-gray-100 rounded-xl divide-y divide-gray-50">
                {neighborhoods.map(b => (
                  <div
                    key={b.id}
                    onClick={() => selecionarBairro(b)}
                    className="p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                  >
                    <span className="font-bold text-sm text-gray-700">{b.name}</span>
                    <span className="text-xs font-black text-green-600">R$ {b.fee}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded-2xl">
            <p className="text-sm font-bold text-gray-700">{address.rua || "Defina a rua"}, {address.numero || "nº"}</p>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{selectedBairro?.name || "Bairro não selecionado"}</p>
          </div>
        )}
      </div>

      {/* ITENS DO PEDIDO */}
      <div className="bg-white p-5 rounded-3xl mb-4 shadow-sm">
        <p className="font-black mb-3 text-gray-800">🛒 Itens Selecionados</p>
        <div className="space-y-3">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
              <span className="text-sm font-medium text-gray-600">{item.name}</span>
              <span className="text-sm font-black text-gray-800">R$ {item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SOBREMESAS (DOCES) */}
      {docesCart.length > 0 && (
        <div className="bg-white p-5 rounded-3xl mb-4 shadow-sm border-2 border-pink-50">
          <p className="font-black mb-3 text-pink-500">🍫 Doces (Resgate)</p>
          <div className="space-y-2">
            {docesCart.map((d, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">{d.nome}</span>
                <span className="text-xs font-black bg-pink-100 text-pink-600 px-2 py-1 rounded-lg">-{d.preco} moedas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESUMO FINANCEIRO */}
      <div className="bg-white p-5 rounded-3xl mb-4 shadow-sm">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Taxa de Entrega</span>
            <span>R$ {taxaFinal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>R$ {totalGeral.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* BOTÃO FIXO FINAL */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto z-50">
        <button 
          onClick={confirmarPedido} 
          disabled={loading}
          className="w-full bg-black hover:scale-[1.02] active:scale-[0.98] text-white p-4 rounded-3xl font-black text-lg transition-all shadow-xl disabled:bg-gray-400"
        >
          {loading ? "PROCESSANDO..." : "FECHAR PEDIDO ➔"}
        </button>
      </div>
    </div>
  );
}