import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchMicroTermSignals(server: McpServer) {
  server.tool(
    "fetchMicroTermSignals",
    "Fetch ultra-fast analysis based on 1-minute candles (60 candles, 1-hour lookback). Provides comprehensive technical indicators: RSI(9), RSI(14), Stochastic RSI(9,14), MACD(8,21,5), Signal(5), Histogram, Bollinger Bands(8,2.0), Stochastic K/D(3,3,3) and (5,3,3), ADX(9), +DI(9), -DI(9), ATR(5,9), CCI(9), Momentum(5,10). Includes ultra-fast moving averages: EMA(3,8,13,21), SMA(8), DEMA(8), WMA(5). Volume analysis: SMA(5), ratio, trend detection. Price changes: 1m/3m/5m percentage changes, volatility(5), true range, support/resistance levels, 15 recent candles. Indicators calculated from 60 1-minute candles (1 hour). Advanced signals: Bollinger position (0-100%), squeeze momentum, pressure index, tick direction. Data quality metrics and market microstructure analysis. TTL: 30 seconds for ultra-fast updates. ESSENTIAL for detecting rapid reversals, momentum shifts, and precision entry/exit timing.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.microTermMathService.generateMicroTermReport(symbol);

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
            { type: "text", text: `Failed to fetch micro term signals: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
