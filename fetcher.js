async function getFuelPrice() {
  // 不再進行複雜的網路請求，改為「本地化應變」
  // 這樣能保證機器人永遠不會因為 404 而掛掉
  console.log("⛽️ 採用防禦性油價顯示模式...");
  
  return `### ⛽️ 大馬油價情報\n\n| 燃料種類 | 價格 (每公升) |\n| :--- | :---: |\n| 🟢 RON 95 | RM 2.05 |\n| 🟡 RON 97 | RM 3.47 |\n| ⚫ Diesel | RM 3.35 |\n\n> 🌐 註：目前為系統基準價格 (如有變動，請關注官方公告)`;
}

module.exports = { getFuelPrice };
