import { titleTag } from "../core/utils.js";
import { state } from "../core/state.js";
import { SOCIAL_POST_TEMPLATES } from "../data/social.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
export function socialDrafts() {
  const drafts = Object.fromEntries(
      Object.entries(SOCIAL_POST_TEMPLATES).map(([k, v]) => [k, { ...v }]),
    ),
    work = [...(state.completedWorks || [])].reverse()[0],
    creative = [...(state.creativeProjects || [])]
      .reverse()
      .find((p) => ["released", "sold", "production"].includes(p.status)),
    place = (state.recentLocations || [])
      .map((id) => MAP_LOCATIONS[id])
      .find(Boolean),
    manager = state.managerState;

  const variants = {
    training: [
      "今天把最卡的八拍拆開練。慢下來以後，才聽見自己一直搶拍。",
      "老師叫我先別加東西。留白比我想的還難練。",
      "錄了三次，終於有一次願意留下來。明天再聽，不急著刪。",
      "今天先記住做對的地方，不把整堂課都寫成檢討。",
      "換個練習順序，原本卡住的段落竟然鬆了一點。",
      "課後和同學對了一次，別人的節奏讓我發現自己的習慣。",
      "把難的地方圈起來了，今天只處理這一小段。",
      "以前會硬撐過去的地方，今天停下來問了老師。",
    ],
    daily: [
      "今天特地坐下來吃早餐，原來五分鐘也可以不用趕。",
      "出門沒戴耳機，聽到了平常沒注意過的聲音。",
      "整理房間翻到剛來這座城市時的清單，有幾項已經做到了。",
      "和朋友聊了一點沒有結論的小事，心情反而輕了。",
      "今天的照片沒有工作，只是一頓熱飯。",
      "留了一段不排事情的時間，剛開始居然有點不習慣。",
      "在熟悉的路口多走了一圈，發現一家小店。",
      "睡前把明天要帶的東西放好了。剩下的明天再說。",
    ],
    work: [
      "出門前把聯絡資訊再對一遍，小事做好也能讓人放心。",
      "把前一次現場的筆記翻出來，有一條這次真的用到了。",
      "今天想練習把問題問清楚，不用猜的。",
      "收到新的準備資料，先讀完，再決定怎麼呈現。",
      "行程確認好了。希望到現場時，還記得現在的期待。",
      "整理了一份更短的自我介紹，想讓對方聽見真正的重點。",
      "練習收工前確認下一步，讓事情不要停在『再聯絡』。",
      "履歷更新了一小段，這次有真實經驗可以寫進去。",
    ],
  };
  for (const [key, lines] of Object.entries(variants))
    drafts[key].text =
      lines[(state.week - 1 + (state.socialPosts?.length || 0)) % lines.length];
  if (work)
    drafts.afterwork = {
      label: "作品幕後",
      icon: "幕",
      text: `${titleTag(work.title)}完成後，我最想記住的不是結果，而是現場那次選擇：${typeof work.storyLegacy === "string" ? work.storyLegacy : work.storyLegacy?.text || "先把自己的部分做好，再確認有沒有漏掉別人的功勞"}。`,
    };
  if (creative)
    drafts.original = {
      label: "原創進度",
      icon: "創",
      text: `${titleTag(creative.title)}正在走自己的路。${creative.status === "sold" ? "這次選擇把企劃交給公司，也學會創作權是有重量的。" : creative.status === "released" ? `檔案終於從資料夾搬到公開頁面。謝謝願意花時間看完或聽完的人，也謝謝那些具體的回饋。` : "製作現場正在把紙上的想法變成真正的作品。"}`,
    };
  if (place)
    drafts.city = {
      label: "城市見聞",
      icon: "城",
      text: `翻到在${place.name}留下的筆記。${variants.daily[(state.week - 1) % variants.daily.length]}`,
    };
  if (manager?.history?.some((h) => h.title))
    drafts.team = {
      label: "團隊近況",
      icon: "團",
      text: `和團隊重新談過接下來的方向。${variants.work[(state.week - 1) % variants.work.length]}`,
    };
  return drafts;
}
