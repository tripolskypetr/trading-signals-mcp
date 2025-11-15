import { inject } from "../../core/di";
import { TYPES } from "../../core/types";
import BinanceService from "../base/BinanceService";
import { Candle } from "node-binance-api";

const RECENT_CANDLES = 6;


export class HourCandleHistoryService {
  private readonly binanceService = inject<BinanceService>(TYPES.binanceService);

  public generateHourCandleHistory = async (
    symbol: string
  ): Promise<string> => {
    const candles: Candle[] = await this.binanceService.getCandles(symbol, "1h", RECENT_CANDLES);
    let markdown = "";
    
    markdown += `## Hourly Candles History (Last ${RECENT_CANDLES})\n`;
    
    for (let index = 0; index < candles.length; index++) {
      const candle = candles[index];
      const open = parseFloat(candle.open);
      const high = parseFloat(candle.high);
      const low = parseFloat(candle.low);
      const close = parseFloat(candle.close);
      const volume = parseFloat(candle.volume);
      
      const volatilityPercent = ((high - low) / close) * 100;
      const bodySize = Math.abs(close - open);
      const candleRange = high - low;
      const bodyPercent = candleRange > 0 ? (bodySize / candleRange) * 100 : 0;
      const candleType = close > open ? "Green" : close < open ? "Red" : "Doji";

      const formattedTime = new Date(candle.openTime).toISOString();
      
      markdown += `### 1h Candle ${index + 1} (${candleType})\n`;
      markdown += `- **Time**: ${formattedTime}\n`;
      markdown += `- **Open**: ${await this.binanceService.formatPrice(symbol, open)} USD\n`;
      markdown += `- **High**: ${await this.binanceService.formatPrice(symbol, high)} USD\n`;
      markdown += `- **Low**: ${await this.binanceService.formatPrice(symbol, low)} USD\n`;
      markdown += `- **Close**: ${await this.binanceService.formatPrice(symbol, close)} USD\n`;
      markdown += `- **Volume**: ${await this.binanceService.formatQuantity(symbol, volume)}\n`;
      markdown += `- **1h Volatility**: ${volatilityPercent.toFixed(2)}%\n`;
      markdown += `- **Body Size**: ${bodyPercent.toFixed(1)}%\n\n`;
    }

    return markdown;
  };
}

export default HourCandleHistoryService;