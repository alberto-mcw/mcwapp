import { useState, useEffect } from 'react';
import { getSignedUrl } from '@/lib/storageUrl';

/**
 * Hook that converts a storage URL to a signed URL for private buckets.
 * Automatically refreshes before expiry.
 */
export function useSignedUrl(
  url: string | null | undefined,
  bucket: string = 'challenge-videos',
  expiresIn: number = 3600
): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setSignedUrl(null);
      return;
    }

    let cancelled = false;

    const fetchUrl = async () => {
      const signed = await getSignedUrl(url, bucket, expiresIn);
      if (!cancelled) setSignedUrl(signed);
    };

    fetchUrl();

    // Refresh 5 minutes before expiry
    const refreshMs = Math.max((expiresIn - 300) * 1000, 60000);
    const timer = setInterval(fetchUrl, refreshMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [url, bucket, expiresIn]);

  return signedUrl;
}
