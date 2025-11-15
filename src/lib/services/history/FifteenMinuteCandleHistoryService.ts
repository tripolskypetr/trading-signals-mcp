import { inject } from "../../core/di";
import { TYPES } from "../../core/types";
import BinanceService from "../base/BinanceService";

const RECENT_CANDLES = 8;


export class FifteenMinuteCandleHistoryService {
  private readonly binanceService = inject<BinanceService>(TYPES.binanceService);

  public generateFifteenMinuteCandleHistory = async (
    symbol: string
  ): Promise<string> => {
    const candles = await this.binanceService.getCandles(symbol, "15m", RECENT_CANDLES);
    const recentCandles = candles.map((candle) => ({
      time: new Date(Number(candle.closeTime)).toISOString(),
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume),
    }));
    const averageVolatility = recentCandles.reduce((sum, candle) => sum + ((candle.high - candle.low) / candle.close) * 100, 0) / recentCandles.length;
    let report = "";
    
    report += `## 15-Minute Candles History (Last ${RECENT_CANDLES})\n`;
    
    for (let index = 0; index < recentCandles.length; index++) {
      const candle = recentCandles[index];
      const volatilityPercent = ((candle.high - candle.low) / candle.close) * 100;
      const isHighVolatility = volatilityPercent > averageVolatility * 1.5;
      const bodySize = Math.abs(candle.close - candle.open);
      const candleRange = candle.high - candle.low;
      const bodyPercent = candleRange > 0 ? (bodySize / candleRange) * 100 : 0;
      const candleType = candle.close > candle.open ? "Green" : candle.close < candle.open ? "Red" : "Doji";
      
      const formattedTime = new Date(candle.time).toISOString();

      report += `### 15m Candle ${index + 1} (${candleType}) ${isHighVolatility ? 'HIGH-VOLATILITY' : ''}\n`;
      report += `- **Time**: ${formattedTime}\n`;
      report += `- **Open**: ${await this.binanceService.formatPrice(symbol, candle.open)} USD\n`;
      report += `- **High**: ${await this.binanceService.formatPrice(symbol, candle.high)} USD\n`;
      report += `- **Low**: ${await this.binanceService.formatPrice(symbol, candle.low)} USD\n`;
      report += `- **Close**: ${await this.binanceService.formatPrice(symbol, candle.close)} USD\n`;
      report += `- **Volume**: ${await this.binanceService.formatQuantity(symbol, candle.volume)}\n`;
      report += `- **15m Volatility**: ${volatilityPercent.toFixed(2)}\n`;
      report += `- **Body Size**: ${bodyPercent.toFixed(1)}\n\n`;
    }

    return report;
  };
}

export default FifteenMinuteCandleHistoryService;