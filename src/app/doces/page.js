import { Suspense } from "react";
import DocesClient from "./DocesClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Carregando doces...</div>}>
      <DocesClient />
    </Suspense>
  );
}