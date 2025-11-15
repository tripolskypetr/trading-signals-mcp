export enum ToolName {
    // Функции для рассуждений интерактивного чата
    FetchShortTermSignals = "fetch_short_term_signals",
    FetchSwingTermSignals = "fetch_swing_term_signals", 
    FetchLongTermSignals = "fetch_long_term_signals",
    FetchMicroTermSignals = "fetch_micro_term_signals",
    FetchVolumeData = "fetch_volume_data",
    FetchSlopeData = "fetch_slope_data",
    FetchBookData = "fetch_book_data",
    // История данных
    FetchHourCandleHistory = "fetch_hour_candle_history",
    FetchThirtyMinuteCandleHistory = "fetch_thirty_minute_candle_history",
    FetchFifteenMinuteCandleHistory = "fetch_fifteen_minute_candle_history",
    FetchOneMinuteCandleHistory = "fetch_one_minute_candle_history",
}

Object.assign(globalThis, { ToolName });
