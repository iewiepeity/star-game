import { state } from "../core/state.js";
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
    { id: "screen", label: "把半年留給影視表演", outcome: "高階的其他路線暫時讓路，這次選擇會真正關上一些門。", effect: { careerCommitment: "screen", commitmentLabel: "影視表演", mood: 2 } },
    { id: "music", label: "把半年留給音樂作品", outcome: "高階的其他路線暫時讓路，這次選擇會真正關上一些門。", effect: { careerCommitment: "music", commitmentLabel: "音樂作品", mood: 2 } },
    { id: "media", label: "把半年留給主持綜藝", outcome: "高階的其他路線暫時讓路，這次選擇會真正關上一些門。", effect: { careerCommitment: "media", commitmentLabel: "主持綜藝", mood: 2 } },
    { id: "commercial", label: "把半年留給商業形象", outcome: "高階的其他路線暫時讓路，這次選擇會真正關上一些門。", effect: { careerCommitment: "commercial", commitmentLabel: "商業形象", mood: 2 } },
  ] : phase.year === 3 ? [
    {id:"compete",label:"正面爭取不可替代的位置",note:"聲勢成長更快，但競爭失利也會被放大。",outcome:"你不再迴避比較；從現在起，勝負會成為履歷的一部分。",effect:{doctrineKey:"year3",doctrineValue:"compete",doctrineLabel:"正面競爭",fame:10,rep:"話題度",value:8}},
    {id:"alliance",label:"建立不靠互踩的合作聯盟",note:"人物信任與合作機會增加，但短期聲量較慢。",outcome:"你把位置理解成一張能一起坐大的桌子，而不是只剩一張的椅子。",effect:{doctrineKey:"year3",doctrineValue:"alliance",doctrineLabel:"合作聯盟",rep:"可信度",value:10}},
    {id:"niche",label:"退出熱門賽道，建立自己的領域",note:"高熱度邀約減少，作品評價與長尾表現更穩。",outcome:"你接受不是每個人都立刻看懂，換取不必再被同一把尺評分。",effect:{doctrineKey:"year3",doctrineValue:"niche",doctrineLabel:"獨特定位",rep:"業界評價",value:10}},
  ] : phase.year === 4 ? [
    {id:"commerce",label:"用商業成功換取更大的決定權",note:"收入與品牌成長，但每季都必須維持曝光。",outcome:"你決定先拿到桌上的權力，再談想留下什麼。",effect:{doctrineKey:"year4",doctrineValue:"commerce",doctrineLabel:"商業換權",money:100000,rep:"商業價值",value:15}},
    {id:"autonomy",label:"拒絕綁定，保住作品與選角自主",note:"部分品牌路線關閉，原創品質與業界評價提升。",outcome:"你把拒絕寫進合約；門變少了，但留下的門真正能由你決定。",effect:{doctrineKey:"year4",doctrineValue:"autonomy",doctrineLabel:"創作自主",rep:"業界評價",value:15}},
    {id:"sustainable",label:"不再用健康與關係交換成功",note:"每週恢復更穩，高壓工作的聲勢收益降低。",outcome:"你第一次把休息當成職涯制度，而不是做不完事情的羞恥。",effect:{doctrineKey:"year4",doctrineValue:"sustainable",doctrineLabel:"可持續職涯",health:8,fatigue:-10}},
  ] : phase.year === 5 ? [
    {id:"masterpiece",label:"押上一年完成代表作",note:"作品品質提高，但其他工作可用時間減少。",outcome:"最後一年不再求多；你決定讓一部作品承擔這五年的答案。",effect:{doctrineKey:"year5",doctrineValue:"masterpiece",doctrineLabel:"代表作優先",rep:"業界評價",value:12}},
    {id:"people",label:"把最後一年留給一起走來的人",note:"人物事件與關係收益提高，職涯衝刺較慢。",outcome:"你拒絕把所有陪伴都寫成成功背後的註腳。",effect:{doctrineKey:"year5",doctrineValue:"people",doctrineLabel:"重要關係優先",mood:8}},
    {id:"legacy",label:"建立能讓新人繼續走的制度",note:"即時人氣較少，可信度與五年結局權重提高。",outcome:"你想留下的不只是一個名字，而是一條別人不必再獨自摸索的路。",effect:{doctrineKey:"year5",doctrineValue:"legacy",doctrineLabel:"產業傳承",rep:"可信度",value:15}},
    {id:"integrated",label:"讓作品、關係與制度成為同一份答案",note:"洞察、共情各 600，且至少完成 10 部作品。",special:true,requires:{hidden:{洞察:600,共情:600},completedWorksMin:10},outcome:"你不再把成功、陪伴與留下道路視為互相排斥的選項；最後一年改成一部由整個團隊共同完成的答案。",effects:[{doctrineKey:"year5",doctrineValue:"integrated",doctrineLabel:"完整人生",rep:"可信度",value:10},{mood:6,rep:"業界評價",value:8}]},
  ] : null;
  const event = {
    id: `career-phase-${phase.year}`,
    kind: "年度章節",
    priority: 96,
    maxDelayWeeks: 3,
    title: `第 ${phase.year} 年・${phase.label}`,
    text: `${phase.world} 今年的壓力是：${phase.pressure} 核心目標不是把所有事做完，而是「${phase.goal}」。`,
    choices: commitmentChoices || [
      { id: "protect", label: "先寫下今年最想守住的事", outcome: "這句話被留在章節首頁；之後碰到衝突時，遊戲會再把它拿回你面前。", effect: { mood: 4, rep: "可信度", value: 2 } },
      { id: "reach", label: "先寫下今年最想拿到的東西", outcome: "目標被寫得很具體。接下來的機會與代價，也會因此更容易比較。", effect: { rep: "話題度", value: 2, fame: 1 } },
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
 if(state.week%17===0){const current=d.year5||d.year4||d.year3;if(current&&!state.doctrineEventHistory?.some(x=>x.week===state.week)){state.doctrineEventHistory??=[];state.doctrineEventHistory.push({week:state.week,id:current.id,label:current.label});enqueueVisibleEvent({id:`doctrine-${current.id}-${state.week}`,kind:"方針回響",priority:72,title:`「${current.label}」帶來的門`,text:`你曾經選下「${current.label}」。這一週，它不再只是履歷上的一句話：有人因此找上門，也有人明確退開。`,choices:[{id:"accept",label:"承認這就是我的取捨",outcome:"你沒有把代價粉飾成意外；團隊也更知道該替你守住什麼。",effect:{mood:3,rep:"可信度",value:3}},{id:"reframe",label:"重新說明這條路的邊界",outcome:"方針沒有撤回，但你為它補上了不傷害身邊人的條件。",effect:{mood:2,rep:"業界評價",value:2}}]},"方針回響")}}
 return true;
}
