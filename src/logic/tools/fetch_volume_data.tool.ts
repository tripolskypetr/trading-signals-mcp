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
  toolName: ToolName.FetchVolumeData,
  isAvailable: async () =>
    await signal.settingsConnectionService.getIsChatVolumeData(),
  fetchContent: async ({}, clientId, agentName) => {
    const symbol = signal.symbolMetaService.getSymbolForAgent(agentName);
    const content = await signal.volumeDataMathService.generateVolumeDataReport(symbol);
    await event(clientId, "llm-tool-call", {
      toolName: ToolName.FetchVolumeData,
      content,
    });
    return content;
  },
  function: (_, agentName) => {
    const displayName =
      signal.symbolMetaService.getDispayNameForAgent(agentName);
    return {
      name: ToolName.FetchVolumeData,
      description: str.newline(
        `Fetch comprehensive volume analysis with support/resistance levels for ${displayName}.`,
        `Provides pivot point calculations (S1/S2/S3, R1/R2/R3), significant volume spikes detection (1.5x+ above average), comprehensive technical indicators: SMA(20,50,200), EMA(12,26,50), DEMA(21), WMA(20), RSI(14), Stochastic RSI(14), Bollinger Bands(20,2), ATR(14), ADX(14), CCI(20), Momentum(10), volume ratio analysis.`,
        `Analyzes 220-hour candle data for SMA(200) accuracy, focuses on 96-hour analysis window with 15 recent candles. Reports maximum 56 high-volume trading signals with price/volume correlations.`,
        `ESSENTIAL for volume validation, liquidity zones identification, support/resistance confirmation, and detecting institutional activity patterns. Critical for confirming entries with volume backing.`
      ),
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  },
});
