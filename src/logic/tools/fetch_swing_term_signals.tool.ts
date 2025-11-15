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
  toolName: ToolName.FetchSwingTermSignals,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatSwingSignals(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.swingTermClientService.generateSwingTermReport(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchSwingTermSignals,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchSwingTermSignals,
      description: str.newline(
        `Fetch comprehensive analysis based on 30-minute candles (96 candles, 48-hour lookback) for ${displayName}.`,
        `Provides complete technical indicators: RSI(14), Stochastic RSI(14), MACD(12,26,9), Bollinger Bands(20,2), ATR(14), SMA(20), EMA(13), EMA(34), DEMA(21), WMA(20), Momentum(8), Stochastic(14,3,3), CCI(20), ADX(14), +DI, -DI.`,
        `Includes comprehensive volatility analysis (historical volatility, ATR, volatility percentile), Fibonacci retracement/extension levels (23.6%, 38.2%, 50%, 61.8%, 78.6%, 127.2%, 161.8%, 261.8%), support/resistance detection, volume trend analysis, market overview, and 15 recent candles.`,
        `Indicators calculated from 96 30-minute candles (48 hours). Essential for medium-term trend analysis, position timing, and bridging signals between different timeframes.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
