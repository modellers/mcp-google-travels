# SerpAPI Google Flights & Hotels MCP Server

## Goal
Node.js MCP server for flight and hotel search using Google's data via SerpAPI.

## What It Does
Browse flight options, compare prices, search hotels and vacation rentals (read-only, no booking).

## External API
- **SerpAPI** (`serpapi.com/search`) - Google Flights and Google Hotels search aggregator

## MCP Endpoints

### Resources (1)
- `mcp://airports` - Static list of major airports with IATA codes

### Tools (7 total)

#### Flight Search
- `search_flights` - One-way or round-trip flight search with pricing
- `search_multi_city` - Multi-city itineraries (2+ legs)
- `get_flight_details` - Detailed info for specific flight

#### Hotel Search
- `search_hotels` - Hotel search with filters (price, class, amenities)
- `get_hotel_details` - Full property details, reviews, photos
- `search_vacation_rentals` - Vacation homes/apartments search

## Information Flow
1. Client requests flight/hotel search
2. Server calls SerpAPI with Google Flights/Hotels engine
3. SerpAPI returns aggregated Google data
4. Server returns formatted results to client

## API Parameters

### Flight Search
```
engine=google_flights
departure_id=JFK
arrival_id=LAX
outbound_date=2025-12-20
return_date=2025-12-27 (optional)
adults=2
type=1 (round-trip) or 2 (one-way)
api_key=...
```

### Multi-City
```
engine=google_flights
type=3
multi_city_json=[{"departure_id":"LAX","arrival_id":"JFK","date":"2025-12-20"},...]
adults=2
api_key=...
```

### Hotel Search
```
engine=google_hotels
q=San Francisco
check_in_date=2025-12-20
check_out_date=2025-12-23
adults=2
currency=USD
min_price=150
max_price=350
hotel_class=4,5
api_key=...
```

## How to Start

### 1. Install
```bash
npm install @modelcontextprotocol/sdk dotenv
```

### 2. Environment Variables
```bash
SERPAPI_API_KEY=your_serpapi_key
```

### 3. Create Server (src/serpapi-mcp.js)
```javascript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const AIRPORTS = [
  { id: "JFK", name: "John F. Kennedy International", city: "New York" },
  { id: "LAX", name: "Los Angeles International", city: "Los Angeles" },
  { id: "ORD", name: "O'Hare International", city: "Chicago" },
  // ... more airports
];

const server = new Server(
  { name: "serpapi-mcp", version: "1.0.0" },
  { capabilities: { resources: {}, tools: {} } }
);

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [{
    uri: "mcp://airports",
    name: "Airport List",
    mimeType: "application/json",
  }],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "mcp://airports") {
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(AIRPORTS, null, 2),
      }],
    };
  }
  throw new Error("Resource not found");
});

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_flights",
      description: "Search one-way or round-trip flights",
      inputSchema: {
        type: "object",
        properties: {
          departure_id: { type: "string", description: "IATA code (e.g., JFK)" },
          arrival_id: { type: "string", description: "IATA code (e.g., LAX)" },
          outbound_date: { type: "string", description: "YYYY-MM-DD" },
          return_date: { type: "string", description: "YYYY-MM-DD (optional)" },
          travel_class: { type: "string", enum: ["economy", "business"], default: "economy" },
          adults: { type: "number", default: 1 },
        },
        required: ["departure_id", "arrival_id", "outbound_date"],
      },
    },
    {
      name: "search_hotels",
      description: "Search hotels with filters",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Location or hotel name" },
          check_in_date: { type: "string", description: "YYYY-MM-DD" },
          check_out_date: { type: "string", description: "YYYY-MM-DD" },
          adults: { type: "number", default: 2 },
          min_price: { type: "number" },
          max_price: { type: "number" },
          hotel_class: { type: "string", description: "e.g., '3,4,5'" },
        },
        required: ["query", "check_in_date", "check_out_date"],
      },
    },
    // ... other 5 tools
  ],
}));

// Execute tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_flights") {
    const params = new URLSearchParams({
      engine: "google_flights",
      departure_id: args.departure_id,
      arrival_id: args.arrival_id,
      outbound_date: args.outbound_date,
      travel_class: args.travel_class === "business" ? "3" : "1",
      adults: args.adults || 1,
      type: args.return_date ? "1" : "2",
      api_key: SERPAPI_KEY,
    });

    if (args.return_date) params.append("return_date", args.return_date);

    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json();

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }

  if (name === "search_hotels") {
    const params = new URLSearchParams({
      engine: "google_hotels",
      q: args.query,
      check_in_date: args.check_in_date,
      check_out_date: args.check_out_date,
      adults: args.adults || 2,
      currency: args.currency || "USD",
      api_key: SERPAPI_KEY,
    });

    // Add optional filters
    if (args.min_price) params.append("min_price", args.min_price);
    if (args.max_price) params.append("max_price", args.max_price);
    if (args.hotel_class) params.append("hotel_class", args.hotel_class);

    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json();

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }

  // Handle other tools...
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 4. Run
```bash
node src/serpapi-mcp.js
```

### 5. Configure Claude Desktop
```json
{
  "mcpServers": {
    "serpapi-flights-hotels": {
      "command": "node",
      "args": ["/path/to/src/serpapi-mcp.js"],
      "env": {
        "SERPAPI_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Key Implementation Details

### Travel Class Mapping
- `economy` → `"1"`
- `premium_economy` → `"2"`
- `business` → `"3"`
- `first` → `"4"`

### Flight Type Codes
- `type=1` - Round-trip
- `type=2` - One-way
- `type=3` - Multi-city

### Multi-City JSON Structure
```javascript
const multiCityData = [
  { departure_id: "LAX", arrival_id: "JFK", date: "2025-12-20" },
  { departure_id: "JFK", arrival_id: "MIA", date: "2025-12-23" },
  { departure_id: "MIA", arrival_id: "LAX", date: "2025-12-27" }
];
params.append("multi_city_json", JSON.stringify(multiCityData));
```

### Response Structure
Returns raw Google Flights/Hotels JSON with:
- `best_flights` / `properties` - Top results
- `other_flights` / Additional options
- `price_insights` - Price trends
- `search_metadata` - Search info
