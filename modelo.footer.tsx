import Image from "next/image"
import Link from "next/link"
import { SITE_CONTACT } from "@/lib/site-contact"

const footerLinks = {
  navegacion: [
    { label: "Inicio", href: "/#inicio" },
    { label: "Nosotros", href: "/#nosotros" },
    { label: "Proyectos", href: "/#proyectos" },
    { label: "Noticias", href: "/#noticias" },
    { label: "Contacto", href: "/#contactanos" },
  ],
  proyectos: [
    { label: "M.I.N.U.", href: "/#proyectos" },
    { label: "Modelo Histórico", href: "/#proyectos" },
    { label: "Cumbre de Líderes", href: "/#proyectos" },
    { label: "C40 Ciudades", href: "/#proyectos" },
  ],
}

export default function AILEFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-[#e7dbf3] bg-white text-[#2f1747]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#6314a7]/10" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(99,20,167,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,20,167,0.05)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(99,20,167,0)_0%,rgba(99,20,167,0.08)_100%)]" />

      <div className="relative mx-auto grid w-full max-w-[1280px] gap-12 px-5 py-14 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] md:px-8">
        <div className="rounded-3xl border border-[#eadff4] bg-[#fcf9ff] p-6 shadow-[0_10px_35px_rgba(99,20,167,0.08)]">
          <Link href="/#inicio" className="inline-flex items-center gap-3">
            <Image
              src="/images/aile-logo-footer.png"
              alt="AILE"
              width={240}
              height={64}
              className="h-12 w-auto object-contain"
            />
          </Link>
          <p className="mt-5 max-w-[340px] text-sm leading-relaxed text-[#4d3a63]/85">
            AILE es una asociación civil que impulsa liderazgo joven, pensamiento crítico y participación con impacto social.
          </p>
          <Link
            href="/authClient"
            className="mt-6 inline-flex items-center rounded-full border border-[#5f2b97] bg-[#6314a7] px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4f0e8a] hover:shadow-[0_12px_26px_rgba(99,20,167,0.25)]"
          >
            Entrar a MiAile
          </Link>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f57a0]">Navegación</h3>
          <ul className="space-y-2.5">
            {footerLinks.navegacion.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-[#3f2c57] transition-colors hover:text-[#6314a7]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f57a0]">Proyectos</h3>
          <ul className="space-y-2.5">
            {footerLinks.proyectos.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-[#3f2c57] transition-colors hover:text-[#6314a7]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f57a0]">Contacto</h3>
          <div className="space-y-3 text-sm text-[#3f2c57]">
            <p>{SITE_CONTACT.location}</p>
            <a className="block transition-colors hover:text-[#6314a7]" href={SITE_CONTACT.emailHref}>
              {SITE_CONTACT.email}
            </a>
            <a
              className="block transition-colors hover:text-[#6314a7]"
              href={SITE_CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {`Instagram: @${SITE_CONTACT.instagramHandle}`}
            </a>
          </div>
        </div>
      </div>

      <div className="relative border-t border-[#e7dbf3]/90">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-[#6f5a8c] md:flex-row md:px-8">
          <p>© 2026 AILE Asociación Civil. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5">
            <Link href="/terminos-y-condiciones" className="transition-colors hover:text-[#6314a7]">
              Términos y Condiciones
            </Link>
            <Link href="/politicaCookies" className="transition-colors hover:text-[#6314a7]">
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
  
}
