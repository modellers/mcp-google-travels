# MCP Google Travels

A Model Context Protocol (MCP) server that provides tools for searching flights, hotels, and vacation rentals using Google's travel data via SerpAPI. This server enables AI assistants to help users browse real travel options without making actual bookings.

## Features

This MCP server provides the following tools:

### Flight Search Tools
- **search_flights** - One-way or round-trip flight search with real pricing from Google Flights
- **search_multi_city** - Multi-city flight search for trips with multiple destinations

### Hotel Search Tools
- **search_hotels** - Search hotels with filters for location, dates, guests, and amenities
- **get_hotel_details** - Get detailed hotel information including reviews and room options

### Vacation Rental Tools
- **search_vacation_rentals** - Search for vacation rentals (homes, apartments, villas) with various filters

### Resources
- **mcp://airports** - Static list of major airports with IATA codes

## Data Source

This server uses **SerpAPI** to fetch real-time data from Google Flights and Google Hotels. SerpAPI provides:
- Live flight prices and availability
- Hotel search results with reviews and ratings
- Price insights and trends
- Comprehensive travel information

## Installation

### Option 1: From GitHub

Clone the repository and install dependencies:

```bash
git clone https://github.com/modellers/mcp-google-travels.git
cd mcp-google-travels
npm install
npm run build
```

### Option 2: From npm (if published)

```bash
npm install -g mcp-google-travels
```

### Set Up SerpAPI

You'll need a SerpAPI API key to use this server:

1. Sign up at [serpapi.com](https://serpapi.com)
2. Get your API key from the dashboard
3. Create a `.env` file in the project root:

```bash
SERPAPI_API_KEY=your_serpapi_key_here
```

Or set it as an environment variable in your Claude Desktop configuration (see below).

## Usage

### As an MCP Server

This server uses the stdio transport protocol. You can integrate it with any MCP-compatible client.

#### Configuration for Claude Desktop

Add to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Using the GitHub repository:**

```json
{
  "mcpServers": {
    "google-travels": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-google-travels/dist/index.js"],
      "env": {
        "SERPAPI_API_KEY": "your_serpapi_key_here"
      }
    }
  }
}
```

Replace `/absolute/path/to/mcp-google-travels` with the actual path where you cloned the repository.

**If installed globally via npm:**

```json
{
  "mcpServers": {
    "google-travels": {
      "command": "mcp-google-travels",
      "env": {
        "SERPAPI_API_KEY": "your_serpapi_key_here"
      }
    }
  }
}
```

**Important:** Replace `your_serpapi_key_here` with your actual SerpAPI key.

### Direct Usage

You can also run the server directly:

```bash
node dist/index.js
```

The server will start and listen for JSON-RPC requests on stdin/stdout.

## Development

### Building

```bash
npm run build
```

### Watching for Changes

```bash
npm run watch
```

### Testing

Run the test script to verify all tools are working:

```bash
node dist/test.js
```

#### Using MCP Inspector

The MCP Inspector is a debugging tool that allows you to interactively test your MCP server. To use it:

1. **Install the MCP Inspector** (if not already installed):
   ```bash
   npx @modelcontextprotocol/inspector
   ```

2. **Build your server**:
   ```bash
   npm run build
   ```

3. **Start the Inspector**:
   ```bash
   npx @modelcontextprotocol/inspector node dist/index.js
   ```

4. **Open the Inspector UI** in your browser at the URL shown in the terminal (typically http://localhost:5173)

5. **Test the tools** interactively:
   - View all available tools in the left panel
   - Click on any tool to see its schema and parameters
   - Fill in the parameters and execute the tool
   - See the results in real-time

This is particularly useful for:
- Testing individual tools during development
- Debugging tool responses
- Validating parameter schemas
- Understanding the tool capabilities before integration



## Tool Examples

### Search Flights

Search for round-trip flights with real pricing from Google Flights:

```json
{
  "name": "search_flights",
  "arguments": {
    "origin": "SFO",
    "destination": "LAX",
    "departureDate": "2025-03-15",
    "returnDate": "2025-03-20",
    "passengers": 2,
    "cabinClass": "economy"
  }
}
```

**Response includes:**
- Best and alternative flight options
- Real-time pricing in USD
- Flight duration and layover information
- Airline and aircraft details
- Carbon emissions data
- Price insights and trends

### Search Multi-City

Search for multi-leg trips (3+ destinations):

```json
{
  "name": "search_multi_city",
  "arguments": {
    "flights": [
      {
        "origin": "SFO",
        "destination": "NYC",
        "departureDate": "2025-03-15"
      },
      {
        "origin": "NYC",
        "destination": "LON",
        "departureDate": "2025-03-20"
      },
      {
        "origin": "LON",
        "destination": "SFO",
        "departureDate": "2025-03-25"
      }
    ],
    "passengers": 1,
    "cabinClass": "business"
  }
}
```

**Response includes:**
- Combined itinerary pricing
- Individual leg details
- Total travel time
- Layover information

### Get Flight Details

Get comprehensive details about a specific flight:

```json
{
  "name": "get_flight_details",
  "arguments": {
    "flightId": "FL-SFO-LAX-001"
  }
}
```

**Response includes:**
- Complete schedule and timing
- Aircraft type and configuration
- In-flight amenities (WiFi, entertainment, meals)
- Baggage allowances
- Seat availability
- Refund and change policies

### Search Hotels

Search for hotels with extensive filters:

```json
{
  "name": "search_hotels",
  "arguments": {
    "location": "San Francisco",
    "checkIn": "2025-03-15",
    "checkOut": "2025-03-17",
    "guests": 2,
    "rooms": 1,
    "minPrice": 100,
    "maxPrice": 300,
    "starRating": 4,
    "amenities": ["wifi", "pool", "gym"]
  }
}
```

**Response includes:**
- Hotel properties with real-time availability
- Nightly rates and total pricing
- Guest ratings and review counts
- Property photos
- Location and distance information
- Available amenities

### Get Hotel Details

Get full property information:

```json
{
  "name": "get_hotel_details",
  "arguments": {
    "hotelId": "HTL-San-Francisco-001"
  }
}
```

**Response includes:**
- Detailed property description
- Room types and configurations
- Full amenity list
- Guest reviews and ratings
- Nearby attractions
- Cancellation policies

### Search Vacation Rentals

Search for vacation homes and apartments:

```json
{
  "name": "search_vacation_rentals",
  "arguments": {
    "location": "Miami Beach",
    "checkIn": "2025-03-15",
    "checkOut": "2025-03-22",
    "guests": 4,
    "bedrooms": 2,
    "bathrooms": 2,
    "propertyType": "house",
    "amenities": ["wifi", "kitchen", "pool", "parking"]
  }
}
```

**Response includes:**
- Available vacation rentals
- Nightly and total pricing
- Property photos and descriptions
- Host information
- Guest reviews
- House rules and check-in details

## API Integration Details

### SerpAPI Parameters

The server translates MCP tool calls into SerpAPI requests:

**Flight Search:**
- Engine: `google_flights`
- Parameters: `departure_id`, `arrival_id`, `outbound_date`, `return_date`, `adults`, `travel_class`, `type`
- Travel class mapping: economy→1, premium_economy→2, business→3, first→4
- Type codes: 1=round-trip, 2=one-way, 3=multi-city

**Hotel Search:**
- Engine: `google_hotels`
- Parameters: `q`, `check_in_date`, `check_out_date`, `adults`, `currency`, `min_price`, `max_price`, `hotel_class`

**Multi-City:**
- Uses `multi_city_json` parameter with array of legs
- Each leg: `{departure_id, arrival_id, date}`

### Response Structure

All responses return structured JSON data from Google with:
- `best_flights` / `properties` - Top recommended results
- `other_flights` / `other_options` - Alternative choices
- `price_insights` - Historical pricing and predictions
- `search_metadata` - Search parameters and timing
- `search_parameters` - Echo of request parameters

## Note on Data

This server provides real-time travel data from Google Flights and Google Hotels via SerpAPI. All searches return:
- Live pricing and availability
- Actual flight schedules and hotel properties
- Real guest reviews and ratings
- Current travel restrictions and policies

**Important:** This is a browse-only service - no bookings are made. Users should complete their bookings directly with airlines, hotels, or booking platforms.

## Development

### Running Tests

The project includes comprehensive tests with mock data from real SerpAPI responses:

```bash
# Run all tests
npm test

# Generate fresh mock data from SerpAPI
npm run generate-mocks
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

### Building

```bash
npm run build
```

### Watching for Changes

```bash
npm run watch
```

## License

MIT
