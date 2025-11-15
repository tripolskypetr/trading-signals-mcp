import {
  addTool,
  commitAssistantMessage,
  commitToolOutput,
  emit,
  event,
  addFetchInfo,
  execute,
} from "agent-swarm-kit";
import { ToolName } from "../../enum/ToolName";
import signal from "../../lib/signal";
import { str } from "functools-kit";

addFetchInfo({
  toolName: ToolName.FetchBookData,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatBookData(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.bookDataMathService.generateBookDataReport(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchBookData,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchBookData,
      description: str.newline(
        `Fetch real-time order book analysis and liquidity data for ${displayName}.`,
        `Provides comprehensive order book metrics: Best Bid/Ask prices, Mid Price, Spread, Depth Imbalance (buy vs sell pressure), Top 20 highest volume order book levels for both bids and asks.`,
        `Shows actual market depth with exact buy/sell order quantities and their percentage distribution. Reveals institutional order levels, support/resistance zones, and liquidity walls.`,
        `Essential for precision entries: detect liquidity gaps, identify whale orders, analyze market maker behavior, and spot potential breakout/breakdown levels based on order book structure and volume distribution.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
