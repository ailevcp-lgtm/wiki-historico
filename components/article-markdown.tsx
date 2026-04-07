import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  flattenNodeText,
  normalizeImportedMarkdown,
  transformHitoReferences,
  transformWikiLinks
} from "@/lib/markdown";
import type { HitoReferenceIndex } from "@/lib/hito-references";
import { slugify } from "@/lib/utils";

import { HitoReference } from "./hito-reference";
import { WikiLink } from "./wiki-link";
import { ZoomableImage } from "./zoomable-image";

interface ArticleMarkdownProps {
  hitoArticles: HitoReferenceIndex;
  articleTitles: Record<string, string>;
  markdown: string;
  openInternalLinksInNewTab?: boolean;
}

export function ArticleMarkdown({
  articleTitles,
  hitoArticles,
  markdown,
  openInternalLinksInNewTab = false
}: ArticleMarkdownProps) {
  const preparedMarkdown = transformWikiLinks(
    transformHitoReferences(normalizeImportedMarkdown(markdown), hitoArticles),
    articleTitles
  );

  return (
    <div className="wiki-article">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => {
          if (url.startsWith("wiki:") || url.startsWith("country:") || url.startsWith("hito:")) {
            return url;
          }

          return defaultUrlTransform(url);
        }}
        components={{
          h2: ({ children }) => {
            const text = flattenNodeText(children);
            return <h2 id={slugify(text)}>{children}</h2>;
          },
          h3: ({ children }) => {
            const text = flattenNodeText(children);
            return <h3 id={slugify(text)}>{children}</h3>;
          },
          a: ({ href = "", children }) => {
            if (href.startsWith("hito:")) {
              const hitoId = href.replace("hito:", "");

              return (
                <HitoReference
                  hitoId={hitoId}
                  hitoArticles={hitoArticles}
                  missingClassName="text-wiki-muted"
                  openInNewTab={openInternalLinksInNewTab}
                />
              );
            }

            if (href.startsWith("wiki:")) {
              const slug = href.replace("wiki:", "");
              return (
                <WikiLink
                  slug={slug}
                  label={flattenNodeText(children)}
                  exists={Boolean(articleTitles[slug])}
                  openInNewTab={openInternalLinksInNewTab}
                />
              );
            }

            if (href.startsWith("country:")) {
              const slug = href.replace("country:", "");

              return (
                <WikiLink
                  slug={slug}
                  label={flattenNodeText(children)}
                  href={`/country/${slug}`}
                  openInNewTab={openInternalLinksInNewTab}
                />
              );
            }

            return (
              <a href={href} target="_blank" rel="noreferrer" className="wiki-link">
                {children}
              </a>
            );
          },
          img: ({ src, alt = "" }) => {
            if (!src || typeof src !== "string") {
              return null;
            }

            return (
              <ZoomableImage
                src={src}
                alt={alt}
                className="h-auto max-w-full rounded-sm border border-wiki-border"
              />
            );
          }
        }}
      >
        {preparedMarkdown}
      </ReactMarkdown>
    </div>
  );
}
