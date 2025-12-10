#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { simplifyFlightResponse, simplifyHotelResponse } from "./response-simplifier.js";

// Load environment variables
dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

if (!SERPAPI_KEY) {
  console.error("Error: SERPAPI_API_KEY environment variable is required");
  console.error("Please set it in your .env file or pass it via environment variables");
  process.exit(1);
}

// Helper function to map cabin class to SerpAPI travel class code
function mapCabinClass(cabinClass: string): string {
  const classMap: Record<string, string> = {
    economy: "1",
    premium_economy: "2",
    business: "3",
    first: "4",
  };
  return classMap[cabinClass] || "1";
}

// Airport list for resources
const AIRPORTS = [
  { id: "JFK", name: "John F. Kennedy International", city: "New York", country: "USA" },
  { id: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "USA" },
  { id: "ORD", name: "O'Hare International", city: "Chicago", country: "USA" },
  { id: "SFO", name: "San Francisco International", city: "San Francisco", country: "USA" },
  { id: "MIA", name: "Miami International", city: "Miami", country: "USA" },
  { id: "LHR", name: "Heathrow", city: "London", country: "UK" },
  { id: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France" },
  { id: "DXB", name: "Dubai International", city: "Dubai", country: "UAE" },
  { id: "NRT", name: "Narita International", city: "Tokyo", country: "Japan" },
  { id: "SYD", name: "Sydney Airport", city: "Sydney", country: "Australia" },
];

// Define tool schemas
const TOOLS: Tool[] = [
  {
    name: "search_flights",
    description: "Browse flight options (no booking). Search for flights between airports with optional filters like dates, passengers, and cabin class.",
    inputSchema: {
      type: "object",
      properties: {
        origin: {
          type: "string",
          description: "Departure airport code (e.g., 'SFO', 'JFK')"
        },
        destination: {
          type: "string",
          description: "Arrival airport code (e.g., 'LAX', 'ORD')"
        },
        departureDate: {
          type: "string",
          description: "Departure date in YYYY-MM-DD format"
        },
        returnDate: {
          type: "string",
          description: "Return date in YYYY-MM-DD format (optional for one-way trips)"
        },
        passengers: {
          type: "number",
          description: "Number of passengers (default: 1)"
        },
        cabinClass: {
          type: "string",
          enum: ["economy", "premium_economy", "business", "first"],
          description: "Cabin class preference (default: economy)"
        }
      },
      required: ["origin", "destination", "departureDate"]
    }
  },
  {
    name: "search_multi_city",
    description: "Multi-city flight search. Search for flights with multiple legs/destinations in a single trip.",
    inputSchema: {
      type: "object",
      properties: {
        flights: {
          type: "array",
          description: "Array of flight legs",
          items: {
            type: "object",
            properties: {
              origin: {
                type: "string",
                description: "Departure airport code"
              },
              destination: {
                type: "string",
                description: "Arrival airport code"
              },
              departureDate: {
                type: "string",
                description: "Departure date in YYYY-MM-DD format"
              }
            },
            required: ["origin", "destination", "departureDate"]
          }
        },
        passengers: {
          type: "number",
          description: "Number of passengers (default: 1)"
        },
        cabinClass: {
          type: "string",
          enum: ["economy", "premium_economy", "business", "first"],
          description: "Cabin class preference (default: economy)"
        }
      },
      required: ["flights"]
    }
  },
  {
    name: "search_hotels",
    description: "Hotel search. Search for hotels in a specific location with optional filters like dates, guests, amenities, and price range.",
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name or location to search (e.g., 'San Francisco', 'Paris')"
        },
        checkIn: {
          type: "string",
          description: "Check-in date in YYYY-MM-DD format"
        },
        checkOut: {
          type: "string",
          description: "Check-out date in YYYY-MM-DD format"
        },
        guests: {
          type: "number",
          description: "Number of guests (default: 2)"
        },
        rooms: {
          type: "number",
          description: "Number of rooms (default: 1)"
        },
        minPrice: {
          type: "number",
          description: "Minimum price per night in USD"
        },
        maxPrice: {
          type: "number",
          description: "Maximum price per night in USD"
        },
        starRating: {
          type: "number",
          description: "Minimum star rating (1-5)"
        },
        amenities: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Desired amenities (e.g., ['wifi', 'pool', 'parking', 'gym'])"
        }
      },
      required: ["location", "checkIn", "checkOut"]
    }
  },
  {
    name: "get_hotel_details",
    description: "Get comprehensive hotel details. Fetches full hotel information including complete description, all amenities, multiple pricing options from different booking sites, room types, images, policies, and nearby places. Use the propertyToken (hotelId) from search_hotels results.",
    inputSchema: {
      type: "object",
      properties: {
        hotelId: {
          type: "string",
          description: "Property token from search results (the 'propertyToken' or 'hotelId' field)"
        }
      },
      required: ["hotelId"]
    }
  },
  {
    name: "search_vacation_rentals",
    description: "Vacation rental search. Search for vacation rentals (homes, apartments, villas) in a specific location with optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name or location to search (e.g., 'Miami Beach', 'Lake Tahoe')"
        },
        checkIn: {
          type: "string",
          description: "Check-in date in YYYY-MM-DD format"
        },
        checkOut: {
          type: "string",
          description: "Check-out date in YYYY-MM-DD format"
        },
        guests: {
          type: "number",
          description: "Number of guests (default: 2)"
        },
        bedrooms: {
          type: "number",
          description: "Minimum number of bedrooms"
        },
        bathrooms: {
          type: "number",
          description: "Minimum number of bathrooms"
        },
        minPrice: {
          type: "number",
          description: "Minimum price per night in USD"
        },
        maxPrice: {
          type: "number",
          description: "Maximum price per night in USD"
        },
        propertyType: {
          type: "string",
          enum: ["house", "apartment", "condo", "villa", "cabin", "any"],
          description: "Type of property (default: any)"
        },
        amenities: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Desired amenities (e.g., ['wifi', 'kitchen', 'washer', 'pool', 'hot_tub'])"
        }
      },
      required: ["location", "checkIn", "checkOut"]
    }
  }
];

// SerpAPI functions
async function searchFlights(args: any) {
  const { origin, destination, departureDate, returnDate, passengers = 1, cabinClass = "economy" } = args;
  
  const params = new URLSearchParams({
    engine: "google_flights",
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departureDate,
    adults: passengers.toString(),
    travel_class: mapCabinClass(cabinClass),
    type: returnDate ? "1" : "2",
    currency: "USD",
    hl: "en",
    api_key: SERPAPI_KEY!,
  });

  if (returnDate) {
    params.append("return_date", returnDate);
  }

  const response = await fetch(`https://serpapi.com/search?${params}`);
  
  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
  }
  
  const rawData = await response.json();
  return simplifyFlightResponse(rawData);
}

async function searchMultiCity(args: any) {
  const { flights, passengers = 1, cabinClass = "economy" } = args;
  
  const multiCityData = flights.map((leg: any) => ({
    departure_id: leg.origin,
    arrival_id: leg.destination,
    date: leg.departureDate,
  }));

  const params = new URLSearchParams({
    engine: "google_flights",
    type: "3",
    adults: passengers.toString(),
    travel_class: mapCabinClass(cabinClass),
    currency: "USD",
    hl: "en",
    api_key: SERPAPI_KEY!,
  });

  params.append("multi_city_json", JSON.stringify(multiCityData));

  const response = await fetch(`https://serpapi.com/search?${params}`);
  
  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
  }
  
  const rawData = await response.json();
  return simplifyFlightResponse(rawData);
}

async function searchHotels(args: any) {
  const { location, checkIn, checkOut, guests = 2, rooms = 1, minPrice, maxPrice, starRating, amenities } = args;
  
  const params = new URLSearchParams({
    engine: "google_hotels",
    q: location,
    check_in_date: checkIn,
    check_out_date: checkOut,
    adults: guests.toString(),
    currency: "USD",
    hl: "en",
    api_key: SERPAPI_KEY!,
  });

  if (minPrice) params.append("min_price", minPrice.toString());
  if (maxPrice) params.append("max_price", maxPrice.toString());
  if (starRating) {
    const classes = [];
    for (let i = starRating; i <= 5; i++) classes.push(i.toString());
    params.append("hotel_class", classes.join(","));
  }

  const response = await fetch(`https://serpapi.com/search?${params}`);
  
  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
  }
  
  const rawData = await response.json();
  return simplifyHotelResponse(rawData);
}

async function getHotelDetails(args: any) {
  const { hotelId } = args;
  
  // The hotelId is actually a property_token from search results
  // SerpAPI supports fetching hotel details using property_token
  
  if (!hotelId || hotelId.length < 10) {
    return {
      error: "Invalid hotelId/property_token",
      note: "Please provide a valid property_token from search_hotels results.",
      example: "Use the 'propertyToken' field from hotel search results"
    };
  }
  
  try {
    const params = new URLSearchParams({
      engine: "google_hotels",
      property_token: hotelId,
      currency: "USD",
      hl: "en",
      api_key: SERPAPI_KEY!,
    });

    const response = await fetch(`https://serpapi.com/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
    }
    
    const rawData = await response.json();
    
    // Simplify the detailed response to include key information
    return {
      hotelId,
      name: rawData.name || "Unknown",
      type: rawData.type || "hotel",
      description: rawData.description,
      checkIn: rawData.check_in_time,
      checkOut: rawData.check_out_time,
      rating: rawData.overall_rating,
      reviews: rawData.reviews,
      location: {
        address: rawData.address,
        neighborhood: rawData.neighborhood,
        coordinates: rawData.gps_coordinates
      },
      prices: rawData.rates?.map((rate: any) => ({
        source: rate.source,
        rate: rate.rate,
        total: rate.total
      }))?.slice(0, 5), // Top 5 booking sources
      amenities: rawData.amenities?.slice(0, 15), // Top 15 amenities
      images: rawData.images?.map((img: any) => img.thumbnail || img.link)?.slice(0, 10), // Top 10 images
      rooms: rawData.rooms?.slice(0, 5), // Top 5 room types
      policies: {
        checkIn: rawData.check_in_time,
        checkOut: rawData.check_out_time,
        cancellation: rawData.policies?.cancellation,
        children: rawData.policies?.children
      },
      nearbyPlaces: rawData.nearby_places?.slice(0, 5),
      propertyToken: hotelId
    };
  } catch (error) {
    return {
      hotelId,
      error: error instanceof Error ? error.message : String(error),
      note: "Failed to fetch hotel details. The property_token may be invalid or expired.",
      suggestion: "Run search_hotels again to get fresh property tokens."
    };
  }
}

async function searchVacationRentals(args: any) {
  const { location, checkIn, checkOut, guests = 2, bedrooms, bathrooms, minPrice, maxPrice, propertyType, amenities } = args;
  
  const params = new URLSearchParams({
    engine: "google_hotels",
    q: `${location} vacation rental`,
    check_in_date: checkIn,
    check_out_date: checkOut,
    adults: guests.toString(),
    currency: "USD",
    hl: "en",
    api_key: SERPAPI_KEY!,
  });

  if (minPrice) params.append("min_price", minPrice.toString());
  if (maxPrice) params.append("max_price", maxPrice.toString());

  const response = await fetch(`https://serpapi.com/search?${params}`);
  
  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
  }
  
  const rawData = await response.json();
  const simplified = simplifyHotelResponse(rawData);
  
  return {
    ...simplified,
    search_note: "Vacation rental results from Google Hotels. Look for properties with type='vacation rental' or 'apartment'.",
    requested_filters: { bedrooms, bathrooms, propertyType, amenities }
  };
}

// Main server setup
const server = new Server(
  {
    name: "mcp-google-travels",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Register resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "mcp://airports",
        name: "Airport Codes",
        description: "List of common airport codes and names",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "mcp://airports") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(AIRPORTS, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    
    switch (name) {
      case "search_flights":
        result = await searchFlights(args);
        break;

      case "search_multi_city":
        result = await searchMultiCity(args);
        break;

      case "search_hotels":
        result = await searchHotels(args);
        break;

      case "get_hotel_details":
        result = await getHotelDetails(args);
        break;

      case "search_vacation_rentals":
        result = await searchVacationRentals(args);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Google Travels Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
