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
      const confirmar = confirm("Você não escolheu sobremesa. Tem certeza?");
      if (!confirmar) return;
    }
    
    setLoading(true);

    try {
      const itensLimpos = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantidade: item.quantidade || 1
      }));

      const novoPedido = {
        clienteNome: user?.displayName || "Cliente",
        clienteId: user?.uid || "anonimo",
        codigoEntrega: Math.floor(1000 + Math.random() * 9000),
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

      <img src="/banner-doces.png" className="w-full h-24 object-cover rounded-2xl mb-4 shadow-sm" />

      {/* 🛒 LISTA DE ITENS */}
      <div className="bg-white p-4 rounded-2xl mb-4 shadow-sm">
        <p className="font-bold mb-2">🛒 Seus itens</p>
        {cart.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum item no carrinho</p>
        ) : (
          cart.map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <img src={item.image} className="w-14 h-14 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-bold text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">Qtd: {item.quantidade || 1}</p>
              </div>
              <p className="font-black text-sm">R$ {item.price}</p>
            </div>
          ))
        )}
      </div>

      {/* 🍰 DOCES */}
      <div className="bg-white p-4 rounded-2xl mb-4 shadow-sm">
        <p className="font-bold mb-2">🍰 Sobremesas</p>
        {docesCart.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma sobremesa escolhida</p>
        ) : (
          docesCart.map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <img src={item.imagem} className="w-14 h-14 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="font-bold text-sm">{item.nome}</p>
              </div>
              <p className="font-black text-sm">R$ {item.preco}</p>
            </div>
          ))
        )}
      </div>

      {/* 🍰 BENEFÍCIO DOCES */}
      <div className="bg-pink-100 border-2 border-pink-200 p-4 rounded-3xl mb-4">
        <p className="font-black text-pink-700 text-lg">🍰 Ganhe 100% do frete</p>
        <p className="text-sm text-pink-600 font-medium">Use até {moedasPrevistas} moedas em sobremesas</p>
        <button
          onClick={() => router.push(`/doces?credito=${moedasPrevistas}`)}
          className="mt-3 w-full bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-2xl font-black"
        >
          ESCOLHER SOBREMESA
        </button>
      </div>

      {/* 📍 ENDEREÇO */}
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
              className="w-full border-2 border-gray-100 p-3 rounded-xl"
            />
            <input
              value={address.numero}
              onChange={e => setAddress({ ...address, numero: e.target.value })}
              placeholder="Número"
              className="w-full border-2 border-gray-100 p-3 rounded-xl"
            />

            <button
              onClick={() => setMostrarBairros(!mostrarBairros)}
              className="w-full bg-gray-50 border-2 border-dashed border-gray-200 p-3 rounded-xl font-bold"
            >
              {selectedBairro ? `Bairro: ${selectedBairro.name}` : "Selecionar bairro"}
            </button>

            {mostrarBairros && (
              <div className="mt-2 max-h-40 overflow-auto border-2 border-gray-100 rounded-xl">
                {neighborhoods.map(b => (
                  <div key={b.id} onClick={() => selecionarBairro(b)} className="p-3 cursor-pointer flex justify-between">
                    <span>{b.name}</span>
                    <span>R$ {b.fee}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded-2xl">
            <p>{address.rua || "Defina a rua"}, {address.numero || "nº"}</p>
            <p className="text-xs text-gray-400">{selectedBairro?.name || "Bairro não selecionado"}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t max-w-md mx-auto">
        <button 
          onClick={confirmarPedido} 
          disabled={loading}
          className="w-full bg-black text-white p-4 rounded-3xl font-black"
        >
          {loading ? "PROCESSANDO..." : "FECHAR PEDIDO ➔"}
        </button>
      </div>
    </div>
  );
}
