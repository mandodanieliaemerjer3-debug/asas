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
              numero: userData.endereco.numero || ""
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

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const totalDoces = docesCart.reduce((acc, item) => acc + item.preco, 0);

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
      const novoPedido = {
        clienteNome: user?.displayName || "Cliente",
        clienteId: user?.uid || "anonimo",
        endereco: { ...address, bairro: selectedBairro.name, bairroId: selectedBairro.id },
        itens: cart,
        doces: docesCart,
        moedas: {
          usadas: totalDoces,
          geradas: moedasPrevistas
        },
        valores: { subtotal, taxaEntrega: taxaFinal, total: totalGeral },
        status: "Pendente",
        pago: false
      };

      const docRef = await addDoc(collection(db, "orders"), novoPedido);

      localStorage.removeItem("carrinho");
      localStorage.removeItem("docesCarrinho");

      router.push(`/pagamento/${docRef.id}`);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar.");
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto p-4 pb-40 font-sans">
      <h1 className="font-black text-xl mb-4">Revisar Pedido</h1>

      {/* BANNER */}
      <img src="/banner-doces.png" className="w-full h-24 object-cover rounded-2xl mb-4" />

      {/* FRETE */}
      <div className="bg-pink-100 border p-4 rounded-2xl mb-4">
        <p className="font-bold text-pink-700">🍰 Ganhe 100% do frete</p>
        <p className="text-sm">Use até {moedasPrevistas} moedas em sobremesas</p>
        <button
          onClick={() => router.push(`/doces?credito=${moedasPrevistas}`)}
          className="mt-2 w-full bg-pink-500 text-white p-3 rounded-xl font-bold"
        >
          Escolher sobremesa
        </button>
      </div>

      {/* ENDEREÇO + BAIRRO */}
      <div className="bg-white p-4 rounded-2xl mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-bold">Endereço</p>
          <button onClick={() => setEditandoEndereco(!editandoEndereco)} className="text-sm text-blue-500">
            {editandoEndereco ? "Fechar" : "Alterar"}
          </button>
        </div>

        {editandoEndereco ? (
          <>
            <input
              value={address.rua}
              onChange={e => setAddress({ ...address, rua: e.target.value })}
              placeholder="Rua"
              className="w-full border p-2 rounded mb-2"
            />
            <input
              value={address.numero}
              onChange={e => setAddress({ ...address, numero: e.target.value })}
              placeholder="Número"
              className="w-full border p-2 rounded mb-2"
            />

            <button
              onClick={() => setMostrarBairros(!mostrarBairros)}
              className="w-full bg-gray-100 p-2 rounded"
            >
              {selectedBairro ? selectedBairro.name : "Selecionar bairro"}
            </button>

            {mostrarBairros && (
              <div className="mt-2 max-h-40 overflow-auto border rounded">
                {neighborhoods.map(b => (
                  <div
                    key={b.id}
                    onClick={() => selecionarBairro(b)}
                    className="p-2 border-b cursor-pointer hover:bg-gray-100"
                  >
                    {b.name} - R$ {b.fee}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm">{address.rua}, {address.numero}</p>
            <p className="text-xs text-gray-500">{selectedBairro?.name}</p>
          </>
        )}
      </div>

      {/* ITENS */}
      <div className="bg-white p-4 rounded-2xl mb-4">
        <p className="font-bold mb-2">🛒 Seu pedido</p>
        {cart.map((item, i) => (
          <p key={i} className="text-sm">{item.name} - R$ {item.price}</p>
        ))}
      </div>

      {/* DOCES */}
      {docesCart.length > 0 && (
        <div className="bg-white p-4 rounded-2xl mb-4">
          <p className="font-bold mb-2">🍫 Sobremesas</p>
          {docesCart.map((d, i) => (
            <p key={i} className="text-sm">{d.nome} - {d.preco} moedas</p>
          ))}
        </div>
      )}

      {/* RESUMO */}
      <div className="bg-white p-4 rounded-2xl mb-4">
        <p>Subtotal: R$ {subtotal.toFixed(2)}</p>
        <p>Entrega: R$ {taxaFinal.toFixed(2)}</p>
        <p className="font-bold">Total: R$ {totalGeral.toFixed(2)}</p>
      </div>

      {/* BOTÃO */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white max-w-md mx-auto">
        <button onClick={confirmarPedido} className="w-full bg-black text-white p-4 rounded-2xl font-bold">
          Ir para pagamento ➔
        </button>
      </div>
    </div>
  );
}
