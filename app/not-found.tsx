import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wiki-paper p-6">
      <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">404</p>
      <h1 className="wiki-page-title mt-2">Entrada no encontrada</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-wiki-muted">
        El artículo o recurso que intentaste abrir todavía no existe en esta wiki o no está publicado.
      </p>
      <div className="mt-6">
        <Link href="/" className="wiki-link font-semibold">
          Volver a la portada
        </Link>
      </div>
    </section>
  );
}
