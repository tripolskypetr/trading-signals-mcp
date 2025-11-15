import { log } from "pinolog";
import { inject } from "../../core/di";
import BinanceService from "../base/BinanceService";
import { TYPES } from "../../core/types";
import { ttl } from "functools-kit";
import { FasterSMA as SMA, FasterEMA as EMA, FasterMOM as MOM, FasterROC as ROC } from "trading-signals";

const TTL_TIMEOUT = 60_000;
// 120 минутных свечей = 2 часа
const HISTORY_CANDLES = 120;

type TIMESTAMP = number;
type VOLUME = number;
type PRICE = number;

export interface ISlopeData {
  sma15: number | null;
  ema15: number | null;
  slope: number;
  momentum10: number | null;
  roc1: number | null;
  roc5: number | null;
  roc10: number | null;
  vwap: number;
  vma15: number;
  volumeMomentum10: number;
  priceVolumeStrength: number;
  prices: [TIMESTAMP, PRICE][];
  volumes: [TIMESTAMP, VOLUME][];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
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


const calculatePriceSlope = async (prices: number[]): Promise<number> => {
  log("slopeMathService calculatePriceSlope", {
    prices: prices.length,
  });

  if (prices.length < 2) return 0;

  // Use linear regression to calculate slope over the period
  const n = prices.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope; // USD per minute
};


const calculateVWAP = async (
  prices: number[],
  volumes: number[]
): Promise<number[]> => {
  log("slopeMathService calculateVWAP", {
    prices: prices.length,
    volumes: volumes.length,
  });

  if (prices.length !== volumes.length || prices.length === 0) return [];

  const vwap: number[] = [];
  let cumulativePriceVolume = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < prices.length; i++) {
    const priceVolumeProduct = prices[i] * volumes[i];
    cumulativePriceVolume += priceVolumeProduct;
    cumulativeVolume += volumes[i];

    if (cumulativeVolume > 0) {
      vwap.push(cumulativePriceVolume / cumulativeVolume);
    } else {
      vwap.push(prices[i]);
    }
  }

  return vwap;
};

const calculateVMA = async (
  volumes: number[],
  period: number
): Promise<number[]> => {
  log("slopeMathService calculateVMA", {
    volumes: volumes.length,
    period,
  });

  if (volumes.length < period) return [];

  const vma: number[] = [];

  for (let i = period - 1; i < volumes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += volumes[j];
    }
    vma.push(sum / period);
  }

  return vma;
};


const calculateVolumeMomentum = async (
  volumes: number[],
  period: number
): Promise<number[]> => {
  log("slopeMathService calculateVolumeMomentum", {
    volumes: volumes.length,
    period,
  });

  if (volumes.length <= period * 2) return [];

  const volumeMomentum: number[] = [];
  for (let i = period * 2 - 1; i < volumes.length; i++) {
    const recentVolumeSum = volumes
      .slice(i - period + 1, i + 1)
      .reduce((a, b) => a + b, 0);
    const olderVolumeSum = volumes
      .slice(i - period * 2 + 1, i - period + 1)
      .reduce((a, b) => a + b, 0);

    if (olderVolumeSum > 0) {
      const momentum =
        ((recentVolumeSum - olderVolumeSum) / olderVolumeSum) * 100;
      volumeMomentum.push(momentum);
    } else {
      volumeMomentum.push(0);
    }
  }
  return volumeMomentum;
};

const calculatePriceVolumeStrength = async (
  prices: number[],
  volumes: number[]
): Promise<number> => {
  log("slopeMathService calculatePriceVolumeStrength", {
    prices: prices.length,
    volumes: volumes.length,
  });

  if (prices.length !== volumes.length || prices.length < 2) return 0;

  let strengthScore = 0;
  const period = Math.min(20, prices.length - 1);
  const startIndex = Math.max(0, prices.length - period - 1);

  for (let i = startIndex; i < prices.length - 1; i++) {
    const priceChange = prices[i + 1] - prices[i];
    const volumeRatio = volumes[i + 1] / Math.max(volumes[i], 0.001);

    if (priceChange > 0 && volumeRatio > 1) {
      // Price increase with volume increase
      strengthScore += priceChange * volumeRatio;
    } else if (priceChange < 0 && volumeRatio > 1) {
      // Price decrease with volume increase
      strengthScore += priceChange * volumeRatio;
    }
  }

  return strengthScore;
};

const generateSlopeDataReport = async (
  self: SlopeMathService,
  symbol: string,
  data: ISlopeData
) => {
  let markdown = `# Minute Trend, Volume and Momentum for ${symbol}\n\n`;
  markdown += `**Lookback Period**: 120 minutes (2 hours)\n\n`;

  markdown += `## Price Indicators\n\n`;
  markdown += `- **SMA(15)**: ${data.sma15 !== null ? await self.binanceService.formatPrice(symbol, data.sma15) + ' USD' : 'N/A'} (over 15 candles, 15min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **EMA(15)**: ${data.ema15 !== null ? await self.binanceService.formatPrice(symbol, data.ema15) + ' USD' : 'N/A'} (over 15 candles, 15min on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **Momentum(10)**: ${data.momentum10 !== null ? await self.binanceService.formatPrice(symbol, data.momentum10) + ' USD' : 'N/A'} (over 10 candles, 10min on 1m timeframe, Min: -∞ USD, Max: +∞ USD)\n`;
  markdown += `- **ROC(1)**: ${data.roc1 !== null ? data.roc1.toFixed(3) + '%' : 'N/A'} (over 1 candle, 1min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **ROC(5)**: ${data.roc5 !== null ? data.roc5.toFixed(3) + '%' : 'N/A'} (over 5 candles, 5min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **ROC(10)**: ${data.roc10 !== null ? data.roc10.toFixed(3) + '%' : 'N/A'} (over 10 candles, 10min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **Price Slope**: ${data.slope.toFixed(6)} USD/min (linear regression over 120 candles, 2h on 1m timeframe, Min: -∞ USD/min, Max: +∞ USD/min)\n`;
  markdown += "\n";

  markdown += `## Volume Indicators\n\n`;
  markdown += `- **VWAP**: ${await self.binanceService.formatPrice(symbol, data.vwap)} USD (over 120 candles, 2h on 1m timeframe, Min: 0 USD, Max: +∞)\n`;
  markdown += `- **VMA(15)**: ${await self.binanceService.formatQuantity(symbol, data.vma15)} (over 15 candles, 15min on 1m timeframe, Min: 0, Max: +∞)\n`;
  markdown += `- **Volume Momentum(10)**: ${data.volumeMomentum10.toFixed(2)}% (over 10 candles, 10min on 1m timeframe, Min: -∞%, Max: +∞%)\n`;
  markdown += `- **Price-Volume Strength**: ${data.priceVolumeStrength.toFixed(2)} (correlation score, Min: -∞, Max: +∞)\n`;

  return markdown;
};

export class SlopeMathService {
  public readonly binanceService = inject<BinanceService>(TYPES.binanceService);

  public generateSlopeDataReport = async (symbol: string) => {
    log("slopeMathService generateSlopeDataReport", {
      symbol,
    });

    const slopeData = await this.getSlopeData(symbol);
    return generateSlopeDataReport(this, symbol, slopeData);
  };

  public computeSlope = async (prices: number[], volumes: number[]) => {
    log("slopeMathService computeSlope", {
      prices: prices.length,
      volumes: volumes.length,
    });

    // Price indicators - 15 minutes period
    const sma15 = new SMA(15);
    const ema15 = new EMA(15);
    const momentum10 = new MOM(10);
    const roc1 = new ROC(1);
    const roc5 = new ROC(5);
    const roc10 = new ROC(10);
    const slope = await calculatePriceSlope(prices);

    // Volume indicators
    const vwapValues = await calculateVWAP(prices, volumes);
    const vma15Values = await calculateVMA(volumes, 15);
    const volumeMomentum10Values = await calculateVolumeMomentum(volumes, 10);

    // Process all data
    for (let i = 0; i < prices.length; i++) {
      sma15.update(prices[i], false);
      ema15.update(prices[i], false);
      momentum10.update(prices[i], false);
      roc1.update(prices[i], false);
      roc5.update(prices[i], false);
      roc10.update(prices[i], false);
      if (i < volumes.length) {
      }
    }
    const priceVolumeStrength = await calculatePriceVolumeStrength(
      prices,
      volumes
    );

    return {
      sma15: (sma15.getResult() != null && !isUnsafe(sma15.getResult())) ? sma15.getResult() : null,
      ema15: (ema15.getResult() != null && !isUnsafe(ema15.getResult())) ? ema15.getResult() : null,
      momentum10: (momentum10.getResult() != null && !isUnsafe(momentum10.getResult())) ? momentum10.getResult() : null,
      roc1: (roc1.getResult() != null && !isUnsafe(roc1.getResult())) ? roc1.getResult() : null,
      roc5: (roc5.getResult() != null && !isUnsafe(roc5.getResult())) ? roc5.getResult() : null,
      roc10: (roc10.getResult() != null && !isUnsafe(roc10.getResult())) ? roc10.getResult() : null,
      slope: (slope != null && !isUnsafe(slope)) ? slope : 0,
      vwap: (vwapValues.length > 0 && !isUnsafe(vwapValues[vwapValues.length - 1]))
          ? vwapValues[vwapValues.length - 1]
          : (!isUnsafe(prices[prices.length - 1]) ? prices[prices.length - 1] : null),
      vma15: (vma15Values.length > 0 && !isUnsafe(vma15Values[vma15Values.length - 1]))
          ? vma15Values[vma15Values.length - 1]
          : (!isUnsafe(volumes[volumes.length - 1]) ? volumes[volumes.length - 1] : null),
      volumeMomentum10: (volumeMomentum10Values.length > 0 && !isUnsafe(volumeMomentum10Values[volumeMomentum10Values.length - 1]))
          ? volumeMomentum10Values[volumeMomentum10Values.length - 1]
          : 0,
      priceVolumeStrength: (priceVolumeStrength != null && !isUnsafe(priceVolumeStrength)) ? priceVolumeStrength : 0,
    };
  };

  public getSlopeData = ttl(
    async (symbol: string): Promise<ISlopeData> => {
      log("slopeMathService getSlopeData", {
        symbol,
      });

      const candles = await this.binanceService.getCandles(
        symbol,
        "1m",
        HISTORY_CANDLES
      );
      const slope = candles.reduce(
        (acc, candle) => {
          const { close, volume, closeTime: timestamp } = candle;
          acc.prices.push([timestamp, parseFloat(close)]);
          acc.total_volumes.push([timestamp, parseFloat(volume)]);
          return acc;
        },
        {
          prices: [] as [TIMESTAMP, PRICE][],
          total_volumes: [] as [TIMESTAMP, VOLUME][],
        }
      );

      const prices = slope.prices.map(([, price]) => price);
      const volumes = slope.total_volumes.map(([, volume]) => volume);

      const slopeData = await this.computeSlope(prices, volumes);

      return {
        ...slopeData,
        prices: slope.prices,
        volumes: slope.total_volumes,
      };
    },
    {
      timeout: TTL_TIMEOUT,
      key: ([symbol]) => `${symbol}`,
    }
  );
}

export default SlopeMathService;