/**
 * Fetches X (Twitter) profile metadata without using the official API.
 * Uses microlink.io as a free proxy to extract Open Graph data.
 */
export async function fetchXProfile(handle: string) {
  const cleanHandle = handle.replace(/^@/, '');
  if (!cleanHandle) return null;

  try {
    // 1. Get image from unavatar (more reliable than microlink for X)
    const avatar_url = `https://unavatar.io/twitter/${cleanHandle}`;

    // 2. Get name and bio from microlink
    const url = `https://api.microlink.io/?url=https://x.com/${cleanHandle}`;
    const res = await fetch(url);
    const data = await res.json();
    
    let name = cleanHandle;
    let bio = '';

    if (data.status === 'success' && data.data) {
      const metadata = data.data;
      // If Microlink returns generic "Profile / X", use the handle as the name
      if (metadata.title && metadata.title !== 'Profile / X') {
        name = metadata.author || metadata.title?.split(' (')[0] || cleanHandle;
      }
      bio = metadata.description || '';
    }

    // Note: Follower counts are difficult to fetch for free without an API key
    // We default to 0 and encourage users to verify via the X profile link
    return {
      name,
      bio,
      avatar_url,
      followers: 0, 
      following: 0
    };
  } catch (error) {
    console.error('Error fetching X profile:', error);
    return {
      name: cleanHandle,
      bio: '',
      avatar_url: `https://unavatar.io/twitter/${cleanHandle}`,
      followers: 0,
      following: 0
    };
  }
}
