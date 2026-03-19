/**
 * Fetches X (Twitter) profile metadata without using the official API.
 * Uses microlink.io as a free proxy to extract Open Graph data.
 */
export async function fetchXProfile(handle: string) {
  const cleanHandle = handle.replace(/^@/, '');
  if (!cleanHandle) return null;

  try {
    const url = `https://api.microlink.io/?url=https://x.com/${cleanHandle}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status !== 'success') return null;

    const metadata = data.data;
    
    return {
      name: metadata.author || metadata.title?.split(' (')[0] || cleanHandle,
      bio: metadata.description || '',
      avatar_url: metadata.image?.url || `https://unavatar.io/twitter/${cleanHandle}`,
      // Microlink doesn't usually provide follower counts in standard OG tags
      // We return 0 or null and let the UI handle it gracefully
      followers: 0,
      following: 0
    };
  } catch (error) {
    console.error('Error fetching X profile:', error);
    // Fallback to unavatar at least
    return {
      name: cleanHandle,
      bio: '',
      avatar_url: `https://unavatar.io/twitter/${cleanHandle}`,
      followers: 0,
      following: 0
    };
  }
}
