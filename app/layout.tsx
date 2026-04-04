import type { Metadata } from "next";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/json-ld";
import {
  aileUrl,
  buildOrganizationJsonLd,
  buildRobots,
  buildWebSiteJsonLd,
  defaultOgImagePath,
  metadataBase,
  siteDescription,
  siteLocale,
  siteName,
  siteTitle,
  siteUrl
} from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase,
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: "%s | Histórico 2100 | AILE"
  },
  description: siteDescription,
  authors: [
    {
      name: "AILE",
      url: aileUrl
    }
  ],
  creator: "AILE",
  publisher: "AILE",
  alternates: {
    canonical: "/"
  },
  robots: buildRobots(),
  openGraph: {
    type: "website",
    locale: siteLocale,
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: defaultOgImagePath,
        width: 1200,
        height: 630,
        alt: siteTitle
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [defaultOgImagePath]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
        {children}
      </body>
    </html>
  );
}
