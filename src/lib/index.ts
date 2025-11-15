import "./core/provide";

import { init, inject } from "./core/di";
import { TYPES } from "./core/types";
import BinanceService from "./services/base/BinanceService";
import SwingTermMathService from "./services/math/SwingTermMathService";
import LongTermMathService from "./services/math/LongTermMathService";
import ShortTermMathService from "./services/math/ShortTermMathService";
import VolumeDataMathService from "./services/math/VolumeDataMathService";
import SlopeDataMathService from "./services/math/SlopeDataMathService";
import MicroTermMathService from "./services/math/MicroTermMathService";
import BookDataMathService from "./services/math/BookDataMathService";
import FifteenMinuteCandleHistoryService from "./services/history/FifteenMinuteCandleHistoryService";
import HourCandleHistoryService from "./services/history/HourCandleHistoryService";
import OneMinuteCandleHistoryService from "./services/history/OneMinuteCandleHistoryService";
import ThirtyMinuteCandleHistoryService from "./services/history/ThirtyMinuteCandleHistoryService";

const baseServices = {
    binanceService: inject<BinanceService>(TYPES.binanceService),
}

const mathServices = {
    swingTermMathService: inject<SwingTermMathService>(TYPES.swingTermMathService),
    longTermMathService: inject<LongTermMathService>(TYPES.longTermMathService),
    shortTermMathService: inject<ShortTermMathService>(TYPES.shortTermMathService),
    volumeDataMathService: inject<VolumeDataMathService>(TYPES.volumeDataMathService),
    slopeDataMathService: inject<SlopeDataMathService>(TYPES.slopeDataMathService),
    microTermMathService: inject<MicroTermMathService>(TYPES.microTermMathService),
    bookDataMathService: inject<BookDataMathService>(TYPES.bookDataMathService),
}

const historyServices = {
    fifteenMinuteCandleHistoryService: inject<FifteenMinuteCandleHistoryService>(TYPES.fifteenMinuteCandleHistoryService),
    hourCandleHistoryService: inject<HourCandleHistoryService>(TYPES.hourCandleHistoryService),
    oneMinuteCandleHistoryService: inject<OneMinuteCandleHistoryService>(TYPES.oneMinuteCandleHistoryService),
    thirtyMinuteCandleHistoryService: inject<ThirtyMinuteCandleHistoryService>(TYPES.thirtyMinuteCandleHistoryService),
}

const signal = {
    ...baseServices,
    ...mathServices,
    ...historyServices,
}

init();

export { signal }

Object.assign(globalThis, { signal });

export default signal;
