import type { Metadata } from "next";

export const siteName = "Histórico 2100";
export const siteTitle = "Histórico 2100 | Wiki AILE";
export const siteDescription =
  "Wiki oficial de AILE sobre el escenario Histórico 2100: hitos, países y eras del modelo histórico futurista, optimizada para compartir con previews claras en WhatsApp y redes.";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const siteUrl = configuredSiteUrl
  ? configuredSiteUrl.replace(/\/+$/, "")
  : "https://wiki.aile.com.ar";
export const aileUrl = "https://aile.com.ar";
export const siteLocale = "es_AR";
export const defaultOgImagePath = "/images/og-aile-whatsapp-1200x630.png";

const baseKeywords = [
  "AILE",
  "Histórico 2100",
  "wiki AILE",
  "historia futurista",
  "escenario geopolítico",
  "modelo de naciones unidas",
  "modelo historico",
  "timeline alternativo",
  "linea del tiempo",
  "wiki.aile.com.ar",
  "aile.com.ar",
  "WhatsApp"
];

export const metadataBase = new URL(siteUrl);

interface MetadataInput {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  imageAlt?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
}

interface BreadCrumbItem {
  name: string;
  path: string;
}

interface CollectionJsonLdInput {
  title: string;
  description: string;
  path: string;
}

interface ArticleJsonLdInput {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  datePublished?: string;
  dateModified?: string;
}

interface CountryJsonLdInput {
  name: string;
  description: string;
  path: string;
  imagePath?: string;
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(normalizePath(path), metadataBase).toString();
}

export function sanitizeMetaDescription(value?: string, fallback = siteDescription) {
  const source = stripEditorialArtifacts(value ?? fallback).replace(/\s+/g, " ").trim();

  if (!source) {
    return fallback;
  }

  if (source.length <= 180) {
    return source;
  }

  return `${source.slice(0, 177).trimEnd()}...`;
}

export function buildMetadata({
  title,
  description,
  path,
  imagePath = defaultOgImagePath,
  imageAlt,
  keywords,
  noIndex = false,
  type = "website"
}: MetadataInput): Metadata {
  const canonicalPath = normalizePath(path);
  const sanitizedDescription = sanitizeMetaDescription(description);
  const imageUrl = absoluteUrl(imagePath);

  return {
    title,
    description: sanitizedDescription,
    alternates: {
      canonical: canonicalPath
    },
    keywords: mergeKeywords(keywords),
    robots: buildRobots(noIndex),
    openGraph: {
      type,
      locale: siteLocale,
      url: absoluteUrl(canonicalPath),
      siteName,
      title,
      description: sanitizedDescription,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt ?? title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: sanitizedDescription,
      images: [imageUrl]
    }
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: "AILE",
    url: aileUrl,
    sameAs: [aileUrl]
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    inLanguage: "es",
    publisher: {
      "@id": absoluteUrl("/#organization")
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function buildBreadcrumbJsonLd(items: BreadCrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function buildCollectionJsonLd({ title, description, path }: CollectionJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: sanitizeMetaDescription(description),
    url: absoluteUrl(path),
    isPartOf: {
      "@id": absoluteUrl("/#website")
    },
    publisher: {
      "@id": absoluteUrl("/#organization")
    }
  };
}

export function buildArticleJsonLd({
  title,
  description,
  path,
  imagePath,
  datePublished,
  dateModified
}: ArticleJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: sanitizeMetaDescription(description),
    url: absoluteUrl(path),
    image: [absoluteUrl(imagePath ?? defaultOgImagePath)],
    inLanguage: "es",
    isPartOf: {
      "@id": absoluteUrl("/#website")
    },
    author: {
      "@id": absoluteUrl("/#organization")
    },
    publisher: {
      "@id": absoluteUrl("/#organization")
    },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {})
  };
}

export function buildCountryJsonLd({ name, description, path, imagePath }: CountryJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name,
    description: sanitizeMetaDescription(description),
    url: absoluteUrl(path),
    image: absoluteUrl(imagePath ?? defaultOgImagePath),
    isPartOf: {
      "@id": absoluteUrl("/#website")
    },
    publisher: {
      "@id": absoluteUrl("/#organization")
    }
  };
}

export function buildRobots(noIndex = false): NonNullable<Metadata["robots"]> {
  return {
    index: !noIndex,
    follow: true,
    googleBot: {
      index: !noIndex,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  };
}

function mergeKeywords(keywords?: string[]) {
  return Array.from(new Set([...baseKeywords, ...(keywords ?? [])]));
}

function normalizePath(path: string) {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function stripEditorialArtifacts(value: string) {
  return value
    .replace(/\[(?:Ej|ej):[^\]]*(?:\]|$)/g, " ")
    .replace(/\{\{[^}]+\}\}/g, " ")
    .replace(/\s+([.,;:])/g, "$1");
}
