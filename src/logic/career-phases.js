import { state } from "../core/state.js";
import { careerChapterText, doctrineScene } from "../data/career-story-content.js";
import { YEAR_CHAPTERS } from "../data/deepening-content.js";
import { enqueueVisibleEvent } from "./event-engine.js";

export const CAREER_PHASES = Object.freeze(YEAR_CHAPTERS.map((chapter) => Object.freeze({
  year: chapter.year,
  label: chapter.title,
  goal: chapter.goal,
  pressure: chapter.pressure,
  world: chapter.world,
})));

export function careerPhase() {
  return CAREER_PHASES[Math.min(4, Math.max(0, Math.floor((state.week - 1) / 52)))];
}

export function queueCareerPhaseEvent() {
  const phase = careerPhase(), startWeek = (phase.year - 1) * 52 + 1;
  state.careerPhaseHistory ??= [];
  if (state.week !== startWeek || state.careerPhaseHistory.includes(phase.year)) return null;
  state.careerPhaseHistory.push(phase.year);
  const commitmentChoices = phase.year === 2 ? [
    { id: "screen", label: "把半年留給影視表演", outcome: "你在便條上寫下「先讓角色可信」。未來半年，三星以上的音樂、主持與廣告工作先暫停；生活費還得照顧，基礎工作不受這份承諾限制。", effect: { careerCommitment: "screen", commitmentLabel: "影視表演", mood: 2 } },
    { id: "music", label: "把半年留給音樂作品", outcome: "你把想練的聲音寫在便條上。未來半年，三星以上的影視、主持與廣告工作先暫停；要把聲音練出自己的樣子，就得真的留下準備的時間。", effect: { careerCommitment: "music", commitmentLabel: "音樂作品", mood: 2 } },
    { id: "media", label: "把半年留給主持綜藝", outcome: "你圈起「把現場接住」這幾個字。未來半年，三星以上的影視、音樂與廣告工作先暫停；先聽懂別人說話，會和練習自己的表現一樣重要。", effect: { careerCommitment: "media", commitmentLabel: "主持綜藝", mood: 2 } },
    { id: "commercial", label: "把半年留給商業形象", outcome: "你先整理鏡頭前的表現與形象方向。未來半年，三星以上的影視、音樂與主持工作先暫停；想讓人記住，得先弄清楚自己願意代表什麼。", effect: { careerCommitment: "commercial", commitmentLabel: "商業形象", mood: 2 } },
  ] : phase.year === 3 ? [
    {id:"compete",label:"正面爭取不可替代的位置",note:"定期累積名氣與話題度，選擇讓自己的表現接受公開比較。",outcome:"你在徵選筆記上留下自己的目標，不再假裝只想來見見世面。野心讓人注意，也讓每次結果更難藏起來；你決定先承認自己想贏。",effect:{doctrineKey:"year3",doctrineValue:"compete",doctrineLabel:"正面競爭",fame:10,rep:"話題度",value:8}},
    {id:"alliance",label:"建立不靠互踩的合作聯盟",note:"定期累積可信度；這項方針本身不會直接增加人物好感。",outcome:"你把合作原則寫成三句話：消息先確認、功勞說清楚、做不到及早講。這些事不會立刻換成一次錄取，但會慢慢決定別人敢不敢信你。",effect:{doctrineKey:"year3",doctrineValue:"alliance",doctrineLabel:"合作聯盟",rep:"可信度",value:10}},
    {id:"niche",label:"退出熱門賽道，建立自己的領域",note:"定期累積業界評價；四星以上廣告將不再開放。",outcome:"你把四星以上大眾廣告排除在方向之外，開始替想做的題材留位置。沒有保證小眾就會成功；只是接下來，不必每一次都追同一個熱門答案。",effect:{doctrineKey:"year3",doctrineValue:"niche",doctrineLabel:"獨特定位",rep:"業界評價",value:10}},
  ] : phase.year === 4 ? [
    {id:"commerce",label:"用商業成功換取更大的決定權",note:"立即取得 100,000 元資源，往後每四週增加 12,000 元收入。",outcome:"你把這條路帶來的第一筆資源記進帳本。資源可以幫你多想一步，也容易讓每個下一步都只剩加碼；你得記得，最初究竟想換什麼。",effect:{doctrineKey:"year4",doctrineValue:"commerce",doctrineLabel:"商業換權",money:100000,rep:"商業價值",value:15}},
    {id:"autonomy",label:"拒絕綁定，保住作品與選角自主",note:"定期累積業界評價；三星以上廣告將不再開放。",outcome:"你把三星以上的品牌綁定排除在選擇之外。收入機會少了一部分，準備什麼、想做什麼卻更需要自己作答；自由並沒有附上現成劇本。",effect:{doctrineKey:"year4",doctrineValue:"autonomy",doctrineLabel:"創作自主",rep:"業界評價",value:15}},
    {id:"sustainable",label:"不再用健康與關係交換成功",note:"每週疲勞降低、健康恢復；同時最多持有兩份正式合約。",outcome:"你替正式合約設下同時兩份的上限，也把恢復身體當成固定功課。這不是保證永遠不累，只是不再把所有警訊都翻譯成「再撐一下」。",effect:{doctrineKey:"year4",doctrineValue:"sustainable",doctrineLabel:"可持續職涯",health:8,fatigue:-10}},
  ] : phase.year === 5 ? [
    {id:"masterpiece",label:"押上一年完成代表作",note:"定期累積業界評價；已有製作進行時，只能再接五星工作。",outcome:"你在最後一年的筆記上寫下「先把這份做好」。一旦已有製作，就只為五星新案保留例外；能否完成代表作，還要由接下來每一次準備回答。",effect:{doctrineKey:"year5",doctrineValue:"masterpiece",doctrineLabel:"代表作優先",rep:"業界評價",value:12}},
    {id:"people",label:"把最後一年留給一起走來的人",note:"心情提升並定期恢復；關係仍需實際互動，結局會參考這項選擇。",outcome:"你把「有空再說」從自己的理由裡劃掉。此刻身邊有誰、關係走到哪裡，都不能靠一句宣言跳過；最後一年，你想更認真地留意那些實際發生的相處。",effect:{doctrineKey:"year5",doctrineValue:"people",doctrineLabel:"重要關係優先",mood:8}},
    {id:"legacy",label:"建立能讓新人繼續走的制度",note:"可信度提升並定期累積；最終是否形成傳承結局仍取決於成果。",outcome:"你打開新的文件，把自己確定過、踩錯過、仍然不知道的事分開記下。沒有一套保證成功的方法，但至少可以少留幾個讓新人白跑一趟的空白。",effect:{doctrineKey:"year5",doctrineValue:"legacy",doctrineLabel:"產業傳承",rep:"可信度",value:15}},
    {id:"integrated",label:"讓作品、關係與制度成為同一份答案",note:"洞察、共情各 600，且至少完成 10 部作品。",special:true,requires:{hidden:{洞察:600,共情:600},completedWorksMin:10},outcome:"你把累積過的作品清單和最後一年的計畫並排。接下來的取捨，既要看成品，也要看人和工作方法；這會更費心，但你已經有足夠經驗，願意試著一起承擔。",effects:[{doctrineKey:"year5",doctrineValue:"integrated",doctrineLabel:"完整人生",rep:"可信度",value:10},{mood:6,rep:"業界評價",value:8}]},
  ] : null;
  const event = {
    id: `career-phase-${phase.year}`,
    kind: "年度章節",
    priority: 96,
    maxDelayWeeks: 3,
    title: `第 ${phase.year} 年・${phase.label}`,
    text: careerChapterText(phase, state),
    choices: commitmentChoices || [
      { id: "protect", label: "先寫下今年最想守住的事", outcome: "你寫下「答應的事要完成，累的時候要承認」。卡片上的星星被杯子遮住一半，願望卻沒有因此變小；明年再翻這頁，就知道自己守住了多少。", effect: { mood: 4, rep: "可信度", value: 2 } },
      { id: "reach", label: "先寫下今年最想拿到的東西", outcome: "你寫下「把準備帶到一次真正的機會面前」。想被看見很坦白，也不能只停在想；卡片旁多了一張要做的事，字比夢想小，卻更接近明天。", effect: { rep: "話題度", value: 2, fame: 1 } },
    ],
  };
  enqueueVisibleEvent(event, "年度章節");
  return event.id;
}

export function applyCareerDoctrineTick(){
 state.doctrineTickWeeks??={};
 if(state.doctrineTickWeeks[state.week])return false;
 state.doctrineTickWeeks[state.week]=true;
 for(const week of Object.keys(state.doctrineTickWeeks))if(Number(week)<state.week-20)delete state.doctrineTickWeeks[week];
 const d=state.careerDoctrine||{};
 if(d.year3?.id==="compete"&&state.week%4===0){state.fame+=3;state.rep.話題度=Math.min(1000,(state.rep.話題度||0)+2)}
 if(d.year3?.id==="alliance"&&state.week%4===0){state.rep.可信度=Math.min(1000,(state.rep.可信度||0)+2)}
 if(d.year3?.id==="niche"&&state.week%6===0){state.rep.業界評價=Math.min(1000,(state.rep.業界評價||0)+3)}
 if(d.year4?.id==="commerce"&&state.week%4===0)state.money+=12000;
 if(d.year4?.id==="autonomy"&&state.week%4===0)state.rep.業界評價=Math.min(1000,(state.rep.業界評價||0)+3);
 if(d.year4?.id==="sustainable"){state.fatigue=Math.max(0,state.fatigue-2);state.health=Math.min(100,state.health+1)}
 if(d.year5?.id==="masterpiece"&&state.week%4===0)state.rep.業界評價=Math.min(1000,(state.rep.業界評價||0)+4);
 if(d.year5?.id==="people"&&state.week%4===0)state.mood=Math.min(100,state.mood+2);
 if(d.year5?.id==="legacy"&&state.week%4===0)state.rep.可信度=Math.min(1000,(state.rep.可信度||0)+4);
 if(d.year5?.id==="integrated"&&state.week%4===0){state.rep.可信度=Math.min(1000,(state.rep.可信度||0)+2);state.rep.業界評價=Math.min(1000,(state.rep.業界評價||0)+2);state.mood=Math.min(100,state.mood+1)}
 if(state.week%17===0){const current=d.year5||d.year4||d.year3;if(current&&!state.doctrineEventHistory?.some(x=>x.week===state.week)){state.doctrineEventHistory??=[];state.doctrineEventHistory.push({week:state.week,id:current.id,label:current.label});const echo=doctrineScene(state,current);enqueueVisibleEvent({id:`doctrine-${current.id}-${state.week}`,kind:"方針回響",priority:72,title:echo?.title||`回看「${current.label}」`,text:echo?.text||`你重新翻開選擇「${current.label}」時留下的紀錄。接下來要做的事，還需要一次次把這個方向說清楚。`,choices:[{id:"accept",label:"承認這就是我的取捨",outcome:echo?.accept||"你把原則留著，也把需要承擔的代價一起記下。",effect:{mood:3,rep:"可信度",value:3}},{id:"reframe",label:"重新說明這條路的邊界",outcome:echo?.reframe||"方針沒有撤回，你重新整理它適用的範圍與原因。",effect:{mood:2,rep:"業界評價",value:2}}]},"方針回響")}}
 return true;
}
