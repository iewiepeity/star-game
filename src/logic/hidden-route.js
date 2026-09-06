import { state } from "../core/state.js";
import { enqueueVisibleEvent } from "./event-engine.js";

const trust = () => state.relationships.silver_pc?.trust || 0;
const known = () => state.knownPeople.includes("silver_pc");
const scene = (id, trustMin, title, text, beats, choices) => Object.freeze({ id, requires: () => known() && trust() >= trustMin, title, text, beats, choices });
const npc = (relation, trustGain, affection = 0) => ({ npc: "silver_pc", relation, trust: trustGain, affection });

export const HIDDEN_ROUTE_CHAPTERS = Object.freeze([
  {
    id: "encounter", requires: () => !known() && state.week >= 9 && state.familiarNpcs.length >= 3,
    title: "錯過散場人潮之後",
    text: "電影院開始播散場廣播，你剛往出口走，一本分鏡冊從前排滑到腳邊。伸手去撿時，銀灰長髮的女子也蹲了下來，指尖在碰到你以前停住。她看著你，像差點叫出一個名字，最後只說：『謝謝。這本很會挑地方跳樓。』",
    beats: [
      { label: "散場廣播", text: "影廳逐排亮燈。她接回本子，一張畫著空座位的紙卻落在你鞋尖；圖裡那個背影，讓你產生一種說不上來的眼熟。" },
      { label: "沒有來源的熟悉", text: "『我好像在夢裡看過這裡。』她說完便皺起眉，像嫌這句話聽起來太老套。『不是搭話模板。我平常有更正常的開場。』" },
      { label: "重新自我介紹", text: "她把名片翻到正面。沈霧棠，動態影像設計師。『先從可以確認的部分開始吧。這是我的名字。』她沒有替那份熟悉指定任何關係。" },
    ],
    choices: [
      { id: "stay", label: "留下來，先交換名字", outcome: "你們站到不擋住出口的地方交換聯絡方式。霧棠把你的名字認真存好，沒有加上『命中注定』之類的備註；倒是在自己的名片上補了『本子會亂跑』。", effect: npc(4, 4, 1) },
      { id: "leave", label: "收下名片，今天先告別", outcome: "你收好名片，保留這次相遇，也保留一點距離。霧棠沒有追問：『之後有適合的影像工作，再請你看看。』出口的燈亮著，誰也不必因為一個巧合立刻留下。", effect: npc(2, 2) },
    ],
  },
  scene("echo", 8, "兩份一模一樣的分鏡",
    "剪輯室裡，霧棠帶來兩頁分鏡。一頁是她的舊稿，另一頁是她依你描述畫出的夢中片段；出口、座位和一隻伸到一半的手，位置近乎相同。只有最後一格不同：你的版本門開著，她的版本卻沒有畫出口。",
    [
      { label: "舊稿", text: "舊紙上沒有可靠日期，也沒有能核對的製作紀錄。『熟悉不是證據。』她在頁角寫下這句話，字比人物名字還大。" },
      { label: "重疊", text: "你問那隻手在等誰。她搖頭，指尖卻停在紙邊很久。『我不知道。所以不想先把答案塞進你手裡。』" },
      { label: "現在", text: "她拿出一張新紙，把今天桌上的兩個杯子畫進第一格。其中一個杯耳畫反了，你指出來，她難得笑出聲：『很好，至少這段記憶有人能糾正我。』" },
    ],
    [
      { id: "compare", label: "把相同和矛盾的地方都記下來", outcome: "你們把相同的細節圈起來，也保留兩種出口。需要查的問題多了，能確定的答案仍然很少；霧棠卻把第二支筆留在桌上，第一次預設下次還會有人一起看。", effect: npc(5, 7, 2) },
      { id: "present", label: "先把今天的兩個杯子畫完", outcome: "你替畫反的杯耳補上一筆，兩人都笑了。舊稿仍有未解的地方，但今天的畫可以確認：你們確實坐在這裡，而且沒有誰替另一個人決定留下多久。", effect: npc(6, 5, 3) },
    ]),
  scene("fracture", 18, "記憶第一次互相背叛",
    "你夢見一場雨，醒來後把片段傳給霧棠：玻璃門、散場的人，以及一個差點追出去的背影。她回傳的畫卻是另一側。你以為門外的人被錯過，她卻記得有人明明說好會等，最後沒有出現。兩份敘述都像真的，卻沒有一份能驗證。",
    [
      { label: "夢境證詞", text: "你們把能記得的畫面分開寫。獎牌、舞臺和服裝只是夢中的道具，不能當成這一輪曾拿過的成績；連雨從哪一側打來，兩人都記得不同。" },
      { label: "無法驗證", text: "霧棠忽然把筆蓋扣上。『我剛才有一瞬間，很想問你為什麼不回來。』她停了一下。『但今天的你，沒有答應過那件事。』" },
      { label: "第一條界線", text: "她把紙翻面，露出今天畫的兩個杯子。『我可以因為夢難過，但不能要你替一段查不到的事道歉。你願意陪我把這兩件事分開嗎？』" },
    ],
    [
      { id: "believe", label: "聽她的難過，先不替夢判真假", outcome: "你們停下調查，把沒說完的感受說完。疑問沒有少，爭論卻終於不再要求誰認領一個陌生版本的錯。她握著自己的杯子，靠近了一點。", effect: npc(5, 8, 3) },
      { id: "verify", label: "繼續比對，也保留彼此停下的權利", outcome: "你們訂下新的比對方法：不知道就寫不知道，難受時可以先停。線索保留得更完整，談話卻沒有因此變輕鬆；霧棠仍願意把手邊的紙推到你面前。", effect: npc(3, 6, 1) },
    ]),
  scene("festival", 28, "一部只拍不存在人生的短片",
    "霧棠接到影展開幕影像的製作邀請，想用兩種互相矛盾的分鏡，拍一部關於『人在不確定時如何選擇』的短片。她把合作範圍寫得很清楚：入鏡，或留在監看螢幕後一起整理畫面。你的名氣不是這份邀請的條件。",
    [
      { label: "測試鏡頭", text: "動態捕捉棚裡只有定位點。她示範那隻伸到一半的手，停在空中，沒有抓住任何人。『這裡不要演成知道結局。我們真的不知道。』" },
      { label: "導演與合作者", text: "她講工作時乾淨俐落，轉頭問你要不要休息卻慢了半拍。『我剛才是不是太像在下命令？』鏡頭外的她，還在學怎麼把在意說得不像工作指示。" },
      { label: "片名空白", text: "你們替工作檔案取名《第九秒以後》。九秒以前保留兩個版本；九秒以後，人物只能依現在看見的事情做決定。" },
    ],
    [
      { id: "perform", label: "親自入鏡，演出那個沒有答案的停頓", outcome: "你把不確定留在動作裡，沒有替人物補上漂亮的理解。霧棠看回放時久久沒說話，最後先問你是否願意保留這個版本；被她看見的同時，你也保有說不的權利。", effect: npc(6, 7, 4) },
      { id: "observe", label: "留在監看端，陪她核對每個剪接點", outcome: "你沒有出現在鏡頭裡，卻陪她找到了兩種分鏡能接在一起的位置。片中的身影不會替你們定義關係；片尾的共同工作紀錄，足夠證明今天確實一起做過什麼。", effect: npc(4, 8, 2) },
    ]),
  scene("archive", 38, "被刪除的結局檔案",
    "整理交付素材時，霧棠發現一段未列在清單裡的九秒影像。片中的人影獨自站在空座位間，聲音說：『這次不要等我。』那個背影與你相似，檔案標記卻無法證實來源。它像極了你們先前的夢，也可能只是另一段被錯放的素材。",
    [
      { label: "九秒", text: "時間標記讓你想到上一段人生結束的時候，但標記本身不足以證明什麼。你們沒有把它列進正式短片，也沒有把片中的話當成誰欠誰的承諾。" },
      { label: "刪除鍵", text: "霧棠確認要處理的是這段來源不明的副本，不是已授權的工作原始檔。她平常最討厭隨便刪檔，這一次卻把決定攤在你面前。" },
      { label: "真正害怕的事", text: "『我不是怕忘記。』她說。『我是怕我們為了證明它是真的，把現在也過成一份要修正的檔案。』游標停在兩個選項之間。" },
    ],
    [
      { id: "delete", label: "刪掉這份未知副本，接受可能不會知道", outcome: "你們刪去手上的九秒副本，不宣稱遠處是否還有同樣的檔案。這條線索不能再從這裡重播，疑問也不會自動消失；你們接受少一個答案，保住繼續往前的空間。", effect: npc(6, 9, 4) },
      { id: "seal", label: "離線封存，暫時停止追查", outcome: "你們把副本與正式素材分開封存，記清楚來源仍未知。將來重啟調查的可能留下了，也留下必須一起同意才能再打開的約定；保存不是相信，更不是照著片中那句話過日子。", effect: npc(4, 8, 2) },
    ]),
  scene("consent", 48, "熟悉不能代替同意",
    "試片後，你們留在戲院整理宣傳說明。一個很有吸引力的標題出現在稿上：『命定重逢，跨越不同人生仍認出彼此。』它比短片真正想說的事容易傳播，也讓你們的合作像已被確認的戀情。霧棠看了很久，最後把那段話圈了起來。",
    [
      { label: "熱門標題", text: "『我知道這樣比較好賣。』她說。『但片裡一直在問能不能自己選，宣傳卻先替我們選好了。』她沒有要求你為她公開任何私人感受。" },
      { label: "她的否認", text: "對外說明裡，她只確認作品與合作：『兩個版本都是敘事設定。演得默契，不代表現實中的關係可以由旁人下結論。』" },
      { label: "沒有觀眾的對話", text: "確認稿件後，她問你想一起出面說明，還是各自守住私人界線。『我希望被你理解。至於每個人都理解……我好像還沒有那麼大的心臟。』" },
    ],
    [
      { id: "stand", label: "一起說清楚作品和現實的界線", outcome: "你們提供一致的作品說明，放下最容易宣傳的命定標題。公開把話說清楚，意味著要承受更多追問；霧棠卻不用再獨自解釋，為什麼兩人的故事還沒到外界指定的那一頁。", effects: [npc(5, 9, 4), { flag: "silver-route:consent" }] },
      { id: "private", label: "只確認合作，把私人的答案留在私下", outcome: "你們沒有提供新的感情話題，也沒有用模糊暗示配合宣傳。部分猜測仍會留下，這是保留隱私必須接受的不確定；私下的對話，卻不用再替鏡頭準備好看的句子。", effects: [npc(5, 8, 5), { flag: "silver-route:private" }] },
    ]),
  scene("choice", 58, "不是命中注定的答案",
    "剪輯室裡，霧棠把沒有日期的舊分鏡放進資料盒，桌面只留下最早畫錯杯耳的那張紙。『最近夢少一點了。』她說得很輕。『我有時反而害怕：如果哪天都不記得，會不會連找你的理由也一起沒了？』",
    [
      { label: "最後一本舊分鏡", text: "你看見紙角多了一行日期，是兩人真正坐下畫杯子的那一天。她把能確認的相處和無法證實的夢分開，沒有刪掉任何人的感受。" },
      { label: "沒有命運作證", text: "『所以想問的其實很普通。』她把筆握緊又放開。『不靠夢，不靠那部片。往後，你還想繼續認識我嗎？』" },
      { label: "重新選擇", text: "她沒有伸手替你填空，也沒有預設這句話一定通往交往。你們此刻已有的生活與關係，都仍然需要被尊重。" },
    ],
    [
      { id: "again", label: "願意，再從一次普通的見面開始", outcome: "你們約定往後的接近都由當下確認，不拿夢裡的親密跳過現實。霧棠終於鬆開筆：『那下次可以不用先討論宇宙，先決定吃什麼。』她笑得很輕，卻比猜中任何線索都清楚。", effect: npc(8, 9, 8) },
      { id: "friends", label: "願意認識你，讓我們留在朋友的位置", outcome: "你把答案說明白。霧棠安靜了一會兒，再把畫杯子的紙收好。靠近的可能換了形狀，彼此的信任沒有被撤回；她接受朋友這個位置，不把它當成等你改口的候補席。", effect: npc(5, 8, 1) },
      { id: "rewrite", label: "把兩個版本都保留，一起寫第三個版本", note: "第三周目或洞察 620", special: true, requires: (state.runCount || 1) >= 3 ? { runMin: 3 } : { hidden: { 洞察: 620 } }, outcome: "你們把矛盾寫進下一份創作提案，不替任何版本宣判正確。霧棠在第三頁先畫今天的桌子：合作可以繼續，關係也可以繼續了解，但它們都不能冒充對方已經給出的承諾。", effects: [npc(8, 10, 7), { flag: "silver-route:third-draft" }] },
    ]),
  scene("finale", 68, "散場不再是唯一出口",
    "《第九秒以後》的放映結束，觀眾沿著走道離開。散場廣播和初遇那晚一樣，霧棠卻沒有急著確認你站在哪裡。她把分鏡本拿穩，側身讓過收拾座位的工作人員，再轉向你。",
    [
      { label: "首映謝幕", text: "片尾放的是你們確認過的版本；那些未知的九秒素材沒有被剪進去。觀眾可以對作品有不同答案，不需要知道你們為什麼曾那麼在意一扇門。" },
      { label: "再次散場", text: "霧棠指了指自己抱好的本子：『今天它不會再跳下去了。』說完，她像覺得這句有點笨，先笑了。熟悉終於可以來自一起經歷的小事。" },
      { label: "下一幕", text: "『你接下來想去哪裡？』她問。這次沒有分鏡先畫好你該站的位置，也沒有廣播替你們決定該一起走還是道別。" },
    ],
    [
      { id: "together", label: "一起去吃散場後的宵夜", outcome: "你們並肩走出影廳，先在門口研究哪家店還開著。這次同行只代表現在都願意，不自動改寫關係，也不借用任何上一段人生的承諾。霧棠把本子收進包裡；今晚可以先不用畫下來。", effects: [npc(8, 10, 8), { flag: "silver-route:present" }] },
      { id: "farewell", label: "在門口好好道別，保留今天的相遇", outcome: "你們把再見說完整，各自走向今晚的生活。這次道別沒有被寫成錯過，也沒有替現有關係另下結論；有些相處之所以珍貴，正是因為留下或離開，都能被對方認真聽見。", effects: [npc(5, 9, 0), { flag: "silver-route:farewell" }] },
    ]),
]);

const CHOICE_ECHOES = Object.freeze({
  echo: { stay: "初遇那晚，你選擇留下交換名字。霧棠這次先確認你有空，才把兩份分鏡攤開。", leave: "初遇那晚，你收下名片便告別。這次是她先寄來正式的合作說明，你們才約好一起看稿；距離沒有因為眼熟就被跳過。" },
  fracture: { compare: "上次你們選擇比對記憶，圈出的矛盾現在有了更多細節，也更難忽略。", present: "上次你們先畫了今天的杯子，沒有急著查夢。新的片段仍找上門來，但你們已經有一張能確認日期的畫，提醒彼此此刻在哪裡。" },
  festival: { believe: "上次你們先把感受說完。這次霧棠把『允許暫停』寫進合作筆記，不要求任何人為了畫面好看重演難受。", verify: "上次你們決定繼續比對。這次短片保留兩種矛盾版本，不把查不到答案包裝成已經知道真相。" },
  archive: { perform: "你曾親自入鏡，知道一個動作可以被不同角度剪成完全相反的意思。這讓眼前的未知片段，更不適合直接當成證詞。", observe: "你留在監看端一起確認過剪接點，知道正式素材清單裡沒有這段。它從哪裡來，仍需要和看起來像誰分開處理。" },
  consent: { delete: "你們刪去了手上的未知副本，已經不能回頭拿它當宣傳佐證。少一條可查的線索，也讓『命定』兩個字顯得更不負責任。", seal: "未知副本仍離線封存，沒有再重播。你們同意過，那是待確認的素材，不是能拿來替真實關係背書的證據。" },
  choice: { stand: "你們上次共同出面說明作品，接受了公開澄清後仍會有追問的代價。現在，這段話不需要任何觀眾作證。", private: "你們上次選擇只確認合作，留下未被平息的猜測。現在門關上了，霧棠終於不用先想哪一句比較不會被剪成標題。" },
  finale: { again: "上次你們同意從普通的見面繼續了解彼此。今晚不需要證明有多命定，只需要確認接下來是否都還有空。", friends: "上次你明確選擇朋友的位置，霧棠也認真接受了。今晚的默契沒有偷偷把那個答案改掉，同行與道別都可以只是朋友之間的選擇。", rewrite: "第三個版本還在提案裡，這次放映沒有假裝它已經拍完。你們保留了繼續創作的可能，也保留在下一步到來時重新確認的權利。" },
});

function chapterPresentation(chapter) {
  const index = HIDDEN_ROUTE_CHAPTERS.indexOf(chapter);
  const previous = HIDDEN_ROUTE_CHAPTERS[index - 1];
  const record = previous && [...(state.eventHistory || [])].reverse().find(item => item.id === `silver-route-${previous.id}`);
  const echo = record && CHOICE_ECHOES[chapter.id]?.[record.choice];
  return { title: chapter.title, text: [echo, chapter.text].filter(Boolean).join("\n\n"), beats: chapter.beats };
}

export function queueHiddenRoute() {
  if ((state.runCount || 1) < 2) return null;
  state.hiddenRouteHistory ??= [];
  const chapter = HIDDEN_ROUTE_CHAPTERS.find(item => !state.hiddenRouteHistory.includes(item.id) && item.requires());
  if (!chapter) return null;
  const choices = chapter.choices?.map(choice => choice.id === "rewrite" && (state.runCount || 1) >= 3 ? { ...choice, requires: {} } : choice);
  const { requires: _requires, ...content } = chapter;
  const payload = { ...content, ...chapterPresentation(chapter), requires: { runMin: 2 }, npcId: "silver_pc", choices, id: `silver-route-${chapter.id}`, kind: "人物事件", persistent: true, priority: 110 };
  enqueueVisibleEvent(payload, "多周目人物主線");
  state.hiddenRouteHistory.push(chapter.id);
  return payload.id;
}

export function hiddenRoutePresentation(event) {
  if (!event) return event;
  const chapter = HIDDEN_ROUTE_CHAPTERS.find(c => `silver-route-${c.id}` === event.id);
  if (!chapter) return event;
  return { ...event, npcId: "silver_pc", ...chapterPresentation(chapter), choices: event.choices?.map(choice => {
    const copy = chapter.choices.find(c => c.id === choice.id);
    return copy ? { ...choice, label: copy.label, outcome: copy.outcome } : choice;
  }) };
}
