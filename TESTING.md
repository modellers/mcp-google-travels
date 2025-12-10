# Testing Guide for MCP Google Travels

This guide explains the testing setup, mock data generation, and how to run tests.

## Overview

The test suite validates:
- MCP server protocol compliance
- Tool definitions and schemas
- Resource endpoints (airports list)
- Mock data structure integrity

## Mock Data Generation

Mock data is generated from **real SerpAPI responses** to ensure tests use realistic data structures without consuming API credits during testing.

### Generating Mock Data

1. Ensure your `.env` file contains a valid `SERPAPI_API_KEY`
2. Run the mock data generator:

```bash
npm run generate-mocks
```

This will:
- Query SerpAPI for flights, hotels, and vacation rentals
- Save responses to `test/fixtures/serpapi-mock-data.json`
- Include a timestamp of when the data was generated

### Mock Data Contents

The generated `serpapi-mock-data.json` includes:

- **flights**: Round-trip flight search (JFK → LAX)
- **multiCityFlights**: Alternative route (LAX → MIA)
- **hotels**: Hotel search results for Los Angeles
- **vacationRentals**: Vacation rental results for Miami
- **generatedAt**: ISO timestamp of generation

## Running Tests

### Run All Tests

```bash
npm test
```

### Test Structure

Tests are located in `src/test/index.test.ts` and cover:

#### 1. Server Protocol Tests
- `MCP Server - List Tools`: Verifies all 6 tools are available
- `MCP Server - List Resources`: Checks airports resource is listed
- `MCP Server - Read Airports Resource`: Validates airport data structure

#### 2. Tool Schema Tests
- `Search Flights Tool - Required Parameters`: Validates required fields
- `Search Hotels Tool - Required Parameters`: Validates required fields
- `Tool Schema - search_flights cabin class options`: Checks enum values
- `Tool Schema - search_multi_city has flights parameter`: Validates array parameter
- `Tool Schema - search_vacation_rentals amenities`: Checks amenities parameter

#### 3. Mock Data Tests
- `Mock Data - Flights Structure`: Validates flight response structure
- `Mock Data - Hotels Structure`: Validates hotel response structure
- `Mock Data - Vacation Rentals Structure`: Validates rental response
- `Mock Data - Generated Timestamp`: Verifies metadata

## Test Output

Successful test run:
```
🧪 Running MCP Google Travels Tests...

✓ Found 6 tools
✔ MCP Server - List Tools (89ms)
✓ Found 1 resources
✔ MCP Server - List Resources (85ms)
✓ Found 10 airports
✔ MCP Server - Read Airports Resource (84ms)
...
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

## Mock Data vs Live API

- **Tests**: Use mock data from `test/fixtures/serpapi-mock-data.json`
- **Runtime**: Server uses live SerpAPI calls with your API key

This approach:
- ✅ Prevents API credit consumption during testing
- ✅ Ensures consistent test results
- ✅ Validates against real API response structures
- ✅ Allows testing without network connectivity

## Updating Mock Data

Regenerate mock data when:
- SerpAPI response format changes
- You want fresher example data
- Adding new test scenarios

Simply run `npm run generate-mocks` again to update the fixtures.

## CI/CD Integration

For continuous integration:

1. Commit `test/fixtures/serpapi-mock-data.json` to version control
2. Tests will run without requiring `SERPAPI_API_KEY` in CI
3. Periodically regenerate mock data in development

## Test Client Setup

Tests use the MCP SDK client to communicate with the server via stdio transport:

```typescript
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
```

This setup:
- Spawns the server as a child process
- Uses dummy API key (tests don't make real API calls)
- Validates MCP protocol compliance
- Tests tool and resource availability

## Troubleshooting

### Test Failures

If tests fail after code changes:
1. Check if tool schemas match implementation
2. Verify resource handlers are registered
3. Ensure server capabilities include `tools` and `resources`

### Mock Data Issues

If mock data generation fails:
1. Verify `SERPAPI_API_KEY` is valid in `.env`
2. Check network connectivity
3. Review SerpAPI rate limits and quotas

### TypeScript Errors

If TypeScript compilation fails:
```bash
npm run build
```

Review errors in `src/test/index.test.ts` and fix type issues.

## Adding New Tests

To add tests for new features:

1. Add mock data generation in `src/generate-mock-data.ts`
2. Regenerate fixtures with `npm run generate-mocks`
3. Add test cases in `src/test/index.test.ts`
4. Run tests with `npm test`

Example test structure:
```typescript
test('New Feature Test', async () => {
  const client = await createTestClient();
  
  try {
    // Test logic here
    const result = await client.someMcpMethod();
    assert.ok(result, 'Should return result');
  } finally {
    await client.close();
  }
});
```
