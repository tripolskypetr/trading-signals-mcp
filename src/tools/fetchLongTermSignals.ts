import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchLongTermSignals(server: McpServer) {
  server.tool(
    "fetchLongTermSignals",
    "Fetch comprehensive analysis based on 1-hour candles (48 candles, 48-hour lookback). Provides complete technical indicators: RSI(14), Stochastic RSI(14), MACD(12,26,9), Signal(9), Bollinger Bands(20,2), ATR(14), ATR(20), SMA(50), EMA(20), EMA(34), DEMA(21), WMA(20), Momentum(10), Stochastic(14,3,3), CCI(20), ADX(14), +DI, -DI. Includes Fibonacci retracement/extension levels (0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%, 127.2%, 161.8%), support/resistance detection, candle pattern recognition, volume trend analysis, and 15 recent candles with detailed market overview. Indicators calculated from 48 1-hour candles (48 hours). Primary tool for position timing decisions over extended periods and confirming directional bias.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.longTermMathService.generateLongTermReport(symbol);

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
            { type: "text", text: `Failed to fetch long term signals: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
