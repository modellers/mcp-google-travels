# SerpAPI Integration Changes

This document describes the changes made to integrate SerpAPI for real-time Google Flights and Hotels data.

## Files Changed

### 1. package.json
- **Added dependency**: `dotenv@^16.3.1` for environment variable management

### 2. .env.example (NEW)
Created example environment file with:
```
SERPAPI_API_KEY=your_serpapi_key_here
```

### 3. README.md
Major updates:
- Changed description to mention SerpAPI integration
- Added "Data Source" section explaining SerpAPI
- Added installation steps for SerpAPI setup
- Updated configuration examples to include SERPAPI_API_KEY environment variable
- Enhanced tool examples with real response descriptions
- Added "API Integration Details" section with parameter mappings
- Updated data note from "mock data" to real-time data

### 4. src/index.ts (NEEDS MANUAL UPDATE)
Required changes:

#### Add imports:
```typescript
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
```

#### Add at top of file (after imports):
```typescript
dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

if (!SERPAPI_KEY) {
  console.error("Error: SERPAPI_API_KEY environment variable is required");
  console.error("Please set it in your .env file or environment");
  process.exit(1);
}

function mapCabinClass(cabinClass: string): string {
  const classMap: Record<string, string> = {
    economy: "1",
    premium_economy: "2",
    business: "3",
    first: "4",
  };
  return classMap[cabinClass] || "1";
}

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
```

#### Replace all mock data functions with SerpAPI calls:

**searchFlights** - Replace with:
```typescript
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
  if (returnDate) params.append("return_date", returnDate);
  const response = await fetch(`https://serpapi.com/search?${params}`);
  if (!response.ok) throw new Error(`SerpAPI request failed: ${response.status}`);
  return await response.json();
}
```

**searchMultiCity** - Replace with similar SerpAPI call using type="3" and multi_city_json

**searchHotels** - Replace with SerpAPI google_hotels engine

**searchVacationRentals** - Use google_hotels engine with "vacation rental" query

#### Add Resources support:
Add to server capabilities and implement ListResourcesRequestSchema and ReadResourceRequestSchema handlers for the AIRPORTS resource.

#### Update all function calls to async/await pattern

## Testing

After changes:
1. Run `npm install` to get dotenv
2. Create `.env` file with your SERPAPI_API_KEY
3. Run `npm run build`
4. Test with MCP Inspector: `npx @modelcontextprotocol/inspector node dist/index.js`

## API Key

Get your SerpAPI key from: https://serpapi.com
