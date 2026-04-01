"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import type { Bloc, Category, TimelineEra, WikiShellCopy } from "@/types/wiki";

interface WikiShellProps {
  blocs: Bloc[];
  categories: Category[];
  copy: WikiShellCopy;
  eras: TimelineEra[];
  children: ReactNode;
}

export function WikiShell({ blocs, categories, copy, eras, children }: WikiShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-wiki-page text-wiki-text">
      <header className="sticky top-0 z-40 border-b border-wiki-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-wiki-border bg-wiki-page text-xl lg:hidden"
            onClick={() => setIsOpen((current) => !current)}
            aria-label="Abrir navegación"
          >
            ≡
          </button>

          <Link href="/" className="min-w-0">
            <div className="font-heading text-xl leading-none text-wiki-text">{copy.siteTitle}</div>
            <div className="text-xs uppercase tracking-[0.18em] text-wiki-muted">{copy.siteTagline}</div>
          </Link>

          <form action="/search" className="ml-auto flex w-full max-w-md items-center gap-2">
            <input
              type="search"
              name="q"
              placeholder={copy.searchPlaceholder}
              className="w-full rounded-sm border border-wiki-border bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-wiki-muted focus:border-wiki-blue"
            />
            <button
              type="submit"
              className="rounded-sm border border-wiki-border bg-wiki-page px-3 py-2 text-sm font-semibold"
            >
              {copy.searchButtonLabel}
            </button>
          </form>
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
          className={`wiki-sidebar fixed left-0 top-[65px] z-40 h-[calc(100vh-65px)] w-[280px] overflow-y-auto border-r border-wiki-border bg-wiki-page p-4 transition-transform lg:sticky lg:top-[65px] lg:block lg:h-[calc(100vh-65px)] lg:w-[240px] lg:translate-x-0 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <NavSection title={copy.navigationSectionTitle}>
            <NavItem href="/" active={pathname === "/"} onNavigate={() => setIsOpen(false)}>
              {copy.homeLabel}
            </NavItem>
            <NavItem
              href="/timeline"
              active={pathname === "/timeline"}
              onNavigate={() => setIsOpen(false)}
            >
              {copy.timelineLabel}
            </NavItem>
            <NavItem href="/search" active={pathname === "/search"} onNavigate={() => setIsOpen(false)}>
              {copy.searchLabel}
            </NavItem>
            <NavItem
              href="/countries"
              active={pathname === "/countries"}
              onNavigate={() => setIsOpen(false)}
            >
              {copy.countriesLabel}
            </NavItem>
          </NavSection>

          <NavSection title={copy.erasSectionTitle}>
            {eras.map((era) => (
              <NavItem
                key={era.slug}
                href={`/era/${era.slug}`}
                active={pathname === `/era/${era.slug}`}
                onNavigate={() => setIsOpen(false)}
              >
                {copy.eraLabelPrefix} {era.number} ({era.yearStart}-{era.yearEnd})
              </NavItem>
            ))}
          </NavSection>

          <NavSection title={copy.categoriesSectionTitle}>
            {categories.map((category) => (
              <NavItem
                key={category.slug}
                href={`/category/${category.slug}`}
                active={pathname === `/category/${category.slug}`}
                onNavigate={() => setIsOpen(false)}
              >
                {category.name}
              </NavItem>
            ))}
          </NavSection>

          <NavSection title={copy.blocsSectionTitle}>
            {blocs.map((bloc) => (
              <div key={bloc.slug} className="rounded-sm border border-wiki-border bg-white px-3 py-2 text-sm">
                <div className="font-semibold text-wiki-text">{bloc.name}</div>
                <p className="mt-1 text-xs text-wiki-muted">{bloc.summary}</p>
              </div>
            ))}
          </NavSection>
        </aside>

        <main className="min-h-[calc(100vh-65px)] flex-1 px-0 lg:px-6">
          <div className="mx-auto max-w-[1040px] px-4 py-6 lg:px-0">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavSection({
  children,
  title
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 border-b border-wiki-border pb-1 text-xs font-bold uppercase tracking-[0.16em] text-wiki-muted">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function NavItem({
  active,
  children,
  href,
  onNavigate
}: {
  active: boolean;
  children: ReactNode;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-sm px-2 py-1.5 text-sm transition-colors ${
        active ? "bg-white font-semibold text-wiki-text shadow-wiki" : "text-wiki-muted hover:bg-white"
      }`}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}
