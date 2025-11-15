import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchHourCandleHistory(server: McpServer) {
  server.tool(
    "fetchHourCandleHistory",
    "Fetch raw 1-hour candle OHLCV data (last 6 candles). Provides detailed candle analysis: Open/High/Low/Close prices, Volume, 1-hour Volatility percentage ((High-Low)/Close*100), Body Size percentage (candle body relative to total range), and Candle Type classification (Bullish/Bearish/Doji). Each candle includes timestamp, formatted prices/volumes, and comprehensive volatility metrics for hourly trend analysis and major momentum identification. Essential for understanding recent hourly price action, major trend shifts, and identifying significant candle pattern formations for position timing.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.hourCandleHistoryService.generateHourCandleHistory(symbol);

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
            { type: "text", text: `Failed to fetch hour candle history: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
