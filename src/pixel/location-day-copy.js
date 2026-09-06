import { MAP_LOCATIONS } from "../data/map-locations.js";

// Completed-day narration is separate from map descriptions and gameplay tips.
// Encounters, invitations, and stat changes have their own recorded outcomes.
export const LOCATION_DAY_COPY = {
  radio:
    "走廊另一頭傳來試音聲，沒多久又安靜下來。你看過公開節目的介紹，把感興趣的題目記下，離開時也放輕了腳步。",
  tv_company:
    "你在公開接待區看了節目介紹與徵選公告。來往的人抱著不同顏色的資料夾，你把要查的資訊抄好，才將位置讓給下一個人。",
  film_company:
    "影業大廳的海報排得很整齊，片名下面卻各有一長串名字。你停下來看了製作名單，也記住幾個想進一步了解的工作。",
  record_company:
    "你翻過公開陳列的唱片介紹，留意曲目之間的編排。離開前，你在筆記裡圈起幾個想再聽一遍的名字。",
  media_company:
    "大廳螢幕播著品牌短片。你看完一輪，又多留意了一次畫面和音樂如何接在一起，將印象最深的片段記下。",
  livehouse:
    "你在場館的公開區域看了演出海報。團名、日期與字體擠在一起，每張都很想被看見；你替有興趣的幾場留了記號。",
  cinema:
    "你放慢腳步看過戲院的片單，為下一次觀影留下幾個選擇。售票口飄來爆米花的味道，讓選片這件事忽然有點難專心。",
  studio:
    "你沿著攝影棚的公共走道看看，在工作區入口停下。推車從身旁經過，你讓出通道，把看到的現場分工記進筆記。",
  recording:
    "你在錄音室的接待區看了公開介紹。隔著門聽不清正在錄什麼，倒是牆上的專輯封面，讓你想起幾首很久沒聽的歌。",
  rehearsal:
    "你在排練室做了些簡單練習，停下來時再看一次自己的筆記。有一句台詞怎麼念都不太順，你把它圈起來，留待下次慢慢試。",
  theatre:
    "你翻看小劇場的節目單，讀了演出介紹與工作坊資訊。紙張邊角被翻得有些捲起，你想知道，前面那些人會選哪一場。",
  gallery:
    "你慢慢看過展品，偶爾退後幾步，再換個角度。走到出口時，腦中留下的不是整面牆，而是一個原本差點略過的小細節。",
  shop: "你逛過幾排衣架，留意衣料、顏色與剪裁怎麼搭在一起。有些搭配很喜歡，有些還拿不定主意，先記下來也不遲。",
  business:
    "你看過商務中心的公司名錄，將想了解的聯絡窗口記好。電梯開開關關，你把資料收進包裡，留待整理清楚再決定下一步。",
  park: "你沿著河岸走了一段，挑張空椅坐下。手機收進口袋後，才發現風和腳踏車鈴聲，已經陪了自己一路。",
  cafe: "你在咖啡館找了個位置，把隨身筆記攤開。寫幾行，停一下，再看看窗外；今天沒有急著把空白全部填滿。",
  library:
    "你在書架間慢慢找資料，把想再讀的段落和書名記下。合上最後一本書時，還有一個問題沒找到答案，便替它留了一頁。",
  gym: "你照著自己的步調做了些活動，留意呼吸與動作是否舒服。結束後收好用過的器材，也留了時間慢慢伸展。",
  dance:
    "你跟著節拍練了幾段動作，卡住的地方就放慢重來。離開教室前，鞋底還忍不住在地上輕輕數拍。",
  market:
    "你在攤位間慢慢逛，看過手作小物，也聽了幾段攤主介紹。走到街尾時，仍記得其中一件作品為什麼選了那個顏色。",
  temple:
    "你在廟埕停留了一會兒，看香煙往屋簷下飄。心裡有些話還沒想好怎麼說，今天先安安靜靜地陪它們待著。",
  beach:
    "你沿著岸邊走了一段，看浪花一次次退回海裡。鞋尖沾了點沙，離開前拍了幾次，還是有一些堅持跟你回家。",
  restaurant:
    "你在餐酒館度過一段自己的時間，聽著桌間交錯的交談聲。離開前把帳單收好，將今晚印象最深的一點小事記在手機裡。",
  beauty:
    "你在沙龍翻看造型與保養資訊，留意哪些做法適合自己的日常。那些很漂亮、卻不想每天早起整理的髮型，也先誠實地劃掉。",
  clinic:
    "你在診所的公開諮詢區看了服務介紹，把想進一步詢問的問題記下。涉及自己的身體與外型，今天不必急著做決定。",
  airport:
    "你在公共航廈看著旅客來去，讀過交通指引與出發資訊。廣播念出一個又一個地名，你把手機收好，繼續走完今天的路。",
};

export function locationDayCopy(venue) {
  return (
    LOCATION_DAY_COPY[venue] ||
    "離開前，你回頭看了一眼，將今天走過的地方記在手帳裡。"
  );
}

// Old saves may contain a map tooltip as the first result note. Replace only
// exact, known copies for a validated explore action, without rewriting saves.
export function explorationResultNotes(result, action) {
  const notes = result?.notes || [];
  const id = result?.assignment?.id;
  const venue = action?.venue;
  if (
    action?.action !== "free" ||
    id !== `explore_${venue}` ||
    !Object.hasOwn(LOCATION_DAY_COPY, venue)
  )
    return notes;
  const location = MAP_LOCATIONS[venue];
  const legacy = [location?.effect, location?.note];
  if (venue === "airport") legacy.push("尚待外地發展系統開放");
  return notes.map((text) =>
    typeof text === "string" && legacy.includes(text)
      ? locationDayCopy(venue)
      : text,
  );
}
