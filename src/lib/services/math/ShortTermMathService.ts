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

const TTL_TIMEOUT = 60_000;
const RECENT_CANDLES = 15;

// Interface for Fibonacci levels
interface IFibonacciLevels {
  high: number;
  low: number;
  levels: {
    "0.0%": number;
    "23.6%": number;
    "38.2%": number;
    "50.0%": number;
    "61.8%": number;
    "78.6%": number;
    "100.0%": number;
    "127.2%": number;
    "161.8%": number;
  };
  nearestLevel: {
    level: string;
    price: number;
    distance: number;
  };
}


// Simplified interfaces - keeping only essential structures

// Simplified analysis interface using only trading-signals library
interface IShortTermAnalysis {
  rsi9: number | null; // RSI(9) - Current RSI value
  stochasticRSI9: number | null; // StochRSI(9) - Stochastic RSI value
  macd8_21_5: number | null; // MACD(8,21,5) - MACD value
  signal5: number | null; // Signal(5) - MACD signal value
  bollingerUpper10_2: number | null; // Bollinger Upper(10,2.0) Band
  bollingerMiddle10_2: number | null; // Bollinger Middle(10,2.0) Band
  bollingerLower10_2: number | null; // Bollinger Lower(10,2.0) Band
  bollingerWidth10_2: number | null; // Bollinger Width(10,2.0) Band
  stochasticK5_3_3: number | null; // Stochastic K(5,3,3) Oscillator %K
  stochasticD5_3_3: number | null; // Stochastic D(5,3,3) Oscillator %D
  adx14: number | null; // ADX(14) - Average Directional Index
  plusDI14: number | null; // +DI(14) - Plus Directional Indicator
  minusDI14: number | null; // -DI(14) - Minus Directional Indicator
  atr9: number | null; // ATR(9) - Average True Range for volatility
  cci14: number | null; // CCI(14) - Commodity Channel Index
  sma50: number | null; // SMA(50) - 50-period Simple Moving Average
  ema8: number | null; // EMA(8) - 8-period Exponential Moving Average
  ema21: number | null; // EMA(21) - 21-period Exponential Moving Average
  dema21: number | null; // DEMA(21) - 21-period Double Exponential Moving Average
  wma20: number | null; // WMA(20) - 20-period Weighted Moving Average
  momentum8: number | null; // MOM(8) - Momentum indicator
  roc5: number | null; // ROC(5) - 5-period Rate of Change %
  roc10: number | null; // ROC(10) - 10-period Rate of Change %
  volumeTrend: "increasing" | "decreasing" | "stable"; // Basic volume trend
  support: number | null; // Nearest support level
  resistance: number | null; // Nearest resistance level
  currentPrice: number | null; // Current price of coin
  fibonacci: IFibonacciLevels; // Fibonacci levels
  recentCandles: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  dataQuality: {
    sufficientData: boolean;
    candleCount: number;
  };
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

// Custom functions removed - using only trading-signals library

// Calculate Fibonacci retracement levels with better lookback
function calculateFibonacciLevels(candles: Candle[]): IFibonacciLevels {
  const closes = candles.map((candle) => Number(candle.close));
  const highs = candles.map((candle) => Number(candle.high));
  const lows = candles.map((candle) => Number(candle.low));
  
  // Better lookback period - 3 days for 15m timeframe
  const lookbackPeriod = Math.min(288, candles.length); // 72 hours (288 * 15m) ideal, limited by available data (144 = 36h)
  const recentCandles = candles.slice(-lookbackPeriod);
  
  const high = Math.max(...recentCandles.map(c => Number(c.high)));
  const low = Math.min(...recentCandles.map(c => Number(c.low)));
  const range = high - low;
  
  // Calculate Fibonacci levels
  const levels = {
    "0.0%": high,
    "23.6%": high - (range * 0.236),
    "38.2%": high - (range * 0.382),
    "50.0%": high - (range * 0.500),
    "61.8%": high - (range * 0.618),
    "78.6%": high - (range * 0.786),
    "100.0%": low,
    "127.2%": high - (range * 1.272),
    "161.8%": high - (range * 1.618),
  };
  
  // Find nearest Fibonacci level to current price
  const currentPrice = closes[closes.length - 1];
  let nearestLevel = { level: "50.0%", price: levels["50.0%"], distance: Math.abs(currentPrice - levels["50.0%"]) };
  
  Object.entries(levels).forEach(([level, price]) => {
    const distance = Math.abs(currentPrice - price);
    if (distance < nearestLevel.distance) {
      nearestLevel = { level, price, distance };
    }
  });
  
  return {
    high,
    low,
    levels,
    nearestLevel,
  };
}




// Simple volume trend calculation using basic logic
function calculateVolumeTrend(volumes: number[]): "increasing" | "decreasing" | "stable" {
  if (volumes.length < 16) return "stable";
  
  // Compare recent 2 hours vs previous 2 hours
  const recentVolumes = volumes.slice(-8);
  const olderVolumes = volumes.slice(-16, -8);
  
  if (recentVolumes.length < 4 || olderVolumes.length < 4) return "stable";
  
  const recentAvg = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
  const olderAvg = olderVolumes.reduce((sum, vol) => sum + vol, 0) / olderVolumes.length;
  
  if (recentAvg > olderAvg * 1.2) return "increasing";
  if (recentAvg < olderAvg * 0.8) return "decreasing";
  return "stable";
}

async function generateComprehensiveReport(symbol: string, analysis: IShortTermAnalysis, self: ShortTermMathService): Promise<string> {
  let report = `# 15-Minute Candles Trading Analysis for ${symbol}\n\n`;
  report += `**Lookback Period**: 144 candles (36 hours)\n\n`;

  report += `## Market Overview\n`;
  report += `- **Support Level**: ${await self.binanceService.formatPrice(symbol, analysis.support)} USD (over 48 candles, 12h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Resistance Level**: ${await self.binanceService.formatPrice(symbol, analysis.resistance)} USD (over 48 candles, 12h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Nearest Fibonacci Level**: ${analysis.fibonacci.nearestLevel.level} at ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.nearestLevel.price)} USD (${await self.binanceService.formatPrice(symbol, analysis.fibonacci.nearestLevel.distance)} USD away)\n\n`;

  report += `## Technical Indicators\n`;
  report += `- **RSI(9)**: ${analysis.rsi9?.toFixed(2) ?? "N/A"} (over 9 candles, 2.25h on 15m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic RSI(9)**: ${analysis.stochasticRSI9 !== null ? analysis.stochasticRSI9.toFixed(2) : 'N/A'} (over 9 candles, 2.25h on 15m timeframe, Min: 0, Max: 100)\n`;
  report += `- **CCI(14)**: ${analysis.cci14?.toFixed(2) ?? "N/A"} (over 14 candles, 3.5h on 15m timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **MACD(8,21,5)**: ${analysis.macd8_21_5?.toFixed(4) ?? 'N/A'} (fast 8 and slow 21 candles on 15m timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **Signal(5)**: ${analysis.signal5?.toFixed(4) ?? 'N/A'} (over 5 candles, 1.25h on 15m timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **ADX**: ${analysis.adx14?.toFixed(2) ?? 'N/A'} (over 14 candles, 3.5h on 15m timeframe, Min: 0, Max: 100)\n`;
  report += `- **+DI**: ${analysis.plusDI14?.toFixed(2) ?? 'N/A'} (over 14 candles, 3.5h on 15m timeframe, Min: 0, Max: 100)\n`;
  report += `- **-DI**: ${analysis.minusDI14?.toFixed(2) ?? 'N/A'} (over 14 candles, 3.5h on 15m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Bollinger Upper(10,2.0)**: ${analysis.bollingerUpper10_2 !== null ? await self.binanceService.formatPrice(symbol, analysis.bollingerUpper10_2) : 'N/A'} USD (over 10 candles, 2.5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Middle(10,2.0)**: ${analysis.bollingerMiddle10_2 !== null ? await self.binanceService.formatPrice(symbol, analysis.bollingerMiddle10_2) : 'N/A'} USD (over 10 candles, 2.5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Lower(10,2.0)**: ${analysis.bollingerLower10_2 !== null ? await self.binanceService.formatPrice(symbol, analysis.bollingerLower10_2) : 'N/A'} USD (over 10 candles, 2.5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **ATR(9)**: ${analysis.atr9 !== null ? await self.binanceService.formatPrice(symbol, analysis.atr9) : 'N/A'} USD (over 9 candles, 2.25h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **SMA(50)**: ${analysis.sma50 !== null ? await self.binanceService.formatPrice(symbol, analysis.sma50) : 'N/A'} USD (over 50 candles, 12.5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **EMA(8)**: ${analysis.ema8 !== null ? await self.binanceService.formatPrice(symbol, analysis.ema8) : 'N/A'} USD (over 8 candles, 2h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **EMA(21)**: ${analysis.ema21 !== null ? await self.binanceService.formatPrice(symbol, analysis.ema21) : 'N/A'} USD (over 21 candles, 5.25h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **DEMA(21)**: ${analysis.dema21 !== null ? await self.binanceService.formatPrice(symbol, analysis.dema21) : 'N/A'} USD (over 21 candles, 5.25h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **WMA(20)**: ${analysis.wma20 !== null ? await self.binanceService.formatPrice(symbol, analysis.wma20) : 'N/A'} USD (over 20 candles, 5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Momentum(8)**: ${analysis.momentum8 !== null ? await self.binanceService.formatPrice(symbol, analysis.momentum8) : 'N/A'} USD (over 8 candles, 2h on 15m timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  report += `- **ROC(5)**: ${analysis.roc5?.toFixed(3) ?? 'N/A'}% (over 5 candles, 1.25h on 15m timeframe, Min: -∞%, Max: +∞%)\n`;
  report += `- **ROC(10)**: ${analysis.roc10?.toFixed(3) ?? 'N/A'}% (over 10 candles, 2.5h on 15m timeframe, Min: -∞%, Max: +∞%)\n`;
  report += `- **Stochastic K(5,3,3)**: ${analysis.stochasticK5_3_3 !== null ? analysis.stochasticK5_3_3.toFixed(2) : 'N/A'} (over 5 candles, 1.25h on 15m timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic D(5,3,3)**: ${analysis.stochasticD5_3_3 !== null ? analysis.stochasticD5_3_3.toFixed(2) : 'N/A'} (smoothing 3 candles on 15m timeframe, Min: 0, Max: 100)\n`;
  report += `\n`;

  report += `## Fibonacci Levels\n`;
  report += `- **0.0% (High)**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["0.0%"])} USD (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **23.6%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["23.6%"])} USD (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **38.2%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["38.2%"])} USD (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **50.0%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["50.0%"])} USD (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **61.8%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["61.8%"])} USD (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **78.6%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["78.6%"])} USD (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **100.0% (Low)**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["100.0%"])} USD (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **127.2% Extension**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["127.2%"])} USD (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **161.8% Extension**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["161.8%"])} USD (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;

  return report;
}

// Simplified analysis using only trading-signals library and essential custom logic
function generateAnalysis(candles: Candle[]): IShortTermAnalysis {
  const closes = candles.map((candle) => Number(candle.close));
  const highs = candles.map((candle) => Number(candle.high));
  const lows = candles.map((candle) => Number(candle.low));
  const volumes = candles.map((candle) => Number(candle.volume));
  const currentPrice = closes[closes.length - 1];

  // Data quality assessment
  const dataQuality = {
    sufficientData: candles.length >= 144,
    candleCount: candles.length
  };

  // Initialize technical indicators for 15m timeframe
  const rsi = new RSI(9);
  const stochasticRSI = new StochasticRSI(9);
  const shortEMA = new EMA(8);
  const longEMA = new EMA(21);
  const signalEMA = new EMA(5);
  const macd = new MACD(shortEMA, longEMA, signalEMA);
  const bollinger = new BollingerBands(10, 2.0);
  const atr = new ATR(9);
  const sma50 = new SMA(50);
  const ema8 = new EMA(8);
  const ema21 = new EMA(21);
  const dema21 = new DEMA(21);
  const wma20 = new WMA(20);
  const momentum = new MOM(8);
  const roc5 = new ROC(5);
  const roc10 = new ROC(10);
  const stochastic = new StochasticOscillator(5, 3, 3);
  const cci = new CCI(14);
  const adx = new ADX(14);

  // Update indicators with candle data
  candles.forEach((candle, i) => {
    const open = parseFloat(candle.open);
    const high = highs[i];
    const low = lows[i];
    const close = closes[i];
    const volume = volumes[i];
    const hlc = { high, low, close };
    const ohlcv = { open, high, low, close, volume };
    
    rsi.update(close, false);
    stochasticRSI.update(close, false);
    macd.update(close, false);
    bollinger.update(close, false);
    atr.update(hlc, false);
    sma50.update(close, false);
    ema8.update(close, false);
    ema21.update(close, false);
    dema21.update(close, false);
    wma20.update(close, false);
    momentum.update(close, false);
    roc5.update(close, false);
    roc10.update(close, false);
    stochastic.update(hlc, false);
    cci.update(hlc, false); // Simple CCI from trading-signals
    adx.update(hlc, false); // Simple ADX from trading-signals
  });

  // Get OBV from trading-signals library

  // Volume trend calculation
  const volumeTrend = calculateVolumeTrend(volumes);

  // Support/resistance using basic method
  const pivotPeriod = Math.min(48, candles.length); // 12 hours or available
  const recentHighs = highs.slice(-pivotPeriod);
  const recentLows = lows.slice(-pivotPeriod);
  
  // Find significant support/resistance with minimum distance
  const minDistance = currentPrice * 0.003; // Minimum 0.3% from price

  const significantHighs = [...recentHighs].filter(h => !isUnsafe(h) && h > currentPrice + minDistance).sort((a, b) => a - b);
  const significantLows = [...recentLows].filter(l => !isUnsafe(l) && l < currentPrice - minDistance).sort((a, b) => b - a);

  // Find significant levels or use extreme values
  const safeHighs = recentHighs.filter(h => !isUnsafe(h));
  const safeLows = recentLows.filter(l => !isUnsafe(l));
  const resistance = significantHighs.length > 0 ? significantHighs[0] : (safeHighs.length > 0 ? Math.max(...safeHighs) : currentPrice);
  const support = significantLows.length > 0 ? significantLows[0] : (safeLows.length > 0 ? Math.min(...safeLows) : currentPrice);

  // Calculate Fibonacci levels (keeping this custom calculation)
  const fibonacci = calculateFibonacciLevels(candles);

  // Get ADX values from trading-signals library
  const adxRaw = adx.getResult();
  const adxValue = !isUnsafe(adxRaw) ? adxRaw : null;
  const pdiValue = (typeof adx.pdi === 'number' && !isUnsafe(adx.pdi * 100)) ? adx.pdi * 100 : null;
  const mdiValue = (typeof adx.mdi === 'number' && !isUnsafe(adx.mdi * 100)) ? adx.mdi * 100 : null;

  // Recent Candles (ensure we don't exceed available data)
  const availableCandles = Math.min(RECENT_CANDLES, candles.length);
  const recentCandles = candles.slice(-availableCandles).map((candle) => ({
    time: new Date(Number(candle.closeTime)).toISOString(),
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
    volume: Number(candle.volume),
  }));

  // Get current indicator values with proper null checks
  const rsiValue = !isUnsafe(rsi.getResult()) ? rsi.getResult() : null;
  const stochasticRSIResult = stochasticRSI.getResult();
  const stochasticRSIValue = !isUnsafe(stochasticRSIResult) ? stochasticRSIResult * 100 : null;
  const macdResult = macd.getResult();
  const bollingerResult = bollinger.getResult();
  const atrValue = !isUnsafe(atr.getResult()) ? atr.getResult() : null;
  const sma50Value = !isUnsafe(sma50.getResult()) ? sma50.getResult() : null;
  const ema8Value = !isUnsafe(ema8.getResult()) ? ema8.getResult() : null;
  const ema21Value = !isUnsafe(ema21.getResult()) ? ema21.getResult() : null;
  const dema21Value = !isUnsafe(dema21.getResult()) ? dema21.getResult() : null;
  const wma20Value = !isUnsafe(wma20.getResult()) ? wma20.getResult() : null;
  const momentumValue = !isUnsafe(momentum.getResult()) ? momentum.getResult() : null;
  const roc5Value = !isUnsafe(roc5.getResult()) ? roc5.getResult() : null;
  const roc10Value = !isUnsafe(roc10.getResult()) ? roc10.getResult() : null;
  const stochasticResult = stochastic.getResult();
  const cciValue = !isUnsafe(cci.getResult()) ? cci.getResult() : null;

  return {
    rsi9: (rsiValue != null && !isUnsafe(rsiValue)) ? rsiValue : null,
    stochasticRSI9: (stochasticRSIValue != null && !isUnsafe(stochasticRSIValue)) ? stochasticRSIValue : null,
    macd8_21_5: (macdResult && !isUnsafe(macdResult.macd)) ? macdResult.macd : null,
    signal5: (macdResult && !isUnsafe(macdResult.signal)) ? macdResult.signal : null,
    bollingerUpper10_2: (bollingerResult && !isUnsafe(bollingerResult.upper)) ? bollingerResult.upper : null,
    bollingerMiddle10_2: (bollingerResult && !isUnsafe(bollingerResult.middle)) ? bollingerResult.middle : null,
    bollingerLower10_2: (bollingerResult && !isUnsafe(bollingerResult.lower)) ? bollingerResult.lower : null,
    bollingerWidth10_2: (bollingerResult && !isUnsafe(bollingerResult.upper) && !isUnsafe(bollingerResult.lower) && !isUnsafe(bollingerResult.middle)) ?
      ((bollingerResult.upper - bollingerResult.lower) / bollingerResult.middle * 100) : null,
    stochasticK5_3_3: (stochasticResult && !isUnsafe(stochasticResult.stochK)) ? stochasticResult.stochK : null,
    stochasticD5_3_3: (stochasticResult && !isUnsafe(stochasticResult.stochD)) ? stochasticResult.stochD : null,
    adx14: (adxValue != null && !isUnsafe(adxValue)) ? adxValue : null,
    plusDI14: (pdiValue != null && !isUnsafe(pdiValue)) ? pdiValue : null,
    minusDI14: (mdiValue != null && !isUnsafe(mdiValue)) ? mdiValue : null,
    atr9: (atrValue != null && !isUnsafe(atrValue)) ? atrValue : null,
    cci14: (cciValue != null && !isUnsafe(cciValue)) ? cciValue : null,
    sma50: (sma50Value != null && !isUnsafe(sma50Value)) ? sma50Value : null,
    ema8: (ema8Value != null && !isUnsafe(ema8Value)) ? ema8Value : null,
    ema21: (ema21Value != null && !isUnsafe(ema21Value)) ? ema21Value : null,
    dema21: (dema21Value != null && !isUnsafe(dema21Value)) ? dema21Value : null,
    wma20: (wma20Value != null && !isUnsafe(wma20Value)) ? wma20Value : null,
    momentum8: (momentumValue != null && !isUnsafe(momentumValue)) ? momentumValue : null,
    roc5: (roc5Value != null && !isUnsafe(roc5Value)) ? roc5Value : null,
    roc10: (roc10Value != null && !isUnsafe(roc10Value)) ? roc10Value : null,
    volumeTrend,
    support: !isUnsafe(support) ? support : (!isUnsafe(currentPrice) ? currentPrice : null),
    resistance: !isUnsafe(resistance) ? resistance : (!isUnsafe(currentPrice) ? currentPrice : null),
    currentPrice: !isUnsafe(currentPrice) ? currentPrice : null,
    fibonacci,
    recentCandles,
    dataQuality,
  };
}

export class ShortTermMathService {
  public readonly binanceService = inject<BinanceService>(TYPES.binanceService);

  public generateShortTermReport = async (symbol: string): Promise<string> => {
    log("shortTermMathService generateShortTermReport", { symbol });

    const analysis = await this.getShortTermAnalysis(symbol);
    return generateComprehensiveReport(symbol, analysis, this);
  };

  public getShortTermAnalysis = ttl(
    async (symbol: string): Promise<IShortTermAnalysis> => {
      log("shortTermMathService, getShortTermAnalysis", { symbol });

      // Request more data for better analysis reliability
      const candles: Candle[] = await this.binanceService.getCandles(symbol, "15m", 144);
      return generateAnalysis(candles);
    },
    {
      timeout: TTL_TIMEOUT,
      key: ([symbol]) => `${symbol}`,
    }
  );
}

export default ShortTermMathService;