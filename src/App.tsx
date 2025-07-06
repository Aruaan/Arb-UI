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
    const [coinDataList, setCoinDataList] = useState<CoinFundingData[]>([]);

    async function handleTrade(coin: string) {
        if (!exchangeA || !exchangeB) return;

        const confirmed = window.confirm(
            `Trade ${coin}:\nLong on ${exchangeA}\nShort on ${exchangeB}?`
        );

        if (!confirmed) return;

        const tradeAmount = 0.01;

        if (exchangeA !== "Hyperliquid") {
            const symbol = exchangeA.toLowerCase() === "okx"
                ? `${coin}-USDT-SWAP`
                : `${coin}USDT`;

            const res = await fetch("http://localhost:8080/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exchange: exchangeA.toLowerCase(),
                    side: "long",
                    symbol,
                    amount: tradeAmount
                })
            });

            if (!res.ok) {
                const err = await res.text();
                console.error("Long leg failed:", err);
                alert("Long trade failed. Check console.");
                return;
            }
        } else {
            const res = await fetch("http://localhost:5000/api/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    coin,
                    side: "buy",
                    size: tradeAmount,
                }),
            });

            if (!res.ok) {
                const err = await res.text();
                console.error("Long leg failed:", err);
                alert("Long trade failed. Check console.");
                return;
            }
        }

        if (exchangeB !== "Hyperliquid") {
            const symbol = exchangeB.toLowerCase() === "okx"
                ? `${coin}-USDT-SWAP`
                : `${coin}USDT`;

            const res = await fetch("http://localhost:8080/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exchange: exchangeB.toLowerCase(),
                    side: "short",
                    symbol,
                    amount: tradeAmount
                })
            });

            if (!res.ok) {
                const err = await res.text();
                console.error("Short leg failed:", err);
                alert("Short trade failed. Check console.");
                return;
            }
        } else {
            const res = await fetch("http://localhost:5000/api/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    coin,
                    side: "sell",
                    size: tradeAmount,
                }),
            });

            if (!res.ok) {
                const err = await res.text();
                console.error("Short leg failed:", err);
                alert("Short trade failed. Check console.");
                return;
            }
        }

        alert(`Live trade sent: LONG ${coin} on ${exchangeA}, SHORT on ${exchangeB}`);
    }


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

            {coinDataList.length > 0 && (
                <table className="w-full text-sm bg-gray-800 border border-gray-700 mt-6">
                    <thead>
                    <tr>
                        <th className="p-2 border-b border-gray-600">Coin</th>
                        <th className="p-2 border-b border-gray-600">{exchangeA} Rate</th>
                        <th className="p-2 border-b border-gray-600">{exchangeB} Rate</th>
                        <th className="p-2 border-b border-gray-600">Spread</th>
                        <th className="p-2 border-b border-gray-600">Better</th>
                        <th className="p-2 border-b border-gray-600">Action</th>

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
                            <td className="p-2 border-b border-gray-700">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                    onClick={() => handleTrade(data.coin)}
                                >
                                    Trade
                                </button>
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
