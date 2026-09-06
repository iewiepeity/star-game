import { jobStoryline } from "./job-storylines.js";

const stageAt=(done,total)=>done>=total?3:Math.min(2,Math.floor((done-1)/total*4));
// 每次完成工作，只交付本次新跨越的幕；1次通告依序交付4幕，2次通告也不漏中段。
// 不改變工作次數、報酬或進度，長期拍攝停留同一階段時回傳空陣列，避免重演同一場戲。
export function jobProductionFrames(job,record,{completed=false}={}){
 const story=jobStoryline(job?.id);
 if(!story)return[];
 const total=Math.max(1,Number(job.sessions)||1);
 const done=Math.min(total,Math.max(1,Number(record?.completedSessions)||1));
 const priorStage=done===1?-1:stageAt(done-1,total);
 const currentStage=completed?3:stageAt(done,total);
 return story.production.slice(priorStage+1,currentStage+1);
}

export function jobProductionScene(job,record,{completed=false}={}){
 const total=Math.max(1,Number(job?.sessions)||1);
 const done=Math.min(total,Math.max(1,Number(record?.completedSessions)||1));
 const stage=completed?3:stageAt(done,total);
 const scene=jobStoryline(job?.id)?.production[stage];
 return scene||{stage,label:"製作",title:job?.title||"工作現場",text:job?.synopsis||"今日工作依通告單進行。"};
}
