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
  FasterDEMA as DEMA,
  FasterWMA as WMA,
  FasterMOM as MOM,
  FasterStochasticRSI as StochasticRSI
} from "trading-signals";
import BinanceService from "../base/BinanceService";
import { TYPES } from "../../core/types";
import { log } from "pinolog";
import { Candle } from "node-binance-api";
import { ttl } from "functools-kit";

const TTL_TIMEOUT = 60_000;
const RECENT_CANDLES = 15;

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


// Removed RSI divergence interface - only using raw numbers from trading-signals

// Removed CCI analysis interface - only using raw numbers from trading-signals

// Removed volatility interface - only using raw numbers from trading-signals

interface ILongTermAnalysis {
  rsi14: number | null; // RSI(14)
  stochasticRSI14: number | null; // StochRSI(14)
  macd12_26_9: number | null; // MACD(12,26,9)
  signal9: number | null; // Signal(9)
  bollinger20_2_upper: number | null; // BB(20,2.0) Upper
  bollinger20_2_middle: number | null; // BB(20,2.0) Middle
  bollinger20_2_lower: number | null; // BB(20,2.0) Lower
  atr14: number | null; // ATR(14)
  atr14_raw: number | null; // ATR(14) Raw
  atr20: number | null; // ATR(20)
  sma50: number | null; // SMA(50)
  ema20: number | null; // EMA(20)
  ema34: number | null; // EMA(34)
  dema21: number | null; // DEMA(21)
  wma20: number | null; // WMA(20)
  momentum10: number | null; // MOM(10)
  stochastic14_3_3_K: number | null; // Stoch(14,3,3) %K
  stochastic14_3_3_D: number | null; // Stoch(14,3,3) %D
  adx14: number | null; // ADX(14)
  pdi14: number | null; // +DI(14)
  ndi14: number | null; // -DI(14)
  cci20: number | null; // CCI(20)
  volumeTrend: "increasing" | "decreasing" | "stable";
  support: number;
  resistance: number;
  currentPrice: number;
  fibonacci: IFibonacciLevels;
  recentCandles: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

// Removed divergence analysis functions - only using raw numbers

// Removed CCI analysis function - only using raw numbers

// Removed CCI divergence function - only using raw numbers

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

function calculateFibonacciLevels(candles: Candle[]): IFibonacciLevels {
  const closes = candles.map((candle) => Number(candle.close));
  
  // 24 часа lookback period
  const lookbackPeriod = Math.min(24, candles.length);
  const recentCandles = candles.slice(-lookbackPeriod);
  
  const high = Math.max(...recentCandles.map(c => Number(c.high)));
  const low = Math.min(...recentCandles.map(c => Number(c.low)));
  const range = high - low;
  
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

// Removed RSI divergence function - only using raw numbers

// Removed volatility metrics function - only using raw numbers



async function generateComprehensiveReport(symbol: string, analysis: ILongTermAnalysis, self: LongTermMathService): Promise<string> {
  let report = `# 1-Hour Candles Trading Analysis for ${symbol}\n\n`;
  report += `**Lookback Period**: 48 candles (48 hours) with SMA(50) from 100 hours\n\n`;

  report += `## Market Overview\n`;
  report += `- **Support Level**: ${await self.binanceService.formatPrice(symbol, analysis.support)} USD (over 4 candles, 4h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Resistance Level**: ${await self.binanceService.formatPrice(symbol, analysis.resistance)} USD (over 4 candles, 4h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Nearest Fibonacci Level**: ${analysis.fibonacci.nearestLevel.level} at ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.nearestLevel.price)} USD (${await self.binanceService.formatPrice(symbol, analysis.fibonacci.nearestLevel.distance)} USD away) (24h lookback)\n\n`;

  report += `## Technical Indicators\n`;
  report += `- **RSI(14)**: ${analysis.rsi14?.toFixed(2) ?? "N/A"} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic RSI(14)**: ${analysis.stochasticRSI14?.toFixed(2) ?? 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  report += `- **CCI(20)**: ${analysis.cci20?.toFixed(2) ?? 'N/A'} (over 20 candles, 20h on 1h timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **MACD(12,26,9)**: ${analysis.macd12_26_9?.toFixed(2) ?? 'N/A'} (fast 12 and slow 26 candles on 1h timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **Signal(9)**: ${analysis.signal9?.toFixed(2) ?? 'N/A'} (over 9 candles, 9h on 1h timeframe, Min: -∞, Max: +∞)\n`;
  report += `- **ADX**: ${analysis.adx14?.toFixed(2) ?? 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  report += `- **+DI**: ${analysis.pdi14?.toFixed(2) ?? 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  report += `- **-DI**: ${analysis.ndi14?.toFixed(2) ?? 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  report += `- **Bollinger Upper(20,2.0)**: ${analysis.bollinger20_2_upper !== null ? await self.binanceService.formatPrice(symbol, analysis.bollinger20_2_upper) : 'N/A'} USD (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Middle(20,2.0)**: ${analysis.bollinger20_2_middle !== null ? await self.binanceService.formatPrice(symbol, analysis.bollinger20_2_middle) : 'N/A'} USD (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Bollinger Lower(20,2.0)**: ${analysis.bollinger20_2_lower !== null ? await self.binanceService.formatPrice(symbol, analysis.bollinger20_2_lower) : 'N/A'} USD (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **ATR(14)**: ${analysis.atr14 !== null ? await self.binanceService.formatPrice(symbol, analysis.atr14) : 'N/A'} USD (over 14 candles, 14h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **ATR(14) Raw**: ${analysis.atr14_raw?.toFixed(4) ?? 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **ATR(20)**: ${analysis.atr20 !== null ? await self.binanceService.formatPrice(symbol, analysis.atr20) : 'N/A'} USD (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **SMA(50)**: ${analysis.sma50 !== null ? await self.binanceService.formatPrice(symbol, analysis.sma50) : 'N/A'} USD (over 50 candles, 50h on 1h timeframe, calculated from 100h dataset, Min: 0 USD, Max: +∞)\n`;
  report += `- **EMA(20)**: ${analysis.ema20 !== null ? await self.binanceService.formatPrice(symbol, analysis.ema20) : 'N/A'} USD (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **EMA(34)**: ${analysis.ema34 !== null ? await self.binanceService.formatPrice(symbol, analysis.ema34) : 'N/A'} USD (over 34 candles, 34h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **DEMA(21)**: ${analysis.dema21 !== null ? await self.binanceService.formatPrice(symbol, analysis.dema21) : 'N/A'} USD (over 21 candles, 21h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **WMA(20)**: ${analysis.wma20 !== null ? await self.binanceService.formatPrice(symbol, analysis.wma20) : 'N/A'} USD (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **Momentum(10)**: ${analysis.momentum10 !== null ? await self.binanceService.formatPrice(symbol, analysis.momentum10) : 'N/A'} USD (over 10 candles, 10h on 1h timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  report += `- **Stochastic K(14,3,3)**: ${analysis.stochastic14_3_3_K?.toFixed(2) ?? 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  report += `- **Stochastic D(14,3,3)**: ${analysis.stochastic14_3_3_D?.toFixed(2) ?? 'N/A'} (smoothing 3 candles on 1h timeframe, Min: 0, Max: 100)\n`;
  report += `\n`;

  report += `## Fibonacci Levels\n`;
  report += `- **0.0% (High)**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["0.0%"])} USD (over 24 candles, 24h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **23.6%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["23.6%"])} USD (over 24 candles, 24h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **38.2%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["38.2%"])} USD (over 24 candles, 24h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **50.0%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["50.0%"])} USD (over 24 candles, 24h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **61.8%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["61.8%"])} USD (over 24 candles, 24h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **78.6%**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["78.6%"])} USD (over 24 candles, 24h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **100.0% (Low)**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["100.0%"])} USD (over 24 candles, 24h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **127.2% Extension**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["127.2%"])} USD (over 24 candles, 24h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  report += `- **161.8% Extension**: ${await self.binanceService.formatPrice(symbol, analysis.fibonacci.levels["161.8%"])} USD (over 24 candles, 24h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;

  return report;
}


function generateAnalysis(candles: Candle[], fullCandles?: Candle[]): ILongTermAnalysis {
  const closes = candles.map((candle) => Number(candle.close));
  const highs = candles.map((candle) => Number(candle.high));
  const lows = candles.map((candle) => Number(candle.low));
  const volumes = candles.map((candle) => Number(candle.volume));
  const currentPrice = closes[closes.length - 1];

  // Initialize all indicators with crypto-optimized periods for 1h timeframe
  const rsi = new RSI(14);
  const stochasticRSI = new StochasticRSI(14);
  const macdShortEMA = new EMA(12);
  const macdLongEMA = new EMA(26);
  const macdSignalEMA = new EMA(9);
  const macd = new MACD(macdShortEMA, macdLongEMA, macdSignalEMA);
  const bollinger = new BollingerBands(20, 2.0);
  const atr14 = new ATR(14);
  const atr20 = new ATR(20);
  const ema20 = new EMA(20);
  const ema34 = new EMA(34);
  const dema = new DEMA(21);
  const wma = new WMA(20);
  const momentum = new MOM(10);
  const stochastic = new StochasticOscillator(14, 3, 3);
  const adx = new ADX(14);
  const cci = new CCI(20);
  
  // SMA(50) from full dataset for accuracy
  let sma50Value: number | null = null;
  if (fullCandles && fullCandles.length >= 50) {
    const sma50 = new SMA(50);
    fullCandles.forEach((candle) => {
      sma50.update(Number(candle.close), false);
    });
    sma50Value = sma50.getResult() ?? null;
  }

  // Update all indicators
  candles.forEach((candle, i) => {
    const open = Number(candle.open);
    const high = highs[i];
    const low = lows[i];
    const close = closes[i];
    const volume = volumes[i];
    
    rsi.update(close, false);
    stochasticRSI.update(close, false);
    macd.update(close, false);
    bollinger.update(close, false);
    atr14.update({ high, low, close }, false);
    atr20.update({ high, low, close }, false);
    ema20.update(close, false);
    ema34.update(close, false);
    dema.update(close, false);
    wma.update(close, false);
    momentum.update(close, false);
    stochastic.update({ high, low, close }, false);
    adx.update({ high, low, close }, false);
    cci.update({ high, low, close }, false);
  });

  // Volume trend calculation - 6-hour analysis optimized
  const volumeSma6 = new SMA(6);
  const volumeSma6Prev = new SMA(6);
  
  const volumeStart = Math.max(0, volumes.length - 12);
  const prevVolumeData = volumes.slice(volumeStart, Math.min(volumeStart + 6, volumes.length));
  const recentVolumeData = volumes.slice(-6);
  
  if (prevVolumeData.length > 0) {
    prevVolumeData.forEach((vol) => volumeSma6Prev.update(vol, false));
  }
  if (recentVolumeData.length > 0) {
    recentVolumeData.forEach((vol) => volumeSma6.update(vol, false));
  }
  
  const recentVolumeRaw = volumeSma6.getResult();
  const prevVolumeRaw = volumeSma6Prev.getResult();
  const recentVolume = !isUnsafe(recentVolumeRaw) ? recentVolumeRaw : volumes[volumes.length - 1];
  const prevVolume = !isUnsafe(prevVolumeRaw) ? prevVolumeRaw : volumes[Math.max(0, volumes.length - 7)];
  const volumeTrend = (!isUnsafe(recentVolume) && !isUnsafe(prevVolume))
    ? (recentVolume > prevVolume * 1.1 ? "increasing" :
       recentVolume < prevVolume * 0.9 ? "decreasing" : "stable")
    : "stable";

  // Support/Resistance calculation (keep as requested)
  const pivotPeriod = Math.min(4, candles.length);
  const recentHighs = highs.slice(-pivotPeriod).filter(h => !isUnsafe(h));
  const recentLows = lows.slice(-pivotPeriod).filter(l => !isUnsafe(l));
  const support = recentLows.length > 0 ? Math.min(...recentLows) : currentPrice;
  const resistance = recentHighs.length > 0 ? Math.max(...recentHighs) : currentPrice;

  // Fibonacci calculation (keep as requested)
  const fibonacci = calculateFibonacciLevels(candles);

  // Recent candles
  const availableCandles = Math.min(RECENT_CANDLES, candles.length);
  const recentCandles = candles.slice(-availableCandles).map((candle) => ({
    time: new Date(Number(candle.closeTime)).toISOString(),
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
    volume: Number(candle.volume),
  }));

  // Get results
  const rsiValue = rsi.getResult() ?? null;
  const stochasticRSIResult = stochasticRSI.getResult();
  const stochasticRSIValue = !isUnsafe(stochasticRSIResult) ? stochasticRSIResult * 100 : null;
  const macdResult = macd.getResult();
  const bollingerResult = bollinger.getResult();
  const stochasticResult = stochastic.getResult();
  const adxValue = adx.getResult() ?? null;
  const pdiValue = (typeof adx.pdi === 'number' ? adx.pdi * 100 : null);
  const ndiValue = (typeof adx.mdi === 'number' ? adx.mdi * 100 : null);

  return {
    rsi14: (rsiValue != null && !isUnsafe(rsiValue)) ? rsiValue : null,
    stochasticRSI14: stochasticRSIValue,
    macd12_26_9: (macdResult && !isUnsafe(macdResult.macd)) ? macdResult.macd : null,
    signal9: (macdResult && !isUnsafe(macdResult.signal)) ? macdResult.signal : null,
    bollinger20_2_upper: (bollingerResult && !isUnsafe(bollingerResult.upper)) ? bollingerResult.upper : null,
    bollinger20_2_middle: (bollingerResult && !isUnsafe(bollingerResult.middle)) ? bollingerResult.middle : null,
    bollinger20_2_lower: (bollingerResult && !isUnsafe(bollingerResult.lower)) ? bollingerResult.lower : null,
    atr14: (atr14.getResult() != null && !isUnsafe(atr14.getResult())) ? atr14.getResult() : null,
    atr14_raw: (atr14.getResult() != null && !isUnsafe(atr14.getResult())) ? atr14.getResult() : null,
    atr20: (atr20.getResult() != null && !isUnsafe(atr20.getResult())) ? atr20.getResult() : null,
    sma50: (sma50Value != null && !isUnsafe(sma50Value)) ? sma50Value : null,
    ema20: (ema20.getResult() != null && !isUnsafe(ema20.getResult())) ? ema20.getResult() : null,
    ema34: (ema34.getResult() != null && !isUnsafe(ema34.getResult())) ? ema34.getResult() : null,
    dema21: (dema.getResult() != null && !isUnsafe(dema.getResult())) ? dema.getResult() : null,
    wma20: (wma.getResult() != null && !isUnsafe(wma.getResult())) ? wma.getResult() : null,
    momentum10: (momentum.getResult() != null && !isUnsafe(momentum.getResult())) ? momentum.getResult() : null,
    stochastic14_3_3_K: (stochasticResult && !isUnsafe(stochasticResult.stochK)) ? stochasticResult.stochK : null,
    stochastic14_3_3_D: (stochasticResult && !isUnsafe(stochasticResult.stochD)) ? stochasticResult.stochD : null,
    adx14: (adxValue != null && !isUnsafe(adxValue)) ? adxValue : null,
    pdi14: (pdiValue != null && !isUnsafe(pdiValue)) ? pdiValue : null,
    ndi14: (ndiValue != null && !isUnsafe(ndiValue)) ? ndiValue : null,
    cci20: (cci.getResult() != null && !isUnsafe(cci.getResult())) ? cci.getResult() : null,
    volumeTrend,
    support: (support != null && !isUnsafe(support)) ? support : (!isUnsafe(currentPrice) ? currentPrice : null),
    resistance: (resistance != null && !isUnsafe(resistance)) ? resistance : (!isUnsafe(currentPrice) ? currentPrice : null),
    currentPrice: (currentPrice != null && !isUnsafe(currentPrice)) ? currentPrice : null,
    fibonacci,
    recentCandles,
  };
}

export class LongTermMathService {
  public readonly binanceService = inject<BinanceService>(TYPES.binanceService);

  public generateLongTermReport = async (symbol: string): Promise<string> => {
    log("longTermMathService generateLongTermReport", { symbol });

    const analysis = await this.getLongTermAnalysis(symbol);
    return generateComprehensiveReport(symbol, analysis, this);
  };

  public getLongTermAnalysis = ttl(
    async (symbol: string): Promise<ILongTermAnalysis> => {
      log("longTermMathService, getLongTermAnalysis", { symbol });

      // Загружаем достаточно данных для SMA(50), но анализируем только последние 48 часов
      const fullCandles: Candle[] = await this.binanceService.getCandles(symbol, "1h", 100);
      const candles: Candle[] = fullCandles.slice(-48);
      return generateAnalysis(candles, fullCandles);
    },
    {
      timeout: TTL_TIMEOUT,
      key: ([symbol]) => `${symbol}`,
    }
  );
}

export default LongTermMathService;