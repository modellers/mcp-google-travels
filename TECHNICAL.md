# Technical Documentation

## Response Simplification

### Overview
Raw SerpAPI responses are simplified to reduce size by 75-95% while preserving essential information and booking capabilities.

### Key Improvements
- **Flight responses**: 44KB → 10KB (77% reduction)
- **Hotel responses**: 118KB → 4KB (96% reduction)
- Preserves booking tokens and property tokens for next steps
- Maintains all essential display information

### Flight Response Structure

**Simplified output includes:**
```typescript
{
  summary: {
    searchParams: {...},
    totalResults: number,
    priceRange: { min, max },
    googleFlightsUrl: string  // Link to open in Google Flights
  },
  bestFlights: [
    {
      airline: string,
      flightNumber: string,
      departure: { airport, code, time },
      arrival: { airport, code, time },
      duration: string,
      stops: number,
      price: number,
      currency: string,
      bookingToken: string,      // For booking integration
      departureToken: string,    // Alternative token
      highlights: string[]       // CO2, legroom, class
    }
  ],
  otherFlights: [...],  // Top 5 alternatives
  priceInsights: {...}
}
```

### Hotel Response Structure

**Simplified output includes:**
```typescript
{
  summary: {
    searchParams: {...},
    totalResults: number,
    priceRange: { min, max }
  },
  properties: [
    {
      hotelId: string,
      name: string,
      type: string,
      rating: number,
      reviewCount: number,
      pricePerNight: number,
      totalPrice: number,
      currency: string,
      location: string,
      propertyToken: string,     // For detail lookup
      bookingLink: string,       // Direct booking URL
      amenities: string[],
      checkIn: string,
      checkOut: string
    }
  ]
}
```

## Booking Integration

### Flights
- Each flight includes `bookingToken` and `departureToken`
- Summary includes `googleFlightsUrl` to open full search
- Users can be directed to Google Flights or airline websites

### Hotels
- Each property includes `bookingLink` for direct booking
- Use `propertyToken` with `get_hotel_details` to see multiple booking sources
- Detail response includes top 5 booking options (Booking.com, Expedia, etc.)

## Hotel Detail Lookup

### Flow
```
1. search_hotels → get simplified results with propertyToken
2. get_hotel_details(propertyToken) → get comprehensive details
```

### Detailed Information Returned
- Full description
- Complete amenity list (top 15)
- Multiple pricing sources (top 5)
- Room types (top 5)
- Images (top 10)
- Policies (cancellation, check-in/out)
- Nearby places
- Full address and coordinates

### Why No Flight Details?
All useful flight information is already included in `search_flights` results. SerpAPI doesn't provide additional detail endpoints for flights, and adding a `get_flight_details` tool would be redundant.

## Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- All 5 MCP tools
- Response simplification
- Booking token validation
- Hotel property tokens
- Essential field preservation

## Development

### Project Structure
```
src/
├── index.ts               # Main MCP server
├── response-simplifier.ts # Response transformation
└── test/
    └── index.test.ts      # Test suite
```

### Build
```bash
npm run build
```

### Generate Mock Data
```bash
npm run generate-mocks
```
This fetches fresh data from SerpAPI and updates test fixtures.
