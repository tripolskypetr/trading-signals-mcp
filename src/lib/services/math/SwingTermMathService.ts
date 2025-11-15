import { inject } from "../../core/di";
import {
  FasterMACD as MACD,
  FasterRSI as RSI,
  FasterBollingerBands as BollingerBands,
  FasterSMA as SMA,
  FasterEMA as EMA,
  FasterStochasticOscillator as StochasticOscillator,
  FasterADX as ADX,
  FasterDX as DX,
  FasterCCI as CCI,
  FasterATR as ATR,
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
const RECENT_CANDLES = 15;

interface IFibonacciLevels {
  retracement: {
    level0: number | null;
    level236: number | null;
    level382: number | null;
    level500: number | null;
    level618: number | null;
    level786: number | null;
    level1000: number | null;
  };
  extension: {
    level1272: number | null;
    level1618: number | null;
    level2618: number | null;
  };
  currentLevel: string | null;
  nearestSupport: number | null;
  nearestResistance: number | null;
}

interface ISwingTermAnalysis {
  symbol: string;
  macd12_26_9: {
    signal: number | null;
    macd: number | null;
    direction: "bullish" | "bearish" | "neutral";
  };
  rsi14: number | null; // RSI(14)
  stochasticRSI14: number | null; // StochRSI(14)
  bollinger20_2: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
  };
  sma20: number | null; // SMA(20)
  ema13: number | null; // EMA(13) - Fibonacci number
  ema34: number | null; // EMA(34) - Fibonacci number
  dema21: number | null; // DEMA(21)
  wma20: number | null;
  stochastic14_3_3: {
    k: number | null;
    d: number | null;
  };
  adx14: {
    adx: number | null; // ADX(14)
    plusDI: number | null;
    minusDI: number | null;
  };
  cci20: number | null; // CCI(20)
  atr14: number | null; // ATR(14)
  bollingerBandWidth20_2: number | null; // BB Width
  fibonacci: IFibonacciLevels;
  momentum8: number | null; // MOM(8)
  currentPrice: number | null;
  volume: number | null;
  volatility: number | null;
  support: number | null;
  resistance: number | null;
  priceMomentum6: number | null;
  volumeTrend: string | null;
  recentCandles: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
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


// Fibonacci levels calculation
function calculateFibonacciLevels(candles: Candle[], period: number = 48): IFibonacciLevels {
  if (candles.length < period) {
    return {
      retracement: {
        level0: null,
        level236: null,
        level382: null,
        level500: null,
        level618: null,
        level786: null,
        level1000: null
      },
      extension: {
        level1272: null,
        level1618: null,
        level2618: null
      },
      currentLevel: null,
      nearestSupport: null,
      nearestResistance: null
    };
  }
  
  const recentCandles = candles.slice(-period);
  const highs = recentCandles.map(c => Number(c.high)).filter(h => !isUnsafe(h));
  const lows = recentCandles.map(c => Number(c.low)).filter(l => !isUnsafe(l));

  if (highs.length === 0 || lows.length === 0) {
    return {
      retracement: { level0: null, level236: null, level382: null, level500: null, level618: null, level786: null, level1000: null },
      extension: { level1272: null, level1618: null, level2618: null },
      currentLevel: null,
      nearestSupport: null,
      nearestResistance: null
    };
  }

  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const range = high - low;
  const currentPrice = Number(candles[candles.length - 1].close);
  
  // Calculate retracement levels from high to low
  const retracement = {
    level0: high,
    level236: high - (range * 0.236),
    level382: high - (range * 0.382),
    level500: high - (range * 0.500),
    level618: high - (range * 0.618),
    level786: high - (range * 0.786),
    level1000: low
  };
  
  // Extension levels above swing high
  const extension = {
    level1272: high + (range * 0.272),
    level1618: high + (range * 0.618),
    level2618: high + (range * 1.618)
  };
  
  // Determine current level with tolerance
  const tolerance = range * 0.015; // 1.5% tolerance
  let currentLevel: string | null = null;
  
  if (Math.abs(currentPrice - retracement.level0) < tolerance) {
    currentLevel = "0.0% (High)";
  } else if (Math.abs(currentPrice - retracement.level236) < tolerance) {
    currentLevel = "23.6% Retracement";
  } else if (Math.abs(currentPrice - retracement.level382) < tolerance) {
    currentLevel = "38.2% Retracement";
  } else if (Math.abs(currentPrice - retracement.level500) < tolerance) {
    currentLevel = "50.0% Retracement";
  } else if (Math.abs(currentPrice - retracement.level618) < tolerance) {
    currentLevel = "61.8% Retracement";
  } else if (Math.abs(currentPrice - retracement.level786) < tolerance) {
    currentLevel = "78.6% Retracement";
  } else if (Math.abs(currentPrice - retracement.level1000) < tolerance) {
    currentLevel = "100% Retracement (Low)";
  } else {
    // Determine between which levels the price is
    if (currentPrice > retracement.level0) {
      currentLevel = "Above high";
    } else if (currentPrice < retracement.level1000) {
      currentLevel = "Below low";
    } else {
      // Find between which specific levels
      const levels = [
        { name: "0.0%", value: retracement.level0 },
        { name: "23.6%", value: retracement.level236 },
        { name: "38.2%", value: retracement.level382 },
        { name: "50.0%", value: retracement.level500 },
        { name: "61.8%", value: retracement.level618 },
        { name: "78.6%", value: retracement.level786 },
        { name: "100%", value: retracement.level1000 }
      ].filter(level => level.value !== null);
      
      for (let i = 0; i < levels.length - 1; i++) {
        const upperLevel = levels[i].value!;
        const lowerLevel = levels[i + 1].value!;
        
        if (currentPrice < upperLevel && currentPrice > lowerLevel) {
          currentLevel = `Between ${levels[i].name} and ${levels[i + 1].name}`;
          break;
        }
      }
    }
  }
  
  // Determine nearest support and resistance levels
  const allRetracementLevels = Object.values(retracement).filter(level => level !== null) as number[];
  const allExtensionLevels = Object.values(extension).filter(level => level !== null && level > 0) as number[];
  
  // Resistance levels (above current price) - include extension levels
  const resistanceLevels = [...allRetracementLevels, ...allExtensionLevels]
    .filter(level => level > currentPrice)
    .sort((a, b) => a - b); // Sort ascending - nearest first
  
  // Support levels (below current price) - only retracement levels
  const supportLevels = allRetracementLevels
    .filter(level => level < currentPrice)
    .sort((a, b) => b - a); // Sort descending - nearest first
  
  const nearestResistance = resistanceLevels.length > 0 ? resistanceLevels[0] : null;
  const nearestSupport = supportLevels.length > 0 ? supportLevels[0] : null;
  
  return {
    retracement,
    extension,
    currentLevel,
    nearestSupport,
    nearestResistance
  };
}

// Support/Resistance calculation
function calculateSupportResistance(
  highs: number[],
  lows: number[],
  window: number = 20
): { support: number | null; resistance: number | null } {
  const recentHighs = highs.slice(-window).filter(h => !isUnsafe(h));
  const recentLows = lows.slice(-window).filter(l => !isUnsafe(l));
  const support = recentLows.length > 0 ? Math.min(...recentLows) : null;
  const resistance = recentHighs.length > 0 ? Math.max(...recentHighs) : null;
  return { support, resistance };
}


// Volume trend calculation
function calculateVolumeTrend(
  volumes: number[],
  window: number = 4
): string | null {
  if (volumes.length < window + 4) return null;
  const recent = volumes.slice(-window);
  const previous = volumes.slice(-window - 4, -window);
  
  if (recent.length === 0 || previous.length === 0) return null;
  
  const avgVolume = recent.reduce((sum, vol) => sum + vol, 0) / recent.length;
  const prevAvgVolume = previous.reduce((sum, vol) => sum + vol, 0) / previous.length;
  
  return avgVolume > prevAvgVolume * 1.1
    ? "increasing"
    : avgVolume < prevAvgVolume * 0.9
      ? "decreasing"
      : "stable";
}

// Volume unit determination
function getVolumeUnit(symbol: string): string {
  const baseAsset = symbol.replace('USDT', '').replace('USD', '').replace('BUSD', '');
  return baseAsset;
}

// Comprehensive report generation
async function generateComprehensiveReport(analysis: ISwingTermAnalysis, self: SwingTermMathService): Promise<string> {
  let report = `# 30-Min Candles Analysis for ${analysis.symbol}\n\n`;
  report += `**Lookback Period**: 96 candles (48 hours)\n\n`;

  const volumeUnit = getVolumeUnit(analysis.symbol);

  report += `## Market Overview\n`;
  report += `- **Volume**: ${analysis.volume ? await self.binanceService.formatQuantity(analysis.symbol, analysis.volume) : "N/A"} ${volumeUnit} (current candle, Min: 0, Max: +∞)\n`;
  report += `- **Support Level**: ${analysis.support ? await self.binanceService.formatPrice(analysis.symbol, analysis.support) : "N/A"} USD (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Resistance Level**: ${analysis.resistance ? await self.binanceService.formatPrice(analysis.symbol, analysis.resistance) : "N/A"} USD (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Price Momentum**: ${analysis.priceMomentum6 ? await self.binanceService.formatPrice(analysis.symbol, analysis.priceMomentum6) + ' USD' : "N/A"} (Min: -∞ USD, Max: +∞ USD, over 6 candles, 3h on 30m timeframe)\n\n`;

  report += `## Technical Indicators\n`;
  report += `- **RSI(14)**: ${analysis.rsi14?.toFixed(2) ?? "N/A"} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic RSI(14)**: ${analysis.stochasticRSI14?.toFixed(2) ?? "N/A"} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  report += `- **MACD(12,26,9)**: ${analysis.macd12_26_9.macd?.toFixed(4) ?? "N/A"} (fast 12 and slow 26 candles on 30m timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **Signal Line**: ${analysis.macd12_26_9.signal?.toFixed(4) ?? "N/A"} (over 9 candles, 4.5h on 30m timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **ADX(14)**: ${analysis.adx14.adx?.toFixed(2) ?? "N/A"} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  report += `- **+DI(14)**: ${analysis.adx14.plusDI?.toFixed(2) ?? "N/A"} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  report += `- **-DI(14)**: ${analysis.adx14.minusDI?.toFixed(2) ?? "N/A"} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  report += `- **CCI(20)**: ${analysis.cci20?.toFixed(2) ?? "N/A"} (over 20 candles, 10h on 30m timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **ATR(14)**: ${analysis.atr14 ? await self.binanceService.formatPrice(analysis.symbol, analysis.atr14) : "N/A"} USD (over 14 candles, 7h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Band Width**: ${analysis.bollingerBandWidth20_2?.toFixed(2) ?? "N/A"}% (over 20 candles, 10h on 30m timeframe, Min: 0%, Max: +∞)\n`;
  report += `- **Bollinger Upper(20,2.0)**: ${analysis.bollinger20_2.upper ? await self.binanceService.formatPrice(analysis.symbol, analysis.bollinger20_2.upper) : "N/A"} USD (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Middle(20,2.0)**: ${analysis.bollinger20_2.middle ? await self.binanceService.formatPrice(analysis.symbol, analysis.bollinger20_2.middle) : "N/A"} USD (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Lower(20,2.0)**: ${analysis.bollinger20_2.lower ? await self.binanceService.formatPrice(analysis.symbol, analysis.bollinger20_2.lower) : "N/A"} USD (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **SMA(20)**: ${analysis.sma20 ? await self.binanceService.formatPrice(analysis.symbol, analysis.sma20) : "N/A"} USD (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **EMA(13)**: ${analysis.ema13 ? await self.binanceService.formatPrice(analysis.symbol, analysis.ema13) : "N/A"} USD (over 13 candles, 6.5h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **EMA(34)**: ${analysis.ema34 ? await self.binanceService.formatPrice(analysis.symbol, analysis.ema34) : "N/A"} USD (over 34 candles, 17h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **DEMA(21)**: ${analysis.dema21 ? await self.binanceService.formatPrice(analysis.symbol, analysis.dema21) : "N/A"} USD (over 21 candles, 10.5h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **WMA(20)**: ${analysis.wma20 ? await self.binanceService.formatPrice(analysis.symbol, analysis.wma20) : "N/A"} USD (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Momentum(8)**: ${analysis.momentum8 ? await self.binanceService.formatPrice(analysis.symbol, analysis.momentum8) + ' USD' : "N/A"} (over 8 candles, 4h on 30m timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  report += `- **Stochastic K(14,3,3)**: ${analysis.stochastic14_3_3.k?.toFixed(2) ?? "N/A"} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic D(14,3,3)**: ${analysis.stochastic14_3_3.d?.toFixed(2) ?? "N/A"} (smoothing 3 candles on 30m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Basic Volatility**: ${analysis.volatility?.toFixed(2) ?? "N/A"}% (standard deviation of price changes, over 96 candles, 48h on 30m timeframe, Min: 0%, Max: +∞)\n`;
  report += `\n`;

  report += `## Fibonacci Levels\n`;
  report += `- **0.0% (High)**: ${analysis.fibonacci.retracement.level0 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.retracement.level0) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **23.6%**: ${analysis.fibonacci.retracement.level236 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.retracement.level236) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **38.2%**: ${analysis.fibonacci.retracement.level382 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.retracement.level382) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **50.0%**: ${analysis.fibonacci.retracement.level500 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.retracement.level500) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **61.8%**: ${analysis.fibonacci.retracement.level618 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.retracement.level618) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **78.6%**: ${analysis.fibonacci.retracement.level786 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.retracement.level786) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **100% (Low)**: ${analysis.fibonacci.retracement.level1000 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.retracement.level1000) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **127.2% Extension**: ${analysis.fibonacci.extension.level1272 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.extension.level1272) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **161.8% Extension**: ${analysis.fibonacci.extension.level1618 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.extension.level1618) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **261.8% Extension**: ${analysis.fibonacci.extension.level2618 ? await self.binanceService.formatPrice(analysis.symbol, analysis.fibonacci.extension.level2618) : "N/A"} USD (over 48 candles, 24h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;

  return report;
}

// Main analysis function using only trading-signals library + custom support/resistance + Fibonacci
function generateAnalysis(
  candles: Candle[],
  symbol: string
): ISwingTermAnalysis {
  const closes = candles.map((candle) => Number(candle.close));
  const volumes = candles.map((candle) => Number(candle.volume));
  const highs = candles.map((candle) => Number(candle.high));
  const lows = candles.map((candle) => Number(candle.low));

  // MACD Calculation using trading-signals
  let macd: { macd: number | null; signal: number | null } = {
    macd: null, signal: null
  };
  try {
    const shortEMA = new EMA(12);
    const longEMA = new EMA(26);
    const signalEMA = new EMA(9);
    const macdIndicator = new MACD(shortEMA, longEMA, signalEMA);

    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        macdIndicator.update(price, false);
      }
    });
    const macdResult = macdIndicator.getResult();
    if (macdResult) {
      macd.macd = !isUnsafe(macdResult.macd) ? macdResult.macd : null;
      macd.signal = !isUnsafe(macdResult.signal) ? macdResult.signal : null;
    }
  } catch (error) {
    console.log("Error calculating MACD:", error);
  }

  // RSI Calculation using trading-signals
  let rsi: number | null = null;
  try {
    const rsiIndicator = new RSI(14);
    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        rsiIndicator.update(price, false);
      }
    });
    const rsiResult = rsiIndicator.getResult();
    rsi = !isUnsafe(rsiResult) ? rsiResult : null;
  } catch (error) {
    console.log("Error calculating RSI:", error);
    rsi = null;
  }

  // Stochastic RSI Calculation using trading-signals
  let stochasticRSI: number | null = null;
  try {
    const stochasticRSIIndicator = new StochasticRSI(14);
    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        stochasticRSIIndicator.update(price, false);
      }
    });
    const stochRSIResult = stochasticRSIIndicator.getResult();
    stochasticRSI = !isUnsafe(stochRSIResult) ? stochRSIResult * 100 : null;
  } catch (error) {
    console.log("Error calculating Stochastic RSI:", error);
    stochasticRSI = null;
  }

  // Bollinger Bands Calculation using trading-signals
  let bollingerResult: { upper: number | null; middle: number | null; lower: number | null } = {
    upper: null,
    middle: null,
    lower: null
  };
  try {
    const bollinger = new BollingerBands(20, 2);
    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        bollinger.update(price, false);
      }
    });
    const result = bollinger.getResult();
    if (result) {
      bollingerResult = {
        upper: !isUnsafe(result.upper) ? result.upper : null,
        middle: !isUnsafe(result.middle) ? result.middle : null,
        lower: !isUnsafe(result.lower) ? result.lower : null,
      };
    }
  } catch (error) {
    console.log("Error calculating Bollinger Bands:", error);
  }

  // SMA Calculation using trading-signals
  let sma: number | null = null;
  try {
    const smaIndicator = new SMA(20);
    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        smaIndicator.update(price, false);
      }
    });
    const smaResult = smaIndicator.getResult();
    sma = !isUnsafe(smaResult) ? smaResult : null;
  } catch (error) {
    console.log("Error calculating SMA:", error);
  }

  // EMA Calculation using trading-signals (Fibonacci numbers)
  let ema13: number | null = null;
  let ema34: number | null = null;
  try {
    const ema13Indicator = new EMA(13);
    const ema34Indicator = new EMA(34);
    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        ema13Indicator.update(price, false);
        ema34Indicator.update(price, false);
      }
    });
    const ema13Result = ema13Indicator.getResult();
    const ema34Result = ema34Indicator.getResult();
    ema13 = !isUnsafe(ema13Result) ? ema13Result : null;
    ema34 = !isUnsafe(ema34Result) ? ema34Result : null;
  } catch (error) {
    console.log("Error calculating EMAs:", error);
  }

  // DEMA Calculation using trading-signals
  let dema: number | null = null;
  try {
    const demaIndicator = new DEMA(21);
    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        demaIndicator.update(price, false);
      }
    });
    const demaResult = demaIndicator.getResult();
    dema = !isUnsafe(demaResult) ? demaResult : null;
  } catch (error) {
    console.log("Error calculating DEMA:", error);
    dema = null;
  }

  // WMA Calculation using trading-signals
  let wma: number | null = null;
  try {
    const wmaIndicator = new WMA(20);
    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        wmaIndicator.update(price, false);
      }
    });
    const wmaResult = wmaIndicator.getResult();
    wma = !isUnsafe(wmaResult) ? wmaResult : null;
  } catch (error) {
    console.log("Error calculating WMA:", error);
    wma = null;
  }

  // Stochastic Oscillator Calculation using trading-signals
  let stochasticResult: { stochK: number | null; stochD: number | null } = { stochK: null, stochD: null };
  try {
    const stochasticIndicator = new StochasticOscillator(14, 3, 3);
    candles.forEach((candle) => {
      const high = Number(candle.high);
      const low = Number(candle.low);
      const close = Number(candle.close);
      if (!isUnsafe(high) && !isUnsafe(low) && !isUnsafe(close) && high >= low && close >= 0) {
        stochasticIndicator.update({ high, low, close }, false);
      }
    });
    stochasticResult = stochasticIndicator.getResult() ?? { stochK: null, stochD: null };
  } catch (error) {
    console.log("Error calculating Stochastic:", error);
  }

  // ADX and DX Calculation using trading-signals
  let adxResult: { adx: number | null; plusDI: number | null; minusDI: number | null } = { adx: null, plusDI: null, minusDI: null };
  try {
    const adxIndicator = new ADX(14);
    const dxIndicator = new DX(14);

    candles.forEach((candle) => {
      const high = Number(candle.high);
      const low = Number(candle.low);
      const close = Number(candle.close);
      if (!isUnsafe(high) && !isUnsafe(low) && !isUnsafe(close) && high >= low && close > 0) {
        adxIndicator.update({ high, low, close }, false);
        dxIndicator.update({ high, low, close }, false);
      }
    });

    const adxRes = adxIndicator.getResult();

    adxResult.adx = !isUnsafe(adxRes) ? adxRes : null;
    adxResult.plusDI = !isUnsafe(dxIndicator.pdi) ? dxIndicator.pdi * 100 : null;
    adxResult.minusDI = !isUnsafe(dxIndicator.mdi) ? dxIndicator.mdi * 100 : null;
  } catch (error) {
    console.log("Error calculating ADX/DX:", error);
  }

  // CCI Calculation using trading-signals
  let cci: number | null = null;
  try {
    const cciIndicator = new CCI(20);
    candles.forEach((candle) => {
      const high = Number(candle.high);
      const low = Number(candle.low);
      const close = Number(candle.close);
      if (!isUnsafe(high) && !isUnsafe(low) && !isUnsafe(close) && high >= low && close > 0) {
        cciIndicator.update({ high, low, close }, false);
      }
    });
    const result = cciIndicator.getResult();
    cci = !isUnsafe(result) ? result : null;
  } catch (error) {
    console.log("Error calculating CCI:", error);
  }

  // ATR Calculation using trading-signals
  let atr: number | null = null;
  try {
    const atrIndicator = new ATR(14);
    candles.forEach((candle) => {
      const high = Number(candle.high);
      const low = Number(candle.low);
      const close = Number(candle.close);
      if (!isUnsafe(high) && !isUnsafe(low) && !isUnsafe(close) && high >= low && close > 0) {
        atrIndicator.update({ high, low, close }, false);
      }
    });
    const result = atrIndicator.getResult();
    atr = !isUnsafe(result) ? result : null;
  } catch (error) {
    console.log("Error calculating ATR:", error);
  }

  // Bollinger Band Width - calculate manually from Bollinger Bands
  let bollingerBandWidth: number | null = null;
  try {
    if (!isUnsafe(bollingerResult.upper) && !isUnsafe(bollingerResult.lower) && !isUnsafe(bollingerResult.middle)) {
      const upper = bollingerResult.upper;
      const lower = bollingerResult.lower;
      const middle = bollingerResult.middle;
      // BBW = (Upper Band - Lower Band) / Middle Band * 100
      bollingerBandWidth = ((upper - lower) / middle) * 100;
    }
  } catch (error) {
    console.log("Error calculating Bollinger Band Width:", error);
  }


  // Momentum Calculation using trading-signals
  let momentum: number | null = null;
  try {
    const momIndicator = new MOM(8);
    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        momIndicator.update(price, false);
      }
    });
    const momResult = momIndicator.getResult();
    momentum = !isUnsafe(momResult) ? momResult : null;
  } catch (error) {
    console.log("Error calculating Momentum:", error);
    momentum = null;
  }


  // Custom calculations: Fibonacci levels (kept as custom)
  const fibonacci = calculateFibonacciLevels(candles);

  // Custom calculations: Basic Volatility (Standard Deviation of Price Changes)
  const priceChanges = closes
    .slice(1)
    .map((price, i) => ((price - closes[i]) / closes[i]) * 100);
  const volatility =
    priceChanges.length > 0
      ? Math.sqrt(
          priceChanges.reduce((sum, change) => sum + change ** 2, 0) /
            priceChanges.length
        )
      : null;

  // Custom calculations: Support/Resistance (kept as custom)
  const { support, resistance } = calculateSupportResistance(highs, lows);

  // Price Momentum Calculation using trading-signals
  let priceMomentum: number | null = null;
  try {
    const momIndicator = new MOM(6);
    closes.forEach((price) => {
      if (!isUnsafe(price) && price > 0) {
        momIndicator.update(price, false);
      }
    });
    const momResult = momIndicator.getResult();
    priceMomentum = !isUnsafe(momResult) ? momResult : null;
  } catch (error) {
    console.log("Error calculating Price Momentum:", error);
    priceMomentum = null;
  }

  // Custom calculations: Volume Trend (kept as custom)
  const volumeTrend = calculateVolumeTrend(volumes);

  // Recent Candles with safer date conversion
  const recentCandles = candles.slice(-RECENT_CANDLES).map((candle) => {
    let timeString: string;
    try {
      const closeTime = Number(candle.closeTime);
      if (!isUnsafe(closeTime) && closeTime > 0) {
        timeString = new Date(closeTime).toISOString();
      } else {
        timeString = new Date().toISOString(); // fallback to current time
      }
    } catch (error) {
      timeString = new Date().toISOString(); // fallback to current time
    }
    
    return {
      time: timeString,
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume),
    };
  });

  return {
    symbol,
    macd12_26_9: {
      signal: macd.signal,
      macd: macd.macd,
      direction: (macd.macd !== null && macd.signal !== null) 
        ? (macd.macd > macd.signal ? "bullish" : macd.macd < macd.signal ? "bearish" : "neutral")
        : "neutral"
    },
    rsi14: (rsi != null && !isUnsafe(rsi)) ? rsi : null,
    stochasticRSI14: (stochasticRSI != null && !isUnsafe(stochasticRSI)) ? stochasticRSI : null,
    bollinger20_2: {
      upper: (bollingerResult.upper != null && !isUnsafe(bollingerResult.upper)) ? bollingerResult.upper : null,
      middle: (bollingerResult.middle != null && !isUnsafe(bollingerResult.middle)) ? bollingerResult.middle : null,
      lower: (bollingerResult.lower != null && !isUnsafe(bollingerResult.lower)) ? bollingerResult.lower : null,
    },
    sma20: (sma != null && !isUnsafe(sma)) ? sma : null,
    ema13: (ema13 != null && !isUnsafe(ema13)) ? ema13 : null,
    ema34: (ema34 != null && !isUnsafe(ema34)) ? ema34 : null,
    dema21: (dema != null && !isUnsafe(dema)) ? dema : null,
    wma20: (wma != null && !isUnsafe(wma)) ? wma : null,
    stochastic14_3_3: {
      k: (stochasticResult?.stochK != null && !isUnsafe(stochasticResult.stochK)) ? stochasticResult.stochK : null,
      d: (stochasticResult?.stochD != null && !isUnsafe(stochasticResult.stochD)) ? stochasticResult.stochD : null,
    },
    adx14: {
      adx: (adxResult.adx != null && !isUnsafe(adxResult.adx)) ? adxResult.adx : null,
      plusDI: (adxResult.plusDI != null && !isUnsafe(adxResult.plusDI)) ? adxResult.plusDI : null,
      minusDI: (adxResult.minusDI != null && !isUnsafe(adxResult.minusDI)) ? adxResult.minusDI : null,
    },
    cci20: (cci != null && !isUnsafe(cci)) ? cci : null,
    atr14: (atr != null && !isUnsafe(atr)) ? atr : null,
    bollingerBandWidth20_2: (bollingerBandWidth != null && !isUnsafe(bollingerBandWidth)) ? bollingerBandWidth : null,
    fibonacci,
    momentum8: (momentum != null && !isUnsafe(momentum)) ? momentum : null,
    currentPrice: !isUnsafe(closes[closes.length - 1]) ? closes[closes.length - 1] : null,
    volume: !isUnsafe(volumes[volumes.length - 1]) ? volumes[volumes.length - 1] : null,
    volatility: (volatility != null && !isUnsafe(volatility)) ? volatility : null,
    support: (support != null && !isUnsafe(support)) ? support : null,
    resistance: (resistance != null && !isUnsafe(resistance)) ? resistance : null,
    priceMomentum6: (priceMomentum != null && !isUnsafe(priceMomentum)) ? priceMomentum : null,
    volumeTrend,
    recentCandles,
  };
}

export class SwingTermMathService {
  public readonly binanceService = inject<BinanceService>(
    TYPES.binanceService
  );

  public generateSwingTermReport = async (symbol: string): Promise<string> => {
    log("swingTermMathService generateSwingTermReport", { symbol });

    const analysis = await this.getSwingTermAnalysis(symbol);
    return await generateComprehensiveReport(analysis, this);
  };

  public getSwingTermAnalysis = ttl(
    async (symbol: string): Promise<ISwingTermAnalysis> => {
      log("swingTermMathService, getSwingTermAnalysis", { symbol });

      // 30-minute candles, 96 candles = 48 hours
      const candles: Candle[] = await this.binanceService.getCandles(
        symbol,
        "30m",
        96
      );
      return generateAnalysis(candles, symbol);
    },
    {
      timeout: TTL_TIMEOUT,
      key: ([symbol]) => `${symbol}`,
    }
  );
}

export default SwingTermMathService;