import { Suspense } from "react";
import VerTodosClient from "./VerTodosClient";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="p-10 text-center font-bold">
        Carregando...
      </div>
    }>
      <VerTodosClient />
    </Suspense>
  );
}