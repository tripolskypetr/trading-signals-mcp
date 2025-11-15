import { singleshot } from "functools-kit";
import Binance from "node-binance-api";

export const getBinance = singleshot(async () => {
  const binance = new Binance().options({
    family: 4,
    recvWindow: 60000,
    useServerTime: true,
  });
  await binance.useServerTime();
  return binance;
});
