const baseServices = {
    binanceService: Symbol.for('binanceService'),
};

const mathServices = {
    longTermMathService: Symbol.for('longTermMathService'),
    swingTermMathService: Symbol.for('swingTermMathService'),
    shortTermMathService: Symbol.for('shortTermMathService'),
    microTermMathService: Symbol.for('microTermMathService'),
    volumeDataMathService: Symbol.for('volumeDataMathService'),
    slopeDataMathService: Symbol.for('slopeDataMathService'),
    bookDataMathService: Symbol.for('bookDataMathService'),
}

const historyServices = {
    fifteenMinuteCandleHistoryService: Symbol.for('fifteenMinuteCandleHistoryService'),
    hourCandleHistoryService: Symbol.for('hourCandleHistoryService'),
    oneMinuteCandleHistoryService: Symbol.for('oneMinuteCandleHistoryService'),
    thirtyMinuteCandleHistoryService: Symbol.for('thirtyMinuteCandleHistoryService'),
}

const reportServices = {
    marketReportService: Symbol.for('marketReportService'),
}

export const TYPES = {
    ...baseServices,
    ...mathServices,
    ...historyServices,
    ...reportServices,
}
