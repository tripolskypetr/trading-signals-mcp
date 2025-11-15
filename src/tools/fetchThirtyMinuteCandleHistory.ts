import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchThirtyMinuteCandleHistory(server: McpServer) {
  server.tool(
    "fetchThirtyMinuteCandleHistory",
    "Fetch raw 30-minute candle OHLCV data (last 6 candles). Provides detailed candle analysis: Open/High/Low/Close prices, Volume, 30-minute Volatility percentage ((High-Low)/Close*100), Body Size percentage (candle body relative to total range), and Candle Type classification (Bullish/Bearish/Doji). Each candle includes timestamp, formatted prices/volumes, and comprehensive volatility metrics for analysis and pattern recognition. Optimal for analyzing recent 30-minute price patterns, medium-term momentum shifts, and bridging signals between different timeframes.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.thirtyMinuteCandleHistoryService.generateThirtyMinuteCandleHistory(symbol);

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
            { type: "text", text: `Failed to fetch thirty minute candle history: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
