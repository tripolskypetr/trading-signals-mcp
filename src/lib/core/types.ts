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

export const TYPES = {
    ...baseServices,
    ...mathServices,
}
