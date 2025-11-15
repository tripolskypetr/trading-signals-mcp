import {
  commitAssistantMessage,
  emit,
  event,
  addFetchInfo,
} from "agent-swarm-kit";
import { ToolName } from "../../enum/ToolName";
import signal from "../../lib/signal";
import { str } from "functools-kit";

addFetchInfo({
  toolName: ToolName.FetchSlopeData,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatSlopeData(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.slopeDataClientService.generateSlopeDataReport(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchSlopeData,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchSlopeData,
      description: str.newline(
        `Fetch minute-by-minute trend slope analysis from 120 one-minute candles (2 hours) for ${displayName}.`,
        `Provides ultra-granular indicators: SMA(15), EMA(15), Price Slope (USD/minute), Momentum(10), VWAP, VMA(15), Volume Momentum(10), Price-Volume Strength correlation.`,
        `Includes detailed price and volume arrays with timestamps for ultra-granular trend analysis, slope calculation, and immediate momentum shift detection with minute-level precision.`,
        `1-minute candles: 15-period moving averages, 10-period momentum, 2-hour lookback window. Essential for precise entry/exit timing, detecting immediate trend changes, and capturing micro-movements in volatile markets.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
