export type AiSuggestions = {
  titles: string[];
  descriptions: string[];
  authorSets: string[][];
  years: string[];
  tagSets: string[][];
};

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
  uploadUrl: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  url?: string;
  resource_type?: string;
};

export const MAX_PDF_UPLOAD_BYTES = 30 * 1024 * 1024;
const MAX_PDF_TEXT_CHARS = 18_000;
const MAX_PDF_TEXT_PAGES = 14;

export function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function assertPdfUploadLimit(file: File) {
  if (isPdfFile(file) && file.size > MAX_PDF_UPLOAD_BYTES) {
    throw new Error("PDF files must be 30 MB or smaller.");
  }
}

const compactInlineText = (value: string) => value.replace(/[ \t]+/g, " ").trim();
const compactBlockText = (value: string) =>
  value
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const metadataPageNumbers = (pageCount: number) => {
  const firstPages = Array.from({ length: Math.min(pageCount, 10) }, (_, index) => index + 1);
  const tailPages = pageCount > 10 ? [pageCount - 1, pageCount] : [];
  return [...new Set([...firstPages, ...tailPages])]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount)
    .slice(0, MAX_PDF_TEXT_PAGES);
};

export async function parsePdfText(file: File) {
  assertPdfUploadLimit(file);

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  let totalLength = 0;

  for (const pageNumber of metadataPageNumbers(pdf.numPages)) {
    if (totalLength >= MAX_PDF_TEXT_CHARS) break;
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = compactBlockText(
      content.items
        .map((item) => {
          if (!("str" in item)) return "";
          const text = compactInlineText(item.str);
          return "hasEOL" in item && item.hasEOL ? `${text}\n` : text;
        })
        .join(" ")
    );

    if (pageText) {
      pages.push(`Page ${pageNumber}\n${pageText}`);
      totalLength += pageText.length;
    }
  }

  return {
    text: compactBlockText(pages.join("\n\n")).slice(0, MAX_PDF_TEXT_CHARS),
    pageCount: pdf.numPages,
  };
}

export async function getPdfMetadataSuggestions(file: File): Promise<AiSuggestions> {
  const parsed = await parsePdfText(file);

  const response = await fetch("/api/resource/suggest-metadata", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      pageCount: parsed.pageCount,
      text: parsed.text,
    }),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new Error(json?.message || "Failed to generate metadata suggestions.");
  }

  return json.data as AiSuggestions;
}

export async function uploadFileDirectToCloudinary(file: File) {
  assertPdfUploadLimit(file);

  const signatureResponse = await fetch("/api/resource/upload-signature", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
    }),
  });

  const signatureJson = await signatureResponse.json().catch(() => null);
  if (!signatureResponse.ok || !signatureJson?.success) {
    throw new Error(signatureJson?.message || "Could not prepare direct upload.");
  }

  const signature = signatureJson.data as CloudinarySignature;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("public_id", signature.publicId);

  const uploadResponse = await fetch(signature.uploadUrl, {
    method: "POST",
    body: formData,
  });
  const uploadJson = await uploadResponse.json().catch(() => null) as CloudinaryUploadResponse | null;

  if (!uploadResponse.ok || !uploadJson?.secure_url) {
    throw new Error("Cloudinary upload failed. Please try again.");
  }

  return {
    fileUrl: uploadJson.secure_url,
    fileType: file.type || uploadJson.resource_type || "application/octet-stream",
  };
}
