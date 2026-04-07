"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { WikiFooter } from "@/components/wiki-footer";
import { ReadingProgressBar, ReadingProgressProvider } from "@/components/reading-progress";
import type { Bloc, TimelineEra, WikiShellCopy } from "@/types/wiki";

interface WikiShellProps {
  blocs: Bloc[];
  copy: WikiShellCopy;
  eras: TimelineEra[];
  readingProgressSlugs: string[];
  children: ReactNode;
}

export function WikiShell({
  blocs,
  copy,
  eras,
  readingProgressSlugs,
  children
}: WikiShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(96);
  const headerRef = useRef<HTMLElement | null>(null);
  const selectedBloc = searchParams.get("bloc");

  useEffect(() => {
    const header = headerRef.current;

    if (!header) {
      return;
    }

    const updateHeight = () => {
      setHeaderHeight(header.getBoundingClientRect().height);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return (
    <ReadingProgressProvider eligibleSlugs={readingProgressSlugs}>
      <div className="min-h-screen bg-wiki-page text-wiki-text">
        <header
          ref={headerRef}
          className="sticky top-0 z-40 border-b border-wiki-border bg-white/95 backdrop-blur"
        >
          <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
            <div className="flex items-center gap-3 py-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded border border-wiki-border bg-wiki-page text-xl lg:hidden"
                onClick={() => setIsOpen((current) => !current)}
                aria-label="Abrir navegación"
              >
                ≡
              </button>

              <Link href="/" className="flex min-w-0 items-center gap-2">
                <Image
                  src="/images/logoHistorico.png"
                  alt="Histórico 2100"
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                  priority
                />
                <div className="min-w-0">
                  <div className="truncate font-heading text-xl leading-none text-wiki-text">
                    {copy.siteTitle}
                  </div>
                  <div className="truncate text-xs uppercase tracking-[0.18em] text-wiki-muted">
                    {copy.siteTagline}
                  </div>
                </div>
              </Link>
            </div>

            <div className="border-t border-wiki-border py-3">
              <ReadingProgressBar />
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1440px]">
          <div
            className={`fixed inset-x-0 bottom-0 z-30 bg-black/35 transition-opacity lg:hidden ${
              isOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            style={{ top: headerHeight }}
            onClick={() => setIsOpen(false)}
          />

          <aside
            className={`wiki-sidebar fixed left-0 z-40 w-[280px] overflow-y-auto border-r border-wiki-border bg-wiki-page p-4 transition-transform lg:sticky lg:w-[240px] lg:translate-x-0 ${
              isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{
              top: headerHeight,
              height: `calc(100vh - ${headerHeight}px)`
            }}
          >
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

            <NavSection title={copy.blocsSectionTitle}>
              {blocs.map((bloc) => (
                <NavItem
                  key={bloc.slug}
                  href={`/bloc/${bloc.slug}`}
                  active={pathname === `/bloc/${bloc.slug}` || (pathname === "/countries" && selectedBloc === bloc.slug)}
                  onNavigate={() => setIsOpen(false)}
                >
                  {bloc.name}
                </NavItem>
              ))}
            </NavSection>
          </aside>

          <main className="min-w-0 flex-1 px-0 lg:px-6" style={{ minHeight: `calc(100vh - ${headerHeight}px)` }}>
            <div className="mx-auto min-w-0 max-w-[1040px] px-4 py-6 lg:px-0">{children}</div>
          </main>
        </div>
        <WikiFooter />
      </div>
    </ReadingProgressProvider>
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
