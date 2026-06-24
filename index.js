// 🇲🇾 my-malaysia-bot — BNM Exchange Rate Module
// 自動爬取 MYR → CNY / USD / GBP / JPY / KRW 匯率
// 零外部 API · 零 npm 依賴 · 純 Node.js 內建模組

const dayjs = require('dayjs');
const { fetchExchangeRates, CURRENCIES } = require('./fetcher');

const todayDate = dayjs().format('YYYY年MM月DD日');
const todayISO = dayjs().format('YYYY-MM-DD');

async function main() {
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  🇲🇾 BNM Exchange Rates — ${todayDate}`);
  console.log(`═══════════════════════════════════════════\n`);

  let rates;
  try {
    rates = await fetchExchangeRates();
  } catch (err) {
    console.error(`❌ Failed to fetch exchange rates: ${err.message}`);
    process.exit(1);
  }

  console.log(`  1 MYR = \n`);

  for (const [code, info] of Object.entries(CURRENCIES)) {
    if (rates[code]) {
      const rate = parseFloat(rates[code]);
      const rateStr = code === 'KRW' ? rate.toFixed(2) : rate.toFixed(4);
      console.log(`  ${info.flag} ${info.symbol} ${rateStr}  ${info.name} (${code})`);
    }
  }

  console.log(`\n───────────────────────────────────────────`);
  console.log(`  📅 Source: BNM / currencyrate.today`);
  console.log(`  🕐 Updated: ${todayISO}`);
  console.log(`═══════════════════════════════════════════\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
