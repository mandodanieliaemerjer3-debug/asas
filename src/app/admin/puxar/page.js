"use client";

import { useEffect, useMemo, useState } from "react";

import { db } from "../../../lib/firebase";

import {
  collection,
  getDocs
} from "firebase/firestore";

export default function ExportadorCardapios() {

  // =========================
  // STATES
  // =========================
  const [produtos, setProdutos] = useState([]);

  const [restaurantes, setRestaurantes] =
    useState([]);

  const [restauranteSelecionado,
    setRestauranteSelecionado] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  // =========================
  // CARREGAR PRODUTOS
  // =========================
  useEffect(() => {

    async function carregar() {

      try {

        const snap = await getDocs(
          collection(db, "products")
        );

        const lista = snap.docs.map(doc => ({

          firebaseId: doc.id,

          ...doc.data()

        }));

        setProdutos(lista);

        // =========================
        // PEGAR RESTAURANTES
        // =========================
        const mapa = {};

        lista.forEach(produto => {

          const id =
            produto.restaurantId ||
            "sem_restaurante";

          if (!mapa[id]) {

            mapa[id] = {

              id,

              name:
                produto.restaurantName ||
                id

            };

          }

        });

        setRestaurantes(
          Object.values(mapa)
        );

      } catch (erro) {

        console.error(
          "Erro ao carregar produtos:",
          erro
        );

      } finally {

        setCarregando(false);

      }

    }

    carregar();

  }, []);

  // =========================
  // PRODUTOS FILTRADOS
  // =========================
  const produtosFiltrados =
    useMemo(() => {

      if (!restauranteSelecionado)
        return [];

      return produtos.filter(

        produto =>

          produto.restaurantId ===
          restauranteSelecionado

      );

    }, [
      produtos,
      restauranteSelecionado
    ]);

  // =========================
  // LIMPAR TEXTO
  // =========================
  const limparTexto = (texto = "") => {

    return texto
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  };

  // =========================
  // EXPORTAR JSON
  // =========================
  const exportarJson = () => {

    if (!restauranteSelecionado) {

      alert(
        "Selecione um restaurante"
      );

      return;

    }

    const produtosJson =
      produtosFiltrados.map((
        produto,
        index
      ) => {

        const nome =
          limparTexto(
            produto.name || ""
          );

        const descricao =
          limparTexto(
            produto.description || ""
          );

        const tags =
          limparTexto(
            produto.tags || ""
          );

        // =========================
        // DETECÇÕES
        // =========================
        const textoCompleto =
          `${nome} ${descricao} ${tags}`
          .toLowerCase();

        const isPizza =
          textoCompleto.includes(
            "pizza"
          );

        const isHamburguer =
          textoCompleto.includes(
            "hamburg"
          );

        const isCombo =
          textoCompleto.includes(
            "combo"
          );

        // =========================
        // JSON SUPER LEVE
        // =========================
        return {

          // ID FIREBASE
          id:
            produto.firebaseId,

          // NOME
          n: nome,

          // DESCRIÇÃO
          d: descricao,

          // PREÇO
          p:
            Number(
              produto.price
            ) || 0,

          // MOEDAS
          cp:
            Number(
              produto.coinPrice
            ) || 0,

          // IMAGEM
          img:
            produto.image || "",

          // TAGS
          t: tags,

          // CATEGORIA
          c:
            produto.category || "",

          // CUSTOMIZAÇÃO
          custom:

            !!produto.listaOpcoes ||

            !!produto.permiteMeioAMeio ||

            false,

          // FORMA
          f:
            produto.forma || "",

          // FLAGS
          pizza: isPizza,

          burguer: isHamburguer,

          combo: isCombo

        };

      });

    // =========================
    // JSON FINAL
    // =========================
    const restaurante =
      restaurantes.find(

        r =>
          r.id ===
          restauranteSelecionado

      );

    const jsonFinal = {

      restaurant: {

        id:
          restaurante?.id || "",

        name:
          restaurante?.name || ""

      },

      updatedAt:
        new Date()
          .toISOString(),

      total:
        produtosJson.length,

      products:
        produtosJson

    };

    // =========================
    // EXPORTAR
    // =========================
    const json =
      JSON.stringify(
        jsonFinal,
        null,
        2
      );

    const blob =
      new Blob(
        [json],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `${restauranteSelecionado}.json`;

    a.click();

    URL.revokeObjectURL(url);

    alert(
      "JSON exportado!"
    );

  };

  // =========================
  // TELA
  // =========================
  return (

    <main className="
      min-h-screen
      bg-white
      p-6
    ">

      <div className="
        max-w-3xl
        mx-auto
      ">

        {/* ========================= */}
        {/* TITULO */}
        {/* ========================= */}
        <h1 className="
          text-3xl
          font-black
          mb-2
        ">
          Exportador JSON
        </h1>

        <p className="
          text-gray-500
          mb-8
        ">
          Exporta cardápios
          leves otimizados
          para produção.
        </p>

        {/* ========================= */}
        {/* STATUS */}
        {/* ========================= */}
        <div className="
          bg-gray-100
          rounded-2xl
          p-6
          mb-6
        ">

          <div className="
            flex
            justify-between
            mb-3
          ">

            <span className="
              font-bold
            ">
              Produtos:
            </span>

            <span>
              {produtos.length}
            </span>

          </div>

          <div className="
            flex
            justify-between
          ">

            <span className="
              font-bold
            ">
              Restaurantes:
            </span>

            <span>
              {restaurantes.length}
            </span>

          </div>

        </div>

        {/* ========================= */}
        {/* SELECT */}
        {/* ========================= */}
        <div className="
          mb-6
        ">

          <label className="
            block
            font-black
            mb-2
          ">
            Restaurante
          </label>

          <select

            value={
              restauranteSelecionado
            }

            onChange={(e) =>
              setRestauranteSelecionado(
                e.target.value
              )
            }

            className="
              w-full
              border
              rounded-2xl
              p-4
              font-bold
            "
          >

            <option value="">
              Selecione
            </option>

            {restaurantes.map(
              restaurante => (

              <option
                key={restaurante.id}
                value={restaurante.id}
              >

                {restaurante.name}
                {" - "}
                {restaurante.id}

              </option>

            ))}

          </select>

        </div>

        {/* ========================= */}
        {/* BOTÃO */}
        {/* ========================= */}
        <button

          onClick={exportarJson}

          disabled={
            carregando ||
            !restauranteSelecionado
          }

          className="
            w-full
            bg-black
            text-white
            py-4
            rounded-2xl
            font-black
            text-sm
            uppercase
            hover:scale-[1.02]
            transition-all
            disabled:opacity-50
          "
        >

          EXPORTAR JSON

        </button>

        {/* ========================= */}
        {/* PREVIEW */}
        {/* ========================= */}
        <div className="
          mt-10
        ">

          <h2 className="
            font-black
            text-xl
            mb-4
          ">
            Prévia
          </h2>

          <div className="
            grid
            gap-4
          ">

            {produtosFiltrados
              .slice(0, 5)
              .map(produto => (

              <div

                key={
                  produto.firebaseId
                }

                className="
                  border
                  rounded-2xl
                  p-4
                  flex
                  gap-4
                "
              >

                <img

                  src={
                    produto.image
                  }

                  alt=""

                  className="
                    w-20
                    h-20
                    rounded-xl
                    object-cover
                  "
                />

                <div className="
                  flex-1
                ">

                  <h3 className="
                    font-black
                  ">
                    {produto.name}
                  </h3>

                  <p className="
                    text-sm
                    text-gray-500
                    line-clamp-2
                  ">
                    {
                      produto.description
                    }
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </main>

  );

}