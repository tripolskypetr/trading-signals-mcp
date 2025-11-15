import { log } from "pinolog";
import { inject } from "../../core/di";
import { TYPES } from "../../core/types";
import LongTermMathService from "../math/LongTermMathService";
import MicroTermMathService from "../math/MicroTermMathService";
import ShortTermMathService from "../math/ShortTermMathService";
import SwingTermMathService from "../math/SwingTermMathService";
import BinanceService from "../base/BinanceService";
import VolumeDataMathService from "../math/VolumeDataMathService";
import SlopeDataMathService from "../math/SlopeDataMathService";

type Result = Awaited<ReturnType<typeof FETCH_SUMMARY_FN>>;

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

const FETCH_SUMMARY_FN = async (symbol: string, self: MarketReportService) => {
// Используем существующие сервисы
  const longTermAnalysis =
    await self.longTermMathService.getLongTermAnalysis(symbol);
  const swingTermAnalysis =
    await self.swingTermMathService.getSwingTermAnalysis(symbol);
  const shortTermAnalysis =
    await self.shortTermMathService.getShortTermAnalysis(symbol);
  const microTermAnalysis =
    await self.microTermMathService.getMicroTermAnalysis(symbol);
  const volumeDataAnalysis =
    await self.volumeDataMathService.getVolumeDataAnalysis(symbol);
  const slopeDataAnalysis =
    await self.slopeDataMathService.getSlopeData(symbol);
  return {
    symbol,
    longTerm: {
      rsi14: longTermAnalysis.rsi14,
      stochasticRSI14: longTermAnalysis.stochasticRSI14,
      macd: longTermAnalysis.macd12_26_9,
      signal: longTermAnalysis.signal9,
      adx14: longTermAnalysis.adx14,
      plusDI14: longTermAnalysis.pdi14,
      minusDI14: longTermAnalysis.ndi14,
      stochasticK: longTermAnalysis.stochastic14_3_3_K,
      stochasticD: longTermAnalysis.stochastic14_3_3_D,
      sma50: longTermAnalysis.sma50,
      ema20: longTermAnalysis.ema20,
      ema34: longTermAnalysis.ema34,
      dema21: longTermAnalysis.dema21,
      wma20: longTermAnalysis.wma20,
      momentum10: longTermAnalysis.momentum10,
      cci20: longTermAnalysis.cci20,
      atr14: longTermAnalysis.atr14,
      bollinger: {
        upper: longTermAnalysis.bollinger20_2_upper,
        middle: longTermAnalysis.bollinger20_2_middle,
        lower: longTermAnalysis.bollinger20_2_lower,
      },
      support: longTermAnalysis.support,
      resistance: longTermAnalysis.resistance,
      currentPrice: longTermAnalysis.currentPrice,
    },
    swingTerm: {
      rsi14: swingTermAnalysis.rsi14,
      stochasticRSI14: swingTermAnalysis.stochasticRSI14,
      macd: swingTermAnalysis.macd12_26_9.macd,
      macdSignal: swingTermAnalysis.macd12_26_9.signal,
      adx14: swingTermAnalysis.adx14.adx,
      plusDI14: swingTermAnalysis.adx14.plusDI,
      minusDI14: swingTermAnalysis.adx14.minusDI,
      stochasticK: swingTermAnalysis.stochastic14_3_3.k,
      stochasticD: swingTermAnalysis.stochastic14_3_3.d,
      sma20: swingTermAnalysis.sma20,
      ema13: swingTermAnalysis.ema13,
      ema34: swingTermAnalysis.ema34,
      dema21: swingTermAnalysis.dema21,
      wma20: swingTermAnalysis.wma20,
      momentum8: swingTermAnalysis.momentum8,
      priceMomentum6: swingTermAnalysis.priceMomentum6,
      cci20: swingTermAnalysis.cci20,
      atr14: swingTermAnalysis.atr14,
      volatility: swingTermAnalysis.volatility,
      bollingerWidth: swingTermAnalysis.bollingerBandWidth20_2,
      bollinger: swingTermAnalysis.bollinger20_2,
      fibonacci: swingTermAnalysis.fibonacci,
      support: swingTermAnalysis.support,
      resistance: swingTermAnalysis.resistance,
      currentPrice: swingTermAnalysis.currentPrice,
      volume: swingTermAnalysis.volume,
    },
    shortTerm: {
      rsi9: shortTermAnalysis.rsi9,
      stochasticRSI9: shortTermAnalysis.stochasticRSI9,
      macd: shortTermAnalysis.macd8_21_5,
      signal: shortTermAnalysis.signal5,
      stochasticK: shortTermAnalysis.stochasticK5_3_3,
      stochasticD: shortTermAnalysis.stochasticD5_3_3,
      adx14: shortTermAnalysis.adx14,
      plusDI14: shortTermAnalysis.plusDI14,
      minusDI14: shortTermAnalysis.minusDI14,
      sma50: shortTermAnalysis.sma50,
      ema8: shortTermAnalysis.ema8,
      ema21: shortTermAnalysis.ema21,
      dema21: shortTermAnalysis.dema21,
      wma20: shortTermAnalysis.wma20,
      momentum8: shortTermAnalysis.momentum8,
      roc5: shortTermAnalysis.roc5,
      roc10: shortTermAnalysis.roc10,
      cci14: shortTermAnalysis.cci14,
      atr9: shortTermAnalysis.atr9,
      bollinger: {
        upper: shortTermAnalysis.bollingerUpper10_2,
        middle: shortTermAnalysis.bollingerMiddle10_2,
        lower: shortTermAnalysis.bollingerLower10_2,
        width: shortTermAnalysis.bollingerWidth10_2,
      },
      support: shortTermAnalysis.support,
      resistance: shortTermAnalysis.resistance,
      fibonacci: shortTermAnalysis.fibonacci,
      currentPrice: shortTermAnalysis.currentPrice,
    },
    microTerm: {
      rsi9: microTermAnalysis.rsi9,
      stochasticRSI9: microTermAnalysis.stochasticRSI9,
      macd: microTermAnalysis.macd8_21_5,
      signal: microTermAnalysis.signal5,
      roc1: microTermAnalysis.roc1,
      roc3: microTermAnalysis.roc3,
      roc5: microTermAnalysis.roc5,
      bollinger: {
        upper: microTermAnalysis.bollingerUpper8_2,
        middle: microTermAnalysis.bollingerMiddle8_2,
        lower: microTermAnalysis.bollingerLower8_2,
        position: microTermAnalysis.bollingerPosition,
      },
      support: microTermAnalysis.support,
      resistance: microTermAnalysis.resistance,
      priceChange1m: microTermAnalysis.priceChange1m,
      priceChange3m: microTermAnalysis.priceChange3m,
    },
    volumeData: {
      pivotPoint: volumeDataAnalysis.pivotPoints.length > 0
        ? volumeDataAnalysis.pivotPoints[volumeDataAnalysis.pivotPoints.length - 1]
        : null,
      sma200: volumeDataAnalysis.technicalIndicators.length > 0
        ? volumeDataAnalysis.technicalIndicators[volumeDataAnalysis.technicalIndicators.length - 1].sma200
        : null,
      volumeRatio: volumeDataAnalysis.technicalIndicators.length > 0
        ? volumeDataAnalysis.technicalIndicators[volumeDataAnalysis.technicalIndicators.length - 1].volumeRatio
        : null,
      pricePosition: volumeDataAnalysis.technicalIndicators.length > 0
        ? volumeDataAnalysis.technicalIndicators[volumeDataAnalysis.technicalIndicators.length - 1].pricePosition
        : null,
      significantVolumes: volumeDataAnalysis.significantVolumes.slice(-3),
    },
    slopeData: {
      priceSlope: slopeDataAnalysis.slope,
      vwap: slopeDataAnalysis.vwap,
      roc1: slopeDataAnalysis.roc1,
      roc5: slopeDataAnalysis.roc5,
      roc10: slopeDataAnalysis.roc10,
      volumeMomentum10: slopeDataAnalysis.volumeMomentum10,
      priceVolumeStrength: slopeDataAnalysis.priceVolumeStrength,
    },
  };
}

const generateReport = async (
  self: MarketReportService,
  result: Result,
): Promise<string> => {
  const { symbol, longTerm, swingTerm, shortTerm, microTerm, volumeData, slopeData } = result;

  let markdown = `# Technical Analysis for ${symbol}\n\n`;

  // 1-hour candles analysis
  markdown += `## Analysis based on 1-hour candles (48 candles, 48-hour lookback)\n\n`;
  markdown += `- **RSI(14)**: ${!isUnsafe(longTerm.rsi14) ? longTerm.rsi14.toFixed(2) : 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic RSI(14)**: ${!isUnsafe(longTerm.stochasticRSI14) ? longTerm.stochasticRSI14.toFixed(2) : 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic K(14,3,3)**: ${!isUnsafe(longTerm.stochasticK) ? longTerm.stochasticK.toFixed(2) : 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic D(14,3,3)**: ${!isUnsafe(longTerm.stochasticD) ? longTerm.stochasticD.toFixed(2) : 'N/A'} (smoothing 3 candles on 1h timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **MACD(12,26,9)**: ${!isUnsafe(longTerm.macd) ? longTerm.macd.toFixed(6) + ' USD' : 'N/A'} (fast 12 and slow 26 candles on 1h timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **Signal(9)**: ${!isUnsafe(longTerm.signal) ? longTerm.signal.toFixed(6) + ' USD' : 'N/A'} (over 9 candles, 9h on 1h timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **ADX(14)**: ${!isUnsafe(longTerm.adx14) ? longTerm.adx14.toFixed(2) : 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **+DI(14)**: ${!isUnsafe(longTerm.plusDI14) ? longTerm.plusDI14.toFixed(2) : 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **-DI(14)**: ${!isUnsafe(longTerm.minusDI14) ? longTerm.minusDI14.toFixed(2) : 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **SMA(50)**: ${!isUnsafe(longTerm.sma50) ? await self.binanceService.formatPrice(symbol, longTerm.sma50) + ' USD' : 'N/A'} (over 50 candles, 50h on 1h timeframe with 100h lookback, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **EMA(20)**: ${!isUnsafe(longTerm.ema20) ? await self.binanceService.formatPrice(symbol, longTerm.ema20) + ' USD' : 'N/A'} (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **EMA(34)**: ${!isUnsafe(longTerm.ema34) ? await self.binanceService.formatPrice(symbol, longTerm.ema34) + ' USD' : 'N/A'} (over 34 candles, 34h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **DEMA(21)**: ${!isUnsafe(longTerm.dema21) ? await self.binanceService.formatPrice(symbol, longTerm.dema21) + ' USD' : 'N/A'} (over 21 candles, 21h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **WMA(20)**: ${!isUnsafe(longTerm.wma20) ? await self.binanceService.formatPrice(symbol, longTerm.wma20) + ' USD' : 'N/A'} (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Momentum(10)**: ${!isUnsafe(longTerm.momentum10) ? await self.binanceService.formatPrice(symbol, longTerm.momentum10) + ' USD' : 'N/A'} (over 10 candles, 10h on 1h timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  markdown += `- **CCI(20)**: ${!isUnsafe(longTerm.cci20) ? longTerm.cci20.toFixed(2) : 'N/A'} (over 20 candles, 20h on 1h timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **ATR(14)**: ${!isUnsafe(longTerm.atr14) ? await self.binanceService.formatPrice(symbol, longTerm.atr14) + ' USD' : 'N/A'} (over 14 candles, 14h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Bollinger Bands(20,2)**:\n`;
  markdown += `  - Upper: ${!isUnsafe(longTerm.bollinger.upper) ? await self.binanceService.formatPrice(symbol, longTerm.bollinger.upper) + ' USD' : 'N/A'} (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `  - Middle: ${!isUnsafe(longTerm.bollinger.middle) ? await self.binanceService.formatPrice(symbol, longTerm.bollinger.middle) + ' USD' : 'N/A'} (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `  - Lower: ${!isUnsafe(longTerm.bollinger.lower) ? await self.binanceService.formatPrice(symbol, longTerm.bollinger.lower) + ' USD' : 'N/A'} (over 20 candles, 20h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Support**: ${!isUnsafe(longTerm.support) ? await self.binanceService.formatPrice(symbol, longTerm.support) + ' USD' : 'N/A'} (over 4 candles, 4h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Resistance**: ${!isUnsafe(longTerm.resistance) ? await self.binanceService.formatPrice(symbol, longTerm.resistance) + ' USD' : 'N/A'} (over 4 candles, 4h on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `\n`;

  // 30-minute candles analysis
  markdown += `## Analysis based on 30-minute candles (96 candles, 48-hour lookback)\n\n`;
  markdown += `- **Volume**: ${!isUnsafe(swingTerm.volume) ? await self.binanceService.formatQuantity(symbol, swingTerm.volume) : 'N/A'} (current candle, Min: 0, Max: +∞)\n`;
  markdown += `- **RSI(14)**: ${!isUnsafe(swingTerm.rsi14) ? swingTerm.rsi14.toFixed(2) : 'N/A'} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic RSI(14)**: ${!isUnsafe(swingTerm.stochasticRSI14) ? swingTerm.stochasticRSI14.toFixed(2) : 'N/A'} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic K(14,3,3)**: ${!isUnsafe(swingTerm.stochasticK) ? swingTerm.stochasticK.toFixed(2) : 'N/A'} (smoothing 3 candles on 30m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic D(14,3,3)**: ${!isUnsafe(swingTerm.stochasticD) ? swingTerm.stochasticD.toFixed(2) : 'N/A'} (smoothing 3 candles on 30m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **MACD(12,26,9)**: ${!isUnsafe(swingTerm.macd) ? swingTerm.macd.toFixed(6) + ' USD' : 'N/A'} (fast 12 and slow 26 candles on 30m timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **MACD Signal**: ${!isUnsafe(swingTerm.macdSignal) ? swingTerm.macdSignal.toFixed(6) + ' USD' : 'N/A'} (smoothing 9 candles on 30m timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **ADX(14)**: ${!isUnsafe(swingTerm.adx14) ? swingTerm.adx14.toFixed(2) : 'N/A'} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **+DI(14)**: ${!isUnsafe(swingTerm.plusDI14) ? swingTerm.plusDI14.toFixed(2) : 'N/A'} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **-DI(14)**: ${!isUnsafe(swingTerm.minusDI14) ? swingTerm.minusDI14.toFixed(2) : 'N/A'} (over 14 candles, 7h on 30m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **SMA(20)**: ${!isUnsafe(swingTerm.sma20) ? await self.binanceService.formatPrice(symbol, swingTerm.sma20) + ' USD' : 'N/A'} (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **EMA(13)**: ${!isUnsafe(swingTerm.ema13) ? await self.binanceService.formatPrice(symbol, swingTerm.ema13) + ' USD' : 'N/A'} (over 13 candles, 6.5h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **EMA(34)**: ${!isUnsafe(swingTerm.ema34) ? await self.binanceService.formatPrice(symbol, swingTerm.ema34) + ' USD' : 'N/A'} (over 34 candles, 17h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **DEMA(21)**: ${!isUnsafe(swingTerm.dema21) ? await self.binanceService.formatPrice(symbol, swingTerm.dema21) + ' USD' : 'N/A'} (over 21 candles, 10.5h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **WMA(20)**: ${!isUnsafe(swingTerm.wma20) ? await self.binanceService.formatPrice(symbol, swingTerm.wma20) + ' USD' : 'N/A'} (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Momentum(8)**: ${!isUnsafe(swingTerm.momentum8) ? await self.binanceService.formatPrice(symbol, swingTerm.momentum8) + ' USD' : 'N/A'} (over 8 candles, 4h on 30m timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  markdown += `- **Price Momentum(6)**: ${!isUnsafe(swingTerm.priceMomentum6) ? await self.binanceService.formatPrice(symbol, swingTerm.priceMomentum6) + ' USD' : 'N/A'} (over 6 candles, 3h on 30m timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  markdown += `- **CCI(20)**: ${!isUnsafe(swingTerm.cci20) ? swingTerm.cci20.toFixed(2) : 'N/A'} (over 20 candles, 10h on 30m timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **ATR(14)**: ${!isUnsafe(swingTerm.atr14) ? await self.binanceService.formatPrice(symbol, swingTerm.atr14) + ' USD' : 'N/A'} (over 14 candles, 7h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Volatility**: ${!isUnsafe(swingTerm.volatility) ? swingTerm.volatility.toFixed(2) + '%' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0%, Max: +∞)\n`;
  markdown += `- **Bollinger Band Width(20,2)**: ${!isUnsafe(swingTerm.bollingerWidth) ? swingTerm.bollingerWidth.toFixed(6) + ' USD' : 'N/A'} (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;

  if (swingTerm.bollinger) {
    markdown += `- **Bollinger Bands(20,2)**:\n`;
    markdown += `  - Upper: ${!isUnsafe(swingTerm.bollinger.upper) ? await self.binanceService.formatPrice(symbol, swingTerm.bollinger.upper) + ' USD' : 'N/A'} (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - Middle: ${!isUnsafe(swingTerm.bollinger.middle) ? await self.binanceService.formatPrice(symbol, swingTerm.bollinger.middle) + ' USD' : 'N/A'} (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - Lower: ${!isUnsafe(swingTerm.bollinger.lower) ? await self.binanceService.formatPrice(symbol, swingTerm.bollinger.lower) + ' USD' : 'N/A'} (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  }

  markdown += `- **Support**: ${!isUnsafe(swingTerm.support) ? await self.binanceService.formatPrice(symbol, swingTerm.support) + ' USD' : 'N/A'} (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Resistance**: ${!isUnsafe(swingTerm.resistance) ? await self.binanceService.formatPrice(symbol, swingTerm.resistance) + ' USD' : 'N/A'} (over 20 candles, 10h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;

  if (swingTerm.fibonacci && swingTerm.fibonacci.retracement) {
    markdown += `- **Fibonacci Retracement**:\n`;
    markdown += `  - 0%: ${!isUnsafe(swingTerm.fibonacci.retracement.level0) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.retracement.level0) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 23.6%: ${!isUnsafe(swingTerm.fibonacci.retracement.level236) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.retracement.level236) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 38.2%: ${!isUnsafe(swingTerm.fibonacci.retracement.level382) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.retracement.level382) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 50%: ${!isUnsafe(swingTerm.fibonacci.retracement.level500) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.retracement.level500) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 61.8%: ${!isUnsafe(swingTerm.fibonacci.retracement.level618) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.retracement.level618) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 78.6%: ${!isUnsafe(swingTerm.fibonacci.retracement.level786) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.retracement.level786) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 100%: ${!isUnsafe(swingTerm.fibonacci.retracement.level1000) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.retracement.level1000) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  }
  if (swingTerm.fibonacci && swingTerm.fibonacci.extension) {
    markdown += `- **Fibonacci Extension**:\n`;
    markdown += `  - 127.2%: ${!isUnsafe(swingTerm.fibonacci.extension.level1272) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.extension.level1272) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 161.8%: ${!isUnsafe(swingTerm.fibonacci.extension.level1618) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.extension.level1618) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 261.8%: ${!isUnsafe(swingTerm.fibonacci.extension.level2618) ? await self.binanceService.formatPrice(symbol, swingTerm.fibonacci.extension.level2618) + ' USD' : 'N/A'} (over 96 candles, 48h on 30m timeframe, Min: 0 USD, Max: +∞)\n`;
  }
  markdown += `\n`;

  // 15-minute candles analysis
  markdown += `## Analysis based on 15-minute candles (144 candles, 36-hour lookback)\n\n`;
  markdown += `- **RSI(9)**: ${!isUnsafe(shortTerm.rsi9) ? shortTerm.rsi9.toFixed(2) : 'N/A'} (over 9 candles, 2.25h on 15m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic RSI(9)**: ${!isUnsafe(shortTerm.stochasticRSI9) ? shortTerm.stochasticRSI9.toFixed(2) : 'N/A'} (over 9 candles, 2.25h on 15m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic K(5,3,3)**: ${!isUnsafe(shortTerm.stochasticK) ? shortTerm.stochasticK.toFixed(2) : 'N/A'} (over 5 candles, 1.25h on 15m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic D(5,3,3)**: ${!isUnsafe(shortTerm.stochasticD) ? shortTerm.stochasticD.toFixed(2) : 'N/A'} (smoothing 3 candles on 15m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **MACD(8,21,5)**: ${!isUnsafe(shortTerm.macd) ? shortTerm.macd.toFixed(6) + ' USD' : 'N/A'} (fast 8 and slow 21 candles on 15m timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **Signal(5)**: ${!isUnsafe(shortTerm.signal) ? shortTerm.signal.toFixed(6) + ' USD' : 'N/A'} (smoothing 5 candles on 15m timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **ADX(14)**: ${!isUnsafe(shortTerm.adx14) ? shortTerm.adx14.toFixed(2) : 'N/A'} (over 14 candles, 3.5h on 15m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **+DI(14)**: ${!isUnsafe(shortTerm.plusDI14) ? shortTerm.plusDI14.toFixed(2) : 'N/A'} (over 14 candles, 3.5h on 15m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **-DI(14)**: ${!isUnsafe(shortTerm.minusDI14) ? shortTerm.minusDI14.toFixed(2) : 'N/A'} (over 14 candles, 3.5h on 15m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **SMA(50)**: ${!isUnsafe(shortTerm.sma50) ? await self.binanceService.formatPrice(symbol, shortTerm.sma50) + ' USD' : 'N/A'} (over 50 candles, 12.5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **EMA(8)**: ${!isUnsafe(shortTerm.ema8) ? await self.binanceService.formatPrice(symbol, shortTerm.ema8) + ' USD' : 'N/A'} (over 8 candles, 2h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **EMA(21)**: ${!isUnsafe(shortTerm.ema21) ? await self.binanceService.formatPrice(symbol, shortTerm.ema21) + ' USD' : 'N/A'} (over 21 candles, 5.25h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **DEMA(21)**: ${!isUnsafe(shortTerm.dema21) ? await self.binanceService.formatPrice(symbol, shortTerm.dema21) + ' USD' : 'N/A'} (over 21 candles, 5.25h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **WMA(20)**: ${!isUnsafe(shortTerm.wma20) ? await self.binanceService.formatPrice(symbol, shortTerm.wma20) + ' USD' : 'N/A'} (over 20 candles, 5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Momentum(8)**: ${!isUnsafe(shortTerm.momentum8) ? await self.binanceService.formatPrice(symbol, shortTerm.momentum8) + ' USD' : 'N/A'} (over 8 candles, 2h on 15m timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  markdown += `- **ROC(5)**: ${!isUnsafe(shortTerm.roc5) ? shortTerm.roc5.toFixed(3) + '%' : 'N/A'} (over 5 candles, 1.25h on 15m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **ROC(10)**: ${!isUnsafe(shortTerm.roc10) ? shortTerm.roc10.toFixed(3) + '%' : 'N/A'} (over 10 candles, 2.5h on 15m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **CCI(14)**: ${!isUnsafe(shortTerm.cci14) ? shortTerm.cci14.toFixed(2) : 'N/A'} (over 14 candles, 3.5h on 15m timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **ATR(9)**: ${!isUnsafe(shortTerm.atr9) ? await self.binanceService.formatPrice(symbol, shortTerm.atr9) + ' USD' : 'N/A'} (over 9 candles, 2.25h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Bollinger Bands(10,2)**:\n`;
  markdown += `  - Upper: ${!isUnsafe(shortTerm.bollinger.upper) ? await self.binanceService.formatPrice(symbol, shortTerm.bollinger.upper) + ' USD' : 'N/A'} (over 10 candles, 2.5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `  - Middle: ${!isUnsafe(shortTerm.bollinger.middle) ? await self.binanceService.formatPrice(symbol, shortTerm.bollinger.middle) + ' USD' : 'N/A'} (over 10 candles, 2.5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `  - Lower: ${!isUnsafe(shortTerm.bollinger.lower) ? await self.binanceService.formatPrice(symbol, shortTerm.bollinger.lower) + ' USD' : 'N/A'} (over 10 candles, 2.5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `  - Width: ${!isUnsafe(shortTerm.bollinger.width) ? shortTerm.bollinger.width.toFixed(6) + ' USD' : 'N/A'} (over 10 candles, 2.5h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Support**: ${!isUnsafe(shortTerm.support) ? await self.binanceService.formatPrice(symbol, shortTerm.support) + ' USD' : 'N/A'} (over 48 candles, 12h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Resistance**: ${!isUnsafe(shortTerm.resistance) ? await self.binanceService.formatPrice(symbol, shortTerm.resistance) + ' USD' : 'N/A'} (over 48 candles, 12h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;

  if (shortTerm.fibonacci && shortTerm.fibonacci.levels) {
    markdown += `- **Fibonacci Levels**:\n`;
    markdown += `  - 0.0%: ${!isUnsafe(shortTerm.fibonacci.levels["0.0%"]) ? await self.binanceService.formatPrice(symbol, shortTerm.fibonacci.levels["0.0%"]) + ' USD' : 'N/A'} (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 23.6%: ${!isUnsafe(shortTerm.fibonacci.levels["23.6%"]) ? await self.binanceService.formatPrice(symbol, shortTerm.fibonacci.levels["23.6%"]) + ' USD' : 'N/A'} (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 38.2%: ${!isUnsafe(shortTerm.fibonacci.levels["38.2%"]) ? await self.binanceService.formatPrice(symbol, shortTerm.fibonacci.levels["38.2%"]) + ' USD' : 'N/A'} (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 50.0%: ${!isUnsafe(shortTerm.fibonacci.levels["50.0%"]) ? await self.binanceService.formatPrice(symbol, shortTerm.fibonacci.levels["50.0%"]) + ' USD' : 'N/A'} (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 61.8%: ${!isUnsafe(shortTerm.fibonacci.levels["61.8%"]) ? await self.binanceService.formatPrice(symbol, shortTerm.fibonacci.levels["61.8%"]) + ' USD' : 'N/A'} (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 78.6%: ${!isUnsafe(shortTerm.fibonacci.levels["78.6%"]) ? await self.binanceService.formatPrice(symbol, shortTerm.fibonacci.levels["78.6%"]) + ' USD' : 'N/A'} (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 100.0%: ${!isUnsafe(shortTerm.fibonacci.levels["100.0%"]) ? await self.binanceService.formatPrice(symbol, shortTerm.fibonacci.levels["100.0%"]) + ' USD' : 'N/A'} (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 127.2%: ${!isUnsafe(shortTerm.fibonacci.levels["127.2%"]) ? await self.binanceService.formatPrice(symbol, shortTerm.fibonacci.levels["127.2%"]) + ' USD' : 'N/A'} (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `  - 161.8%: ${!isUnsafe(shortTerm.fibonacci.levels["161.8%"]) ? await self.binanceService.formatPrice(symbol, shortTerm.fibonacci.levels["161.8%"]) + ' USD' : 'N/A'} (over 288 candles, 72h on 15m timeframe, Min: 0 USD, Max: +∞)\n`;
  }
  markdown += `\n`;

  // 1-minute candles analysis
  markdown += `## Analysis based on 1-minute candles (60 candles, 1-hour lookback)\n\n`;
  markdown += `- **RSI(9)**: ${!isUnsafe(microTerm.rsi9) ? microTerm.rsi9.toFixed(2) : 'N/A'} (over 9 candles, 9min on 1m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **Stochastic RSI(9)**: ${!isUnsafe(microTerm.stochasticRSI9) ? microTerm.stochasticRSI9.toFixed(2) : 'N/A'} (over 9 candles, 9min on 1m timeframe, Min: 0, Max: 100)\n`;
  markdown += `- **MACD(8,21,5)**: ${!isUnsafe(microTerm.macd) ? microTerm.macd.toFixed(6) + ' USD' : 'N/A'} (fast 8 and slow 21 candles on 1m timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **Signal(5)**: ${!isUnsafe(microTerm.signal) ? microTerm.signal.toFixed(6) + ' USD' : 'N/A'} (smoothing 5 candles on 1m timeframe, Min: -∞, Max: +∞)\n`;
  markdown += `- **ROC(1)**: ${!isUnsafe(microTerm.roc1) ? microTerm.roc1.toFixed(3) + '%' : 'N/A'} (over 1 candle, 1min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **ROC(3)**: ${!isUnsafe(microTerm.roc3) ? microTerm.roc3.toFixed(3) + '%' : 'N/A'} (over 3 candles, 3min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **ROC(5)**: ${!isUnsafe(microTerm.roc5) ? microTerm.roc5.toFixed(3) + '%' : 'N/A'} (over 5 candles, 5min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **Bollinger Bands(8,2)**:\n`;
  markdown += `  - Upper: ${!isUnsafe(microTerm.bollinger.upper) ? await self.binanceService.formatPrice(symbol, microTerm.bollinger.upper) + ' USD' : 'N/A'} (over 8 candles, 8min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `  - Middle: ${!isUnsafe(microTerm.bollinger.middle) ? await self.binanceService.formatPrice(symbol, microTerm.bollinger.middle) + ' USD' : 'N/A'} (over 8 candles, 8min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `  - Lower: ${!isUnsafe(microTerm.bollinger.lower) ? await self.binanceService.formatPrice(symbol, microTerm.bollinger.lower) + ' USD' : 'N/A'} (over 8 candles, 8min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `  - Position: ${!isUnsafe(microTerm.bollinger.position) ? microTerm.bollinger.position.toFixed(2) + '%' : 'N/A'} (price position within Bollinger(8,2) bands, Min: 0%, Max: 100%)\n`;
  markdown += `- **Support**: ${!isUnsafe(microTerm.support) ? await self.binanceService.formatPrice(symbol, microTerm.support) + ' USD' : 'N/A'} (over 30 candles, 30min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Resistance**: ${!isUnsafe(microTerm.resistance) ? await self.binanceService.formatPrice(symbol, microTerm.resistance) + ' USD' : 'N/A'} (over 30 candles, 30min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Price Change 1m**: ${!isUnsafe(microTerm.priceChange1m) ? microTerm.priceChange1m.toFixed(3) + '%' : 'N/A'} (over 1 candle, 1min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **Price Change 3m**: ${!isUnsafe(microTerm.priceChange3m) ? microTerm.priceChange3m.toFixed(3) + '%' : 'N/A'} (over 3 candles, 3min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `\n`;

  // Volume analysis based on 1-hour candles
  markdown += `## Volume analysis based on 1-hour candles (96 candles, 96-hour lookback with SMA(200) on 220 hours)\n\n`;
  markdown += `- **SMA(200)**: ${!isUnsafe(volumeData.sma200) ? await self.binanceService.formatPrice(symbol, volumeData.sma200) + ' USD' : 'N/A'} (over 200 candles, 200h on 1h timeframe with 220h lookback, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Volume Ratio**: ${!isUnsafe(volumeData.volumeRatio) ? volumeData.volumeRatio.toFixed(2) + 'x' : 'N/A'} (current candle vs SMA(20), over 20 candles, 20h on 1h timeframe, Min: 0x, Max: +∞)\n`;
  markdown += `- **Price Position**: ${!isUnsafe(volumeData.pricePosition) ? volumeData.pricePosition.toFixed(2) + '%' : 'N/A'} (position between high and low of current candle, Min: 0%, Max: 100%)\n`;

  if (volumeData.pivotPoint) {
    markdown += `- **Pivot Point (PP)**: ${!isUnsafe(volumeData.pivotPoint.pivot) ? await self.binanceService.formatPrice(symbol, volumeData.pivotPoint.pivot) + ' USD' : 'N/A'} (calculated from previous candle on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `- **Pivot Support 1 (S1)**: ${!isUnsafe(volumeData.pivotPoint.support1) ? await self.binanceService.formatPrice(symbol, volumeData.pivotPoint.support1) + ' USD' : 'N/A'} (calculated from previous candle on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `- **Pivot Support 2 (S2)**: ${!isUnsafe(volumeData.pivotPoint.support2) ? await self.binanceService.formatPrice(symbol, volumeData.pivotPoint.support2) + ' USD' : 'N/A'} (calculated from previous candle on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `- **Pivot Support 3 (S3)**: ${!isUnsafe(volumeData.pivotPoint.support3) ? await self.binanceService.formatPrice(symbol, volumeData.pivotPoint.support3) + ' USD' : 'N/A'} (calculated from previous candle on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `- **Pivot Resistance 1 (R1)**: ${!isUnsafe(volumeData.pivotPoint.resistance1) ? await self.binanceService.formatPrice(symbol, volumeData.pivotPoint.resistance1) + ' USD' : 'N/A'} (calculated from previous candle on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `- **Pivot Resistance 2 (R2)**: ${!isUnsafe(volumeData.pivotPoint.resistance2) ? await self.binanceService.formatPrice(symbol, volumeData.pivotPoint.resistance2) + ' USD' : 'N/A'} (calculated from previous candle on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
    markdown += `- **Pivot Resistance 3 (R3)**: ${!isUnsafe(volumeData.pivotPoint.resistance3) ? await self.binanceService.formatPrice(symbol, volumeData.pivotPoint.resistance3) + ' USD' : 'N/A'} (calculated from previous candle on 1h timeframe, Min: 0 USD, Max: +∞)\n`;
  }

  if (volumeData.significantVolumes && volumeData.significantVolumes.length > 0) {
    markdown += `- **Significant Volume Levels** (last 3 spikes, >1.5x average):\n`;
    for (const level of volumeData.significantVolumes) {
      const priceValue = parseFloat(level.price);
      const volumeValue = parseFloat(level.volume);
      const price = !isUnsafe(priceValue) ? await self.binanceService.formatPrice(symbol, priceValue) : 'N/A';
      const volume = !isUnsafe(volumeValue) ? await self.binanceService.formatQuantity(symbol, volumeValue) : 'N/A';
      const ratio = !isUnsafe(level.volumeRatio) ? level.volumeRatio + 'x' : 'N/A';
      markdown += `  - Price: ${price} USD (Min: 0 USD, Max: +∞), Volume: ${volume} (Min: 0, Max: +∞), Ratio: ${ratio} (Min: 1.5x, Max: +∞)\n`;
    }
  }
  markdown += `\n`;

  // Slope and momentum analysis based on 1-minute candles
  markdown += `## Slope and momentum analysis based on 1-minute candles (120 candles, 2-hour lookback)\n\n`;
  markdown += `- **VWAP**: ${!isUnsafe(slopeData.vwap) ? await self.binanceService.formatPrice(symbol, slopeData.vwap) + ' USD' : 'N/A'} (over 120 candles, 2h on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Price Slope**: ${!isUnsafe(slopeData.priceSlope) ? slopeData.priceSlope.toFixed(6) + ' USD/min' : 'N/A'} (linear regression over 120 candles, 2h on 1m timeframe, Min: -∞ USD/min, Max: +∞ USD/min)\n`;
  markdown += `- **ROC(1)**: ${!isUnsafe(slopeData.roc1) ? slopeData.roc1.toFixed(3) + '%' : 'N/A'} (over 1 candle, 1min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **ROC(5)**: ${!isUnsafe(slopeData.roc5) ? slopeData.roc5.toFixed(3) + '%' : 'N/A'} (over 5 candles, 5min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **ROC(10)**: ${!isUnsafe(slopeData.roc10) ? slopeData.roc10.toFixed(3) + '%' : 'N/A'} (over 10 candles, 10min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **Volume Momentum(10)**: ${!isUnsafe(slopeData.volumeMomentum10) ? slopeData.volumeMomentum10.toFixed(2) + '%' : 'N/A'} (over 10 candles, 10min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **Price-Volume Strength**: ${!isUnsafe(slopeData.priceVolumeStrength) ? slopeData.priceVolumeStrength.toFixed(2) : 'N/A'} (correlation over 120 candles, 2h on 1m timeframe, Min: -∞, Max: +∞)\n`;

  return markdown;
};

export class MarketReportService {

    public readonly binanceService = inject<BinanceService>(TYPES.binanceService);

    public readonly longTermMathService = inject<LongTermMathService>(TYPES.longTermMathService);
    public readonly swingTermMathService = inject<SwingTermMathService>(TYPES.swingTermMathService);
    public readonly shortTermMathService = inject<ShortTermMathService>(TYPES.shortTermMathService);
    public readonly microTermMathService = inject<MicroTermMathService>(TYPES.microTermMathService);

    public readonly volumeDataMathService = inject<VolumeDataMathService>(TYPES.volumeDataMathService);
    public readonly slopeDataMathService = inject<SlopeDataMathService>(TYPES.slopeDataMathService); 

    public getReport = async (symbol: string) => {
        log("marketReportService getReport", {
            symbol,
        });
        const result = await FETCH_SUMMARY_FN(symbol, this);
        return await generateReport(this, result);
    }

}

export default MarketReportService;
