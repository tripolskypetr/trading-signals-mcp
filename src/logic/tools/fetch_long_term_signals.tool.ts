import {
  commitAssistantMessage,
  commitDeveloperMessage,
  emit,
  event,
  addFetchInfo,
} from "agent-swarm-kit";
import { ToolName } from "../../enum/ToolName";
import signal from "../../lib/signal";
import { str } from "functools-kit";

addFetchInfo({
  toolName: ToolName.FetchLongTermSignals,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatLongSignals(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.longTermMathService.generateLongTermReport(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchLongTermSignals,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchLongTermSignals,
      description: str.newline(
        `Fetch comprehensive analysis based on 1-hour candles (48 candles, 48-hour lookback) for ${displayName}.`,
        `Provides complete technical indicators: RSI(14), Stochastic RSI(14), MACD(12,26,9), Signal(9), Bollinger Bands(20,2), ATR(14), ATR(20), SMA(50), EMA(20), EMA(34), DEMA(21), WMA(20), Momentum(10), Stochastic(14,3,3), CCI(20), ADX(14), +DI, -DI.`,
        `Includes Fibonacci retracement/extension levels (0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%, 127.2%, 161.8%), support/resistance detection, candle pattern recognition, volume trend analysis, and 15 recent candles with detailed market overview.`,
        `Indicators calculated from 48 1-hour candles (48 hours). Primary tool for position timing decisions over extended periods and confirming directional bias.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
