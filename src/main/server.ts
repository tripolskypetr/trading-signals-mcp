import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerFetchLongTermSignals } from "../tools/fetchLongTermSignals.js";
import { registerFetchShortTermSignals } from "../tools/fetchShortTermSignals.js";
import { registerFetchSwingTermSignals } from "../tools/fetchSwingTermSignals.js";
import { registerFetchMicroTermSignals } from "../tools/fetchMicroTermSignals.js";
import { registerFetchVolumeData } from "../tools/fetchVolumeData.js";
import { registerFetchSlopeData } from "../tools/fetchSlopeData.js";
import { registerFetchBookData } from "../tools/fetchBookData.js";
import { registerFetchHourCandleHistory } from "../tools/fetchHourCandleHistory.js";
import { registerFetchFifteenMinuteCandleHistory } from "../tools/fetchFifteenMinuteCandleHistory.js";
import { registerFetchThirtyMinuteCandleHistory } from "../tools/fetchThirtyMinuteCandleHistory.js";
import { registerFetchOneMinuteCandleHistory } from "../tools/fetchOneMinuteCandleHistory.js";

async function main() {
    const server = new McpServer({
        name: "trading-signals-mcp",
        version: "1.0.0"
    });

    // Register technical analysis tools
    registerFetchLongTermSignals(server);
    registerFetchShortTermSignals(server);
    registerFetchSwingTermSignals(server);
    registerFetchMicroTermSignals(server);
    registerFetchVolumeData(server);
    registerFetchSlopeData(server);
    registerFetchBookData(server);

    // Register candle history tools
    registerFetchHourCandleHistory(server);
    registerFetchFifteenMinuteCandleHistory(server);
    registerFetchThirtyMinuteCandleHistory(server);
    registerFetchOneMinuteCandleHistory(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main();
