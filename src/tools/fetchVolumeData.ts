import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchVolumeData(server: McpServer) {
  server.tool(
    "fetchVolumeData",
    "Fetch comprehensive volume analysis with support/resistance levels. Provides pivot point calculations (S1/S2/S3, R1/R2/R3), significant volume spikes detection (1.5x+ above average), comprehensive technical indicators: SMA(20,50,200), EMA(12,26,50), DEMA(21), WMA(20), RSI(14), Stochastic RSI(14), Bollinger Bands(20,2), ATR(14), ADX(14), CCI(20), Momentum(10), volume ratio analysis. Analyzes 220-hour candle data for SMA(200) accuracy, focuses on 96-hour analysis window with 15 recent candles. Reports maximum 56 high-volume trading signals with price/volume correlations. ESSENTIAL for volume validation, liquidity zones identification, support/resistance confirmation, and detecting institutional activity patterns. Critical for confirming entries with volume backing.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.volumeDataMathService.generateVolumeDataReport(symbol);

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
            { type: "text", text: `Failed to fetch volume data: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
