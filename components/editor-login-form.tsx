"use client";

import { useState } from "react";

import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function EditorLoginForm({
  error,
  nextPath
}: {
  error?: string;
  nextPath?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(
    error === "role"
      ? "Tu cuenta inició sesión, pero no tiene el claim app_role=editor/admin."
      : ""
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseBrowserConfig()) {
      setMessage("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      window.location.assign(nextPath || "/admin/review");
    } catch {
      setMessage("No pude iniciar sesión con Supabase.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="wiki-paper p-5 md:p-6">
      <p className="text-sm uppercase tracking-[0.18em] text-wiki-muted">Acceso editorial</p>
      <h1 className="wiki-page-title mt-2">Iniciar sesión</h1>
      <p className="mt-3 max-w-2xl text-wiki-muted">
        Usa una cuenta de Supabase Auth con <code>app_role</code> igual a <code>editor</code> o{" "}
        <code>admin</code>.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-wiki-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-wiki-muted">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2"
            required
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-sm border border-wiki-border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </div>

      {message ? <p className="mt-4 text-sm text-wiki-muted">{message}</p> : null}
    </form>
  );
}
