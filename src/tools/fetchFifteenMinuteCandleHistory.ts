import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchFifteenMinuteCandleHistory(server: McpServer) {
  server.tool(
    "fetchFifteenMinuteCandleHistory",
    "Fetch raw 15-minute candle OHLCV data (last 8 candles). Provides detailed candle analysis: Open/High/Low/Close prices, Volume, 15-minute Volatility percentage ((High-Low)/Close*100), Body Size percentage (candle body relative to total range), Candle Type classification (Bullish/Bearish/Doji), and High-Volatility detection (>1.5x average volatility). Each candle includes timestamp, formatted prices/volumes, and advanced volatility metrics with HIGH-VOLATILITY flagging for exceptional movements exceeding normal thresholds. Critical for rapid 15-minute price movements identification, momentum shifts detection, and spotting high-volatility breakout periods for quick entry/exit decisions.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.fifteenMinuteCandleHistoryService.generateFifteenMinuteCandleHistory(symbol);

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
            { type: "text", text: `Failed to fetch fifteen minute candle history: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
