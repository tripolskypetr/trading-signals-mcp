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
  toolName: ToolName.FetchShortTermSignals,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatShortSignals(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.shortTermMathService.generateShortTermReport(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchShortTermSignals,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchShortTermSignals,
      description: str.newline(
        `Fetch comprehensive analysis based on 15-minute candles (144 candles, 36-hour lookback) for ${displayName}.`,
        `Provides complete technical indicators: RSI(9), Stochastic RSI(9), MACD(8,21,5), Bollinger Bands(10,2), ATR(9), SMA(50), EMA(8), EMA(21), DEMA(21), WMA(20), Momentum(8), Stochastic(5,3,3), CCI(14), ADX(14), +DI, -DI.`,
        `Includes Fibonacci retracement/extension levels (0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%, 127.2%, 161.8%) with 288-candle lookback, support/resistance detection, volume trend analysis (increasing/decreasing/stable), market overview, and 15 recent candles.`,
        `Indicators calculated from 144 15-minute candles (36 hours), Fibonacci from 288 candles. ROC(3) for 45-minute momentum analysis. PRIMARY TOOL for detecting rapid market movements, momentum shifts, and making precise entry/exit decisions with high-frequency trading signals.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
