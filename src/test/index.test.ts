import { test } from 'node:test';
import assert from 'node:assert';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import { simplifyFlightResponse, simplifyHotelResponse } from '../response-simplifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load mock data
const mockDataPath = path.join(__dirname, '../../test/fixtures/serpapi-mock-data.json');
const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));

/**
 * Create a client connected to the MCP server
 */
async function createTestClient() {
  const serverPath = path.join(__dirname, '../index.js');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: {
      ...process.env,
      SERPAPI_API_KEY: 'test-key-for-mocking',
    },
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  await client.connect(transport);
  return client;
}

test('MCP Server - List Tools', async () => {
  const client = await createTestClient();
  
  try {
    const response = await client.listTools();
    
    assert.ok(response.tools, 'Should return tools');
    assert.ok(response.tools.length > 0, 'Should have at least one tool');
    
    const toolNames = response.tools.map((t: any) => t.name);
    assert.ok(toolNames.includes('search_flights'), 'Should have search_flights tool');
    assert.ok(toolNames.includes('search_multi_city'), 'Should have search_multi_city tool');
    assert.ok(toolNames.includes('search_hotels'), 'Should have search_hotels tool');
    assert.ok(toolNames.includes('search_vacation_rentals'), 'Should have search_vacation_rentals tool');
    assert.ok(toolNames.includes('get_hotel_details'), 'Should have get_hotel_details tool');
    assert.strictEqual(response.tools.length, 5, 'Should have exactly 5 tools');
    
    console.log(`✓ Found ${response.tools.length} tools`);
  } finally {
    await client.close();
  }
});

test('MCP Server - List Resources', async () => {
  const client = await createTestClient();
  
  try {
    const response = await client.listResources();
    
    assert.ok(response.resources, 'Should return resources');
    assert.ok(response.resources.length > 0, 'Should have at least one resource');
    
    const resourceUris = response.resources.map((r: any) => r.uri);
    assert.ok(resourceUris.includes('mcp://airports'), 'Should have airports resource');
    
    console.log(`✓ Found ${response.resources.length} resources`);
  } finally {
    await client.close();
  }
});

test('MCP Server - Read Airports Resource', async () => {
  const client = await createTestClient();
  
  try {
    const response = await client.readResource({ uri: 'mcp://airports' });
    
    assert.ok(response.contents, 'Should return contents');
    assert.ok(response.contents.length > 0, 'Should have content');
    
    const content = response.contents[0];
    assert.strictEqual(content.mimeType, 'application/json', 'Should be JSON content');
    
    // Handle both text and blob content types
    const textContent = 'text' in content ? content.text : '';
    const airports = JSON.parse(textContent);
    assert.ok(Array.isArray(airports), 'Should return array of airports');
    assert.ok(airports.length > 0, 'Should have airports');
    
    const jfk = airports.find((a: any) => a.id === 'JFK');
    assert.ok(jfk, 'Should include JFK airport');
    assert.strictEqual(jfk.name, 'John F. Kennedy International', 'JFK should have correct name');
    
    console.log(`✓ Found ${airports.length} airports`);
  } finally {
    await client.close();
  }
});

test('Search Flights Tool - Required Parameters', async () => {
  const client = await createTestClient();
  
  try {
    const searchFlightsTool = (await client.listTools()).tools.find((t: any) => t.name === 'search_flights');
    assert.ok(searchFlightsTool, 'search_flights tool should exist');
    
    const schema = searchFlightsTool.inputSchema;
    assert.ok(schema.required, 'Should have required fields');
    assert.ok(schema.required.includes('origin'), 'origin should be required');
    assert.ok(schema.required.includes('destination'), 'destination should be required');
    assert.ok(schema.required.includes('departureDate'), 'departureDate should be required');
    // passengers is optional with default value
    
    console.log('✓ search_flights has correct required parameters');
  } finally {
    await client.close();
  }
});

test('Search Hotels Tool - Required Parameters', async () => {
  const client = await createTestClient();
  
  try {
    const searchHotelsTool = (await client.listTools()).tools.find((t: any) => t.name === 'search_hotels');
    assert.ok(searchHotelsTool, 'search_hotels tool should exist');
    
    const schema = searchHotelsTool.inputSchema;
    assert.ok(schema.required, 'Should have required fields');
    assert.ok(schema.required.includes('location'), 'location should be required');
    assert.ok(schema.required.includes('checkIn'), 'checkIn should be required');
    assert.ok(schema.required.includes('checkOut'), 'checkOut should be required');
    
    console.log('✓ search_hotels has correct required parameters');
  } finally {
    await client.close();
  }
});

test('Mock Data - Flights Structure', () => {
  assert.ok(mockData.flights, 'Mock data should have flights');
  assert.ok(mockData.flights.search_metadata, 'Flights should have search_metadata');
  assert.ok(mockData.flights.search_parameters, 'Flights should have search_parameters');
  assert.ok(mockData.flights.best_flights || mockData.flights.other_flights, 'Flights should have results');
  
  // Check for booking tokens in flight options
  const flightOption = mockData.flights.best_flights?.[0] || mockData.flights.other_flights?.[0];
  if (flightOption) {
    assert.ok(
      flightOption.booking_token || flightOption.departure_token,
      'Flight options should have booking_token or departure_token'
    );
  }
  
  // Check for Google Flights URL
  if (mockData.flights.search_metadata) {
    const hasGoogleFlightsUrl = mockData.flights.search_metadata.google_flights_url;
    if (hasGoogleFlightsUrl) {
      assert.ok(hasGoogleFlightsUrl.includes('google.com'), 'Google Flights URL should be valid');
    }
  }
  
  console.log('✓ Flights mock data has correct structure');
});

test('Mock Data - Hotels Structure', () => {
  assert.ok(mockData.hotels, 'Mock data should have hotels');
  assert.ok(mockData.hotels.search_metadata, 'Hotels should have search_metadata');
  assert.ok(mockData.hotels.search_parameters, 'Hotels should have search_parameters');
  assert.ok(mockData.hotels.properties, 'Hotels should have properties');
  assert.ok(Array.isArray(mockData.hotels.properties), 'Properties should be an array');
  
  if (mockData.hotels.properties.length > 0) {
    const firstProperty = mockData.hotels.properties[0];
    assert.ok(firstProperty.name, 'Property should have name');
    assert.ok(firstProperty.link || firstProperty.property_token, 'Property should have link or token');
    
    // Validate booking information
    if (firstProperty.property_token) {
      assert.ok(
        typeof firstProperty.property_token === 'string',
        'Property token should be a string'
      );
    }
    if (firstProperty.link) {
      assert.ok(
        firstProperty.link.startsWith('http'),
        'Property link should be a valid URL'
      );
    }
  }
  
  console.log(`✓ Hotels mock data has ${mockData.hotels.properties.length} properties`);
});

test('Mock Data - Vacation Rentals Structure', () => {
  assert.ok(mockData.vacationRentals, 'Mock data should have vacation rentals');
  assert.ok(mockData.vacationRentals.search_metadata, 'Vacation rentals should have search_metadata');
  assert.ok(mockData.vacationRentals.properties, 'Vacation rentals should have properties');
  
  console.log(`✓ Vacation rentals mock data has ${mockData.vacationRentals.properties?.length || 0} properties`);
});

test('Mock Data - Generated Timestamp', () => {
  assert.ok(mockData.generatedAt, 'Mock data should have generation timestamp');
  const timestamp = new Date(mockData.generatedAt);
  assert.ok(!isNaN(timestamp.getTime()), 'Timestamp should be valid date');
  
  console.log(`✓ Mock data generated at ${mockData.generatedAt}`);
});

test('Tool Schema - search_flights cabin class options', async () => {
  const client = await createTestClient();
  
  try {
    const tools = await client.listTools();
    const searchFlights = tools.tools.find((t: any) => t.name === 'search_flights');
    
    assert.ok(searchFlights, 'search_flights tool should exist');
    const cabinClassProp: any = searchFlights?.inputSchema?.properties?.cabinClass;
    assert.ok(cabinClassProp?.enum, 'cabinClass should have enum values');
    assert.ok(cabinClassProp.enum.includes('economy'), 'Should include economy');
    assert.ok(cabinClassProp.enum.includes('premium_economy'), 'Should include premium_economy');
    assert.ok(cabinClassProp.enum.includes('business'), 'Should include business');
    assert.ok(cabinClassProp.enum.includes('first'), 'Should include first');
    
    console.log('✓ search_flights cabin class has all options');
  } finally {
    await client.close();
  }
});

test('Tool Schema - search_multi_city has flights parameter', async () => {
  const client = await createTestClient();
  
  try {
    const tools = await client.listTools();
    const searchMultiCity = tools.tools.find((t: any) => t.name === 'search_multi_city');
    
    assert.ok(searchMultiCity, 'search_multi_city tool should exist');
    const flightsProp: any = searchMultiCity?.inputSchema?.properties?.flights;
    assert.ok(flightsProp, 'Should have flights parameter');
    assert.strictEqual(flightsProp.type, 'array', 'flights should be an array');
    
    console.log('✓ search_multi_city has flights array parameter');
  } finally {
    await client.close();
  }
});

test('Tool Schema - search_vacation_rentals amenities', async () => {
  const client = await createTestClient();
  
  try {
    const tools = await client.listTools();
    const searchVacationRentals = tools.tools.find((t: any) => t.name === 'search_vacation_rentals');
    
    assert.ok(searchVacationRentals, 'search_vacation_rentals tool should exist');
    const amenitiesParam: any = searchVacationRentals?.inputSchema?.properties?.amenities;
    
    if (amenitiesParam) {
      assert.strictEqual(amenitiesParam.type, 'array', 'amenities should be array');
      console.log('✓ search_vacation_rentals has amenities array');
    } else {
      console.log('⚠ amenities parameter not found (may be optional)');
    }
  } finally {
    await client.close();
  }
});

test('Response Simplifier - Flight Booking Tokens', () => {
  // Use real mock data for flights
  const simplified = simplifyFlightResponse(mockData.flights);
  
  assert.ok(simplified, 'Should return simplified response');
  assert.ok(simplified.summary, 'Should have summary');
  assert.ok(simplified.bestFlights || simplified.otherFlights, 'Should have flights');
  
  // Check for Google Flights URL in summary
  if (simplified.summary.googleFlightsUrl) {
    assert.ok(
      simplified.summary.googleFlightsUrl.includes('google.com'),
      'Google Flights URL should be valid'
    );
  }
  
  // Check first flight has booking tokens
  const firstFlight = simplified.bestFlights?.[0] || simplified.otherFlights?.[0];
  if (firstFlight) {
    // Should have at least one booking token
    const hasBookingInfo = firstFlight.bookingToken || firstFlight.departureToken;
    assert.ok(hasBookingInfo, 'Flight should have booking token or departure token');
    
    // Verify token types
    if (firstFlight.bookingToken) {
      assert.strictEqual(typeof firstFlight.bookingToken, 'string', 'Booking token should be string');
    }
    if (firstFlight.departureToken) {
      assert.strictEqual(typeof firstFlight.departureToken, 'string', 'Departure token should be string');
    }
  }
  
  console.log('✓ Simplified flights include booking tokens');
});

test('Response Simplifier - Hotel Booking Links', () => {
  // Use real mock data for hotels
  const simplified = simplifyHotelResponse(mockData.hotels);
  
  assert.ok(simplified, 'Should return simplified response');
  assert.ok(simplified.summary, 'Should have summary');
  assert.ok(simplified.properties, 'Should have properties');
  assert.ok(Array.isArray(simplified.properties), 'Properties should be an array');
  
  if (simplified.properties.length > 0) {
    const firstProperty = simplified.properties[0];
    
    // Should have property token for detail lookup
    assert.ok(firstProperty.propertyToken, 'Property should have propertyToken');
    assert.strictEqual(
      typeof firstProperty.propertyToken,
      'string',
      'Property token should be string'
    );
    
    // Should have booking link if available in source
    if (firstProperty.bookingLink) {
      assert.ok(
        firstProperty.bookingLink.startsWith('http'),
        'Booking link should be valid URL'
      );
    }
    
    // Verify other essential fields
    assert.ok(firstProperty.hotelId, 'Property should have hotelId');
    assert.ok(firstProperty.name, 'Property should have name');
    assert.ok(typeof firstProperty.pricePerNight === 'number', 'Should have price per night');
  }
  
  console.log('✓ Simplified hotels include booking information');
});

test('Response Simplifier - Flight Structure Without flightId', () => {
  const simplified = simplifyFlightResponse(mockData.flights);
  const firstFlight = simplified.bestFlights?.[0] || simplified.otherFlights?.[0];
  
  if (firstFlight) {
    // Should NOT have flightId (we removed it)
    const hasFlightId = 'flightId' in firstFlight;
    assert.strictEqual(hasFlightId, false, 'Flight should not have flightId field');
    
    // Should have essential fields
    assert.ok(firstFlight.airline, 'Flight should have airline');
    assert.ok(firstFlight.departure, 'Flight should have departure');
    assert.ok(firstFlight.arrival, 'Flight should have arrival');
    assert.ok(typeof firstFlight.price === 'number', 'Flight should have price');
    
    console.log('✓ Flight results cleaned up without flightId');
  } else {
    console.log('⚠ No flights in mock data to test');
  }
});

console.log('\n🧪 Running MCP Google Travels Tests...\n');
