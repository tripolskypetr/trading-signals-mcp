# Architecture Documentation

## Overview

Trading Signals MCP Server is a modular TypeScript-based system designed to provide comprehensive technical analysis for cryptocurrency trading through the Model Context Protocol (MCP). The architecture follows clean separation of concerns with dependency injection, service-oriented design, and a plugin-based tool registration system.

## Core Technologies

- **TypeScript 5.8**: Type-safe development
- **Node.js**: Runtime environment
- **MCP SDK 1.8.0**: Model Context Protocol implementation
- **di-kit 1.0.18**: Lightweight dependency injection container
- **trading-signals 6.9.1**: Technical analysis indicators library
- **node-binance-api 1.0.18**: Binance exchange API integration
- **functools-kit 1.0.93**: Functional utilities with TTL caching
- **pinolog 1.0.5**: Logging infrastructure
- **Rollup 3.29.4**: Module bundler

## Project Structure

```
trading-signals-mcp/
├── src/
│   ├── config/              # Configuration
│   │   └── binance.ts       # Binance client initialization
│   ├── lib/                 # Core library
│   │   ├── core/            # DI and type definitions
│   │   │   ├── di.ts        # DI activator (provide, inject, init)
│   │   │   ├── types.ts     # DI symbols registry
│   │   │   └── provide.ts   # Service registration
│   │   ├── services/        # Business logic services
│   │   │   ├── base/        # Foundation services
│   │   │   │   └── BinanceService.ts
│   │   │   ├── math/        # Technical analysis services
│   │   │   │   ├── LongTermMathService.ts      (1h candles)
│   │   │   │   ├── ShortTermMathService.ts     (15m candles)
│   │   │   │   ├── SwingTermMathService.ts     (30m candles)
│   │   │   │   ├── MicroTermMathService.ts     (1m candles)
│   │   │   │   ├── VolumeDataMathService.ts    (volume analysis)
│   │   │   │   ├── SlopeDataMathService.ts     (trend slope)
│   │   │   │   └── BookDataMathService.ts      (order book)
│   │   │   ├── history/     # Candle history services
│   │   │   │   ├── HourCandleHistoryService.ts
│   │   │   │   ├── FifteenMinuteCandleHistoryService.ts
│   │   │   │   ├── ThirtyMinuteCandleHistoryService.ts
│   │   │   │   └── OneMinuteCandleHistoryService.ts
│   │   │   └── report/      # Aggregated reports
│   │   │       └── MarketReportService.ts
│   │   └── index.ts         # Library entry point
│   ├── main/                # MCP server
│   │   └── server.ts        # MCP server initialization
│   ├── tools/               # MCP tool definitions
│   │   ├── fetchLongTermSignals.ts
│   │   ├── fetchShortTermSignals.ts
│   │   ├── fetchSwingTermSignals.ts
│   │   ├── fetchMicroTermSignals.ts
│   │   ├── fetchVolumeData.ts
│   │   ├── fetchSlopeData.ts
│   │   ├── fetchBookData.ts
│   │   ├── fetchHourCandleHistory.ts
│   │   ├── fetchFifteenMinuteCandleHistory.ts
│   │   ├── fetchThirtyMinuteCandleHistory.ts
│   │   └── fetchOneMinuteCandleHistory.ts
│   ├── types/               # Type definitions
│   │   └── node-binance-api.d.ts
│   ├── utils/               # Utility functions
│   │   └── roundTicks.ts
│   └── index.ts             # Application entry point
└── build/                   # Compiled output
    └── index.mjs            # ESM bundle entry point
```

## Architecture Layers

### 1. Entry Layer (`src/index.ts`)

- Application bootstrap
- Imports and executes the MCP server
- Single entry point for the entire application

### 2. MCP Server Layer (`src/main/server.ts`)

**Responsibilities:**
- Initialize MCP server instance
- Register all MCP tools
- Configure stdio transport
- Connect and start the server

**Pattern:**
```typescript
async function main() {
    const server = new McpServer({
        name: "trading-signals-mcp",
        version: "1.0.0"
    });

    // Register tools
    registerFetchLongTermSignals(server);
    // ... more tool registrations

    const transport = new StdioServerTransport();
    await server.connect(transport);
}
```

### 3. Tool Layer (`src/tools/`)

**Purpose:** Expose services as MCP tools using Zod schema validation

**Pattern:**
```typescript
export function registerFetchLongTermSignals(server: McpServer) {
    server.tool(
        "fetchLongTermSignals",
        "Description of the tool",
        {
            symbol: z.string().describe("Trading pair symbol"),
        },
        async ({ symbol }) => {
            const content = await signal.longTermMathService.generateLongTermReport(symbol);
            return { content: [{ type: "text", text: content }] };
        }
    );
}
```

**Key Features:**
- Zod-based parameter validation
- Error handling and formatting
- Service delegation through DI
- Standardized response format

### 4. Service Layer (`src/lib/services/`)

#### 4.1 Base Services (`src/lib/services/base/`)

**BinanceService:**
- Singleton Binance API client
- Candle data fetching with caching (TTL: 5 seconds)
- Exchange info retrieval
- Price/quantity formatting utilities

```typescript
class BinanceService {
    public readonly binance = binanceClient;

    fetchCandles = singleshot(async (symbol, interval, limit) => {
        // TTL-cached candle fetching
    }, { ttl: 5_000 });

    getExchangeInfo = singleshot(async () => {
        // Cached exchange info
    }, { ttl: 60_000 });
}
```

#### 4.2 Math Services (`src/lib/services/math/`)

Technical analysis computation services, each specialized for different timeframes:

**LongTermMathService** (1h candles, 48h lookback):
- RSI(14), Stochastic RSI(14)
- MACD(12,26,9)
- Bollinger Bands(20,2)
- ADX(14), Stochastic(14,3,3)
- Multiple moving averages (SMA, EMA, DEMA, WMA)
- Fibonacci retracement/extension
- Support/resistance detection

**ShortTermMathService** (15m candles, 36h lookback):
- Fast indicators for rapid market changes
- RSI(9), MACD(8,21,5)
- Fibonacci levels (288 candles)

**SwingTermMathService** (30m candles, 48h lookback):
- Medium-term trend analysis
- Volatility analysis
- Comprehensive Fibonacci analysis

**MicroTermMathService** (1m candles, 1h lookback):
- Ultra-fast indicators
- Price change tracking (1m/3m/5m)
- Bollinger position analysis

**VolumeDataMathService** (1h candles, 220h for SMA(200)):
- Pivot points (S1/S2/S3, R1/R2/R3)
- Volume spike detection (>1.5x average)
- Institutional activity tracking

**SlopeDataMathService** (1m candles, 2h lookback):
- Linear regression slope
- Price momentum (ROC 1/5/10)
- Volume momentum
- Price-volume correlation

**BookDataMathService**:
- Order book depth analysis
- Bid/ask imbalance
- Liquidity zone detection

**Pattern:**
```typescript
class LongTermMathService {
    private readonly binanceService = inject<BinanceService>(TYPES.binanceService);

    getLongTermAnalysis = async (symbol: string) => {
        const candles = await this.binanceService.fetchCandles(symbol, "1h", 48);
        // Calculate indicators using trading-signals library
        return analysis;
    };

    generateLongTermReport = async (symbol: string) => {
        const analysis = await this.getLongTermAnalysis(symbol);
        // Format as markdown report
        return markdown;
    };
}
```

#### 4.3 History Services (`src/lib/services/history/`)

Provide formatted historical candle data with volatility metrics:

- **HourCandleHistoryService**: Last 6 hourly candles
- **FifteenMinuteCandleHistoryService**: Last 8 15m candles with HIGH-VOLATILITY flagging
- **ThirtyMinuteCandleHistoryService**: Last 6 30m candles
- **OneMinuteCandleHistoryService**: Last 15 1m candles

**Pattern:**
```typescript
class HourCandleHistoryService {
    private readonly binanceService = inject<BinanceService>(TYPES.binanceService);

    getHourCandleHistory = async (symbol: string) => {
        const candles = await this.binanceService.fetchCandles(symbol, "1h", 6);
        return candles.map(candle => ({
            time, open, high, low, close, volume,
            volatility: ((high - low) / low * 100),
            bodySize: Math.abs((close - open) / open * 100),
            type: close > open ? "bullish" : "bearish"
        }));
    };
}
```

#### 4.4 Report Services (`src/lib/services/report/`)

**MarketReportService:**
- Aggregates data from multiple math services
- Generates comprehensive markdown reports
- Combines multi-timeframe analysis
- Validates data safety (NaN, Infinity checks)

```typescript
class MarketReportService {
    private readonly longTermMathService = inject<LongTermMathService>(TYPES.longTermMathService);
    // ... inject all math services

    getReport = async (symbol: string) => {
        const longTerm = await this.longTermMathService.getLongTermAnalysis(symbol);
        const shortTerm = await this.shortTermMathService.getShortTermAnalysis(symbol);
        // ... fetch all analyses

        return generateMarkdownReport({
            symbol, longTerm, shortTerm, ...
        });
    };
}
```

### 5. Dependency Injection Layer (`src/lib/core/`)

#### 5.1 DI Activator (`di.ts`)

Creates the DI container using `di-kit`:

```typescript
export const { provide, inject, init, override } = createActivator("signal");
```

#### 5.2 Type Registry (`types.ts`)

Defines DI symbols organized by category:

```typescript
const baseServices = {
    binanceService: Symbol.for('binanceService'),
};

const mathServices = {
    longTermMathService: Symbol.for('longTermMathService'),
    // ... 7 math services
};

const historyServices = {
    hourCandleHistoryService: Symbol.for('hourCandleHistoryService'),
    // ... 4 history services
};

const reportServices = {
    marketReportService: Symbol.for('marketReportService'),
};

export const TYPES = {
    ...baseServices,
    ...mathServices,
    ...historyServices,
    ...reportServices,
};
```

#### 5.3 Service Provider (`provide.ts`)

Registers all service implementations:

```typescript
// Base services
{ provide(TYPES.binanceService, () => new BinanceService()); }

// Math services
{
    provide(TYPES.longTermMathService, () => new LongTermMathService());
    // ... 7 services
}

// History services
{
    provide(TYPES.hourCandleHistoryService, () => new HourCandleHistoryService());
    // ... 4 services
}

// Report services
{ provide(TYPES.marketReportService, () => new MarketReportService()); }
```

#### 5.4 Library Entry Point (`src/lib/index.ts`)

Exposes the complete service container:

```typescript
import "./core/provide";
import { init, inject } from "./core/di";

const signal = {
    ...baseServices,
    ...mathServices,
    ...historyServices,
    ...reportServices,
};

init();

export default signal;
Object.assign(globalThis, { signal });
```

## Data Flow

```
MCP Client (Claude)
    ↓
MCP Server (StdioTransport)
    ↓
Tool Layer (Zod validation)
    ↓
Service Layer (via DI)
    ↓
BinanceService (cached API calls)
    ↓
Binance Public API
```

**Example Flow:**

1. Claude calls `fetchLongTermSignals` with `{ symbol: "BTCUSDT" }`
2. Tool validates parameters using Zod schema
3. Tool calls `signal.longTermMathService.generateLongTermReport("BTCUSDT")`
4. Service injects `BinanceService` via DI
5. Service calls `binanceService.fetchCandles("BTCUSDT", "1h", 48)`
6. BinanceService checks TTL cache (5 seconds)
7. If cache miss, fetches from Binance API
8. Service calculates indicators using `trading-signals` library
9. Service formats data as markdown report
10. Tool returns formatted response to MCP server
11. Server sends response to Claude

## Design Patterns

### 1. Dependency Injection

**Implementation:** `di-kit` with Symbol-based identifiers

**Benefits:**
- Loose coupling between services
- Easy testing (mock injection)
- Single source of truth for instances
- Lazy initialization

**Usage:**
```typescript
// Define symbol
const TYPES = { binanceService: Symbol.for('binanceService') };

// Register provider
provide(TYPES.binanceService, () => new BinanceService());

// Inject dependency
class LongTermMathService {
    private readonly binanceService = inject<BinanceService>(TYPES.binanceService);
}
```

### 2. Service Layer Pattern

Each service has clear responsibilities:
- **Single Responsibility:** Each service handles one domain (long-term analysis, volume, etc.)
- **Data Encapsulation:** Services hide implementation details
- **Reusability:** Services can be used by multiple tools

### 3. Repository Pattern (BinanceService)

Abstracts data access:
- Centralized API communication
- Caching strategy (TTL-based)
- Data transformation (price/quantity formatting)

### 4. Factory Pattern (DI Providers)

Services are created on-demand:
```typescript
provide(TYPES.longTermMathService, () => new LongTermMathService());
```

### 5. Strategy Pattern (Math Services)

Different analysis strategies for different timeframes:
- LongTermMathService: 1h candles strategy
- ShortTermMathService: 15m candles strategy
- MicroTermMathService: 1m candles strategy

## Caching Strategy

### TTL-based Caching (functools-kit)

**BinanceService.fetchCandles:**
- TTL: 5 seconds
- Prevents duplicate API calls for the same symbol/interval
- Reduces Binance API rate limiting issues

**BinanceService.getExchangeInfo:**
- TTL: 60 seconds (1 minute)
- Exchange info changes infrequently

**Implementation:**
```typescript
fetchCandles = singleshot(async (symbol, interval, limit) => {
    return new Promise((resolve, reject) => {
        binanceClient.candlesticks(symbol, interval, (error, ticks) => {
            if (error) reject(error);
            else resolve(ticks.slice(-limit));
        }, { limit });
    });
}, { ttl: 5_000 });
```

## Error Handling

### Service Layer

**Pattern:**
```typescript
try {
    const candles = await this.binanceService.fetchCandles(symbol, interval, limit);
    // Process data
} catch (error) {
    log("Error fetching candles", { symbol, error });
    throw error;
}
```

### Tool Layer

**Pattern:**
```typescript
async ({ symbol }) => {
    try {
        const content = await signal.longTermMathService.generateLongTermReport(symbol);
        return { content: [{ type: "text", text: content }] };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{
                type: "text",
                text: `Error fetching long-term signals: ${errorMessage}`
            }],
            isError: true,
        };
    }
}
```

### Data Validation

**isUnsafe helper (MarketReportService):**
```typescript
function isUnsafe(value: number | null) {
    if (typeof value !== "number") return true;
    if (isNaN(value)) return true;
    if (!isFinite(value)) return true;
    return false;
}
```

Used to prevent rendering invalid data in reports:
```typescript
markdown += `- **RSI(14)**: ${!isUnsafe(rsi14) ? rsi14.toFixed(2) : 'N/A'}\n`;
```

## Extension Points

### Adding a New Service

1. Create service class in appropriate directory:
   ```typescript
   // src/lib/services/math/NewMathService.ts
   import { inject } from "../../core/di";
   import { TYPES } from "../../core/types";
   import BinanceService from "../base/BinanceService";

   export class NewMathService {
       private readonly binanceService = inject<BinanceService>(TYPES.binanceService);

       getAnalysis = async (symbol: string) => {
           // Implementation
       };
   }
   ```

2. Add symbol to `types.ts`:
   ```typescript
   const mathServices = {
       // ...existing services
       newMathService: Symbol.for('newMathService'),
   };
   ```

3. Register in `provide.ts`:
   ```typescript
   import NewMathService from "../services/math/NewMathService";

   {
       provide(TYPES.newMathService, () => new NewMathService());
   }
   ```

4. Export in `index.ts`:
   ```typescript
   import NewMathService from "./services/math/NewMathService";

   const mathServices = {
       // ...existing services
       newMathService: inject<NewMathService>(TYPES.newMathService),
   };
   ```

### Adding a New Tool

1. Create tool file:
   ```typescript
   // src/tools/fetchNewAnalysis.ts
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   import { z } from "zod";
   import signal from "../lib/index.js";

   export function registerFetchNewAnalysis(server: McpServer) {
       server.tool(
           "fetchNewAnalysis",
           "Tool description",
           { symbol: z.string().describe("Trading pair symbol") },
           async ({ symbol }) => {
               try {
                   const content = await signal.newMathService.getAnalysis(symbol);
                   return { content: [{ type: "text", text: content }] };
               } catch (error) {
                   // Error handling
               }
           }
       );
   }
   ```

2. Register in `server.ts`:
   ```typescript
   import { registerFetchNewAnalysis } from "../tools/fetchNewAnalysis.js";

   async function main() {
       const server = new McpServer({ ... });
       registerFetchNewAnalysis(server);
       // ...
   }
   ```

## Performance Considerations

1. **Caching:** TTL-based caching reduces API calls
2. **Lazy Initialization:** DI services created on first use
3. **Promise-based:** Async/await for non-blocking I/O
4. **Bundling:** Rollup creates optimized ESM bundle
5. **Streaming:** Stdio transport for efficient communication

## Security Considerations

1. **Public API Only:** Uses Binance public endpoints (no API keys required)
2. **Input Validation:** Zod schemas validate all tool parameters
3. **Error Sanitization:** Error messages don't leak sensitive data
4. **No User Data Storage:** Stateless design

## Testing Strategy

**Recommended approach:**

1. **Unit Tests:** Test individual services with mocked dependencies
   ```typescript
   describe('LongTermMathService', () => {
       it('should calculate RSI correctly', async () => {
           const mockBinance = createMockBinanceService();
           override(TYPES.binanceService, () => mockBinance);
           // Test
       });
   });
   ```

2. **Integration Tests:** Test service interactions
3. **E2E Tests:** Test MCP tools through stdio transport

## Build Process

**Rollup Configuration:**
- Input: `src/index.ts`
- Output: `build/index.mjs` (ESM format)
- TypeScript compilation with `@rollup/plugin-typescript`
- Tree-shaking for optimized bundle size

**Build Command:**
```bash
npm run build
```

## Deployment

The MCP server runs as a Node.js process connected via stdio transport:

```json
{
    "mcpServers": {
        "trading-signals-mcp": {
            "command": "node",
            "args": ["/path/to/trading-signals-mcp/build/index.mjs"],
            "disabled": false,
            "autoApprove": []
        }
    }
}
```

## Future Improvements

1. **WebSocket Support:** Real-time price updates
2. **Additional Exchanges:** Expand beyond Binance
3. **Custom Indicators:** User-defined technical indicators
4. **Backtesting:** Historical strategy testing
5. **Alerts:** Price/indicator threshold notifications
6. **Persistence:** Optional database for historical analysis
7. **Rate Limiting:** Advanced request throttling
8. **Metrics:** Performance monitoring and analytics

## References

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Binance API Documentation](https://developers.binance.com/en/)
- [trading-signals Library](https://github.com/bennycode/trading-signals)
- [di-kit Documentation](https://www.npmjs.com/package/di-kit)
- [Technical Analysis Indicators](https://www.investopedia.com/terms/t/technicalindicator.asp)
