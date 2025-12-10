#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

if (!SERPAPI_KEY) {
  console.error("Error: SERPAPI_API_KEY environment variable is required");
  console.error("Please set it in your .env file or environment");
  process.exit(1);
}

// Helper function to map cabin class to SerpAPI travel class code
function mapCabinClass(cabinClass: string): string {
  const classMap: Record<string, string> = {
    economy: "1",
    premium_economy: "2",
    business: "3",
    first: "4",
  };
  return classMap[cabinClass] || "1";
}

// Airport list for resources
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
