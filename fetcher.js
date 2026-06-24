// BNM Exchange Rate Fetcher — 零 API，純 Node.js 爬蟲
// 爬取 MYR → CNY / USD / GBP / JPY / KRW
// 三層 fallback：currencyrate.today → fxrate.org → 硬編碼

const https = require('https');
const http = require('http');

const CURRENCIES = {
  CNY: { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  KRW: { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

// ── Layer 1: currencyrate.today ──
async function fetchCurrencyRateToday() {
  const html = await fetchUrl('https://myr.currencyrate.today/convert/amount-1-to-usd.html');
  // The page has a "What RM 1 is worth" section, but it only lists for the target currency.
  // Use the /convert/amount-100-to-cny.html page which shows a full table
  const html2 = await fetchUrl('https://myr.currencyrate.today/convert/amount-100-to-cny.html');
  
  const rates = {};
  // Pattern: "100 MYR to US Dollar 💵 $24.65" — extract per 100 then divide
  const currencyMap = {
    'US Dollar': 'USD',
    'Chinese Yuan': 'CNY',
    'British Pound Sterling': 'GBP',
    'Japanese Yen': 'JPY',
    'South Korean Won': 'KRW',
  };

  for (const [label, code] of Object.entries(currencyMap)) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match various formats: "$24.65" or "¥166.78" or "₩37,411.77"
    const re = new RegExp(`100\\s+MYR\\s+to\\s+${escaped}[^<]*?([\$¥£₩])([0-9,]+(?:\\.[0-9]+)?)`);
    const match = html2.match(re);
    if (match) {
      const value = parseFloat(match[2].replace(/,/g, ''));
      rates[code] = (value / 100).toFixed(4);
    }
  }

  if (Object.keys(rates).length >= 4) {
    console.log('[fetcher] Layer 1 (currencyrate.today) OK');
    return rates;
  }
  throw new Error('Insufficient rates from currencyrate.today');
}

// ── Layer 2: fxrate.org ──
async function fetchFxRate() {
  const rates = {};
  for (const code of Object.keys(CURRENCIES)) {
    const html = await fetchUrl(`https://fxrate.org/MYR/${code}/`);
    // Match: "1 MYR Malaysian Ringgit ¥ 1.662 CNY Chinese Yuan" or similar
    const re = new RegExp(`RM\\s+1\\.000\\s+[^0-9]*?([0-9]+\\.[0-9]+)`);
    const match = html.match(re);
    if (match) {
      rates[code] = parseFloat(match[1]).toFixed(4);
    }
  }

  if (Object.keys(rates).length >= 4) {
    console.log('[fetcher] Layer 2 (fxrate.org) OK');
    return rates;
  }
  throw new Error('Insufficient rates from fxrate.org');
}

// ── Layer 3: Hardcoded approximate rates (last resort) ──
function fetchHardcoded() {
  console.log('[fetcher] Layer 3 (hardcoded fallback) — using estimated rates');
  return {
    CNY: '1.6678',
    USD: '0.2465',
    GBP: '0.1838',
    JPY: '39.4753',
    KRW: '374.1177',
  };
}

// ── Main fetcher with fallback ──
async function fetchExchangeRates() {
  // Layer 1
  try {
    return await fetchCurrencyRateToday();
  } catch (e) {
    console.error(`[fetcher] Layer 1 failed: ${e.message}`);
  }

  // Layer 2
  try {
    return await fetchFxRate();
  } catch (e) {
    console.error(`[fetcher] Layer 2 failed: ${e.message}`);
  }

  // Layer 3
  return fetchHardcoded();
}

module.exports = { fetchExchangeRates, CURRENCIES };
