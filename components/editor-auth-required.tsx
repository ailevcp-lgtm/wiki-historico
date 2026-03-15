"use client";

import Link from "next/link";

import type { EditorAccessState } from "@/lib/editor/auth";

export function EditorAuthRequired({ access }: { access: EditorAccessState }) {
  const isRoleError = access.denialReason === "role";

  return (
    <section className="wiki-paper p-5 md:p-6">
      <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Acceso restringido</p>
      <h1 className="wiki-page-title mt-2">
        {isRoleError ? "Tu cuenta no tiene permisos editoriales" : "Inicia sesión para entrar al admin"}
      </h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-wiki-muted">
        {isRoleError
          ? "La autenticación existe, pero la cuenta no tiene el claim app_role=editor o app_role=admin."
          : "El panel administrativo está separado de la wiki pública. Debes iniciar sesión con una cuenta editorial para continuar."}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={access.loginHref ?? "/admin/login"}
          className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold hover:border-wiki-blue hover:text-wiki-blue"
        >
          Ir al login admin
        </Link>
        <Link href="/" className="wiki-link self-center text-sm">
          Volver a la wiki pública
        </Link>
      </div>
    </section>
  );
}
