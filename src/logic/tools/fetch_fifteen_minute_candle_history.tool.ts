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
  toolName: ToolName.FetchFifteenMinuteCandleHistory,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatShortSignals(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.fifteenMinuteCandleHistoryService.generateFifteenMinuteCandleHistory(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchFifteenMinuteCandleHistory,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchFifteenMinuteCandleHistory,
      description: str.newline(
        `Fetch raw 15-minute candle OHLCV data (last 8 candles) for ${displayName}.`,
        `Provides detailed candle analysis: Open/High/Low/Close prices, Volume, 15-minute Volatility percentage ((High-Low)/Close*100), Body Size percentage (candle body relative to total range), Candle Type classification (Bullish/Bearish/Doji), and High-Volatility detection (>1.5x average volatility).`,
        `Each candle includes timestamp, formatted prices/volumes, and advanced volatility metrics with HIGH-VOLATILITY flagging for exceptional movements exceeding normal thresholds.`,
        `Critical for rapid 15-minute price movements identification, momentum shifts detection, and spotting high-volatility breakout periods for quick entry/exit decisions.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
