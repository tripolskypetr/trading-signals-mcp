import { memoize, queued, singleshot, sleep, ttl } from "functools-kit";
import { log } from "pinolog";
import { getBinance } from "../../../config/binance";
import { roundTicks } from "../../../utils/roundTicks";
import { Candle, Interval } from "node-binance-api";
import { get } from "lodash-es";

declare function parseFloat(value: unknown): number;

const PRICE_UPDATE_MS = 30_000;

const getExchangeInfo = singleshot(async () => {
  const binance = await getBinance();
  return await binance.exchangeInfo();
});

const getTickerInfo = ttl(
  async () => {
    const binance = await getBinance();
    const ticker = await binance.prices();
    return ticker;
  },
  {
    timeout: PRICE_UPDATE_MS,
  }
);

export class BinanceService {
  public getCandles = async (
    symbol: string,
    interval: Interval,
    limit: number
  ) => {
    log("binanceService getCandles", {
      symbol,
    });
    const binance = await getBinance();
    const candles = await binance.candlesticks(symbol, interval, {
      limit,
    });
    return candles;
  };

  public getExchangeInfo = memoize(
    ([symbol, filterType]) => `${symbol}-${filterType}`,
    async (symbol: string, filterType = "LOT_SIZE") => {
      log("binanceService getExchangeInfo", {
        symbol,
        filterType,
      });
      const exchangeInfo = await getExchangeInfo();
      const lotSizes = Object.values(exchangeInfo.symbols)
        .map(({ symbol, filters }) => [
          symbol,
          filters.find((f: any) => f.filterType === filterType),
        ])
        .reduce<any>((acm, [k, v]) => ({ ...acm, [k]: v }), {});
      const { stepSize, tickSize, minQty } = lotSizes[symbol];
      return {
        stepSize,
        tickSize,
        minQty,
      };
    }
  );

  public getTickerPrice = async (symbol: string) => {
    log("binanceService getMarketPrice", {
      symbol,
    });
    const ticker = await getTickerInfo();
    const price = get(ticker, symbol);
    if (!price) {
      throw new Error(
        `binanceService getMarketPrice symbol not in ticker symbol=${symbol}`
      );
    }
    return parseFloat(price);
  };

  public getMarketPrice = async (symbol: string) => {
    log("binanceService getMarketPrice", {
      symbol,
    });
    const binance = await getBinance();
    const { price } = await binance.avgPrice(symbol);
    if (!price) {
      throw new Error(
        `binanceService getMarketPrice symbol not in ticker symbol=${symbol}`
      );
    }
    return parseFloat(price);
  };

  public formatQuantity = async (symbol: string, quantity: number) => {
    log("binanceService formatQuantity", {
      symbol,
    });
    const { stepSize } = await this.getExchangeInfo(symbol, "LOT_SIZE");
    return roundTicks(quantity, stepSize);
  };

  public formatPrice = async (symbol: string, price: number) => {
    log("binanceService formatPrice", {
      price,
    });
    const { tickSize } = await this.getExchangeInfo(symbol, "PRICE_FILTER");
    return roundTicks(price, tickSize);
  };
}

export default BinanceService;
