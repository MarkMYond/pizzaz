// Stub DB module - returns dummy data for now
// Later: Replace with real MongoDB connection

export interface GlampsiteResult {
  _id?: string;
  id?: string;
  name: string;
  location?: {
    coordinates: [number, number]; // [lng, lat]
  };
  description?: string;
  region?: string;
  city?: string;
  rating?: number;
  priceRange?: string;
  images?: string[];
  thumbnail?: string;
}

/**
 * Stub function that simulates a MongoDB query
 * @param searchQuery - Search term (location, region, etc)
 * @returns Array of glampsite results
 */
export async function queryGlampsites(searchQuery: string): Promise<GlampsiteResult[]> {
  // Simulate async DB call with small delay
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Dummy glampsite data
  const glampsites = [
    {
      _id: 'glampsite-1',
      name: 'Coastal Retreat Yurts',
      location: { coordinates: [-5.0527, 50.2660] as [number, number] },  // Cornwall
      description: 'Luxury yurts overlooking the dramatic Cornish coastline with ocean views.',
      region: 'Cornwall',
      rating: 4.8,
      priceRange: '$$$',
      images: ['https://picsum.photos/400/400?random=101']
    },
    {
      _id: 'glampsite-2',
      name: 'Woodland Safari Tents',
      location: { coordinates: [-3.5339, 50.7156] as [number, number] },  // Devon
      description: 'Safari-style tents nestled in ancient Devon woodland with private hot tubs.',
      region: 'Devon',
      rating: 4.6,
      priceRange: '$$',
      images: ['https://picsum.photos/400/400?random=102']
    },
    {
      _id: 'glampsite-3',
      name: 'Mountain View Pods',
      location: { coordinates: [-3.7837, 52.1307] as [number, number] },  // Wales
      description: 'Modern eco-pods with panoramic views of Snowdonia National Park.',
      region: 'Wales',
      rating: 4.9,
      priceRange: '$$',
      images: ['https://picsum.photos/400/400?random=103']
    },
    {
      _id: 'glampsite-4',
      name: 'Highland Bell Tents',
      location: { coordinates: [-4.2026, 56.4907] as [number, number] },  // Scotland
      description: 'Traditional bell tents in the Scottish Highlands with loch views.',
      region: 'Scotland',
      rating: 4.7,
      priceRange: '$',
      images: ['https://picsum.photos/400/400?random=104']
    },
    {
      _id: 'glampsite-5',
      name: 'Dales Shepherd Huts',
      location: { coordinates: [-1.0873, 53.9576] as [number, number] },  // Yorkshire
      description: 'Cozy shepherd huts in the Yorkshire Dales with countryside charm.',
      region: 'Yorkshire',
      rating: 4.5,
      priceRange: '$',
      images: ['https://picsum.photos/400/400?random=105']
    },
    {
      _id: 'glampsite-6',
      name: 'Forest Geodome Retreat',
      location: { coordinates: [-5.0527, 50.2660] as [number, number] },  // Cornwall
      description: 'Stunning geodesic domes in a secluded forest clearing with stargazing.',
      region: 'Cornwall',
      rating: 4.9,
      priceRange: '$$$',
      images: ['https://picsum.photos/400/400?random=106']
    }
  ];
  
  // Filter by search query if provided
  if (searchQuery && searchQuery.toLowerCase() !== 'all') {
    const query = searchQuery.toLowerCase();
    const filtered = glampsites.filter(site => 
      site.name.toLowerCase().includes(query) ||
      site.region.toLowerCase().includes(query) ||
      site.description.toLowerCase().includes(query)
    );
    
    // If we have exact matches, put them first, then add others to make 5 total
    if (filtered.length > 0) {
      const others = glampsites.filter(site => !filtered.includes(site));
      const combined = [...filtered, ...others];
      return combined.slice(0, 5);
    }
  }
  
  // Return first 5 glampsites
  return glampsites.slice(0, 5);
}
