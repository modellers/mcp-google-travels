import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { simplifyFlightResponse, simplifyHotelResponse } from './response-simplifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load mock data
const mockDataPath = path.join(__dirname, '../test/fixtures/serpapi-mock-data.json');
const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));

console.log('='.repeat(80));
console.log('RESPONSE COMPARISON: Original vs Simplified');
console.log('='.repeat(80));

// Flight comparison
console.log('\n📊 FLIGHT SEARCH RESPONSE\n');
console.log('Original SerpAPI Response Size:', JSON.stringify(mockData.flights).length, 'bytes');
const simplifiedFlights = simplifyFlightResponse(mockData.flights);
console.log('Simplified Response Size:', JSON.stringify(simplifiedFlights).length, 'bytes');
console.log('Reduction:', ((1 - JSON.stringify(simplifiedFlights).length / JSON.stringify(mockData.flights).length) * 100).toFixed(1), '%');

console.log('\n--- Original Structure (keys) ---');
console.log(Object.keys(mockData.flights));
console.log('\n--- Simplified Structure (keys) ---');
console.log(Object.keys(simplifiedFlights));

console.log('\n--- Sample Flight (Original) ---');
if (mockData.flights.best_flights?.[0]) {
  console.log(JSON.stringify(mockData.flights.best_flights[0], null, 2).substring(0, 500) + '...');
}

console.log('\n--- Sample Flight (Simplified) ---');
if (simplifiedFlights.bestFlights?.[0]) {
  console.log(JSON.stringify(simplifiedFlights.bestFlights[0], null, 2));
}

// Hotel comparison
console.log('\n' + '='.repeat(80));
console.log('📊 HOTEL SEARCH RESPONSE\n');
console.log('Original SerpAPI Response Size:', JSON.stringify(mockData.hotels).length, 'bytes');
const simplifiedHotels = simplifyHotelResponse(mockData.hotels);
console.log('Simplified Response Size:', JSON.stringify(simplifiedHotels).length, 'bytes');
console.log('Reduction:', ((1 - JSON.stringify(simplifiedHotels).length / JSON.stringify(mockData.hotels).length) * 100).toFixed(1), '%');

console.log('\n--- Original Structure (keys) ---');
console.log(Object.keys(mockData.hotels));
console.log('\n--- Simplified Structure (keys) ---');
console.log(Object.keys(simplifiedHotels));

console.log('\n--- Sample Hotel (Original) ---');
if (mockData.hotels.properties?.[0]) {
  console.log(JSON.stringify(mockData.hotels.properties[0], null, 2).substring(0, 500) + '...');
}

console.log('\n--- Sample Hotel (Simplified) ---');
if (simplifiedHotels.properties?.[0]) {
  console.log(JSON.stringify(simplifiedHotels.properties[0], null, 2));
}

console.log('\n' + '='.repeat(80));
console.log('KEY BENEFITS OF SIMPLIFIED RESPONSES');
console.log('='.repeat(80));
console.log(`
✅ Smaller response size (easier for LLMs to process)
✅ Consistent structure across all searches
✅ Only essential information for display
✅ Preserves tokens (booking_token, property_token) for detail lookups
✅ Includes helpful highlights and key features
✅ Filters out metadata and irrelevant fields
✅ Limits results to top 10 for better UX
`);

console.log('\n' + '='.repeat(80));
console.log('COMPARISON WITH ORIGINAL MOCK DATA');
console.log('='.repeat(80));
console.log(`
Original Mock (index-original.ts):
- Structure: { searchCriteria, totalResults, flights, note }
- 3 hardcoded flight options with ~20 fields each
- Simple, clean, but fake data
- ~300-400 bytes per flight

Real SerpAPI (before simplification):
- Structure: { search_metadata, search_parameters, best_flights, other_flights, ... }
- 10-30 flight options with nested objects
- Real data but overwhelming detail
- ~2000-3000 bytes per flight option

Simplified SerpAPI (current implementation):
- Structure: { summary, bestFlights, otherFlights, priceInsights }
- Top 5-10 options with essential fields only
- Real data, clean presentation
- ~400-600 bytes per flight
- Similar simplicity to mock but with real data!
`);
