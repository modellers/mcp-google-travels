# MCP Google Travels

A Model Context Protocol (MCP) server that provides tools for searching flights, hotels, and vacation rentals. This server enables AI assistants to help users browse travel options without making actual bookings.

## Features

This MCP server provides the following tools:

- **search_flights** - Browse flight options between airports with filters for dates, passengers, and cabin class
- **search_multi_city** - Multi-city flight search for trips with multiple destinations
- **get_flight_details** - Get detailed information about a specific flight
- **search_hotels** - Search for hotels with filters for location, dates, guests, and amenities
- **get_hotel_details** - Get detailed hotel information including reviews and room options
- **search_vacation_rentals** - Search for vacation rentals (homes, apartments, villas) with various filters

## Installation

```bash
npm install
```

## Usage

### As an MCP Server

This server uses the stdio transport protocol. You can integrate it with any MCP-compatible client.

#### Configuration for Claude Desktop

Add to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-travels": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-google-travels/dist/index.js"]
    }
  }
}
```

Or if installed globally via npm:

```json
{
  "mcpServers": {
    "google-travels": {
      "command": "mcp-google-travels"
    }
  }
}
```

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

```json
{
  "name": "search_flights",
  "arguments": {
    "origin": "SFO",
    "destination": "LAX",
    "departureDate": "2024-03-15",
    "returnDate": "2024-03-20",
    "passengers": 2,
    "cabinClass": "economy"
  }
}
```

### Search Multi-City

```json
{
  "name": "search_multi_city",
  "arguments": {
    "flights": [
      {
        "origin": "SFO",
        "destination": "NYC",
        "departureDate": "2024-03-15"
      },
      {
        "origin": "NYC",
        "destination": "LON",
        "departureDate": "2024-03-20"
      },
      {
        "origin": "LON",
        "destination": "SFO",
        "departureDate": "2024-03-25"
      }
    ],
    "passengers": 1,
    "cabinClass": "business"
  }
}
```

### Get Flight Details

```json
{
  "name": "get_flight_details",
  "arguments": {
    "flightId": "FL-SFO-LAX-001"
  }
}
```

### Search Hotels

```json
{
  "name": "search_hotels",
  "arguments": {
    "location": "San Francisco",
    "checkIn": "2024-03-15",
    "checkOut": "2024-03-17",
    "guests": 2,
    "rooms": 1,
    "minPrice": 100,
    "maxPrice": 300,
    "starRating": 4,
    "amenities": ["wifi", "pool", "gym"]
  }
}
```

### Get Hotel Details

```json
{
  "name": "get_hotel_details",
  "arguments": {
    "hotelId": "HTL-San-Francisco-001"
  }
}
```

### Search Vacation Rentals

```json
{
  "name": "search_vacation_rentals",
  "arguments": {
    "location": "Miami Beach",
    "checkIn": "2024-03-15",
    "checkOut": "2024-03-22",
    "guests": 4,
    "bedrooms": 2,
    "bathrooms": 2,
    "propertyType": "house",
    "amenities": ["wifi", "kitchen", "pool", "parking"]
  }
}
```

## Note on Data

This server currently returns mock data for demonstration purposes. In a production environment, you would integrate with real travel APIs such as:

- Google Flights API
- Amadeus Travel APIs
- Booking.com API
- Airbnb API
- Or other travel service providers

The mock data structure is designed to be realistic and easily replaceable with real API integrations.

## License

MIT
