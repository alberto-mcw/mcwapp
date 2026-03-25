import { supabase } from '@/integrations/supabase/client';

/**
 * Extracts the file path from a Supabase storage public URL.
 * Handles both full public URLs and plain paths.
 */
function extractStoragePath(url: string, bucket: string): string | null {
  if (!url) return null;
  
  // If it's already a plain path (no http), return as-is
  if (!url.startsWith('http')) return url;
  
  // Extract path from public URL pattern:
  // .../storage/v1/object/public/{bucket}/{path}
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(url.substring(idx + marker.length));
  }
  
  // Also handle signed URL pattern:
  // .../storage/v1/object/sign/{bucket}/{path}
  const signMarker = `/storage/v1/object/sign/${bucket}/`;
  const signIdx = url.indexOf(signMarker);
  if (signIdx !== -1) {
    const pathWithQuery = url.substring(signIdx + signMarker.length);
    return decodeURIComponent(pathWithQuery.split('?')[0]);
  }
  
  return null;
}

/**
 * Creates a signed URL for a file in a private storage bucket.
 * Accepts either a full public URL or a plain file path.
 * Returns the signed URL, or the original URL if it's not from the bucket.
 */
export async function getSignedUrl(
  url: string,
  bucket: string = 'challenge-videos',
  expiresIn: number = 3600
): Promise<string> {
  if (!url) return url;
  
  const path = extractStoragePath(url, bucket);
  if (!path) return url; // Not a storage URL, return as-is (e.g., external URL)
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  
  if (error || !data?.signedUrl) {
    console.error('Error creating signed URL:', error);
    return url; // Fallback to original
  }
  
  return data.signedUrl;
}
