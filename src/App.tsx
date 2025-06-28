import { useState, useEffect } from 'react'
import {EXCHANGES} from "./constants/common.constants.ts";
import {fetchCoins} from "./utils/fetchCoins.ts";
import {getFundingRate} from "./utils/getFundingRate.ts";

function App() {
    const [exchangeA, setExchangeA] = useState('')
    const [exchangeB, setExchangeB] = useState('')
    const [coin, setCoin] = useState('')
    const [fundingRate, setFundingRate] = useState<number | null>(null);
    const [spread, setSpread] = useState<number | null>(null);
    const [note, setNote] = useState<string | null>(null);
    const [availableCoins, setAvailableCoins] = useState<string[]>([]);

    useEffect(() => {
        async function loadCoins() {
            if (!exchangeA || !exchangeB) return;

            const [coinsA, coinsB] = await Promise.all([
                fetchCoins(exchangeA),
                fetchCoins(exchangeB)
            ]);

            const common = coinsA.filter((coin) => coinsB.includes(coin));
            setAvailableCoins(common.sort());
        }

        loadCoins().catch(console.error);
    }, [exchangeA, exchangeB]);

    async function testFundingRate() {
        if (!coin || !exchangeA || !exchangeB) {
            console.warn("Missing selection");
            return;
        }

        const rateA = await getFundingRate(exchangeA, coin);
        const rateB = await getFundingRate(exchangeB, coin);


        const spreadVal = rateA - rateB;
        setFundingRate(rateA);
        setSpread(spreadVal);
        setNote(
            spreadVal > 0
                ? `${exchangeA} has a higher funding rate.`
                : `${exchangeB} has a higher funding rate.`
        );
    }


    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-6">Arbitrage Funding Viewer</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block mb-1 text-sm">Exchange A (Long)</label>
                    <select
                        className="bg-gray-800 border border-gray-600 p-2 rounded w-full"
                        value={exchangeA}
                        onChange={(e) => setExchangeA(e.target.value)}
                    >
                        <option value="">-- Choose Exchange --</option>
                        {EXCHANGES.map((ex) => (
                            <option key={ex} value={ex}>{ex}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block mb-1 text-sm">Exchange B (Short)</label>
                    <select
                        className="bg-gray-800 border border-gray-600 p-2 rounded w-full"
                        value={exchangeB}
                        onChange={(e) => setExchangeB(e.target.value)}
                    >
                        <option value="">-- Choose Exchange --</option>
                        {EXCHANGES.map((ex) => (
                            <option key={ex} value={ex}>{ex}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mb-6">
                <label className="block mb-1 text-sm">Select Coin</label>
                <select
                    className="bg-gray-800 border border-gray-600 p-2 rounded w-full"
                    value={coin}
                    onChange={(e) => setCoin(e.target.value)}
                >
                    <option value="">-- Choose Coin --</option>
                    {availableCoins.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <button
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-6"
                onClick={testFundingRate}
            >
                Compare Funding Rates
            </button>

            {coin && exchangeA && exchangeB && (
                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                    <h2 className="text-xl font-semibold mb-2">{coin} - Funding Rate Comparison</h2>
                    <p className="mb-1"><strong>{exchangeA}</strong> rate: {fundingRate?.toFixed(8)}</p>
                    <p className="mb-1"><strong>{exchangeB}</strong> rate: {(fundingRate !== null && spread !== null) ? (fundingRate - spread).toFixed(8) : 'N/A'}</p>
                    <p className={`mt-2 ${spread && spread > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Spread: <strong>{spread?.toFixed(8)}</strong>
                        <br />
                        {note}
                    </p>
                </div>
            )}
        </div>
    )

}

export default App
