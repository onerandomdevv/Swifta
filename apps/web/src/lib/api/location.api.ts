export interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchAddress(query: string): Promise<LocationResult[]> {
  if (!query || query.length < 3) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&countrycodes=ng&format=json&limit=5`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          // Nominatim requires a user agent or referrer for fair use, we provide a generic one
          'User-Agent': 'Swifta/1.0',
        },
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch addresses');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
}
