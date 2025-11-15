import { inject } from "../../core/di";
import {
  FasterRSI as RSI,
  FasterMACD as MACD,
  FasterBollingerBands as BollingerBands,
  FasterSMA as SMA,
  FasterEMA as EMA,
  FasterATR as ATR,
  FasterStochasticOscillator as StochasticOscillator,
  FasterADX as ADX,
  FasterCCI as CCI,
  FasterStochasticRSI as StochasticRSI,
  FasterDEMA as DEMA,
  FasterWMA as WMA,
  FasterMOM as MOM,
  FasterROC as ROC
} from "trading-signals";
import BinanceService from "../base/BinanceService";
import { TYPES } from "../../core/types";
import { log } from "pinolog";
import { Candle } from "node-binance-api";
import { ttl } from "functools-kit";

const TTL_TIMEOUT = 30_000; // 30 seconds for ultra-fast updates
const RECENT_CANDLES = 15;

// Interface for 1-minute micro term analysis optimized for close outline
interface IMicroTermAnalysis {
  // Ultra-fast RSI indicators for reversal detection
  rsi9: number | null; // RSI(9) - Ultra-fast RSI for 1m
  rsi14: number | null; // RSI(14) - Standard RSI for confirmation
  stochasticRSI9: number | null; // StochRSI(9) - Fast stochastic RSI
  stochasticRSI14: number | null; // StochRSI(14) - Standard stochastic RSI
  
  // MACD for momentum divergences on 1m
  macd8_21_5: number | null; // MACD(8,21,5) - Fast MACD for 1m
  signal5: number | null; // Signal(5) - MACD signal line
  macdHistogram: number | null; // MACD histogram for momentum
  
  // Bollinger bands for volatility and reversal
  bollingerUpper8_2: number | null; // Bollinger Upper(8,2.0) - Ultra-fast bands
  bollingerMiddle8_2: number | null; // Bollinger Middle(8,2.0) - Fast SMA
  bollingerLower8_2: number | null; // Bollinger Lower(8,2.0) - Lower band
  bollingerWidth8_2: number | null; // Bollinger width for volatility
  bollingerPosition: number | null; // Position within bands (0-100%)
  
  // Stochastic oscillator for overbought/oversold
  stochasticK3_3_3: number | null; // Stochastic K(3,3,3) - Ultra-fast
  stochasticD3_3_3: number | null; // Stochastic D(3,3,3) - Ultra-fast
  stochasticK5_3_3: number | null; // Stochastic K(5,3,3) - Fast
  stochasticD5_3_3: number | null; // Stochastic D(5,3,3) - Fast
  
  // Trend strength and direction
  adx9: number | null; // ADX(9) - Fast trend strength
  plusDI9: number | null; // +DI(9) - Fast directional indicator
  minusDI9: number | null; // -DI(9) - Fast directional indicator
  
  // Volatility and momentum
  atr5: number | null; // ATR(5) - Ultra-fast volatility
  atr9: number | null; // ATR(9) - Fast volatility
  cci9: number | null; // CCI(9) - Fast commodity channel index
  momentum5: number | null; // MOM(5) - Ultra-fast momentum
  momentum10: number | null; // MOM(10) - Fast momentum
  roc1: number | null; // ROC(1) - 1-period Rate of Change %
  roc3: number | null; // ROC(3) - 3-period Rate of Change %
  roc5: number | null; // ROC(5) - 5-period Rate of Change %
  
  // Moving averages for trend
  ema3: number | null; // EMA(3) - Ultra-fast trend
  ema8: number | null; // EMA(8) - Fast trend
  ema13: number | null; // EMA(13) - Medium trend
  ema21: number | null; // EMA(21) - Slower trend for confluence
  sma8: number | null; // SMA(8) - Simple average
  dema8: number | null; // DEMA(8) - Double exponential
  wma5: number | null; // WMA(5) - Weighted average
  
  // Volume analysis
  volumeSma5: number | null; // Volume SMA(5) for volume trend
  volumeRatio: number | null; // Current volume vs average
  volumeTrend: "increasing" | "decreasing" | "stable"; // Volume pattern
  
  // Price action metrics
  currentPrice: number | null; // Current close price
  priceChange1m: number | null; // 1-minute price change %
  priceChange3m: number | null; // 3-minute price change %
  priceChange5m: number | null; // 5-minute price change %
  
  // Volatility metrics
  volatility5: number | null; // 5-period volatility %
  trueRange: number | null; // Current true range
  
  // Support/resistance levels
  support: number | null; // Nearest support level
  resistance: number | null; // Nearest resistance level
  
  // Recent candles for pattern analysis
  recentCandles: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  
  // Data quality metrics
  dataQuality: {
    sufficientData: boolean;
    candleCount: number;
    dataAge: number; // Age of latest data in seconds
  };
  
  // Market microstructure
  bidAskSpread?: number; // If available from order book
  tickDirection: "up" | "down" | "unchanged"; // Last tick direction
  
  // Advanced signals
  squeezeMomentum: number | null; // Bollinger squeeze momentum
  pressureIndex: number | null; // Buying/selling pressure
  
}

// Calculate basic volume metrics using SMA
function calculateVolumeMetrics(candles: Candle[]): {
  volumeSma5: number | null;
  volumeRatio: number | null;
  volumeTrend: "increasing" | "decreasing" | "stable";
} {
  if (candles.length < 5) {
    return { volumeSma5: null, volumeRatio: null, volumeTrend: "stable" };
  }

  const volumes = candles.map(c => parseFloat(c.volume));
  const volumeSma5 = new SMA(5);
  
  volumes.forEach(vol => volumeSma5.update(vol, false));
  const avgVolumeRaw = volumeSma5.getResult();
  const avgVolume = !isUnsafe(avgVolumeRaw) ? avgVolumeRaw : 0;
  const currentVolume = volumes[volumes.length - 1];
  const volumeRatio = (avgVolume > 0 && !isUnsafe(currentVolume)) ? currentVolume / avgVolume : 1;
  
  // Simple volume trend calculation similar to other math services
  let volumeTrend: "increasing" | "decreasing" | "stable" = "stable";
  
  if (volumes.length >= 6) {
    const recent3 = volumes.slice(-3);
    const prev3 = volumes.slice(-6, -3);
    if (prev3.length >= 3) {
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / 3;
      const prevAvg = prev3.reduce((a, b) => a + b, 0) / 3;
      
      if (recentAvg > prevAvg * 1.2) volumeTrend = "increasing";
      else if (recentAvg < prevAvg * 0.8) volumeTrend = "decreasing";
    }
  }
  
  return { volumeSma5: avgVolume, volumeRatio, volumeTrend };
}

// Calculate basic price change percentages
function calculatePriceChanges(candles: Candle[]): {
  priceChange1m: number | null;
  priceChange3m: number | null;
  priceChange5m: number | null;
} {
  if (candles.length < 2) {
    return { priceChange1m: null, priceChange3m: null, priceChange5m: null };
  }

  const closes = candles.map(c => parseFloat(c.close));
  const current = closes[closes.length - 1];
  
  const priceChange1m = closes.length >= 2 
    ? ((current - closes[closes.length - 2]) / closes[closes.length - 2] * 100) 
    : null;
    
  const priceChange3m = closes.length >= 4 
    ? ((current - closes[closes.length - 4]) / closes[closes.length - 4] * 100) 
    : null;
    
  const priceChange5m = closes.length >= 6 
    ? ((current - closes[closes.length - 6]) / closes[closes.length - 6] * 100) 
    : null;

  return { priceChange1m, priceChange3m, priceChange5m };
}


// Calculate basic support/resistance levels similar to other math services
function calculateSupportResistance(candles: Candle[], currentPrice: number): {
  support: number | null;
  resistance: number | null;
} {
  if (candles.length < 10) {
    return { support: null, resistance: null };
  }

  const highs = candles.map(c => parseFloat(c.high));
  const lows = candles.map(c => parseFloat(c.low));
  
  // Use recent period for support/resistance similar to ShortTermMathService
  const recentPeriod = Math.min(30, candles.length); // 30 minutes or available
  const recentHighs = highs.slice(-recentPeriod);
  const recentLows = lows.slice(-recentPeriod);
  
  // Find significant levels with minimum distance (similar to other services)
  const minDistance = currentPrice * 0.003; // 0.3% from price
  
  const significantHighs = [...recentHighs].filter(h => !isUnsafe(h) && h > currentPrice + minDistance).sort((a, b) => a - b);
  const significantLows = [...recentLows].filter(l => !isUnsafe(l) && l < currentPrice - minDistance).sort((a, b) => b - a);

  const safeHighs = recentHighs.filter(h => !isUnsafe(h));
  const safeLows = recentLows.filter(l => !isUnsafe(l));
  const resistance = significantHighs.length > 0 ? significantHighs[0] : (safeHighs.length > 0 ? Math.max(...safeHighs) : currentPrice);
  const support = significantLows.length > 0 ? significantLows[0] : (safeLows.length > 0 ? Math.min(...safeLows) : currentPrice);
  
  return { support, resistance };
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

// Simple candle analysis without interpretation
function analyzeCandles(candles: Candle[]): IMicroTermAnalysis['recentCandles'] {
  return candles.slice(-RECENT_CANDLES).map(candle => {
    const open = parseFloat(candle.open);
    const high = parseFloat(candle.high);
    const low = parseFloat(candle.low);
    const close = parseFloat(candle.close);
    const volume = parseFloat(candle.volume);
    
    return {
      time: new Date(candle.closeTime).toISOString(),
      open,
      high,
      low,
      close,
      volume
    };
  });
}

// Main analysis function
function generateMicroTermAnalysis(candles: Candle[]): IMicroTermAnalysis {
  const closes = candles.map(c => parseFloat(c.close));
  const highs = candles.map(c => parseFloat(c.high));
  const lows = candles.map(c => parseFloat(c.low));
  const volumes = candles.map(c => parseFloat(c.volume));
  const currentPrice = closes[closes.length - 1];

  // Data quality assessment
  const dataQuality = {
    sufficientData: candles.length >= 60, // Need at least 1 hour of data
    candleCount: candles.length,
    dataAge: candles.length > 0 ? Math.floor((Date.now() - candles[candles.length - 1].closeTime) / 1000) : 0
  };

  // Initialize ultra-fast indicators
  const rsi9 = new RSI(9);
  const rsi14 = new RSI(14);
  const stochasticRSI9 = new StochasticRSI(9);
  const stochasticRSI14 = new StochasticRSI(14);

  const macdShortEMA = new EMA(8);
  const macdLongEMA = new EMA(21);
  const macdSignalEMA = new EMA(5);
  const macd = new MACD(macdShortEMA, macdLongEMA, macdSignalEMA);

  const bollinger8 = new BollingerBands(8, 2.0);
  
  const stochastic3 = new StochasticOscillator(3, 3, 3);
  const stochastic5 = new StochasticOscillator(5, 3, 3);
  
  const adx9 = new ADX(9);
  
  const atr5 = new ATR(5);
  const atr9 = new ATR(9);
  const cci9 = new CCI(9);
  const momentum5 = new MOM(5);
  const momentum10 = new MOM(10);
  const roc1 = new ROC(1);
  const roc3 = new ROC(3);
  const roc5 = new ROC(5);

  const ema3 = new EMA(3);
  const ema8 = new EMA(8);
  const ema13 = new EMA(13);
  const ema21 = new EMA(21);
  const sma8 = new SMA(8);
  const dema8 = new DEMA(8);
  const wma5 = new WMA(5);


  // Update all indicators
  candles.forEach((candle, i) => {
    const open = parseFloat(candle.open);
    const high = highs[i];
    const low = lows[i];
    const close = closes[i];
    const volume = volumes[i];
    const hlc = { high, low, close };
    
    rsi9.update(close, false);
    rsi14.update(close, false);
    stochasticRSI9.update(close, false);
    stochasticRSI14.update(close, false);
    
    macd.update(close, false);
    
    bollinger8.update(close, false);
    
    stochastic3.update(hlc, false);
    stochastic5.update(hlc, false);
    
    adx9.update(hlc, false);
    
    atr5.update(hlc, false);
    atr9.update(hlc, false);
    cci9.update(hlc, false);
    momentum5.update(close, false);
    momentum10.update(close, false);
    roc1.update(close, false);
    roc3.update(close, false);
    roc5.update(close, false);

    ema3.update(close, false);
    ema8.update(close, false);
    ema13.update(close, false);
    ema21.update(close, false);
    sma8.update(close, false);
    dema8.update(close, false);
    wma5.update(close, false);

  });

  // Get final indicator values
  const rsi9Value = !isUnsafe(rsi9.getResult()) ? rsi9.getResult() : null;
  const rsi14Value = !isUnsafe(rsi14.getResult()) ? rsi14.getResult() : null;
  const stochasticRSI9Result = stochasticRSI9.getResult();
  const stochasticRSI9Value = !isUnsafe(stochasticRSI9Result) ? stochasticRSI9Result * 100 : null;
  const stochasticRSI14Result = stochasticRSI14.getResult();
  const stochasticRSI14Value = !isUnsafe(stochasticRSI14Result) ? stochasticRSI14Result * 100 : null;

  const macdResult = macd.getResult();
  const macd8_21_5 = (macdResult && !isUnsafe(macdResult.macd)) ? macdResult.macd : null;
  const signal5 = (macdResult && !isUnsafe(macdResult.signal)) ? macdResult.signal : null;
  const macdHistogram = (macdResult && !isUnsafe(macdResult.histogram)) ? macdResult.histogram : null;

  const bollingerResult = bollinger8.getResult();
  const bollingerUpper8_2 = (bollingerResult && !isUnsafe(bollingerResult.upper)) ? bollingerResult.upper : null;
  const bollingerMiddle8_2 = (bollingerResult && !isUnsafe(bollingerResult.middle)) ? bollingerResult.middle : null;
  const bollingerLower8_2 = (bollingerResult && !isUnsafe(bollingerResult.lower)) ? bollingerResult.lower : null;
  
  // Calculate bollinger position
  let bollingerPosition: number | null = null;
  if (!isUnsafe(bollingerUpper8_2) && !isUnsafe(bollingerLower8_2) && !isUnsafe(currentPrice)) {
    const range = bollingerUpper8_2 - bollingerLower8_2;
    if (range > 0 && !isUnsafe(range)) {
      bollingerPosition = ((currentPrice - bollingerLower8_2) / range) * 100;
    }
  }

  const bollingerWidth8_2 = (!isUnsafe(bollingerUpper8_2) && !isUnsafe(bollingerLower8_2) && !isUnsafe(bollingerMiddle8_2) && bollingerMiddle8_2 !== 0)
    ? ((bollingerUpper8_2 - bollingerLower8_2) / bollingerMiddle8_2 * 100) : null;
  
  const stochastic3Result = stochastic3.getResult();
  const stochastic5Result = stochastic5.getResult();

  const adx9Result = adx9.getResult();
  const adx9Value = !isUnsafe(adx9Result) ? adx9Result : null;
  const plusDI9 = (typeof adx9.pdi === 'number' && !isUnsafe(adx9.pdi * 100)) ? adx9.pdi * 100 : null;
  const minusDI9 = (typeof adx9.mdi === 'number' && !isUnsafe(adx9.mdi * 100)) ? adx9.mdi * 100 : null;

  const atr5Value = !isUnsafe(atr5.getResult()) ? atr5.getResult() : null;
  const atr9Value = !isUnsafe(atr9.getResult()) ? atr9.getResult() : null;
  const cci9Value = !isUnsafe(cci9.getResult()) ? cci9.getResult() : null;
  const momentum5Value = !isUnsafe(momentum5.getResult()) ? momentum5.getResult() : null;
  const momentum10Value = !isUnsafe(momentum10.getResult()) ? momentum10.getResult() : null;
  const roc1Value = !isUnsafe(roc1.getResult()) ? roc1.getResult() : null;
  const roc3Value = !isUnsafe(roc3.getResult()) ? roc3.getResult() : null;
  const roc5Value = !isUnsafe(roc5.getResult()) ? roc5.getResult() : null;

  const ema3Value = !isUnsafe(ema3.getResult()) ? ema3.getResult() : null;
  const ema8Value = !isUnsafe(ema8.getResult()) ? ema8.getResult() : null;
  const ema13Value = !isUnsafe(ema13.getResult()) ? ema13.getResult() : null;
  const ema21Value = !isUnsafe(ema21.getResult()) ? ema21.getResult() : null;
  const sma8Value = !isUnsafe(sma8.getResult()) ? sma8.getResult() : null;
  const dema8Value = !isUnsafe(dema8.getResult()) ? dema8.getResult() : null;
  const wma5Value = !isUnsafe(wma5.getResult()) ? wma5.getResult() : null;

  // Calculate basic metrics
  const volumeMetrics = calculateVolumeMetrics(candles);
  const priceChanges = calculatePriceChanges(candles);
  const { support, resistance } = calculateSupportResistance(candles, currentPrice);
  
  // Calculate basic volatility (standard deviation)
  const volatility5 = candles.length >= 5 
    ? Math.sqrt(
        candles.slice(-5).reduce((sum, c, i, arr) => {
          if (i === 0) return 0;
          const prevClose = parseFloat(arr[i-1].close);
          const currentClose = parseFloat(c.close);
          const return_ = Math.log(currentClose / prevClose);
          return sum + return_ * return_;
        }, 0) / 4
      ) * 100
    : null;

  // Current true range
  const trueRange = candles.length >= 2 
    ? Math.max(
        highs[highs.length - 1] - lows[lows.length - 1],
        Math.abs(highs[highs.length - 1] - closes[closes.length - 2]),
        Math.abs(lows[lows.length - 1] - closes[closes.length - 2])
      )
    : null;

  // Simple tick direction
  let tickDirection: "up" | "down" | "unchanged" = "unchanged";
  if (candles.length >= 2) {
    const prevClose = closes[closes.length - 2];
    if (currentPrice > prevClose) tickDirection = "up";
    else if (currentPrice < prevClose) tickDirection = "down";
  }

  // Calculate squeeze momentum (basic volatility ratio)
  const squeezeMomentum = (!isUnsafe(bollingerWidth8_2) && !isUnsafe(atr9Value) && !isUnsafe(currentPrice) && currentPrice !== 0)
    ? (bollingerWidth8_2 / (atr9Value / currentPrice * 100)) : null;

  // Pressure index (price position in range)
  let pressureIndex: number | null = null;
  if (candles.length >= 2) {
    const range = highs[highs.length - 1] - lows[lows.length - 1];
    if (!isUnsafe(range) && range > 0) {
      pressureIndex = ((closes[closes.length - 1] - lows[lows.length - 1]) -
        (highs[highs.length - 1] - closes[closes.length - 1])) /
        range * 100;
    }
  }


  return {
    // RSI indicators
    rsi9: rsi9Value,
    rsi14: rsi14Value,
    stochasticRSI9: stochasticRSI9Value,
    stochasticRSI14: stochasticRSI14Value,
    
    // MACD
    macd8_21_5,
    signal5,
    macdHistogram,
    
    // Bollinger bands
    bollingerUpper8_2,
    bollingerMiddle8_2,
    bollingerLower8_2,
    bollingerWidth8_2,
    bollingerPosition,
    
    // Stochastic
    stochasticK3_3_3: (stochastic3Result && !isUnsafe(stochastic3Result.stochK)) ? stochastic3Result.stochK : null,
    stochasticD3_3_3: (stochastic3Result && !isUnsafe(stochastic3Result.stochD)) ? stochastic3Result.stochD : null,
    stochasticK5_3_3: (stochastic5Result && !isUnsafe(stochastic5Result.stochK)) ? stochastic5Result.stochK : null,
    stochasticD5_3_3: (stochastic5Result && !isUnsafe(stochastic5Result.stochD)) ? stochastic5Result.stochD : null,

    // Trend and direction
    adx9: adx9Value,
    plusDI9,
    minusDI9,
    
    // Volatility and momentum
    atr5: atr5Value,
    atr9: atr9Value,
    cci9: cci9Value,
    momentum5: momentum5Value,
    momentum10: momentum10Value,
    roc1: roc1Value,
    roc3: roc3Value,
    roc5: roc5Value,

    // Moving averages
    ema3: ema3Value,
    ema8: ema8Value,
    ema13: ema13Value,
    ema21: ema21Value,
    sma8: sma8Value,
    dema8: dema8Value,
    wma5: wma5Value,
    
    // Volume analysis
    volumeSma5: volumeMetrics.volumeSma5,
    volumeRatio: volumeMetrics.volumeRatio,
    volumeTrend: volumeMetrics.volumeTrend,
    
    // Price metrics
    currentPrice,
    priceChange1m: priceChanges.priceChange1m,
    priceChange3m: priceChanges.priceChange3m,
    priceChange5m: priceChanges.priceChange5m,
    
    // Volatility
    volatility5,
    trueRange,
    
    // Support/resistance
    support,
    resistance,
    
    // Candles
    recentCandles: analyzeCandles(candles),
    
    // Data quality
    dataQuality,
    
    // Market microstructure
    tickDirection,
    
    // Advanced signals
    squeezeMomentum,
    pressureIndex
  };
}

// Generate comprehensive markdown report
async function generateMicroTermReport(
  symbol: string, 
  analysis: IMicroTermAnalysis, 
  self: MicroTermMathService
): Promise<string> {
  let report = `# 1-Minute Candles Analysis for ${symbol}\n\n`;
  report += `**Lookback Period**: 60 candles (1 hour)\n\n`;
  report += `*Report generated: ${new Date().toISOString()}*\n\n`;

  // Market snapshot
  report += `## Market Snapshot\n`;
  report += `- **Current Price**: ${analysis.currentPrice !== null ? await self.binanceService.formatPrice(symbol, analysis.currentPrice) : 'N/A'} USD (current candle, Min: 0 USD, Max: +∞)\n`;
  report += `- **1m Change**: ${analysis.priceChange1m !== null ? analysis.priceChange1m.toFixed(3) : 'N/A'}% (over 1 candle, 1min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  report += `- **3m Change**: ${analysis.priceChange3m !== null ? analysis.priceChange3m.toFixed(3) : 'N/A'}% (over 3 candles, 3min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  report += `- **5m Change**: ${analysis.priceChange5m !== null ? analysis.priceChange5m.toFixed(3) : 'N/A'}% (over 5 candles, 5min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  report += `- **Volume Ratio**: ${analysis.volumeRatio !== null ? analysis.volumeRatio.toFixed(2) : 'N/A'}x (current vs average, Min: 0x, Max: +∞)\n\n`;

  // Momentum indicators
  report += `## Momentum Indicators\n`;
  report += `- **RSI(9)**: ${analysis.rsi9?.toFixed(2) ?? 'N/A'} (over 9 candles, 9min on 1m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic RSI(9)**: ${analysis.stochasticRSI9?.toFixed(2) ?? 'N/A'} (over 9 candles, 9min on 1m timeframe, Min: 0, Max: 100)\n`;
  report += `- **MACD(8,21,5)**: ${analysis.macd8_21_5?.toFixed(4) ?? 'N/A'} (fast 8 and slow 21 candles on 1m timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **Signal(5)**: ${analysis.signal5?.toFixed(4) ?? 'N/A'} (over 5 candles, 5min on 1m timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **MACD Histogram**: ${analysis.macdHistogram?.toFixed(4) ?? 'N/A'} (fast 8 and slow 21 candles on 1m timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **Momentum(5)**: ${analysis.momentum5 !== null ? await self.binanceService.formatPrice(symbol, analysis.momentum5) : 'N/A'} USD (over 5 candles, 5min on 1m timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  report += `- **Momentum(10)**: ${analysis.momentum10 !== null ? await self.binanceService.formatPrice(symbol, analysis.momentum10) : 'N/A'} USD (over 10 candles, 10min on 1m timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  report += `- **ROC(1)**: ${analysis.roc1?.toFixed(3) ?? 'N/A'}% (over 1 candle, 1min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  report += `- **ROC(3)**: ${analysis.roc3?.toFixed(3) ?? 'N/A'}% (over 3 candles, 3min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  report += `- **ROC(5)**: ${analysis.roc5?.toFixed(3) ?? 'N/A'}% (over 5 candles, 5min on 1m timeframe, Min: -∞%, Max: +∞%)\n\n`;

  // Volatility and trend
  report += `## Volatility and Trend Analysis\n`;
  report += `- **Bollinger Upper(8,2.0)**: ${analysis.bollingerUpper8_2 !== null ? await self.binanceService.formatPrice(symbol, analysis.bollingerUpper8_2) : 'N/A'} USD (over 8 candles, 8min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Middle(8,2.0)**: ${analysis.bollingerMiddle8_2 !== null ? await self.binanceService.formatPrice(symbol, analysis.bollingerMiddle8_2) : 'N/A'} USD (over 8 candles, 8min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Lower(8,2.0)**: ${analysis.bollingerLower8_2 !== null ? await self.binanceService.formatPrice(symbol, analysis.bollingerLower8_2) : 'N/A'} USD (over 8 candles, 8min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Width**: ${analysis.bollingerWidth8_2?.toFixed(3) ?? 'N/A'}% (over 8 candles, 8min on 1m timeframe, Min: 0%, Max: +∞)\n`;
  report += `- **Bollinger Position**: ${analysis.bollingerPosition?.toFixed(1) ?? 'N/A'}% (price position within Bollinger Bands, Min: 0%, Max: 100%)\n`;
  report += `- **ATR(5)**: ${analysis.atr5 !== null ? await self.binanceService.formatPrice(symbol, analysis.atr5) : 'N/A'} USD (over 5 candles, 5min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **ATR(9)**: ${analysis.atr9 !== null ? await self.binanceService.formatPrice(symbol, analysis.atr9) : 'N/A'} USD (over 9 candles, 9min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Volatility(5)**: ${analysis.volatility5?.toFixed(3) ?? 'N/A'}% (over 5 candles, 5min on 1m timeframe, Min: 0%, Max: +∞)\n`;
  report += `- **True Range**: ${analysis.trueRange !== null ? await self.binanceService.formatPrice(symbol, analysis.trueRange) : 'N/A'} USD (current candle, Min: 0 USD, Max: +∞)\n\n`;

  // Stochastic oscillators
  report += `## Stochastic Oscillators\n`;
  report += `- **Stochastic K(3,3,3)**: ${analysis.stochasticK3_3_3?.toFixed(2) ?? 'N/A'} (over 3 candles, 3min on 1m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic D(3,3,3)**: ${analysis.stochasticD3_3_3?.toFixed(2) ?? 'N/A'} (smoothing 3 candles on 1m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic K(5,3,3)**: ${analysis.stochasticK5_3_3?.toFixed(2) ?? 'N/A'} (over 5 candles, 5min on 1m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic D(5,3,3)**: ${analysis.stochasticD5_3_3?.toFixed(2) ?? 'N/A'} (smoothing 3 candles on 1m timeframe, Min: 0, Max: 100)\n\n`;

  // Trend strength
  report += `## Trend Strength and Direction\n`;
  report += `- **ADX(9)**: ${analysis.adx9?.toFixed(2) ?? 'N/A'} (over 9 candles, 9min on 1m timeframe, Min: 0, Max: 100)\n`;
  report += `- **+DI(9)**: ${analysis.plusDI9?.toFixed(2) ?? 'N/A'} (over 9 candles, 9min on 1m timeframe, Min: 0, Max: 100)\n`;
  report += `- **-DI(9)**: ${analysis.minusDI9?.toFixed(2) ?? 'N/A'} (over 9 candles, 9min on 1m timeframe, Min: 0, Max: 100)\n`;
  report += `- **CCI(9)**: ${analysis.cci9?.toFixed(2) ?? 'N/A'} (over 9 candles, 9min on 1m timeframe, Min: -∞, Max: +∞)\n\n`;

  // Moving averages
  report += `## Ultra-Fast Moving Averages\n`;
  report += `- **EMA(3)**: ${analysis.ema3 !== null ? await self.binanceService.formatPrice(symbol, analysis.ema3) : 'N/A'} USD (over 3 candles, 3min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **EMA(8)**: ${analysis.ema8 !== null ? await self.binanceService.formatPrice(symbol, analysis.ema8) : 'N/A'} USD (over 8 candles, 8min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **EMA(13)**: ${analysis.ema13 !== null ? await self.binanceService.formatPrice(symbol, analysis.ema13) : 'N/A'} USD (over 13 candles, 13min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **EMA(21)**: ${analysis.ema21 !== null ? await self.binanceService.formatPrice(symbol, analysis.ema21) : 'N/A'} USD (over 21 candles, 21min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **SMA(8)**: ${analysis.sma8 !== null ? await self.binanceService.formatPrice(symbol, analysis.sma8) : 'N/A'} USD (over 8 candles, 8min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **DEMA(8)**: ${analysis.dema8 !== null ? await self.binanceService.formatPrice(symbol, analysis.dema8) : 'N/A'} USD (over 8 candles, 8min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **WMA(5)**: ${analysis.wma5 !== null ? await self.binanceService.formatPrice(symbol, analysis.wma5) : 'N/A'} USD (over 5 candles, 5min on 1m timeframe, Min: 0 USD, Max: +∞)\n\n`;

  // Support/Resistance levels
  report += `## Support/Resistance Levels\n`;
  report += `- **Support**: ${analysis.support !== null ? await self.binanceService.formatPrice(symbol, analysis.support) : 'N/A'} USD (over 30 candles, 30min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Resistance**: ${analysis.resistance !== null ? await self.binanceService.formatPrice(symbol, analysis.resistance) : 'N/A'} USD (over 30 candles, 30min on 1m timeframe, Min: 0 USD, Max: +∞)\n\n`;


  // Advanced signals
  report += `## Advanced Signals\n`;
  report += `- **Squeeze Momentum**: ${analysis.squeezeMomentum?.toFixed(3) ?? 'N/A'} (Bollinger width ratio to ATR, over 8-9 candles on 1m timeframe, Min: 0, Max: +∞)\n`;
  report += `- **Pressure Index**: ${analysis.pressureIndex?.toFixed(1) ?? 'N/A'}% (price position within current candle range, Min: -100%, Max: +100%)\n\n`;

  return report;
}

export class MicroTermMathService {
  public readonly binanceService = inject<BinanceService>(TYPES.binanceService);

  public generateMicroTermReport = async (symbol: string): Promise<string> => {
    log("microTermMathService generateMicroTermReport", { symbol });

    const analysis = await this.getMicroTermAnalysis(symbol);
    return await generateMicroTermReport(symbol, analysis, this);
  };

  public getMicroTermAnalysis = ttl(
    async (symbol: string): Promise<IMicroTermAnalysis> => {
      log("microTermMathService getMicroTermAnalysis", { symbol });

      // Get 60 minutes of 1m candles for ultra-fast micro term analysis
      const candles: Candle[] = await this.binanceService.getCandles(symbol, "1m", 60);
      return generateMicroTermAnalysis(candles);
    },
    {
      timeout: TTL_TIMEOUT,
      key: ([symbol]) => `microterm_${symbol}`,
    }
  );
}

export default MicroTermMathService;