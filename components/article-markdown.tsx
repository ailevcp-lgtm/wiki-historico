import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { flattenNodeText, transformWikiLinks } from "@/lib/markdown";
import { slugify } from "@/lib/utils";

import { WikiLink } from "./wiki-link";

interface ArticleMarkdownProps {
  articleTitles: Record<string, string>;
  markdown: string;
}

export function ArticleMarkdown({ articleTitles, markdown }: ArticleMarkdownProps) {
  const preparedMarkdown = transformWikiLinks(markdown, articleTitles);

  return (
    <div className="wiki-article">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
            if (href.startsWith("wiki:")) {
              const slug = href.replace("wiki:", "");
              return (
                <WikiLink
                  slug={slug}
                  label={flattenNodeText(children)}
                  exists={Boolean(articleTitles[slug])}
                />
              );
            }

            return (
              <a href={href} target="_blank" rel="noreferrer" className="wiki-link">
                {children}
              </a>
            );
          }
        }}
      >
        {preparedMarkdown}
      </ReactMarkdown>
    </div>
  );
}
