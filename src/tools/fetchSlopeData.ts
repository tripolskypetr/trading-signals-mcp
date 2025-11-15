import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchSlopeData(server: McpServer) {
  server.tool(
    "fetchSlopeData",
    "Fetch minute-by-minute trend slope analysis from 120 one-minute candles (2 hours). Provides ultra-granular indicators: SMA(15), EMA(15), Price Slope (USD/minute), Momentum(10), VWAP, VMA(15), Volume Momentum(10), Price-Volume Strength correlation. Includes detailed price and volume arrays with timestamps for ultra-granular trend analysis, slope calculation, and immediate momentum shift detection with minute-level precision. 1-minute candles: 15-period moving averages, 10-period momentum, 2-hour lookback window. Essential for precise entry/exit timing, detecting immediate trend changes, and capturing micro-movements in volatile markets.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.slopeDataMathService.generateSlopeDataReport(symbol);

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
            { type: "text", text: `Failed to fetch slope data: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
