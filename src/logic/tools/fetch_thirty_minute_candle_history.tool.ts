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
  toolName: ToolName.FetchThirtyMinuteCandleHistory,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatSwingSignals(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.thirtyMinuteCandleHistoryService.generateThirtyMinuteCandleHistory(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchThirtyMinuteCandleHistory,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchThirtyMinuteCandleHistory,
      description: str.newline(
        `Fetch raw 30-minute candle OHLCV data (last 6 candles) for ${displayName}.`,
        `Provides detailed candle analysis: Open/High/Low/Close prices, Volume, 30-minute Volatility percentage ((High-Low)/Close*100), Body Size percentage (candle body relative to total range), and Candle Type classification (Bullish/Bearish/Doji).`,
        `Each candle includes timestamp, formatted prices/volumes, and comprehensive volatility metrics for analysis and pattern recognition.`,
        `Optimal for analyzing recent 30-minute price patterns, medium-term momentum shifts, and bridging signals between different timeframes.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
