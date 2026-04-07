import { infoboxLabel } from "@/lib/markdown";
import { humanizeSlug } from "@/lib/utils";
import type { InfoboxData } from "@/types/wiki";

import { WikiLink } from "./wiki-link";
import { ZoomableImage } from "./zoomable-image";

interface InfoboxProps {
  articleTitles: Record<string, string>;
  data?: InfoboxData;
  imageUrl?: string;
  title: string;
}

export function Infobox({ articleTitles, data, imageUrl, title }: InfoboxProps) {
  if (!data) {
    return null;
  }

  const rows = Object.entries(data).filter(([key, value]) => key !== "type" && value !== undefined && value !== null);

  return (
    <aside className="wiki-infobox">
      {imageUrl ? (
        <div className="border-b border-wiki-border bg-white p-2">
          <ZoomableImage
            src={imageUrl}
            alt={title}
            className="h-auto w-full rounded-sm border border-wiki-border object-cover"
          />
        </div>
      ) : null}

      <div className="border-b border-wiki-border bg-wiki-infobox px-3 py-2 text-center font-heading text-lg">
        {title}
      </div>

      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([key, value]) => (
            <tr key={key} className="border-b border-wiki-border align-top last:border-b-0">
              <th className="w-[38%] bg-wiki-page px-3 py-2 text-left font-semibold text-wiki-text">
                {infoboxLabel(key)}
              </th>
              <td className="bg-white px-3 py-2 text-wiki-muted">
                {renderInfoboxValue(key, value, articleTitles)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}

function renderInfoboxValue(
  key: string,
  value: InfoboxData[string],
  articleTitles: Record<string, string>
) {
  if (Array.isArray(value)) {
    if (key === "related") {
      return (
        <div className="flex flex-wrap gap-2">
          {(value as string[]).map((slug) => (
            <WikiLink
              key={slug}
              slug={slug}
              label={articleTitles[slug] ?? humanizeSlug(slug)}
              exists={Boolean(articleTitles[slug])}
            />
          ))}
        </div>
      );
    }

    if (value.every((item) => Array.isArray(item))) {
      return (
        <div className="space-y-1">
          {value.map((side, index) => (
            <div key={`${key}-${index}`}>{side.join(", ")}</div>
          ))}
        </div>
      );
    }

    return <div className="space-y-1">{value.map((item) => <div key={item}>{item}</div>)}</div>;
  }

  return String(value);
}
