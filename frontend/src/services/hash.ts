export async function computeFileHash(file: File): Promise<string> {
  // Special handling for text files - hash the text content
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    const text = await file.text();
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  // For binary files (images, PDFs, etc.), hash the raw buffer
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function compareHashes(
  localHash: string,
  storedHash: string
): boolean {
  if (!localHash || !storedHash) return false;

  const normalize = (h: string) =>
    h.toLowerCase().replace(/^0x/, "");

  return normalize(localHash) === normalize(storedHash);
}

