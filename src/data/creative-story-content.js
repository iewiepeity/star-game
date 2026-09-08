// Direction-specific craft scenes. Release copy is selected from actual results,
// so a modest release never borrows the language of a hit.
import { CREATIVE_PHASE_VARIANTS } from "./creative-phase-variants.js";
const route = (development, production, release, strength, risk) => ({
  development: development[0], production: production[0], release: release[1],
  developmentBeats: development, productionBeats: production, releaseBeats: release,
  strength, risk,
});
export const CREATIVE_DIRECTION_STORIES = {
  song: {
    heart: route([
      "你把一行漂亮卻不像自己會說的詞劃掉。紙上剩下半句大白話，反而讓旋律停住了。先留著，今晚不用替它找押韻。",
      "試唱到第二段，你發現主歌還在難過，副歌卻已經原諒了所有人。你拆開兩段之間的空白，替情緒補上一個轉彎。",
      "你用手機重錄一次，不修音，也不加殘響。某句唱得太滿，像替聽眾宣布感想；你把它收回來，留一點沒說出口的地方。",
      "歌詞終於從頭唱得通。你把第一版留在資料夾裡：那些被刪掉的形容詞，原來也是找到這句話的路。",
    ], [
      "製作先從乾淨的人聲與簡單伴奏開始。你在吸氣處做記號，避免樂器把那句猶豫蓋過去。",
      "反覆比較之後，最整齊的一軌未必最合適。你依歌曲需要挑選停頓，沒有把所有顫抖都當瑕疵修掉。",
      "耳機、喇叭、低音量各聽一次。最後一句終於能在伴奏退開時站住，你才按下輸出。",
    ], [
      "作品已經上線，回應還很稀疏。你重聽到幾個說得太急的地方，在下一份歌詞旁做了記號。這首先完整留在這裡。",
      "有人摘下一句歌詞，沒有標註唱功，只說它像某個下班的晚上。你讀了兩遍，才關掉通知。",
      "分享裡開始出現聽眾自己的故事。你寫歌時留白的地方，被不同的人放進了不同生活。",
    ], "細節鮮明的歌詞與情緒", "不靠強烈節奏吸引第一耳，需要讓人願意聽完"),
    stage: route([
      "你先哼出最容易跟唱的幾個音，再用腳打拍子。副歌很好記，但不能只剩副歌；今天先替它找一個值得等待的入口。",
      "你對著空椅子試一次開場。三次倒數後才發現，原本設計的呼吸點正好撞上最需要力氣的拍點。",
      "間奏長度被你剪了又貼。要讓觀眾想拍手，也得替演出的人留半口氣，舞台可沒有復原鍵。",
      "整首走完，最後一個重拍終於和收尾對齊。你在草稿旁寫下現場版備案，免得音樂一停，只剩人還在衝。",
    ], [
      "你先比對節拍與主旋律，把想塞進去的每一種聲音排隊。第一位可以大聲，其他人先不要一起搶麥。",
      "副歌堆疊後很有氣勢，主聲卻被吞掉。你把幾軌伴奏退後，讓爆發有一個真正能被聽見的中心。",
      "完整播放與短版各測一次。短版保留鉤子，完整版交代鋪陳，最後再確認開頭不會把耳朵嚇醒。",
    ], [
      "公開後的反應還沒追上你對副歌的期待。你注意到轉進副歌前掉了節奏，把問題留給下一次編排。",
      "有人跟著重拍點頭，也有人只記得那一句副歌。你開始知道，舞台上以為的小設計，傳出去會變成什麼。",
      "副歌片段被反覆分享，留言開始問完整版本在哪裡。那段你捨不得刪的鋪陳，終於有機會被聽完。",
    ], "鮮明節拍與表演記憶點", "編排太滿時容易掩蓋聲音，也更考驗體力"),
    experimental: route([
      "你把一段環境聲拖進時間軸。它不整齊，也不討喜，但有個節奏讓你想再聽一次。先從這裡試。",
      "聲音越疊越怪，你暫停新增素材，只聽兩個段落怎麼接。實驗可以讓人意外，不能每一步都靠意外遮住接縫。",
      "你替最陌生的一段留下一條容易辨認的旋律。像在陌生街區亮一盞燈，聽的人可以走遠，也找得到回來的路。",
      "你分別存下大膽版與克制版。比完後留住的是能支撐整首的聲音，不是檔名裡寫著『最狂』的那份。",
    ], [
      "幾種聲響單聽都好，放在一起卻擠成一團。你先整理頻段，再決定哪個奇怪聲音值得站到前面。",
      "你比較耳機裡的細節與喇叭裡的輪廓。不能只在自己最熟悉的設備上，才聽得出作品的意思。",
      "最後檢查段落的落點。你留下不尋常的轉折，也替結尾留下一個能確定作品已說完的呼吸。",
    ], [
      "第一批回應不多，有人停在最陌生的段落。你記下聽感上的阻礙，沒有急著把冷清解釋成大家不懂。",
      "有人問起某個聲音怎麼做，也有人坦白聽不習慣。不同反應幫你辨認，這次實驗究竟把哪道門打開了。",
      "討論開始細到音色與結構。你原本只敢在草稿裡試的聲音，現在被別人認真聽見，也認真挑戰。",
    ], "特殊聲響與清楚的個人辨識度", "陌生感需要鋪陳，不能預設觀眾一定接受"),
  },
  script: {
    character: route([
      "你先寫角色今天想得到什麼，再寫他為什麼不肯直說。背景欄還空著，兩個人的第一場對話卻有了阻力。",
      "一個轉折推得很順，角色卻像突然換了腦袋。你退回前一場，補上會讓他做出這個選擇的線索。",
      "你把解釋心情的長台詞讀出聲，讀到一半自己先沒氣。刪去幾句後，留下一個動作，意思反而更清楚。",
      "從結尾往前核對，每個後果都得找得到起點。有一段很喜歡的戲沒有改變任何人，你另外存檔，把位置留給真正需要的那場。",
    ], [
      "製作先拆開場次與人物目標。你確認每場戲的關係位置，避免先拍結局時，人物還帶著初見的距離。",
      "你比對試讀與現有素材。有些內心話寫在紙上很好看，換成畫面卻需要一個能被觀眾捕捉的動作。",
      "最後串接時，你追著人物的選擇看一遍。該心軟的地方不能只剩剪接技巧，該付代價的地方也不能突然省略。",
    ], [
      "作品推出後，有些動機仍沒被清楚傳達。你把觀眾容易疑惑的場次圈起來，這次完成的經驗成了下次改稿的坐標。",
      "回應開始討論角色為什麼那樣選。有人認同，有人生氣，至少那個抉擇已經離開紙面，成了值得爭論的事。",
      "不同觀眾替同一個角色辯護，還翻回前段找線索。你很久以前埋的小動作，這次真的有人記得。",
    ], "人物動機與前後選擇的連續性", "鋪陳必須讓人感到關係正在變化"),
    commercial: route([
      "你在企劃第一頁寫下故事的承諾：觀眾為什麼要打開，又想等到哪一刻。這句話先寫給自己看，不拿宣傳標語代替答案。",
      "你把轉折依順序攤開，發現兩場高潮在搶同一件事。你留住更有代價的那一場，替前段騰出喘息。",
      "伏筆藏得太深，翻盤就像臨時發明；露得太早，又只剩等答案。你調整線索出現的位置，重新從第一場讀起。",
      "最後確認觀眾被邀請期待的事有沒有兌現。你保留一個意外，也補齊它發生前應該看得見的理由。",
    ], [
      "你按製作條件整理場景。同樣一個轉折，換個可拍的做法，比在分鏡上把預算畫到消失更有用。",
      "節奏測試裡，中段比想像中長。你把重複交代的資訊收掉，沒有直接把人物的反應一起刪掉。",
      "宣傳片段與正片並排檢查。最刺激的鏡頭能吸引注意，但不能先把正片唯一的答案送出去。",
    ], [
      "作品已公開，熱度仍有限。你重看承諾與成品之間的落差，把沒兌現的節奏記下，而不是只換一張更吵的海報。",
      "第一批觀眾跟上了故事，最常被提到的是中段的轉折。你也看見有人嫌後面太急，下一次得替收束多留一點位置。",
      "作品引來的討論不只停在開場，連結尾都有人回頭拆。你原先畫在紙上的節奏表，終於變成觀眾真的走過的旅程。",
    ], "清楚類型與完整的情節回報", "追求刺激時容易壓縮人物與收束"),
    arthouse: route([
      "你先留下一個反覆回來的畫面，再問自己為什麼放不下它。沒有急著替畫面配旁白，今天先讓它保持安靜。",
      "意象之間開始有了關係。你試著拿掉解說，看看剩下的動作和聲音，能不能讓情緒往前走。",
      "一場戲留白太多，連你都分不清是含蓄還是沒想完。你補進一個具體的選擇，讓安靜也有重量。",
      "最後一場不回答所有問題，但要接得住第一個畫面。你把兩頁並在一起，等那條暗線真正連上。",
    ], [
      "你先整理能實現的影像語言。長鏡頭不是把攝影機一直開著，演出、光線與等待都得有理由。",
      "你試著用現有畫面重新組合節奏。有一段很美卻把情緒帶偏，刪掉時有點心疼，整體卻終於往同一個方向走。",
      "最後不看筆記，完整讀過或看過一次。你確認作品留下的是問題，而不是只有作者才找得到的說明書。",
    ], [
      "作品公開後，回應慢而零散。你把已完成的版本收好，也記下幾個太依賴自己解說的段落。下一次要讓畫面多承擔一點。",
      "有人提到一個你以為不會被注意的畫面。那不是標準解答，卻讓你知道這份留白確實容得下另一個人。",
      "評論開始沿著畫面與聲音討論作品。你沒有替每一種解讀蓋章，能被認真觀看本身已經讓那些等待有了去處。",
    ], "影像語言與持續回味的空間", "留白必須有內在關係，發行反應也可能較慢"),
  },
  show: {
    warm: route([
      "你把訪綱上最容易催淚的問題先放到最後，改寫一個來賓願意開口的小入口。節目可以感人，來賓不必負責交出眼淚。",
      "你設計了一個不用揭露私事也能參加的單元。連不想多說的人，都得有可以舒服待著的位置。",
      "試念流程時，你發現每段都在說『好溫暖』，卻沒有真的發生什麼。你補進一項能一起完成的小事，讓關係從行動裡長出來。",
      "你替訪綱標上可跳過的題目，再寫一個不依賴感人結論的收尾。陪伴不是把每一集都收成同一種心情。",
    ], [
      "製作先核對流程與退出方式。你把開場語氣放輕，讓參與者知道，今天不是答得夠感人才算完成工作。",
      "你從試錄或素材中找自然的互動。有人遞水、有人接住一句玩笑，這些比預先寫好的感動更難補拍。",
      "成品檢查時，你把斷章取義的接句拆開。節奏少了一點刺激，說話的人卻還是他原來的意思。",
    ], [
      "首波反應不多，幾段等待也顯得太長。你把需要縮短的地方記好，沒有把安靜一律當成溫暖。",
      "有人說適合配晚餐看完。這不是很響亮的稱讚，卻讓你想起最初想做的，是哪一種有人在場的晚上。",
      "觀眾開始記得節目裡細小的互動，還會回來找完整段落。那些沒被剪成爆點的時間，也有人願意留下。",
    ], "相處的細節與觀眾陪伴感", "節奏仍需推進，真誠不能代替內容"),
    viral: route([
      "你先寫出讓人想轉傳的瞬間，再補上前後流程。十五秒可以很快，一份企劃不能只有十五秒。",
      "單元測試跑到一半，你發現最有笑點的地方也最容易讓人下不了台。你改掉勝負條件，讓好笑不必靠誰受辱。",
      "你把鏡位、提示與停止訊號寫清楚。臨場反應可以自由，出事後要由誰叫停，不能留到現場猜拳。",
      "你把亮點連起來看，補上兩段之間的轉場。節目終於不只是幾張很熱鬧、卻不知道怎麼翻頁的梗圖。",
    ], [
      "你先走一次單元流程，把口頭說『應該沒問題』的地方逐項實測。最好笑的事故，是不需要真的發生的那種。",
      "效果與節奏開始成形，你檢查笑點前後的語境。短片可以精簡，不能把別人的反應剪成另一件事。",
      "正式版與短片版本分別確認，標題也重新讀一次。要讓人點進來，還得讓人看完後不覺得受騙。",
    ], [
      "公開後，話題沒有如預期擴散，幾個效果還顯得用力。你把現場節奏的問題留下，沒有再靠更聳動的字眼補救。",
      "短片帶來了新觀眾，也帶來各種不同解讀。你看完完整內容的反應，才決定哪些笑點值得再做。",
      "片段被分享後，有人回頭找完整版。你終於看見，讓人笑一下和讓人願意看下一段，可以在同一份節目裡發生。",
    ], "清楚單元與可分享的笑點", "剪輯語境與現場安全會一起影響口碑"),
    observational: route([
      "你先決定觀察什麼，再把預寫的結論刪掉。鏡頭得有方向，參與的人卻不必照著你的心得活一次。",
      "你替每個單元設定可以等待的時間。要給反應長出來，也要知道什麼時候已經沒有新事情發生。",
      "你比對不同視角的素材設計。只拍說話的人會漏掉誰正在聽，也可能把一次誤會寫成定論。",
      "企劃最後補上時間與語境標記。你希望觀眾能看見變化，不能靠把不同天拼在一起，製造並不存在的因果。",
    ], [
      "製作先核對素材時間和人物位置。每個反應都要找得到它真正回應的事，不能只因為表情漂亮就搬家。",
      "你把重複素材拿開，留下會改變觀眾理解的一刻。安靜不一定無聊，重複同一個意思才是。",
      "最後回看整條時間線。你保留人物修正自己的過程，沒有把第一個失誤直接剪成他永久的樣子。",
    ], [
      "作品推出後，觀眾還不容易抓到重點。你重新看一次資訊順序，記下哪些地方該多給線索，哪些地方只是等得太久。",
      "有人重看一段互動，發現第一次沒注意到的反應。這種慢半拍的理解，正是你希望節目留下的東西。",
      "討論開始比較人物前後的變化，而不是只替一張截圖下判斷。你在時間線上保住的過程，這次被人完整看見了。",
    ], "人物觀察與前後變化", "素材篩選要清楚，不能把缺乏節奏當自然"),
  },
};

function phaseSlot(project, phase) {
  if (phase === "development") {
    return Math.min(3, Math.max(0, Math.ceil((project.progress || 0) / 25) - 1));
  }
  if (phase === "production") {
    return project.productionProgress >= 100 || project.status === "ready_release" ? 2 : Math.min(1, Math.max(0, (project.productionSessions || 1) - 1));
  }
  if (phase === "release") return (project.marketScore || 0) >= 82 ? 2 : (project.marketScore || 0) >= 55 ? 1 : 0;
  return null;
}

// A story key identifies an actual craft step, not just its broad text pool.
// Saving the key with history keeps repeated renders stable after recording it.
export function creativePhaseKey(project, phase) {
  const step = phase === "development" ? project.progress || 0
    : phase === "production" ? `${project.productionSessions || 0}:${project.productionProgress || 0}:${phaseSlot(project, phase)}`
    : project.marketScore || 0;
  return `${project.type}:${project.direction}:${phase}:${project.storyStep || 0}:${step}`;
}

function projectVariantOffset(project, count) {
  // Real project IDs end in their creation ordinal. Consecutive works therefore
  // start on different authored variants even when their timestamps differ.
  const ordinal = /^CP-\d+-(\d+)$/.exec(project.id || "");
  if (ordinal) return Number(ordinal[1]) % count;
  let hash = 0;
  for (const char of String(project.id || project.title || "")) hash = (Math.imul(hash, 31) + char.codePointAt(0)) >>> 0;
  return hash % count;
}

export function creativePhaseCopy(project, phase) {
  const entry = CREATIVE_DIRECTION_STORIES[project?.type]?.[project?.direction];
  if (!entry) return "你重新核對草稿與目前的製作安排，先完成眼前能確認的一步。";
  const slot = phaseSlot(project, phase);
  if (slot === null) return entry[phase] || entry.development;
  const extra = CREATIVE_PHASE_VARIANTS[project.type]?.[project.direction]?.[phase]?.[slot];
  const pool = [entry[`${phase}Beats`][slot], extra].filter(Boolean);
  const history = Array.isArray(project.storyHistory) ? project.storyHistory : [];
  const key = creativePhaseKey(project, phase);
  const recorded = history.findLast(scene => scene?.phase === phase && scene.storyKey === key && pool.includes(scene.text));
  if (recorded) return recorded.text;

  // Older saves have no storyKey. Text matching still recognizes the original
  // scene and offers its unseen sibling on the next step in this same slot.
  const seen = history.filter(scene => scene?.phase === phase && pool.includes(scene.text));
  const offset = projectVariantOffset(project, pool.length);
  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(offset + i) % pool.length];
    if (!seen.some(scene => scene.text === candidate)) return candidate;
  }
  // Once both variants have been read, alternate rather than immediately repeat.
  return pool[(pool.indexOf(seen.at(-1).text) + 1) % pool.length];
}
