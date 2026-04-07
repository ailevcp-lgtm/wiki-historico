import Image from "next/image";
import Link from "next/link";

const footerSections = {
  wiki: [
    { label: "Portada", href: "/" },
    { label: "Línea del tiempo", href: "/timeline" },
    { label: "Países", href: "/countries" }
  ],
  aile: [
    { label: "Sitio oficial AILE", href: "https://aile.com.ar" },
    { label: "Inscripciones modelo ONU", href: "https://aile.com.ar" }
  ]
};

export function WikiFooter() {
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-wiki-border bg-white text-wiki-text">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(2,60,120,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(2,60,120,0.05)_1px,transparent_1px)] [background-size:30px_30px]" />
      <div className="relative mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-6">
        <div className="rounded-sm border border-wiki-border bg-[#f7fbff] p-5">
          <div className="flex items-center gap-3">
            <Image
              src="/images/aile-logo-footer.png"
              alt="AILE"
              width={220}
              height={60}
              className="h-10 w-auto object-contain"
            />
          </div>
          <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-wiki-muted">
            Este modelo histórico futurista forma parte de las actividades de AILE. Para inscribirte al
            modelo ONU y conocer novedades, visitá su sitio oficial.
          </p>
          <a
            href="https://aile.com.ar"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center rounded-sm border border-wiki-blue bg-white px-4 py-2 text-sm font-semibold text-wiki-blue transition-colors hover:bg-[#edf4ff]"
          >
            Ir a aile.com.ar
          </a>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-wiki-muted">Wiki</h3>
          <ul className="space-y-2.5">
            {footerSections.wiki.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-wiki-text hover:text-wiki-blue">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-wiki-muted">AILE</h3>
          <ul className="space-y-2.5">
            {footerSections.aile.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-wiki-text hover:text-wiki-blue"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-wiki-border">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-4 text-xs text-wiki-muted md:flex-row md:items-center md:justify-between lg:px-6">
          <p>© 2026 AILE Asociación Civil.</p>
          <a href="https://aile.com.ar" target="_blank" rel="noreferrer" className="hover:text-wiki-blue">
            aile.com.ar
          </a>
        </div>
      </div>
    </footer>
  );
}
