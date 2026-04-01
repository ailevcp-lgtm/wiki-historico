import { promises as fs } from "fs";
import path from "path";

import mammoth from "mammoth";

import { slugify } from "@/lib/utils";

const importedHistoryDocsImagesRoot = path.join(
  process.cwd(),
  "public",
  "images",
  "history-docs",
  "imported"
);
const importedHistoryDocsImagesBasePath = "/images/history-docs/imported";

export async function extractDocxText(buffer: Buffer, fileName: string): Promise<string> {
  const assetDirectoryName = buildDocAssetDirectoryName(fileName);
  const targetDirectory = path.join(importedHistoryDocsImagesRoot, assetDirectoryName);
  const mammothWithMarkdown = mammoth as typeof mammoth & {
    convertToMarkdown: typeof mammoth.convertToHtml;
  };

  await fs.rm(targetDirectory, { recursive: true, force: true });
  await fs.mkdir(targetDirectory, { recursive: true });

  let extractedImages = 0;
  const result = await mammothWithMarkdown.convertToMarkdown(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        extractedImages += 1;

        const extension = extensionForContentType(image.contentType);
        const storedFileName = `${String(extractedImages).padStart(3, "0")}${extension}`;
        const storedFilePath = path.join(targetDirectory, storedFileName);
        const imageBuffer = await image.readAsBuffer();

        await fs.writeFile(storedFilePath, imageBuffer);

        return {
          src: `${importedHistoryDocsImagesBasePath}/${assetDirectoryName}/${storedFileName}`
        };
      })
    }
  );

  return markdownToImportText(result.value);
}

function markdownToImportText(markdown: string) {
  return markdown
    .replace(/\r/g, "")
    .split("\n")
    .map(normalizeMarkdownLine)
    .filter(Boolean)
    .join("\n");
}

function normalizeMarkdownLine(line: string) {
  let nextLine = line.replace(/\u00a0/g, " ").trim();

  if (!nextLine) {
    return "";
  }

  nextLine = nextLine.replace(/<a [^>]*><\/a>/gi, "");
  nextLine = unescapeMarkdownText(nextLine);
  nextLine = nextLine.replace(/^#{1,6}\s+/, "");

  if (isMarkdownImageLine(nextLine)) {
    return nextLine;
  }

  nextLine = stripMarkdownEmphasis(nextLine);
  nextLine = nextLine.replace(/^>\s+/, "");
  nextLine = stripMarkdownEmphasis(nextLine);

  return nextLine.replace(/[ \t]+/g, " ").trim();
}

function stripMarkdownEmphasis(value: string) {
  let nextValue = value;

  while (/^(\*\*|__)(.*)\1$/.test(nextValue) || /^\*(.*)\*$/.test(nextValue) || /^_(.*)_$/.test(nextValue)) {
    nextValue = nextValue
      .replace(/^(\*\*|__)(.*)\1$/, "$2")
      .replace(/^\*(.*)\*$/, "$1")
      .replace(/^_(.*)_$/, "$1")
      .trim();
  }

  return nextValue
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .trim();
}

function unescapeMarkdownText(value: string) {
  return value.replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, "$1");
}

function isMarkdownImageLine(line: string) {
  return /^!\[[^\]]*]\([^)]+\)$/.test(line);
}

function buildDocAssetDirectoryName(fileName: string) {
  return slugify(stripExtension(fileName));
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function extensionForContentType(contentType?: string) {
  const extensionsByType: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg"
  };

  return contentType ? extensionsByType[contentType] ?? ".bin" : ".bin";
}
