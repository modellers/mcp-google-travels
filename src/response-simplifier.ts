/**
 * Response Simplification Utilities
 * 
 * These utilities extract the most important information from SerpAPI responses
 * while preserving tokens/IDs and booking links for next steps.
 */

interface SimplifiedFlight {
  // Essential info for display
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    code: string;
    time: string;
  };
  arrival: {
    airport: string;
    code: string;
    time: string;
  };
  duration: string;
  stops: number;
  price: number;
  currency: string;
  
  // Booking information
  bookingToken?: string;
  departureToken?: string;
  
  // Key highlights
  highlights?: string[];
}

interface SimplifiedHotel {
  // Essential info for display
  hotelId: string; // Use property_token as ID
  name: string;
  type: string; // hotel, vacation rental, etc.
  rating?: number;
  reviewCount?: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  location?: string;
  
  // Booking information
  propertyToken: string; // For detail lookup
  bookingLink?: string; // Direct link to booking page
  
  // Key highlights
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
}

/**
 * Simplify SerpAPI flight search response
 */
export function simplifyFlightResponse(serpApiResponse: any): {
  summary: {
    searchParams: any;
    totalResults: number;
    priceRange?: { min: number; max: number };
    googleFlightsUrl?: string;
  };
  bestFlights: SimplifiedFlight[];
  otherFlights: SimplifiedFlight[];
  priceInsights?: any;
} {
  const bestFlights = (serpApiResponse.best_flights || []).map((option: any) => 
    simplifyFlightOption(option)
  );
  
  const otherFlights = (serpApiResponse.other_flights || []).map((option: any) =>
    simplifyFlightOption(option)
  );
  
  const allPrices = [...bestFlights, ...otherFlights].map(f => f.price);
  const priceRange = allPrices.length > 0 ? {
    min: Math.min(...allPrices),
    max: Math.max(...allPrices)
  } : undefined;
  
  return {
    summary: {
      searchParams: serpApiResponse.search_parameters,
      totalResults: bestFlights.length + otherFlights.length,
      priceRange,
      googleFlightsUrl: serpApiResponse.search_metadata?.google_flights_url
    },
    bestFlights,
    otherFlights: otherFlights.slice(0, 5), // Limit to top 5 alternatives
    priceInsights: serpApiResponse.price_insights
  };
}

/**
 * Simplify a single flight option
 */
function simplifyFlightOption(option: any): SimplifiedFlight {
  const firstFlight = option.flights?.[0] || {};
  const lastFlight = option.flights?.[option.flights.length - 1] || firstFlight;
  
  return {
    airline: firstFlight.airline || 'Unknown',
    flightNumber: firstFlight.flight_number || '',
    departure: {
      airport: firstFlight.departure_airport?.name || '',
      code: firstFlight.departure_airport?.id || '',
      time: firstFlight.departure_airport?.time || ''
    },
    arrival: {
      airport: lastFlight.arrival_airport?.name || '',
      code: lastFlight.arrival_airport?.id || '',
      time: lastFlight.arrival_airport?.time || ''
    },
    duration: formatDuration(option.total_duration || 0),
    stops: (option.flights?.length || 1) - 1,
    price: option.price || 0,
    currency: 'USD',
    bookingToken: option.booking_token,
    departureToken: option.departure_token,
    highlights: buildFlightHighlights(option)
  };
}

/**
 * Simplify SerpAPI hotel search response
 */
export function simplifyHotelResponse(serpApiResponse: any): {
  summary: {
    searchParams: any;
    totalResults: number;
    priceRange?: { min: number; max: number };
  };
  properties: SimplifiedHotel[];
} {
  const properties = (serpApiResponse.properties || []).map((prop: any) =>
    simplifyHotelProperty(prop)
  );
  
  const allPrices = properties.map((p: SimplifiedHotel) => p.pricePerNight).filter((p: number) => p > 0);
  const priceRange = allPrices.length > 0 ? {
    min: Math.min(...allPrices),
    max: Math.max(...allPrices)
  } : undefined;
  
  return {
    summary: {
      searchParams: serpApiResponse.search_parameters,
      totalResults: properties.length,
      priceRange
    },
    properties: properties.slice(0, 10) // Limit to top 10
  };
}

/**
 * Simplify a single hotel property
 */
function simplifyHotelProperty(prop: any): SimplifiedHotel {
  return {
    hotelId: prop.property_token || generateHotelId(prop),
    name: prop.name || 'Unknown Property',
    type: prop.type || 'hotel',
    rating: prop.overall_rating,
    reviewCount: prop.reviews,
    pricePerNight: prop.rate_per_night?.extracted_lowest || 0,
    totalPrice: prop.total_rate?.extracted_lowest || 0,
    currency: 'USD',
    location: prop.neighborhood || prop.location || '',
    propertyToken: prop.property_token || '',
    bookingLink: prop.link, // Direct link to booking page
    amenities: prop.amenities?.slice(0, 5), // Top 5 amenities
    checkIn: prop.check_in_time,
    checkOut: prop.check_out_time
  };
}

/**
 * Helper functions
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function generateHotelId(prop: any): string {
  return `HTL-${prop.name?.replace(/\s+/g, '-').substring(0, 20)}-${Date.now()}`;
}

function buildFlightHighlights(option: any): string[] {
  const highlights: string[] = [];
  
  if (option.carbon_emissions?.difference_percent < 0) {
    highlights.push(`${Math.abs(option.carbon_emissions.difference_percent)}% less CO2`);
  }
  
  const firstFlight = option.flights?.[0];
  if (firstFlight?.legroom) {
    highlights.push(`Legroom: ${firstFlight.legroom}`);
  }
  
  if (firstFlight?.travel_class) {
    highlights.push(firstFlight.travel_class);
  }
  
  if (option.type) {
    highlights.push(option.type);
  }
  
  return highlights.slice(0, 3); // Max 3 highlights
}
