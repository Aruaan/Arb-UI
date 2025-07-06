import * as hl from '@nktkas/hyperliquid';

export async function fetchCoins(exchange:string): Promise<string[]> {
    try {
        if (exchange === 'Binance') {
            const res = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
            const data = await res.json();
            console.log(data.symbols
                .filter((s: any) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT')
                .map((s: any) => s.baseAsset.toUpperCase().trim()));
            
            return data.symbols
                .filter((s: any) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT')
                .map((s:any) => s.baseAsset.toUpperCase());
        }

        if (exchange === 'Bybit') {
            const res = await fetch("https://api.bybit.com/v5/market/instruments-info?category=linear");
            const data = await res.json();
            console.log(data.result.list
                .filter((s:any) => s.symbol.endsWith("USDT"))
                .map((s:any) => s.symbol.replace("USDT", "").toUpperCase().trim()));
            
            return data.result.list
                .filter((s:any) => s.symbol.endsWith("USDT"))
                .map((s:any) => s.symbol.replace("USDT", "").toUpperCase().trim());
        }

        if (exchange === 'OKX') {
            const res = await fetch("https://www.okx.com/api/v5/public/instruments?instType=SWAP");
            const data = await res.json();
            console.log(data.data
                .filter((s: any) => s.instId.endsWith('USDT-SWAP'))
                .map((s: any) => s.instId.replace('-USDT-SWAP', '').toUpperCase().trim()))
            return data.data
                .filter((s: any) => s.instId.endsWith('USDT-SWAP'))
                .map((s: any) => s.instId.replace('-USDT-SWAP', '').toUpperCase());
        }


        if (exchange === "Hyperliquid") {
            const transport = new hl.HttpTransport();
            const client = new hl.InfoClient({transport});
            const res = await client.meta();
            console.log(res.universe.map((coin: any) => coin.name.toUpperCase()));
            return res.universe.map((coin: any) => coin.name.toUpperCase());
        }

        return [];
    } catch (err) {
        console.warn(`Failed to fetch coins for ${exchange}:`, err)
        return [];
    }
}