# Trading Signals MCP Server

## Overview

Trading Signals MCP Server is a comprehensive technical analysis service designed to provide real-time cryptocurrency trading signals and market insights through the Binance exchange. It delivers multi-timeframe analysis, advanced technical indicators, order book data, and historical candle patterns to support informed trading decisions. The server utilizes the Model Context Protocol (MCP) framework to ensure structured and efficient data delivery.

### Key Functionalities:

- Multi-timeframe technical analysis (1-minute to 1-hour candles)
- Comprehensive technical indicators (RSI, MACD, Bollinger Bands, Fibonacci levels, and more)
- Real-time order book analysis and liquidity tracking
- Volume analysis with institutional activity detection
- Historical candle data with volatility metrics
- Trend slope analysis for precise entry/exit timing
- Support for multiple trading strategies (scalping, day trading, swing trading)

## Features

- [x] **Long-Term Signals (1h)**: 48-hour analysis with comprehensive technical indicators and Fibonacci levels
- [x] **Short-Term Signals (15m)**: 36-hour high-frequency analysis for rapid market movements
- [x] **Swing-Term Signals (30m)**: 48-hour medium-term trend analysis
- [x] **Micro-Term Signals (1m)**: Ultra-fast 1-hour analysis for precision timing
- [x] **Volume Data Analysis**: Pivot points, volume spikes, and institutional activity detection
- [x] **Slope Data Analysis**: Minute-by-minute trend slope for immediate momentum shifts
- [x] **Order Book Analysis**: Real-time liquidity zones and whale order detection
- [x] **Historical Candle Data**: OHLCV data with volatility metrics (1m, 15m, 30m, 1h)
- [x] **Binance API Integration**: Direct connection to Binance exchange for live market data
- [x] **MCP Framework**: Structured data delivery using Model Context Protocol

## Requirements

Before setting up the Trading Signals MCP Server, ensure you have the following installed:

- Node.js (v18 or later)
- npm or yarn
- Binance API key and secret (for Binance exchange integration)

## Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/your-repo/trading-signals-mcp.git
cd trading-signals-mcp
npm install  # or yarn install
```

## Configuration

To configure the server, create a `.env` file in the root directory and specify the following variables:

```sh
# Binance API Configuration
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_API_SECRET=your_binance_api_secret_here
```

## Creating a Binance API Key

Before using the Binance API integration, you need to create an API key. This allows you to connect to Binance's servers, pull market data, and interact with the exchange.

**Prerequisites:**
- Complete identity verification on Binance
- Enable two-factor authentication (2FA) on your account

**Steps to create a Binance API Key:**

1. Log in to your Binance account and click the profile icon, then [Account].

2. Go to [API Management] then click [Create API].

3. Select your preferred API Key type:
   - System-generated API keys (HMAC symmetric encryption) - You'll get the API key and the Secret Key.
   - Self-generated API keys (Ed25519 or RSA asymmetric encryption) - You'll receive an API key, but you have to create your own public-private key pair.

4. Enter a label/name for your API Key.

5. Verify with your 2FA devices and passkeys.

6. Your API key is now created.

**Important:** For trading signals analysis, you only need **Read** permissions. Do not enable trading or withdrawal permissions unless absolutely necessary.

For more details on Binance API, please refer to the [Binance API Documentation](https://developers.binance.com/en/).

## Integration with Claude Desktop

Before integrating this MCP server with Claude Desktop, build the server using the following command:

```sh
npm run build  
```

To add this MCP server to Claude Desktop:

Create or edit the Claude Desktop configuration file at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

Add the following configuration:

```json
{
    "mcpServers": {
        "trading-signals-mcp": {
            "command": "node",
            "args": [
                "/path/to/trading-signals-mcp/build/main/server.js"
            ],
            "env": {
                "BINANCE_API_KEY": "your_binance_api_key",
                "BINANCE_API_SECRET": "your_binance_api_secret"
            },
            "disabled": false,
            "autoApprove": []
        }
    }
}
```

Make sure to pass the correct location of the `server.js` file in the `args` field.

Restart Claude Desktop for the changes to take effect.

## Usage (For Connecting MCP HOST other than Claude)

### Start the Server

To start the MCP server, run:

```sh
npm start
```

## Available Tools

### Technical Analysis Tools

1. **Long-Term Signals - `fetchLongTermSignals`**
   ```json
   {
       "symbol": "BTCUSDT"
   }
   ```
   - **Timeframe**: 1-hour candles, 48-hour lookback
   - **Indicators**: RSI(14), Stochastic RSI(14), MACD(12,26,9), Bollinger Bands(20,2), ATR(14,20), SMA(50), EMA(20,34), DEMA(21), WMA(20), Momentum(10), Stochastic(14,3,3), CCI(20), ADX(14)
   - **Features**: Fibonacci retracement/extension levels, support/resistance detection, candle patterns, volume trends, 15 recent candles
   - **Use Case**: Position timing over extended periods, confirming directional bias

2. **Short-Term Signals - `fetchShortTermSignals`**
   ```json
   {
       "symbol": "BTCUSDT"
   }
   ```
   - **Timeframe**: 15-minute candles, 36-hour lookback
   - **Indicators**: RSI(9), Stochastic RSI(9), MACD(8,21,5), Bollinger Bands(10,2), ATR(9), SMA(50), EMA(8,21), DEMA(21), WMA(20), Momentum(8), Stochastic(5,3,3), CCI(14), ADX(14), ROC(3)
   - **Features**: Fibonacci levels (288 candles), support/resistance, volume trend analysis
   - **Use Case**: Detecting rapid market movements, high-frequency trading signals

3. **Swing-Term Signals - `fetchSwingTermSignals`**
   ```json
   {
       "symbol": "BTCUSDT"
   }
   ```
   - **Timeframe**: 30-minute candles, 48-hour lookback
   - **Indicators**: RSI(14), Stochastic RSI(14), MACD(12,26,9), Bollinger Bands(20,2), ATR(14), SMA(20), EMA(13,34), DEMA(21), WMA(20), Momentum(8), Stochastic(14,3,3), CCI(20), ADX(14)
   - **Features**: Comprehensive volatility analysis, Fibonacci levels, support/resistance
   - **Use Case**: Medium-term trend analysis, bridging signals between timeframes

4. **Micro-Term Signals - `fetchMicroTermSignals`**
   ```json
   {
       "symbol": "BTCUSDT"
   }
   ```
   - **Timeframe**: 1-minute candles, 1-hour lookback
   - **Indicators**: RSI(9,14), Stochastic RSI(9,14), MACD(8,21,5), Bollinger Bands(8,2), Stochastic(3,5), ADX(9), ATR(5,9), CCI(9), Momentum(5,10), EMA(3,8,13,21), SMA(8), DEMA(8), WMA(5)
   - **Features**: Volume analysis, price changes (1m/3m/5m), volatility, Bollinger position, squeeze momentum, pressure index
   - **Use Case**: Ultra-precise timing, rapid reversals detection, scalping

5. **Volume Data Analysis - `fetchVolumeData`**
   ```json
   {
       "symbol": "BTCUSDT"
   }
   ```
   - **Timeframe**: 1-hour candles, 220-hour data for SMA(200)
   - **Features**: Pivot points (S1/S2/S3, R1/R2/R3), volume spikes (1.5x+), SMA(20,50,200), EMA(12,26,50), DEMA(21), WMA(20), RSI(14), Stochastic RSI(14), Bollinger Bands(20,2), ATR(14), ADX(14), CCI(20), Momentum(10)
   - **Use Case**: Volume validation, liquidity zones, institutional activity detection

6. **Slope Data Analysis - `fetchSlopeData`**
   ```json
   {
       "symbol": "BTCUSDT"
   }
   ```
   - **Timeframe**: 1-minute candles, 2-hour lookback (120 candles)
   - **Indicators**: SMA(15), EMA(15), Price Slope (USD/minute), Momentum(10), VWAP, VMA(15), Volume Momentum(10), Price-Volume Strength
   - **Features**: Detailed price/volume arrays with timestamps
   - **Use Case**: Precise entry/exit timing, immediate trend changes, micro-movements

7. **Order Book Data - `fetchBookData`**
   ```json
   {
       "symbol": "BTCUSDT"
   }
   ```
   - **Features**: Best Bid/Ask, Mid Price, Spread, Depth Imbalance, Top 20 order levels (bids/asks), percentage distribution
   - **Use Case**: Liquidity gaps, whale orders, market maker behavior, breakout/breakdown levels

### Historical Candle Tools

8. **Hour Candle History - `fetchHourCandleHistory`**
   ```json
   {
       "symbol": "BTCUSDT"
   }
   ```
   - **Data**: Last 6 hourly candles with OHLCV, volatility %, body size %, candle type

9. **Fifteen-Minute Candle History - `fetchFifteenMinuteCandleHistory`**
   ```json
   {
       "symbol": "BTCUSDT"
   }
   ```
   - **Data**: Last 8 15-minute candles with HIGH-VOLATILITY flagging (>1.5x average)

10. **Thirty-Minute Candle History - `fetchThirtyMinuteCandleHistory`**
    ```json
    {
        "symbol": "BTCUSDT"
    }
    ```
    - **Data**: Last 6 30-minute candles with volatility metrics

11. **One-Minute Candle History - `fetchOneMinuteCandleHistory`**
    ```json
    {
        "symbol": "BTCUSDT"
    }
    ```
    - **Data**: Last 15 1-minute candles for ultra-granular analysis

## Model Context Protocol (MCP)

The **Model Context Protocol (MCP)** is an open standard designed to enhance the way applications interact with AI models and data sources. MCP establishes structured context that improves the efficiency of data delivery and analysis.

### Benefits of MCP:

- **Standardization**: Defines a unified approach for application interactions
- **Efficiency**: Reduces computational overhead and improves data delivery speed
- **Interoperability**: Supports integration across multiple platforms and AI systems
- **Structured Data**: Ensures consistent formatting for technical analysis data

## Error Handling

When a tool call fails, the server returns an error message with details. Common error scenarios include:

- Invalid trading symbol
- Binance API authentication errors
- Rate limiting restrictions
- Network connectivity issues
- Insufficient data for calculations

## License

This project is open-source under the MIT License.

For contributions, bug reports, or feature requests, submit an issue on [GitHub](https://github.com/your-repo/trading-signals-mcp).
