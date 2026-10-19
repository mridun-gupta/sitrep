import type { MarketQuote } from '../types';
import { fetchJson, fetchText } from './http';

/**
 * Market radar — crypto via CoinGecko free API, global indices via stooq CSV.
 * Both are keyless. Each half is independent: if one upstream hiccups the
 * other still returns.
 */

const COINGECKO =
  'https://api.coingecko.com/api/v3/simple/price' +
  '?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';

const STOOQ =
  'https://stooq.com/q/l/?s=%5Espx,%5Endq,%5Edji,%5Eukx,%5Edax,%5Enkx' +
  '&f=sd2t2ohlcv&h&e=csv';

const INDEX_NAMES: Record<string, string> = {
  '^spx': 'S&P 500',
  '^ndq': 'Nasdaq 100',
  '^dji': 'Dow Jones',
  '^ukx': 'FTSE 100',
  '^dax': 'DAX 40',
  '^nkx': 'Nikkei 225',
};

const CRYPTO_NAMES: Record<string, { symbol: string; name: string }> = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
  ethereum: { symbol: 'ETH', name: 'Ethereum' },
  solana: { symbol: 'SOL', name: 'Solana' },
};

export async function fetchMarkets(): Promise<MarketQuote[]> {
  const quotes: MarketQuote[] = [];

  const [crypto, indices] = await Promise.allSettled([
    fetchJson<Record<string, { usd?: number; usd_24h_change?: number }>>(COINGECKO),
    fetchText(STOOQ),
  ]);

  if (crypto.status === 'fulfilled') {
    for (const [id, v] of Object.entries(crypto.value)) {
      const meta = CRYPTO_NAMES[id];
      if (!meta || v.usd === undefined) continue;
      quotes.push({
        symbol: meta.symbol,
        name: meta.name,
        price: v.usd,
        change24h: v.usd_24h_change,
        unit: 'USD',
        kind: 'crypto',
      });
    }
  }

  if (indices.status === 'fulfilled') {
    const lines = indices.value.trim().split('\n').slice(1); // drop header
    for (const line of lines) {
      const [sym, , , , , close] = line.split(',');
      if (!sym || !close || close === 'N/D') continue;
      const key = sym.toLowerCase();
      quotes.push({
        symbol: sym.replace('^', ''),
        name: INDEX_NAMES[key] ?? sym,
        price: Number(close),
        unit: 'pts',
        kind: 'index',
      });
    }
  }

  if (quotes.length === 0) throw new Error('all market upstreams failed');
  return quotes;
}
