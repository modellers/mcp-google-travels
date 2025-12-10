import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

if (!SERPAPI_KEY) {
  console.error('SERPAPI_API_KEY not found in environment variables');
  process.exit(1);
}

async function fetchFlightData() {
  console.log('Fetching flight data...');
  const params = new URLSearchParams({
    engine: "google_flights",
    departure_id: "JFK",
    arrival_id: "LAX",
    outbound_date: "2025-12-15",
    return_date: "2025-12-20",
    adults: "2",
    travel_class: "1",
    type: "1",
    currency: "USD",
    hl: "en",
    api_key: SERPAPI_KEY!,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  if (!response.ok) {
    throw new Error(`Flight API failed: ${response.status}`);
  }
  return await response.json();
}

async function fetchMultiCityFlightData() {
  console.log('Fetching multi-city flight data...');
  // For multi-city, we'll use a simpler approach - just get a different route
  const params = new URLSearchParams({
    engine: "google_flights",
    departure_id: "LAX",
    arrival_id: "MIA",
    outbound_date: "2025-12-15",
    return_date: "2025-12-22",
    adults: "1",
    travel_class: "1",
    type: "1",
    currency: "USD",
    hl: "en",
    api_key: SERPAPI_KEY!,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  if (!response.ok) {
    throw new Error(`Multi-city API failed: ${response.status}`);
  }
  return await response.json();
}

async function fetchHotelData() {
  console.log('Fetching hotel data...');
  const params = new URLSearchParams({
    engine: "google_hotels",
    q: "Hotels in Los Angeles",
    check_in_date: "2025-12-15",
    check_out_date: "2025-12-20",
    adults: "2",
    currency: "USD",
    hl: "en",
    api_key: SERPAPI_KEY!,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  if (!response.ok) {
    throw new Error(`Hotel API failed: ${response.status}`);
  }
  return await response.json();
}

async function fetchVacationRentalData() {
  console.log('Fetching vacation rental data...');
  const params = new URLSearchParams({
    engine: "google_hotels",
    q: "Miami vacation rental",
    check_in_date: "2025-12-15",
    check_out_date: "2025-12-20",
    adults: "2",
    currency: "USD",
    hl: "en",
    api_key: SERPAPI_KEY!,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  if (!response.ok) {
    throw new Error(`Vacation rental API failed: ${response.status}`);
  }
  return await response.json();
}

async function main() {
  try {
    const mockData = {
      flights: await fetchFlightData(),
      multiCityFlights: await fetchMultiCityFlightData(),
      hotels: await fetchHotelData(),
      vacationRentals: await fetchVacationRentalData(),
      generatedAt: new Date().toISOString(),
    };

    const outputDir = path.join(__dirname, '..', 'test', 'fixtures');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'serpapi-mock-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(mockData, null, 2));

    console.log(`✅ Mock data saved to ${outputPath}`);
    console.log(`Generated at: ${mockData.generatedAt}`);
  } catch (error) {
    console.error('Error generating mock data:', error);
    process.exit(1);
  }
}

main();
