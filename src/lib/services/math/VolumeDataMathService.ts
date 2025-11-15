import { inject } from "../../core/di";
import {
  FasterSMA as SMA,
  FasterEMA as EMA,
  FasterRSI as RSI,
  FasterBollingerBands as BollingerBands,
  FasterATR as ATR,
  FasterADX as ADX,
  FasterCCI as CCI,
  FasterStochasticRSI as StochasticRSI,
  FasterDEMA as DEMA,
  FasterWMA as WMA,
  FasterMOM as MOM
} from "trading-signals";
import BinanceService from "../base/BinanceService";
import { TYPES } from "../../core/types";
import { log } from "pinolog";
import { Candle } from "node-binance-api";
import { ttl } from "functools-kit";

const TTL_TIMEOUT = 60_000;

const REPORT_SIGNALS = 56;
const LONG_TERM_CANDLES = 220;
const ANALYSIS_CANDLES = 96;
const ANALYSIS_OFFSET = 50;
const RECENT_CANDLES = 15;

export interface PivotPointLevel {
  time: number;
  pivot: number;
  support1: number;
  resistance1: number;
  support2: number;
  resistance2: number;
  support3: number;
  resistance3: number;
}

export interface SignificantVolumeLevel {
  time: number;
  price: string;
  volume: string;
  volumeMA: number;
  volumeRatio: number;
}

export interface TechnicalIndicators {
  time: number;
  price: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  ema50: number | null;
  dema21: number | null;
  wma20: number | null;
  rsi14: number | null;
  stochasticRSI14: number | null;
  bollinger20_2_upper: number | null;
  bollinger20_2_middle: number | null;
  bollinger20_2_lower: number | null;
  atr14: number | null;
  adx14: number | null;
  cci20: number | null;
  momentum10: number | null;
  volumeRatio: number;
  pricePosition: number;
}

interface EnhancedSMAResult {
  pivotPoints: PivotPointLevel[];
  significantVolumes: SignificantVolumeLevel[];
  technicalIndicators: TechnicalIndicators[];
  recentCandles: Candle[];
}

function isUnsafe(value: number | null) {
  if (typeof value !== "number") {
    return true;
  }
  if (isNaN(value)) {
    return true;
  }
  if (!isFinite(value)) {
    return true;
  }
  return false;
}


function calculatePricePosition(high: number, low: number, close: number): number {
  if (high === low) return 50;
  return ((close - low) / (high - low)) * 100;
}

function calculateTechnicalIndicators(data: Candle[]): TechnicalIndicators[] {
  const sma20 = new SMA(20);
  const sma50 = new SMA(50);
  const sma200 = new SMA(200);
  const ema12 = new EMA(12);
  const ema26 = new EMA(26);
  const ema50 = new EMA(50);
  const dema21 = new DEMA(21);
  const wma20 = new WMA(20);
  const rsi14 = new RSI(14);
  const stochasticRSI14 = new StochasticRSI(14);
  const bollinger20_2 = new BollingerBands(20, 2);
  const atr14 = new ATR(14);
  const adx14 = new ADX(14);
  const cci20 = new CCI(20);
  const momentum10 = new MOM(10);
  const volumeSma = new SMA(20);

  const indicators: TechnicalIndicators[] = [];
  const prices: number[] = [];
  const volumes: number[] = [];

  data.forEach((candle, index) => {
      const open = parseFloat(candle.open);
      const high = parseFloat(candle.high);
      const low = parseFloat(candle.low);
      const close = parseFloat(candle.close);
      const volume = parseFloat(candle.volume);

      prices.push(close);
      volumes.push(volume);

      sma20.update(close, false);
      sma50.update(close, false);
      sma200.update(close, false);
      ema12.update(close, false);
      ema26.update(close, false);
      ema50.update(close, false);
      dema21.update(close, false);
      wma20.update(close, false);
      rsi14.update(close, false);
      stochasticRSI14.update(close, false);
      bollinger20_2.update(close, false);
      atr14.update({ high, low, close }, false);
      adx14.update({ high, low, close }, false);
      cci20.update({ high, low, close }, false);
      momentum10.update(close, false);
      volumeSma.update(volume, false);

      // Start calculating indicators at index >= 50 (covers SMA(50), the largest non-SMA(200) period)
      // SMA(200) will be overridden for trimmed data in getVolumeDataAnalysis
      if (index >= 50) {
        const bollinger20_2Result = bollinger20_2.getResult();
        const rsi14Result = rsi14.getResult();
        const stochRSI14Result = stochasticRSI14.getResult();
        const atr14Result = atr14.getResult();
        const adx14Result = adx14.getResult();
        const cci20Result = cci20.getResult();
        const momentum10Result = momentum10.getResult();
        const pricePosition = calculatePricePosition(high, low, close);
        const avgVolumeRaw = volumeSma.getResult();
        const avgVolume = !isUnsafe(avgVolumeRaw) ? avgVolumeRaw : volume;
        const volumeRatio = (avgVolume > 0 && !isUnsafe(volume)) ? volume / avgVolume : 1;

        indicators.push({
          time: candle.openTime,
          price: close,
          sma20: !isUnsafe(sma20.getResult()) ? sma20.getResult() : null,
          sma50: !isUnsafe(sma50.getResult()) ? sma50.getResult() : null,
          sma200: data.length >= 200 && !isUnsafe(sma200.getResult()) ? sma200.getResult() : null,
          ema12: !isUnsafe(ema12.getResult()) ? ema12.getResult() : null,
          ema26: !isUnsafe(ema26.getResult()) ? ema26.getResult() : null,
          ema50: !isUnsafe(ema50.getResult()) ? ema50.getResult() : null,
          dema21: !isUnsafe(dema21.getResult()) ? dema21.getResult() : null,
          wma20: !isUnsafe(wma20.getResult()) ? wma20.getResult() : null,
          rsi14: !isUnsafe(rsi14Result) ? rsi14Result : null,
          stochasticRSI14: (!isUnsafe(stochRSI14Result) ? stochRSI14Result * 100 : null),
          bollinger20_2_upper: (bollinger20_2Result && !isUnsafe(bollinger20_2Result.upper)) ? bollinger20_2Result.upper : null,
          bollinger20_2_middle: (bollinger20_2Result && !isUnsafe(bollinger20_2Result.middle)) ? bollinger20_2Result.middle : null,
          bollinger20_2_lower: (bollinger20_2Result && !isUnsafe(bollinger20_2Result.lower)) ? bollinger20_2Result.lower : null,
          atr14: !isUnsafe(atr14Result) ? atr14Result : null,
          adx14: !isUnsafe(adx14Result) ? adx14Result : null,
          cci20: !isUnsafe(cci20Result) ? cci20Result : null,
          momentum10: !isUnsafe(momentum10Result) ? momentum10Result : null,
          volumeRatio,
          pricePosition
        });
      }
    });

  return indicators;
}

function calculatePivotPoints(data: Candle[]): PivotPointLevel[] {
  const levels: PivotPointLevel[] = [];

  for (let i = 1; i < data.length; i++) {
    const prevCandle = data[i - 1];
    const high = parseFloat(prevCandle.high);
    const low = parseFloat(prevCandle.low);
    const close = parseFloat(prevCandle.close);

    const pivot = (high + low + close) / 3;
    const support1 = 2 * pivot - high;
    const resistance1 = 2 * pivot - low;
    const support2 = pivot - (high - low);
    const resistance2 = pivot + (high - low);
    const support3 = low - 2 * (high - pivot);
    const resistance3 = high + 2 * (pivot - low);

    levels.push({
      time: data[i].openTime,
      pivot,
      support1,
      resistance1,
      support2,
      resistance2,
      support3,
      resistance3,
    });
  }

  return levels;
}

function analyzeVolume(data: Candle[], threshold: number = 1.5): SignificantVolumeLevel[] {
  const sma = new SMA(20);
  
  const significantLevels: SignificantVolumeLevel[] = [];
  let volumeMA = 0;

  data.forEach((candle, index) => {
    const volume = parseFloat(candle.volume);
    sma.update(volume, false);

    if (index >= 19) {
      const volumeMARaw = sma.getResult();
      volumeMA = !isUnsafe(volumeMARaw) ? volumeMARaw : volume;
      const volumeRatio = (volumeMA > 0 && !isUnsafe(volume)) ? volume / volumeMA : 1;
      
      if (volumeRatio > threshold) {
        significantLevels.push({
          time: candle.openTime,
          price: candle.close,
          volume: candle.volume,
          volumeMA,
          volumeRatio: Math.round(volumeRatio * 100) / 100
        });
      }
    }
  });

  return significantLevels;
}

const generateEnhancedVolumeReport = async (
  self: VolumeDataMathService,
  result: EnhancedSMAResult,
  symbol: string
): Promise<string> => {
  function formatDate(timestamp: number): string {
    return new Date(timestamp).toISOString();
  }

  let markdown = `# Technical Analysis for ${symbol}\n\n`;
  markdown += `**Lookback Period**: 96 hours (4 days) with SMA(200) calculated on 220 hours\n\n`;
  markdown += `*Report generated: ${formatDate(Date.now())}*\n\n`;

  // Technical indicators table
  if (result.technicalIndicators.length > 0) {
    const latest = result.technicalIndicators[result.technicalIndicators.length - 1];
    markdown += "## Current Technical Indicators\n\n";
    markdown += "| Indicator | Value | Data Source |\n";
    markdown += "|-----------|-------|-------------|\n";
    
    const price = !isUnsafe(latest.price) ? await self.binanceService.formatPrice(symbol, latest.price) : 'N/A';
    const sma20 = latest.sma20 !== null ? await self.binanceService.formatPrice(symbol, latest.sma20) : 'N/A';
    const sma50 = latest.sma50 !== null ? await self.binanceService.formatPrice(symbol, latest.sma50) : 'N/A';
    const sma200 = latest.sma200 !== null ? await self.binanceService.formatPrice(symbol, latest.sma200) : 'N/A';
    const ema12 = latest.ema12 !== null ? await self.binanceService.formatPrice(symbol, latest.ema12) : 'N/A';
    const ema26 = latest.ema26 !== null ? await self.binanceService.formatPrice(symbol, latest.ema26) : 'N/A';
    const ema50 = latest.ema50 !== null ? await self.binanceService.formatPrice(symbol, latest.ema50) : 'N/A';
    const dema21 = latest.dema21 !== null ? await self.binanceService.formatPrice(symbol, latest.dema21) : 'N/A';
    const wma20 = latest.wma20 !== null ? await self.binanceService.formatPrice(symbol, latest.wma20) : 'N/A';
    const bollinger20_2_upper = latest.bollinger20_2_upper !== null ? await self.binanceService.formatPrice(symbol, latest.bollinger20_2_upper) : 'N/A';
    const bollinger20_2_lower = latest.bollinger20_2_lower !== null ? await self.binanceService.formatPrice(symbol, latest.bollinger20_2_lower) : 'N/A';
    
    markdown += `| Price | ${price} (Min: 0 USD, Max: +∞) | over 96 candles, 96h on 1h timeframe |\n`;
    markdown += `| SMA(20) | ${sma20} (Min: 0 USD, Max: +∞) | over 20 candles, 20h on 1h timeframe |\n`;
    markdown += `| SMA(50) | ${sma50} (Min: 0 USD, Max: +∞) | over 50 candles, 50h on 1h timeframe |\n`;
    markdown += `| SMA(200) | ${sma200} (Min: 0 USD, Max: +∞) | over 200 candles, 200h on 1h timeframe with 220h lookback |\n`;
    markdown += `| EMA(12) | ${ema12} (Min: 0 USD, Max: +∞) | over 12 candles, 12h on 1h timeframe |\n`;
    markdown += `| EMA(26) | ${ema26} (Min: 0 USD, Max: +∞) | over 26 candles, 26h on 1h timeframe |\n`;
    markdown += `| EMA(50) | ${ema50} (Min: 0 USD, Max: +∞) | over 50 candles, 50h on 1h timeframe |\n`;
    markdown += `| DEMA(21) | ${dema21} (Min: 0 USD, Max: +∞) | over 21 candles, 21h on 1h timeframe |\n`;
    markdown += `| WMA(20) | ${wma20} (Min: 0 USD, Max: +∞) | over 20 candles, 20h on 1h timeframe |\n`;
    markdown += `| RSI(14) | ${latest.rsi14 !== null ? latest.rsi14.toFixed(2) : 'N/A'} (Min: 0, Max: 100) | over 14 candles, 14h on 1h timeframe |\n`;
    markdown += `| Stochastic RSI(14) | ${latest.stochasticRSI14 !== null ? latest.stochasticRSI14.toFixed(2) : 'N/A'} (Min: 0, Max: 100) | over 14 candles, 14h on 1h timeframe |\n`;
    markdown += `| Bollinger Upper(20,2.0) | ${bollinger20_2_upper} (Min: 0 USD, Max: +∞) | over 20 candles, 20h on 1h timeframe |\n`;
    markdown += `| Bollinger Lower(20,2.0) | ${bollinger20_2_lower} (Min: 0 USD, Max: +∞) | over 20 candles, 20h on 1h timeframe |\n`;
    markdown += `| ATR(14) | ${latest.atr14 !== null ? latest.atr14.toFixed(2) : 'N/A'} (Min: 0, Max: +∞) | over 14 candles, 14h on 1h timeframe |\n`;
    markdown += `| ADX(14) | ${latest.adx14 !== null ? latest.adx14.toFixed(2) : 'N/A'} (Min: 0, Max: 100) | over 14 candles, 14h on 1h timeframe |\n`;
    markdown += `| CCI(20) | ${latest.cci20 !== null ? latest.cci20.toFixed(2) : 'N/A'} (Min: -∞, Max: +∞) | over 20 candles, 20h on 1h timeframe |\n`;
    markdown += `| Momentum(10) | ${latest.momentum10 !== null ? await self.binanceService.formatPrice(symbol, latest.momentum10) : 'N/A'} USD (Min: -∞ USD, Max: +∞ USD) | over 10 candles, 10h on 1h timeframe |\n`;
    markdown += `| Volume Ratio | ${!isUnsafe(latest.volumeRatio) ? latest.volumeRatio.toFixed(2) : 'N/A'}x (Min: 0x, Max: +∞) | current volume / SMA(20) of volume, over 20 candles, 20h on 1h timeframe |\n`;
    markdown += `| Price Position | ${!isUnsafe(latest.pricePosition) ? latest.pricePosition.toFixed(2) + '%' : 'N/A'} (Min: 0%, Max: 100%) | position between support and resistance |\n\n`;
  }


  // Support and resistance levels
  markdown += "## Pivot Point (PP)\n\n";
  markdown += "| Time | Pivot | S1 | R1 | S2 | R2 | S3 | R3 |\n";
  markdown += "|------|-------|----|----|----|----|----|----|";

  for (const level of result.pivotPoints.slice(-10)) {
    const formattedDate = formatDate(level.time);
    const pivot = !isUnsafe(level.pivot) ? await self.binanceService.formatPrice(symbol, level.pivot) : 'N/A';
    const s1 = !isUnsafe(level.support1) ? await self.binanceService.formatPrice(symbol, level.support1) : 'N/A';
    const r1 = !isUnsafe(level.resistance1) ? await self.binanceService.formatPrice(symbol, level.resistance1) : 'N/A';
    const s2 = !isUnsafe(level.support2) ? await self.binanceService.formatPrice(symbol, level.support2) : 'N/A';
    const r2 = !isUnsafe(level.resistance2) ? await self.binanceService.formatPrice(symbol, level.resistance2) : 'N/A';
    const s3 = !isUnsafe(level.support3) ? await self.binanceService.formatPrice(symbol, level.support3) : 'N/A';
    const r3 = !isUnsafe(level.resistance3) ? await self.binanceService.formatPrice(symbol, level.resistance3) : 'N/A';

    markdown += `\n| ${formattedDate} | ${pivot} | ${s1} | ${r1} | ${s2} | ${r2} | ${s3} | ${r3} |`;
  }

  markdown += "\n\n";

  // High volume levels
  markdown += "## High Volume Trading Levels\n\n";
  markdown += "| Time | Price | Volume | Avg Volume | Ratio |\n";
  markdown += "|------|-------|--------|------------|-------|";

  for (const level of result.significantVolumes.slice(-15)) {
    const formattedDate = formatDate(level.time);
    const priceValue = parseFloat(level.price);
    const volumeValue = parseFloat(level.volume);
    const price = !isUnsafe(priceValue) ? await self.binanceService.formatPrice(symbol, priceValue) : 'N/A';
    const volume = !isUnsafe(volumeValue) ? await self.binanceService.formatQuantity(symbol, volumeValue) : 'N/A';
    const volumeMA = !isUnsafe(level.volumeMA) ? await self.binanceService.formatQuantity(symbol, level.volumeMA) : 'N/A';
    const volumeRatio = !isUnsafe(level.volumeRatio) ? level.volumeRatio + 'x' : 'N/A';

    markdown += `\n| ${formattedDate} | ${price} | ${volume} | ${volumeMA} | ${volumeRatio} |`;
  }

  markdown += "\n\n";

  return markdown;
};

export class VolumeDataMathService {
  public readonly binanceService = inject<BinanceService>(
    TYPES.binanceService
  );

  public generateVolumeDataReport = async (symbol: string) => {
    log("volumeDataMathService generateTechnicalDataReport", {
      symbol,
    });
    const technicalData = await this.getVolumeDataAnalysis(symbol);
    return await generateEnhancedVolumeReport(this, technicalData, symbol);
  };

  public getVolumeDataAnalysis = ttl(async (symbol: string): Promise<EnhancedSMAResult> => {
    log("volumeDataMathService getVolumeDataAnalysis", {
      symbol,
    });
    
    const longTermData = await this.binanceService.getCandles(symbol, "1h", LONG_TERM_CANDLES);

    // Calculate technical indicators on full 220h data for SMA(200) accuracy
    const fullTechnicalIndicators = calculateTechnicalIndicators(longTermData);

    const OFFSET = ANALYSIS_OFFSET + ANALYSIS_CANDLES;

    // Trim data to last 96 hours
    const trimmedLongTermData = longTermData.slice(-OFFSET);
    const trimmedPivotPoints = calculatePivotPoints(trimmedLongTermData);
    const trimmedSignificantVolumes = analyzeVolume(trimmedLongTermData);
    const trimmedTechnicalIndicators = calculateTechnicalIndicators(trimmedLongTermData);

    // Combine indicators: SMA(200) from full data, others from trimmed data
    const combinedTechnicalIndicators = trimmedTechnicalIndicators.map((trimmed, index) => {
      const fullIndex = fullTechnicalIndicators.length - trimmedTechnicalIndicators.length + index;
      const fullIndicator = fullTechnicalIndicators[fullIndex];
      
      return {
        ...trimmed,
        sma200: fullIndicator ? fullIndicator.sma200 : null // Use SMA(200) from full data, fallback to null
      };
    });

    return {
      pivotPoints: trimmedPivotPoints.slice(-REPORT_SIGNALS),
      significantVolumes: trimmedSignificantVolumes.slice(-REPORT_SIGNALS),
      technicalIndicators: combinedTechnicalIndicators.slice(-Math.min(REPORT_SIGNALS, combinedTechnicalIndicators.length)),
      recentCandles: trimmedLongTermData.slice(-RECENT_CANDLES)
    };
  }, {
    timeout: TTL_TIMEOUT,
    key: ([symbol]) => `technical_${symbol}`,
  });
}

export default VolumeDataMathService;