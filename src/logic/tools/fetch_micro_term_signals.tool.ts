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
  toolName: ToolName.FetchMicroTermSignals,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatMicroSignals(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.microTermMathService.generateMicroTermReport(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchMicroTermSignals,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchMicroTermSignals,
      description: str.newline(
        `Fetch ultra-fast analysis based on 1-minute candles (60 candles, 1-hour lookback) for ${displayName}.`,
        `Provides comprehensive technical indicators: RSI(9), RSI(14), Stochastic RSI(9,14), MACD(8,21,5), Signal(5), Histogram, Bollinger Bands(8,2.0), Stochastic K/D(3,3,3) and (5,3,3), ADX(9), +DI(9), -DI(9), ATR(5,9), CCI(9), Momentum(5,10).`,
        `Includes ultra-fast moving averages: EMA(3,8,13,21), SMA(8), DEMA(8), WMA(5). Volume analysis: SMA(5), ratio, trend detection. Price changes: 1m/3m/5m percentage changes, volatility(5), true range, support/resistance levels, 15 recent candles.`,
        `Indicators calculated from 60 1-minute candles (1 hour). Advanced signals: Bollinger position (0-100%), squeeze momentum, pressure index, tick direction. Data quality metrics and market microstructure analysis. TTL: 30 seconds for ultra-fast updates. ESSENTIAL for detecting rapid reversals, momentum shifts, and precision entry/exit timing.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
