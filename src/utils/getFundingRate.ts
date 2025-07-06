import * as hl from '@nktkas/hyperliquid'


export async function getAllHyperliquidFundingRates(): Promise<{
    fundingRates: Record<string, number>,
    coinNames: string[]
}> {
    const transport = new hl.HttpTransport();
    const client = new hl.InfoClient({ transport });
    const universe = await client.meta();

    const fundingRates: Record<string, number> = {};
    const coinNames = universe.universe.map(c => c.name.toUpperCase());

    for (const coin of coinNames) {
        try {
            const history = await client.fundingHistory({
                coin,
                startTime: Date.now() - 1000 * 60 * 60 * 24
            })
            if (history.length > 0) {
                fundingRates[coin.toUpperCase()] = parseFloat(history[0].fundingRate);
            } else {
                fundingRates[coin.toUpperCase()] = 0;
            }

            await new Promise((res) => setTimeout(res, 100)); // throttle
        } catch (err){
            console.warn(`Skipping coin ${coin}:`, err);
            fundingRates[coin.toUpperCase()] = 0;
        }
    }

    return { fundingRates, coinNames };
}


export async function getFundingRate(exchange: string, coin: string): Promise<number> {

    if (exchange === "Binance") {
        const res = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${coin}USDT`);
        const data = await res.json();
        return parseFloat(data.lastFundingRate);
    }

    if (exchange === "Bybit") {
        const res = await fetch(`https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${coin}USDT`);
        const data = await res.json();
        const rate = data.result?.list?.[0]?.fundingRate;
        return parseFloat(rate);
    }

    if (exchange === "OKX") {
        const res = await fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${coin}-USDT-SWAP`);
        const data = await res.json();
        return parseFloat(data.data[0].fundingRate);
    }
    return 0;
}