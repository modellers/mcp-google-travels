# Detail Lookup Implementation

## Overview

The MCP server supports **hotel detail lookups** using the property tokens preserved in search results.

**Note:** `get_flight_details` has been removed as it was redundant - all useful flight information is already included in `search_flights` results.

## How It Works

### Search → Details Flow

```
1. User calls search_hotels
   ↓
2. Response includes simplified results with propertyToken
   ↓
3. User extracts a token and calls:
   - get_hotel_details(hotelId)
   ↓
4. Server fetches comprehensive details
```

## Flight Details - REMOVED ❌

### Why Removed?
SerpAPI doesn't have a separate flight details endpoint, and all useful browsing information is already included in `search_flights` results:

**Already Available in search_flights:**
- ✅ Airline, flight number, times
- ✅ Duration, stops, price
- ✅ Aircraft type (when available)
- ✅ Carbon emissions
- ✅ Legroom information
- ✅ Travel class
- ✅ Price insights and trends
- ✅ Booking tokens (for external booking integrations)

**Not Available (Requires Airline APIs):**
- ❌ Real-time seat availability
- ❌ Seat maps
- ❌ Detailed baggage policy
- ❌ Meal options

**Conclusion:** A separate `get_flight_details` tool would be misleading and add no value for a browsing-focused MCP server.

## Hotel Details

### Full Implementation ✅
`get_hotel_details(hotelId)` now fetches **real detailed hotel information** from SerpAPI using the `property_token`.

### What's Fetched
- ✅ Full description
- ✅ Complete amenity list (top 15)
- ✅ Multiple pricing options (top 5 booking sources)
- ✅ Room types and availability (top 5)
- ✅ Hotel images (top 10)
- ✅ Detailed policies (cancellation, check-in/out, children)
- ✅ Nearby places
- ✅ Full address and coordinates
- ✅ Reviews and ratings

### Response Example
```json
{
  "hotelId": "ChoQtb7__uCU1dGBARoNL2cvMTFrajVuNzk1NRAC",
  "name": "Stylish 2BR Near Dodger Stadium",
  "type": "vacation rental",
  "description": "Modern apartment with...",
  "checkIn": "3:00 PM",
  "checkOut": "11:00 AM",
  "rating": 4.35,
  "reviews": 11,
  "location": {
    "address": "123 Main St, Los Angeles, CA",
    "neighborhood": "Downtown",
    "coordinates": { "latitude": 34.06, "longitude": -118.23 }
  },
  "prices": [
    {
      "source": "OneLuxStay",
      "rate": "$175",
      "total": "$877"
    },
    {
      "source": "Booking.com",
      "rate": "$180",
      "total": "$902"
    }
  ],
  "amenities": [
    "Air conditioning",
    "WiFi",
    "Kitchen",
    "Washer/Dryer",
    "Parking",
    ...
  ],
  "images": [
    "https://...",
    "https://...",
    ...
  ],
  "rooms": [
    {
      "type": "2 Bedroom Apartment",
      "beds": "1 King, 1 Queen",
      "rate": "$175"
    }
  ],
  "policies": {
    "checkIn": "3:00 PM",
    "checkOut": "11:00 AM",
    "cancellation": "Free cancellation before...",
    "children": "Children allowed"
  },
  "nearbyPlaces": [
    { "name": "Dodger Stadium", "distance": "0.5 miles" },
    ...
  ],
  "propertyToken": "ChoQtb7__uCU1dGBARoNL2cvMTFrajVuNzk1NRAC"
}
```

## Usage Example

### 1. Search for Hotels
```json
// Call: search_hotels
{
  "location": "Los Angeles",
  "checkIn": "2025-12-15",
  "checkOut": "2025-12-20",
  "guests": 2
}

// Response includes:
{
  "properties": [
    {
      "hotelId": "ChoQtb7__uCU1dGBARoNL2cvMTFrajVuNzk1NRAC",
      "name": "Stylish 2BR Near Dodger Stadium",
      "pricePerNight": 195,
      "rating": 4.35,
      "propertyToken": "ChoQtb7__uCU1dGBARoNL2cvMTFrajVuNzk1NRAC"
      // ... simplified info
    }
  ]
}
```

### 2. Get Hotel Details
```json
// Call: get_hotel_details
{
  "hotelId": "ChoQtb7__uCU1dGBARoNL2cvMTFrajVuNzk1NRAC"
}

// Response: Full hotel details with descriptions, images, all amenities, etc.
```

## Error Handling

### Invalid Token
```json
{
  "hotelId": "invalid",
  "error": "Invalid hotelId/property_token",
  "note": "Please provide a valid property_token from search_hotels results."
}
```

### API Error
```json
{
  "hotelId": "ChoQtb7...",
  "error": "SerpAPI request failed: 400 Bad Request",
  "note": "Failed to fetch hotel details. The property_token may be invalid or expired.",
  "suggestion": "Run search_hotels again to get fresh property tokens."
}
```

## Implementation Details

### Hotel Details Code
```typescript
async function getHotelDetails(args: any) {
  const { hotelId } = args;
  
  const params = new URLSearchParams({
    engine: "google_hotels",
    property_token: hotelId,
    currency: "USD",
    hl: "en",
    api_key: SERPAPI_KEY!,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  const rawData = await response.json();
  
  // Return simplified detailed response
  return {
    hotelId,
    name: rawData.name,
    description: rawData.description,
    prices: rawData.rates?.slice(0, 5),
    amenities: rawData.amenities?.slice(0, 15),
    images: rawData.images?.slice(0, 10),
    // ... more fields
  };
}
```

### Flight Details Code
```typescript
async function getFlightDetails(args: any) {
  const { flightId } = args;
  
  // Decode booking token
  const decoded = Buffer.from(flightId, 'base64').toString('utf-8');
  const parsed = JSON.parse(decoded);
  
  return {
    flightId,
    decodedInfo: parsed,
    guidance: { /* steps to get more details */ },
    availableInSearchResults: [ /* list of fields */ ]
  };
}
```

## Benefits

1. **Hotel Details**: Full implementation with real API data
2. **Flight Details**: Educational response guiding users to existing data
3. **Token Preservation**: Simplified responses maintain detail lookup capability
4. **Error Handling**: Clear messages when tokens are invalid
5. **Data Limiting**: Returns top 5-15 items to keep responses manageable

## Testing

All detail functions can be tested via the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

1. Search for hotels/flights
2. Copy a token from results
3. Call get_hotel_details or get_flight_details with that token
4. Verify detailed information is returned
