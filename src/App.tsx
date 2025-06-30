import { useState, useEffect } from 'react'

// Constants
import {EXCHANGES} from "./constants/common.constants.ts";

// Utils
import {fetchCoins} from "./utils/fetchCoins.ts";
import {getFundingRate} from "./utils/getFundingRate.ts";
import {getAllHyperliquidFundingRates} from "./utils/getFundingRate.ts";

// Types
import type {CoinFundingData} from "./types/common.types.ts";

function App() {
    const [exchangeA, setExchangeA] = useState('')
    const [exchangeB, setExchangeB] = useState('')
    const [coin, setCoin] = useState('')
    const [availableCoins, setAvailableCoins] = useState<string[]>([]);
    const [coinDataList, setCoinDataList] = useState<CoinFundingData[]>([]);

    useEffect(() => {
        async function loadCoins() {
            console.log("LOADING COINS");
            try {
                let hlRates: Record<string, number> = {};
                let hlCoinNames: string[] = [];

                if (!exchangeA || !exchangeB) return;

                if (exchangeA === 'Hyperliquid' || exchangeB === 'Hyperliquid') {
                    console.log("Getting HL rates");
                    const { fundingRates, coinNames } = await getAllHyperliquidFundingRates();
                    hlRates = fundingRates;
                    hlCoinNames = coinNames;
                    console.log("HL coins:", hlCoinNames);
                }

                const coinsA = exchangeA === 'Hyperliquid' ? hlCoinNames : await fetchCoins(exchangeA);
                const coinsB = exchangeB === 'Hyperliquid' ? hlCoinNames : await fetchCoins(exchangeB);


                console.log("CoinsA:", coinsA);
                console.log("CoinsB:", coinsB);

                const common = coinsA.filter((coin) => coinsB.includes(coin));
                console.log("Common coins:", common);

                setAvailableCoins(common.sort());

                const coinFundingList: CoinFundingData[] = [];

                await Promise.all(common.map(async (coin) => {
                    try {
                        const [rateA, rateB] = await Promise.all([
                            exchangeA === 'Hyperliquid' ? hlRates[coin] ?? 0 : getFundingRate(exchangeA, coin),
                            exchangeB === 'Hyperliquid' ? hlRates[coin] ?? 0 : getFundingRate(exchangeB, coin),
                        ]);
                        const spread = rateA - rateB;
                        const betterExchange = spread > 0 ? exchangeA : exchangeB;

                        coinFundingList.push({
                            coin,
                            rateA,
                            rateB,
                            spread,
                            betterExchange
                        });
                    } catch (err) {
                        console.warn(`Error getting rate for ${coin}: `, err);
                    }
                }));

                setCoinDataList(coinFundingList);
            } catch (err) {
                console.error("Failed to load coins:", err);
            }
        }

        loadCoins().catch(console.error);
    }, [exchangeA, exchangeB]);

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

            {coinDataList.length > 0 && (
                <table className="w-full text-sm bg-gray-800 border border-gray-700 mt-6">
                    <thead>
                    <tr>
                        <th className="p-2 border-b border-gray-600">Coin</th>
                        <th className="p-2 border-b border-gray-600">{exchangeA} Rate</th>
                        <th className="p-2 border-b border-gray-600">{exchangeB} Rate</th>
                        <th className="p-2 border-b border-gray-600">Spread</th>
                        <th className="p-2 border-b border-gray-600">Better</th>
                    </tr>
                    </thead>
                    <tbody>
                    {coinDataList.map((data) => (
                        <tr key={data.coin} className="text-center">
                            <td className="p-2 border-b border-gray-700">{data.coin}</td>
                            <td className="p-2 border-b border-gray-700">{data.rateA.toFixed(8)}</td>
                            <td className="p-2 border-b border-gray-700">{data.rateB.toFixed(8)}</td>
                            <td className="p-2 border-b border-gray-700">{data.spread.toFixed(8)}</td>
                            <td className={`p-2 border-b border-gray-700 ${data.betterExchange === exchangeA ? 'text-green-400' : 'text-red-400'}`}>
                                {data.betterExchange}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    )

}

export default App
