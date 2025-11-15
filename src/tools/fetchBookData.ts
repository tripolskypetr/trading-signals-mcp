import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import signal from "../lib/index.js";

export function registerFetchBookData(server: McpServer) {
  server.tool(
    "fetchBookData",
    "Fetch real-time order book analysis and liquidity data. Provides comprehensive order book metrics: Best Bid/Ask prices, Mid Price, Spread, Depth Imbalance (buy vs sell pressure), Top 20 highest volume order book levels for both bids and asks. Shows actual market depth with exact buy/sell order quantities and their percentage distribution. Reveals institutional order levels, support/resistance zones, and liquidity walls. Essential for precision entries: detect liquidity gaps, identify whale orders, analyze market maker behavior, and spot potential breakout/breakdown levels based on order book structure and volume distribution.",
    {
      symbol: z.string().describe("Trading pair symbol (e.g., BTCUSDT)"),
    },
    async ({ symbol }) => {
      try {
        const content = await signal.bookDataMathService.generateBookDataReport(symbol);

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
            { type: "text", text: `Failed to fetch book data: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
