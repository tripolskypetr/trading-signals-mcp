import BinanceService from "../services/base/BinanceService";
import LongTermMathService from "../services/math/LongTermMathService";
import MicroTermMathService from "../services/math/MicroTermMathService";
import ShortTermMathService from "../services/math/ShortTermMathService";
import SlopeDataMathService from "../services/math/SlopeDataMathService";
import SwingTermMathService from "../services/math/SwingTermMathService";
import VolumeDataMathService from "../services/math/VolumeDataMathService";
import BookDataMathService from "../services/math/BookDataMathService";
import { provide } from "./di";
import { TYPES } from "./types";

{
    provide(TYPES.binanceService, () => new BinanceService());
}

{
    provide(TYPES.swingTermMathService, () => new SwingTermMathService());
    provide(TYPES.longTermMathService, () => new LongTermMathService());
    provide(TYPES.shortTermMathService, () => new ShortTermMathService());
    provide(TYPES.microTermMathService, () => new MicroTermMathService());
    provide(TYPES.volumeDataMathService, () => new VolumeDataMathService());
    provide(TYPES.slopeDataMathService, () => new SlopeDataMathService());
    provide(TYPES.bookDataMathService, () => new BookDataMathService());
}
