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
  toolName: ToolName.FetchHourCandleHistory,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatLongSignals(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.hourCandleHistoryService.generateHourCandleHistory(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchHourCandleHistory,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchHourCandleHistory,
      description: str.newline(
        `Fetch raw 1-hour candle OHLCV data (last 6 candles) for ${displayName}.`,
        `Provides detailed candle analysis: Open/High/Low/Close prices, Volume, 1-hour Volatility percentage ((High-Low)/Close*100), Body Size percentage (candle body relative to total range), and Candle Type classification (Bullish/Bearish/Doji).`,
        `Each candle includes timestamp, formatted prices/volumes, and comprehensive volatility metrics for hourly trend analysis and major momentum identification.`,
        `Essential for understanding recent hourly price action, major trend shifts, and identifying significant candle pattern formations for position timing.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
