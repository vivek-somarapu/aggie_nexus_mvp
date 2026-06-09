import crypto from 'crypto';

const MAX_EXTRACTED_CHARS = 200_000;

export type ExtractableFileType = 'pdf' | 'docx';

/**
 * Extracts plain text from a Buffer using the file type to select the parser.
 * PDF  → pdf-parse
 * DOCX → mammoth
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: ExtractableFileType,
): Promise<string> {
  if (fileType === 'pdf') {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }

  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Fetches a file from a public storage URL, extracts its text, and returns it
 * truncated to MAX_EXTRACTED_CHARS. Throws if the fetch fails.
 */
export async function extractTextFromStorageUrl(
  url: string,
  fileType: ExtractableFileType,
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from storage: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const text = (await extractTextFromBuffer(buffer, fileType)).trim();
  return text.length > MAX_EXTRACTED_CHARS ? text.slice(0, MAX_EXTRACTED_CHARS) : text;
}

export function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}
