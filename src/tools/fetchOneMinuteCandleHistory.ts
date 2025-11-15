import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchOneMinuteCandleHistory(server: McpServer) {
  server.tool(
    "fetchOneMinuteCandleHistory",
    "Fetch raw 1-minute candle OHLCV data (last 15 candles). Provides detailed candle analysis: Open/High/Low/Close prices, Volume, 1-minute Volatility percentage ((High-Low)/Close*100), Body Size percentage (candle body relative to total range), and Candle Type classification (Bullish/Bearish/Doji). Each candle includes timestamp, formatted prices/volumes, and volatility metrics for ultra-granular market analysis and immediate momentum detection. Essential for ultra-precise timing, immediate market reactions analysis, minute-by-minute price action monitoring, and detecting rapid momentum shifts for quick entry/exit decisions.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.oneMinuteCandleHistoryService.generateOneMinuteCandleHistory(symbol);

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
            { type: "text", text: `Failed to fetch one minute candle history: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
