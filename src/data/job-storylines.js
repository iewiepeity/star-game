import{JOB_CATALOG}from"./jobs.js";
import{FLAGSHIP_JOB_BEATS,jobDepthTier}from"./deepening-content.js";

const CATEGORY_BEATS={
 歌曲:{arrival:"錄音室先關掉所有效果器，只留下最赤裸的聲音",friction:"製作團隊對情緒、技巧與市場方向出現不同意見",turn:"最後一次播放時，大家都在等那個只有這首作品才有的瞬間",breach:"錄音與宣傳檔期被迫拆散，原本預留的合作人員也轉往其他企劃"},
 電影:{arrival:"場記板第一次落下前，整個劇組都在確認這個角色是否真的存在",friction:"鏡頭、表演與現場調度互相拉扯，最重要的戲反而沒有重來的餘裕",turn:"殺青鏡頭結束後，角色留下的重量比掌聲更慢散去",breach:"場景與演員檔期無法重新拼回原樣，製作方必須臨時調整拍攝版本"},
 電視劇:{arrival:"密集拍攝從第一頁通告單開始，角色的生活要在有限時間裡長出來",friction:"臨時改頁與跳拍考驗你是否真的記得角色走過哪些事",turn:"最後一集收工時，工作人員開始拆掉陪伴數週的場景",breach:"後續集數被迫改寫，連戲與宣傳素材都需要重新安排"},
 綜藝:{arrival:"導播倒數之前，流程表只提供方向，真正的節奏仍要在現場發生",friction:"突發反應比腳本更快，鏡頭正在等你決定要接住人還是只接住效果",turn:"最後一次收錄留下的不只是笑點，而是觀眾逐漸熟悉的節目關係",breach:"集數流程與來賓配置臨時重排，製作單位必須補上一個無法預期的空缺"},
 廣告:{arrival:"品牌、產品與人物形象在第一個鏡位前被逐項對齊",friction:"漂亮畫面不等於可信，團隊要求你重新找到這個產品與生活的關係",turn:"主視覺定格後，反覆修正的細節終於變成幾秒能被記住的影像",breach:"品牌檔期與媒體版位已經啟動，未完成的素材讓整套宣傳被迫延期"}
};
const PRESSURES=["預算沒有多到能無限重來","宣傳日期已經寫死","合作陣容的共同檔期只有這一次","現場臨時收到市場端的新要求","主創決定把原本安全的版本全部推翻","一位核心工作人員突然無法到場","第一版成品測試反應兩極","媒體已經開始追問尚未公開的內容"];
const DETAILS=["一個沒有寫進企劃書的小動作","試鏡時留下的那個選擇","主創反覆圈起來的一句話","合作對象臨場改變的節奏","觀眾測試裡最安靜的三秒","工作人員私下提出的提醒","第一次排練時意外留下的版本","只有現場人才知道的失誤"];

function common(job,index){
 const beat=CATEGORY_BEATS[job.category]||CATEGORY_BEATS.電影,pressure=PRESSURES[index%PRESSURES.length],detail=DETAILS[(index*3)%DETAILS.length],steady=job.audition.choices[0],bold=job.audition.choices[1];
 return{beat,pressure,detail,steady,bold};
}
function genericStory(job,index){
 const{beat,pressure,detail,steady,bold}=common(job,index);
 return Object.freeze({id:job.id,depth:"C",
  audition:{arrival:`你抵達${job.audition.venue}。${job.audition.prompt}`,steady:`你選擇「${steady.label}」，評審記住的是準備完整與判斷清楚。`,bold:`你選擇「${bold.label}」，現場氣氛因此改變，也讓風險被放到最大。`,passed:`製作方沒有只說通過，而是指出你讓《${job.title}》的${detail}真正成立。`,failed:`這次名單沒有你的名字；回饋特別提到「${job.audition.tip}」，成為下次再爭取時的準備方向。`},
  contract:{title:`《${job.title}》合約桌上的最後一頁`,text:`${job.client}確認由你參與這份${job.tagline}企劃。${job.synopsis} 合約同時寫明 ${job.sessions} 次工作與第 {deadline} 週前完成；${pressure}。`},
  production:Object.freeze([
   {label:"開工",title:`《${job.title}》第一次正式進場`,text:`${beat.arrival}。團隊重新提起試鏡時的選擇，確認你會如何把它帶進正式製作。`},
   {label:"磨合",title:`《${job.title}》開始偏離企劃書`,text:`${beat.friction}。${pressure}，你必須決定哪些準備要守住、哪些反應要重新長出來。`},
   {label:"關鍵場次",title:`《${job.title}》不能重來的那一段`,text:`${detail}成為今天的核心。${job.synopsis} 此刻不再只是簡介，而是所有部門必須共同完成的承諾。`},
   {label:"完成",title:`《${job.title}》留下的最後一格`,text:`${beat.turn}。${job.client}把成品交給市場，而你在這份作品裡留下了只有這次合作才會出現的版本。`}
  ]),
  completion:{steady:`從試鏡到完成，你維持了「${steady.label}」的選擇；作品因此被評為穩定、可信且能承擔長期合作。`,bold:`從試鏡到完成，你延續了「${bold.label}」的冒險；成品辨識度更高，也引來更兩極但更強烈的討論。`},
  breach:{title:`《${job.title}》停在未完成的位置`,text:`${beat.breach}。${job.client}記住的不是單純少了 ${job.sessions} 次工作，而是這次缺口如何影響了整個團隊。`},
  legacy:{title:`《${job.title}》後來仍被提起`,text:`作品公開後，${detail}成為觀眾與業界最常提到的部分。這份回聲會影響${job.client}是否再次把機會交到你手上。`}
 });
}
function flagshipStory(job,index){
 const base=genericStory(job,index),flag=FLAGSHIP_JOB_BEATS[job.id];
 if(!flag)return base;
 const{steady,bold}=common(job,index);
 return Object.freeze({...base,depth:"A",theme:flag.theme,
  contract:{...base.contract,text:`${base.contract.text} 企劃核心被標註為「${flag.theme}」；這份工作會一路追問你要留下哪一種版本。`},
  production:Object.freeze([
   {label:"開工",title:`《${job.title}》・${flag.theme}`,text:flag.opening},
   {label:"危機",title:`《${job.title}》出現原本沒寫在企劃裡的問題`,text:flag.crisis},
   {label:"關鍵選擇",title:`《${job.title}》真正決定成品的那一刻`,text:flag.pivot},
   {label:"完成",title:`《${job.title}》最後留下的版本`,text:flag.wrap}
  ]),
  completion:{steady:`你把試鏡時「${steady.label}」的判斷帶到最後。${flag.wrap}`,bold:`你一路延續「${bold.label}」帶來的風險與辨識度。${flag.wrap}`},
  legacy:{title:`《${job.title}》離開片場／錄音室之後`,text:flag.publicEcho}
 });
}
function build(job,index){return jobDepthTier(job.id)==="A"?flagshipStory(job,index):genericStory(job,index)}
export const JOB_STORYLINES=Object.freeze(Object.fromEntries(JOB_CATALOG.map((job,index)=>[job.id,build(job,index)])));
export const jobStoryline=id=>JOB_STORYLINES[id]||null;
