import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchSwingTermSignals(server: McpServer) {
  server.tool(
    "fetchSwingTermSignals",
    "Fetch comprehensive analysis based on 30-minute candles (96 candles, 48-hour lookback). Provides complete technical indicators: RSI(14), Stochastic RSI(14), MACD(12,26,9), Bollinger Bands(20,2), ATR(14), SMA(20), EMA(13), EMA(34), DEMA(21), WMA(20), Momentum(8), Stochastic(14,3,3), CCI(20), ADX(14), +DI, -DI. Includes comprehensive volatility analysis (historical volatility, ATR, volatility percentile), Fibonacci retracement/extension levels (23.6%, 38.2%, 50%, 61.8%, 78.6%, 127.2%, 161.8%, 261.8%), support/resistance detection, volume trend analysis, market overview, and 15 recent candles. Indicators calculated from 96 30-minute candles (48 hours). Essential for medium-term trend analysis, position timing, and bridging signals between different timeframes.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.swingTermMathService.generateSwingTermReport(symbol);

        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `Failed to fetch swing term signals: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
