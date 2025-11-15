import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchShortTermSignals(server: McpServer) {
  server.tool(
    "fetchShortTermSignals",
    "Fetch comprehensive analysis based on 15-minute candles (144 candles, 36-hour lookback). Provides complete technical indicators: RSI(9), Stochastic RSI(9), MACD(8,21,5), Bollinger Bands(10,2), ATR(9), SMA(50), EMA(8), EMA(21), DEMA(21), WMA(20), Momentum(8), Stochastic(5,3,3), CCI(14), ADX(14), +DI, -DI. Includes Fibonacci retracement/extension levels (0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%, 127.2%, 161.8%) with 288-candle lookback, support/resistance detection, volume trend analysis (increasing/decreasing/stable), market overview, and 15 recent candles. Indicators calculated from 144 15-minute candles (36 hours), Fibonacci from 288 candles. ROC(3) for 45-minute momentum analysis. PRIMARY TOOL for detecting rapid market movements, momentum shifts, and making precise entry/exit decisions with high-frequency trading signals.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.shortTermMathService.generateShortTermReport(symbol);

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
            { type: "text", text: `Failed to fetch short term signals: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
