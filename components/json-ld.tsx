type JsonLdDocument = Record<string, unknown>;

interface JsonLdProps {
  data: JsonLdDocument | JsonLdDocument[] | null | undefined;
}

function isJsonLdDocument(value: unknown): value is JsonLdDocument {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasJsonLdContext(value: JsonLdDocument) {
  return typeof value["@context"] === "string" && value["@context"].trim().length > 0;
}

function serializeJsonLd(data: JsonLdDocument) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: JsonLdProps) {
  const documents = (Array.isArray(data) ? data : [data]).filter(
    (value): value is JsonLdDocument => isJsonLdDocument(value) && hasJsonLdContext(value)
  );

  if (documents.length === 0) {
    return null;
  }

  return (
    <>
      {documents.map((document, index) => (
        <script
          key={`json-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(document)
          }}
        />
      ))}
    </>
  );
}
