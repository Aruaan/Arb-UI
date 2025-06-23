import { useState } from 'react'
import * as hl from "@nktkas/hyperliquid";

const EXCHANGES = ['Hyperliquid', 'Binance', 'Bybit', 'OKX']
const COINS = ['BTC', 'ETH', 'SOL', 'MKR', 'DOGE']
const MOCK_FUNDING_RATES: Record<string, Record<string, number>> = {
    Binance: { BTC: 0.00001, ETH: 0.00002, SOL: 0.000015, MKR: 0.00001, DOGE: 0.000005 },
    Bybit:   { BTC: 0.000012, ETH: 0.000019, SOL: 0.000017, MKR: 0.000012, DOGE: 0.000006 },
    OKX:     { BTC: 0.000011, ETH: 0.000022, SOL: 0.000014, MKR: 0.000013, DOGE: 0.000004 }
}

function App() {
    const [exchangeA, setExchangeA] = useState('')
    const [exchangeB, setExchangeB] = useState('')
    const [coin, setCoin] = useState('')
    const [fundingRate, setFundingRate] = useState<number | null>(null);
    const [spread, setSpread] = useState<number | null>(null);
    const [note, setNote] = useState<string | null>(null);

    async function testFundingRate() {
        if (!coin || !exchangeA || !exchangeB) {
            console.warn("Missing selection");
            return;
        }

        const transport = new hl.HttpTransport();
        const client = new hl.InfoClient({ transport });

        const result = await client.fundingHistory({
            coin: coin,
            startTime: Date.now() - 1000 * 60 * 60 * 24
        });

        const hlRate = parseFloat(result[0].fundingRate);
        let otherRate = 0;

        if (exchangeA === "Hyperliquid") {
            otherRate = MOCK_FUNDING_RATES[exchangeB]?.[coin] ?? 0;
        } else if (exchangeB === "Hyperliquid") {
            otherRate = MOCK_FUNDING_RATES[exchangeA]?.[coin] ?? 0;
        } else {
            console.warn("At least one exchange must be Hyperliquid");
            return;
        }

        const spreadVal = hlRate - otherRate;
        setFundingRate(hlRate);
        setSpread(spreadVal);
        setNote(
            spreadVal > 0
                ? "Positive funding spread. Arbitrage might be profitable."
                : "No profitable arbitrage."
        );
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

            {fundingRate !== null && (
                <p className="mt-4 text-green-400">
                    Latest funding rate: <strong>{fundingRate}</strong>
                </p>
            )}

            {spread !== null && (
                <p className={`mt-2 ${spread > 0 ? 'text-green-400 ': 'text-red-400'}`}>
                    Spread: <strong>{spread.toFixed(8)}</strong>
                    <br />
                    {note}
                </p>
            )}
        </div>
    )
}

export default App
