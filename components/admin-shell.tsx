"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

interface AdminShellProps {
  children: ReactNode;
}

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/import", label: "Importar fichas" },
  { href: "/admin/review", label: "Cola editorial" },
  { href: "/admin/articles", label: "Publicaciones" },
  { href: "/admin/countries", label: "Países" },
  { href: "/", label: "Ver wiki pública" }
];

function isActiveAdminItem(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f1eb] text-wiki-text">
      <header className="sticky top-0 z-40 border-b border-[#b8aea1] bg-[#f7f2e8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#b8aea1] bg-white text-xl lg:hidden"
            onClick={() => setIsOpen((current) => !current)}
            aria-label="Abrir navegación admin"
          >
            ≡
          </button>

          <Link href="/admin" className="min-w-0">
            <div className="font-heading text-xl leading-none text-[#3a3127]">Admin Histórico 2100</div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#6d6151]">Panel editorial</div>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <div
          className={`fixed inset-0 z-30 bg-black/35 transition-opacity lg:hidden ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
        />

        <aside
          className={`fixed left-0 top-[65px] z-40 h-[calc(100vh-65px)] w-[280px] overflow-y-auto border-r border-[#b8aea1] bg-[#efe7d8] p-4 transition-transform lg:sticky lg:top-[65px] lg:block lg:h-[calc(100vh-65px)] lg:w-[260px] lg:translate-x-0 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <section className="mb-6">
            <h2 className="mb-2 border-b border-[#b8aea1] pb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6d6151]">
              Administración
            </h2>
            <div className="space-y-2">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-sm px-2 py-1.5 text-sm transition-colors ${
                    isActiveAdminItem(pathname, item.href)
                      ? "bg-white font-semibold text-[#3a3127] shadow-wiki"
                      : "text-[#6d6151] hover:bg-white"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-sm border border-[#b8aea1] bg-white p-4 text-sm text-[#6d6151]">
            <div className="font-semibold text-[#3a3127]">Separación de entornos</div>
            <p className="mt-2 leading-6">
              Este panel no forma parte de la experiencia pública de la wiki. Todo el trabajo
              editorial y de revisión se concentra aquí.
            </p>
          </section>
        </aside>

        <main className="min-h-[calc(100vh-65px)] flex-1 px-0 lg:px-6">
          <div className="mx-auto max-w-[1120px] px-4 py-6 lg:px-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
