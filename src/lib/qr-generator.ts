// Generate a short, URL-safe random ID
export function generateShortId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Legacy function - kept for backward compatibility but now uses short IDs
export function generateQRCode(): string {
  // This now just generates a short ID - the actual storage happens in the API
  return generateShortId(8);
}

export function generateQRCodeURL(shortId: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.ie';
  
  // Create a much shorter URL using just the short ID
  return `${base}/qr/${shortId}`;
}

export function generateQRData(shortId: string): string {
  const qrData = {
    shortId,
    timestamp: Date.now()
  };
  
  return JSON.stringify(qrData);
}
