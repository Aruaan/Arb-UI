import { useState } from 'react'
import * as hl from "@nktkas/hyperliquid";

const EXCHANGES = ['Hyperliquid', 'Binance', 'Bybit', 'OKX']
const COINS = ['BTC', 'ETH', 'SOL', 'MKR', 'DOGE']

function App() {
    const [exchangeA, setExchangeA] = useState('')
    const [exchangeB, setExchangeB] = useState('')
    const [coin, setCoin] = useState('')


    async function testFundingRate() {
        if (!coin) {
            console.warn("No coin selected");
            return;
        }

        const transport = new hl.HttpTransport();
        const client = new hl.InfoClient({ transport });

        const result = await client.fundingHistory({
            coin: coin,
            startTime: Date.now() - 1000 * 60 * 60 * 24
        });

        const last = result[0];
        console.log(`Funding rate for ${coin}:`, last.fundingRate);
    }


    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-2xl font-bold mb-4">Arbitrage Funding Viewer</h1>

            <div className="mb-4">
                <label className="block mb-1">Select Exchange A (Long)</label>
                <select
                    className="bg-gray-800 border border-gray-600 p-2 rounded w-full"
                    value={exchangeA}
                    onChange={(e) => setExchangeA(e.target.value)}
                >
                    <option value="">-- Choose Exchange --</option>
                    {EXCHANGES.map((ex) => (
                        <option key={ex} value={ex}>
                            {ex}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-6">
                <label className="block mb-1">Select Exchange B (Short)</label>
                <select
                    className="bg-gray-800 border border-gray-600 p-2 rounded w-full"
                    value={exchangeB}
                    onChange={(e) => setExchangeB(e.target.value)}
                >
                    <option value="">-- Choose Exchange --</option>
                    {EXCHANGES.map((ex) => (
                        <option key={ex} value={ex}>
                            {ex}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <p className="text-sm text-gray-400">
                    Selected: <strong>{exchangeA || 'None'}</strong> vs <strong>{exchangeB || 'None'}</strong>
                </p>
            </div>
            <div className="mb-6">
                <label className="block mb-1">Select Coin</label>
                <select
                    className="bg-gray-800 border border-gray-600 p-2 rounded w-full"
                    value={coin}
                    onChange={(e) => setCoin(e.target.value)}
                >
                    <option value="">-- Choose Coin --</option>
                    {COINS.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <p className="text-sm text-gray-400">
                    {coin ? (
                        <>Viewing funding rate for <strong>{coin}</strong> on {exchangeA} vs {exchangeB}</>
                    ) : (
                        <>No coin selected.</>
                    )}
                </p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mt-4"
                    onClick={testFundingRate}>
                Get Hyperliquid Funding Rate
            </button>

        </div>
    )
}

export default App
