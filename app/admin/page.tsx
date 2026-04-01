import Link from "next/link";

import { EditorAccessNotice } from "@/components/editor-access-notice";
import { EditorAuthRequired } from "@/components/editor-auth-required";
import { requireEditorPageAccess } from "@/lib/editor/auth";

const cards = [
  {
    href: "/admin/config",
    title: "Configurar wiki",
    description: "Editar eras, categorías, bloques y textos visibles de la experiencia pública."
  },
  {
    href: "/admin/import",
    title: "Importar fichas",
    description: "Subir y normalizar lotes .docx del CEA antes de guardarlos en staging."
  },
  {
    href: "/admin/review",
    title: "Cola editorial",
    description: "Revisar payloads normalizados, warnings y decidir qué promover."
  },
  {
    href: "/admin/articles",
    title: "Publicaciones",
    description: "Mover artículos entre draft, review y published sin exponer el panel al público."
  },
  {
    href: "/admin/countries",
    title: "Países",
    description: "Editar perfiles, bloques y scorecards de países o regiones con snapshots por era."
  },
  {
    href: "/",
    title: "Ver wiki pública",
    description: "Abrir la experiencia que verá el usuario normal, sin navegación editorial."
  }
];

export default async function AdminDashboardPage() {
  const access = await requireEditorPageAccess("/admin");

  if (!access.allowed) {
    return <EditorAuthRequired access={access} />;
  }

  return (
    <section className="space-y-6">
      <EditorAccessNotice access={access} />

      <header className="wiki-paper p-5 md:p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Panel admin</p>
        <h1 className="wiki-page-title mt-2">Operaciones editoriales</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
          Este entorno está separado de la wiki pública. Desde aquí se importa, revisa y publica
          contenido sin mezclar navegación administrativa con la vista de delegados o lectores.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="wiki-paper block p-5 transition-transform hover:-translate-y-0.5"
          >
            <h2 className="font-heading text-2xl">{card.title}</h2>
            <p className="mt-3 text-wiki-muted">{card.description}</p>
          </Link>
        ))}
      </section>
    </section>
  );
}
