#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

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
    name: "get_flight_details",
    description: "Get detailed flight information. Retrieve detailed information about a specific flight including schedule, aircraft, amenities, and pricing.",
    inputSchema: {
      type: "object",
      properties: {
        flightId: {
          type: "string",
          description: "Unique flight identifier from search results"
        }
      },
      required: ["flightId"]
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
    description: "Get detailed hotel information. Retrieve detailed information about a specific hotel including amenities, photos, reviews, and room options.",
    inputSchema: {
      type: "object",
      properties: {
        hotelId: {
          type: "string",
          description: "Unique hotel identifier from search results"
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

// Mock data generators
function searchFlights(args: any) {
  const { origin, destination, departureDate, returnDate, passengers = 1, cabinClass = "economy" } = args;
  
  // Generate mock flight results
  const mockFlights = [
    {
      flightId: `FL-${origin}-${destination}-001`,
      airline: "United Airlines",
      flightNumber: "UA 1234",
      origin,
      destination,
      departureTime: `${departureDate}T08:00:00`,
      arrivalTime: `${departureDate}T11:30:00`,
      duration: "3h 30m",
      stops: 0,
      cabinClass,
      price: passengers * (cabinClass === "economy" ? 250 : cabinClass === "business" ? 850 : 450),
      currency: "USD",
      availableSeats: 12
    },
    {
      flightId: `FL-${origin}-${destination}-002`,
      airline: "Delta Air Lines",
      flightNumber: "DL 5678",
      origin,
      destination,
      departureTime: `${departureDate}T14:15:00`,
      arrivalTime: `${departureDate}T17:45:00`,
      duration: "3h 30m",
      stops: 0,
      cabinClass,
      price: passengers * (cabinClass === "economy" ? 280 : cabinClass === "business" ? 900 : 480),
      currency: "USD",
      availableSeats: 8
    },
    {
      flightId: `FL-${origin}-${destination}-003`,
      airline: "American Airlines",
      flightNumber: "AA 9012",
      origin,
      destination,
      departureTime: `${departureDate}T18:30:00`,
      arrivalTime: `${departureDate}T22:00:00`,
      duration: "3h 30m",
      stops: 0,
      cabinClass,
      price: passengers * (cabinClass === "economy" ? 230 : cabinClass === "business" ? 820 : 430),
      currency: "USD",
      availableSeats: 15
    }
  ];

  return {
    searchCriteria: {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabinClass
    },
    totalResults: mockFlights.length,
    flights: mockFlights,
    note: "This is a mock flight search. Real integration would connect to Google Flights API or similar service."
  };
}

function searchMultiCity(args: any) {
  const { flights, passengers = 1, cabinClass = "economy" } = args;
  
  const mockResults = flights.map((leg: any, index: number) => ({
    legNumber: index + 1,
    flightId: `FL-MC-${leg.origin}-${leg.destination}-${index + 1}`,
    airline: ["United Airlines", "Delta Air Lines", "American Airlines"][index % 3],
    flightNumber: `UA ${1000 + index}`,
    origin: leg.origin,
    destination: leg.destination,
    departureTime: `${leg.departureDate}T10:00:00`,
    arrivalTime: `${leg.departureDate}T14:00:00`,
    duration: "4h 00m",
    stops: 0,
    cabinClass,
    price: passengers * (cabinClass === "economy" ? 300 : cabinClass === "business" ? 950 : 520),
    currency: "USD",
    availableSeats: 10
  }));

  const totalPrice = mockResults.reduce((sum: number, flight: any) => sum + flight.price, 0);

  return {
    searchCriteria: {
      flights,
      passengers,
      cabinClass
    },
    totalLegs: mockResults.length,
    totalPrice,
    currency: "USD",
    legs: mockResults,
    note: "This is a mock multi-city flight search. Real integration would connect to Google Flights API or similar service."
  };
}

function getFlightDetails(args: any) {
  const { flightId } = args;
  
  return {
    flightId,
    airline: "United Airlines",
    flightNumber: "UA 1234",
    aircraft: {
      model: "Boeing 737-900",
      manufacturer: "Boeing",
      seatingCapacity: 179
    },
    origin: {
      airport: "San Francisco International Airport",
      code: "SFO",
      terminal: "3",
      gate: "B7"
    },
    destination: {
      airport: "Los Angeles International Airport",
      code: "LAX",
      terminal: "7",
      gate: "C5"
    },
    schedule: {
      departureTime: "2024-01-15T08:00:00",
      arrivalTime: "2024-01-15T11:30:00",
      duration: "3h 30m",
      timezone: {
        departure: "PST",
        arrival: "PST"
      }
    },
    stops: 0,
    cabinClass: "economy",
    pricing: {
      basePrice: 250,
      taxes: 45,
      fees: 15,
      totalPrice: 310,
      currency: "USD"
    },
    amenities: [
      "WiFi available (paid)",
      "In-flight entertainment",
      "Power outlets",
      "Snacks and beverages",
      "Checked baggage (1 bag included)"
    ],
    baggagePolicy: {
      carryOn: "1 personal item + 1 carry-on bag",
      checked: "1 checked bag up to 50 lbs included",
      additionalFee: 35
    },
    seatMap: "Available during booking",
    note: "This is mock flight detail data. Real integration would connect to Google Flights API or similar service."
  };
}

function searchHotels(args: any) {
  const { location, checkIn, checkOut, guests = 2, rooms = 1, minPrice, maxPrice, starRating, amenities } = args;
  
  const mockHotels = [
    {
      hotelId: `HTL-${location.replace(/\s+/g, '-')}-001`,
      name: "Grand Plaza Hotel",
      starRating: 4,
      location: {
        address: `123 Main Street, ${location}`,
        neighborhood: "Downtown",
        coordinates: { lat: 37.7749, lng: -122.4194 }
      },
      pricePerNight: 189,
      totalPrice: 189 * calculateNights(checkIn, checkOut) * rooms,
      currency: "USD",
      images: ["https://example.com/hotel1-img1.jpg"],
      amenities: ["WiFi", "Pool", "Gym", "Restaurant", "Parking"],
      rating: {
        score: 4.3,
        reviewCount: 1247
      },
      availableRooms: 5,
      roomType: "Deluxe King Room"
    },
    {
      hotelId: `HTL-${location.replace(/\s+/g, '-')}-002`,
      name: "Seaside Resort & Spa",
      starRating: 5,
      location: {
        address: `456 Ocean Drive, ${location}`,
        neighborhood: "Beachfront",
        coordinates: { lat: 37.7849, lng: -122.4094 }
      },
      pricePerNight: 349,
      totalPrice: 349 * calculateNights(checkIn, checkOut) * rooms,
      currency: "USD",
      images: ["https://example.com/hotel2-img1.jpg"],
      amenities: ["WiFi", "Pool", "Spa", "Beach Access", "Restaurant", "Bar", "Gym", "Parking"],
      rating: {
        score: 4.7,
        reviewCount: 892
      },
      availableRooms: 3,
      roomType: "Ocean View Suite"
    },
    {
      hotelId: `HTL-${location.replace(/\s+/g, '-')}-003`,
      name: "Budget Inn Express",
      starRating: 3,
      location: {
        address: `789 Budget Lane, ${location}`,
        neighborhood: "Airport Area",
        coordinates: { lat: 37.7649, lng: -122.4294 }
      },
      pricePerNight: 89,
      totalPrice: 89 * calculateNights(checkIn, checkOut) * rooms,
      currency: "USD",
      images: ["https://example.com/hotel3-img1.jpg"],
      amenities: ["WiFi", "Parking", "Breakfast"],
      rating: {
        score: 3.8,
        reviewCount: 543
      },
      availableRooms: 12,
      roomType: "Standard Queen Room"
    }
  ];

  // Apply filters
  let filteredHotels = mockHotels;
  if (minPrice) {
    filteredHotels = filteredHotels.filter(h => h.pricePerNight >= minPrice);
  }
  if (maxPrice) {
    filteredHotels = filteredHotels.filter(h => h.pricePerNight <= maxPrice);
  }
  if (starRating) {
    filteredHotels = filteredHotels.filter(h => h.starRating >= starRating);
  }

  return {
    searchCriteria: {
      location,
      checkIn,
      checkOut,
      guests,
      rooms,
      nights: calculateNights(checkIn, checkOut)
    },
    totalResults: filteredHotels.length,
    hotels: filteredHotels,
    note: "This is a mock hotel search. Real integration would connect to Google Hotels API or similar service."
  };
}

function getHotelDetails(args: any) {
  const { hotelId } = args;
  
  return {
    hotelId,
    name: "Grand Plaza Hotel",
    starRating: 4,
    location: {
      address: "123 Main Street, San Francisco, CA 94102",
      neighborhood: "Downtown",
      coordinates: { lat: 37.7749, lng: -122.4194 },
      nearbyAttractions: [
        { name: "Union Square", distance: "0.3 miles" },
        { name: "Cable Car Museum", distance: "0.5 miles" },
        { name: "Chinatown", distance: "0.7 miles" }
      ]
    },
    description: "A luxurious downtown hotel offering modern amenities and exceptional service. Perfect for both business and leisure travelers.",
    images: [
      "https://example.com/hotel-img1.jpg",
      "https://example.com/hotel-img2.jpg",
      "https://example.com/hotel-img3.jpg"
    ],
    amenities: {
      property: ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Bar", "Room Service", "Concierge", "Valet Parking"],
      room: ["Air Conditioning", "TV", "Mini Bar", "Coffee Maker", "Safe", "Iron"]
    },
    roomTypes: [
      {
        type: "Standard King",
        pricePerNight: 189,
        bedding: "1 King Bed",
        maxOccupancy: 2,
        size: "300 sq ft",
        available: 5
      },
      {
        type: "Deluxe Suite",
        pricePerNight: 349,
        bedding: "1 King Bed + Sofa Bed",
        maxOccupancy: 4,
        size: "550 sq ft",
        available: 2
      }
    ],
    reviews: {
      overallRating: 4.3,
      totalReviews: 1247,
      breakdown: {
        cleanliness: 4.5,
        service: 4.4,
        location: 4.7,
        value: 4.0
      },
      recentReviews: [
        {
          rating: 5,
          comment: "Excellent location and friendly staff!",
          date: "2024-01-10",
          reviewer: "John D."
        },
        {
          rating: 4,
          comment: "Great hotel, small rooms but very clean.",
          date: "2024-01-08",
          reviewer: "Sarah M."
        }
      ]
    },
    policies: {
      checkIn: "3:00 PM",
      checkOut: "11:00 AM",
      cancellation: "Free cancellation up to 24 hours before check-in",
      pets: "Pets allowed (additional fee)",
      smoking: "Non-smoking property"
    },
    contact: {
      phone: "+1 (415) 555-0123",
      email: "info@grandplazahotel.com",
      website: "https://grandplazahotel.com"
    },
    note: "This is mock hotel detail data. Real integration would connect to Google Hotels API or similar service."
  };
}

function searchVacationRentals(args: any) {
  const { location, checkIn, checkOut, guests = 2, bedrooms, bathrooms, minPrice, maxPrice, propertyType = "any", amenities } = args;
  
  const mockRentals = [
    {
      rentalId: `VR-${location.replace(/\s+/g, '-')}-001`,
      title: "Cozy Beach House with Ocean Views",
      propertyType: "house",
      location: {
        address: `Beach Road, ${location}`,
        neighborhood: "Beachfront",
        coordinates: { lat: 25.7617, lng: -80.1918 }
      },
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
      pricePerNight: 225,
      totalPrice: 225 * calculateNights(checkIn, checkOut),
      currency: "USD",
      images: ["https://example.com/rental1-img1.jpg"],
      amenities: ["WiFi", "Kitchen", "Washer", "Dryer", "AC", "Beach Access", "Parking"],
      rating: {
        score: 4.8,
        reviewCount: 156
      },
      host: {
        name: "Maria S.",
        memberSince: "2019",
        responseRate: "100%"
      },
      minimumNights: 2
    },
    {
      rentalId: `VR-${location.replace(/\s+/g, '-')}-002`,
      title: "Modern Downtown Apartment",
      propertyType: "apartment",
      location: {
        address: `City Center, ${location}`,
        neighborhood: "Downtown",
        coordinates: { lat: 25.7717, lng: -80.1818 }
      },
      bedrooms: 2,
      bathrooms: 1,
      maxGuests: 4,
      pricePerNight: 150,
      totalPrice: 150 * calculateNights(checkIn, checkOut),
      currency: "USD",
      images: ["https://example.com/rental2-img1.jpg"],
      amenities: ["WiFi", "Kitchen", "Washer", "Dryer", "AC", "Gym", "Parking"],
      rating: {
        score: 4.6,
        reviewCount: 89
      },
      host: {
        name: "John D.",
        memberSince: "2020",
        responseRate: "95%"
      },
      minimumNights: 1
    },
    {
      rentalId: `VR-${location.replace(/\s+/g, '-')}-003`,
      title: "Luxury Villa with Private Pool",
      propertyType: "villa",
      location: {
        address: `Palm Estate, ${location}`,
        neighborhood: "Exclusive Suburb",
        coordinates: { lat: 25.7817, lng: -80.1718 }
      },
      bedrooms: 5,
      bathrooms: 4,
      maxGuests: 10,
      pricePerNight: 550,
      totalPrice: 550 * calculateNights(checkIn, checkOut),
      currency: "USD",
      images: ["https://example.com/rental3-img1.jpg"],
      amenities: ["WiFi", "Kitchen", "Washer", "Dryer", "AC", "Pool", "Hot Tub", "BBQ", "Parking"],
      rating: {
        score: 4.9,
        reviewCount: 234
      },
      host: {
        name: "David & Lisa",
        memberSince: "2018",
        responseRate: "100%",
        superhost: true
      },
      minimumNights: 3
    }
  ];

  // Apply filters
  let filteredRentals = mockRentals;
  if (bedrooms) {
    filteredRentals = filteredRentals.filter(r => r.bedrooms >= bedrooms);
  }
  if (bathrooms) {
    filteredRentals = filteredRentals.filter(r => r.bathrooms >= bathrooms);
  }
  if (minPrice) {
    filteredRentals = filteredRentals.filter(r => r.pricePerNight >= minPrice);
  }
  if (maxPrice) {
    filteredRentals = filteredRentals.filter(r => r.pricePerNight <= maxPrice);
  }
  if (propertyType !== "any") {
    filteredRentals = filteredRentals.filter(r => r.propertyType === propertyType);
  }

  return {
    searchCriteria: {
      location,
      checkIn,
      checkOut,
      guests,
      nights: calculateNights(checkIn, checkOut),
      bedrooms,
      bathrooms,
      propertyType
    },
    totalResults: filteredRentals.length,
    rentals: filteredRentals,
    note: "This is a mock vacation rental search. Real integration would connect to vacation rental APIs or services."
  };
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
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
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_flights":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(searchFlights(args), null, 2),
            },
          ],
        };

      case "search_multi_city":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(searchMultiCity(args), null, 2),
            },
          ],
        };

      case "get_flight_details":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(getFlightDetails(args), null, 2),
            },
          ],
        };

      case "search_hotels":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(searchHotels(args), null, 2),
            },
          ],
        };

      case "get_hotel_details":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(getHotelDetails(args), null, 2),
            },
          ],
        };

      case "search_vacation_rentals":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(searchVacationRentals(args), null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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
