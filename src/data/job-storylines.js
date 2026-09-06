import { titleTag } from "../core/utils.js";
import { JOB_CATALOG } from "./jobs.js";
import { jobDepthTier } from "./deepening-content.js";
import { AUTHORED_JOB_CONTENT, AUTHORED_FLAGSHIP_CHOICES } from "./job-authored-content.js";

const choiceNarrative=label=>`你選擇「${label.replaceAll("「","『").replaceAll("」","』")}」。`;
const STAGE_LABELS=Object.freeze(["開工","磨合","關鍵場次","完成"]);
function build(job){
 const content=AUTHORED_JOB_CONTENT[job.id];
 if(!content)throw new Error(`Missing authored job storyline: ${job.id}`);
 const title=titleTag(job.title);
 return Object.freeze({
  id:job.id,depth:jobDepthTier(job.id),theme:content.theme,
  flagshipChoices:AUTHORED_FLAGSHIP_CHOICES[job.id]||null,
  audition:Object.freeze({
   arrival:`${job.audition.venue}。${content.audition.arrival}`,
   steady:choiceNarrative(job.audition.choices[0].label),
   bold:choiceNarrative(job.audition.choices[1].label),
   passed:`${title}的試鏡結果到了。${content.audition.passed}`,
   failed:`${title}的試鏡結果到了。${content.audition.failed}`
  }),
  contract:Object.freeze({title:`${title}・確認工作範圍`,text:`${job.client}的合約桌上，工作範圍逐項攤開。${content.scope} 需於第 {deadline} 週前完成 ${job.sessions} 次工作。`}),
  production:Object.freeze(content.production.map((text,stage)=>Object.freeze({stage,label:STAGE_LABELS[stage],title:`${title}・${stage===0?content.theme:STAGE_LABELS[stage]}`,text}))),
  completion:content.completion,
  breach:Object.freeze({title:`${title}・未完成的承諾`,text:content.breach}),
  legacy:Object.freeze({title:`${title}・留在工作之後`,text:content.legacy})
 });
}
export const JOB_STORYLINES=Object.freeze(Object.fromEntries(JOB_CATALOG.map(job=>[job.id,build(job)])));
export const jobStoryline=id=>JOB_STORYLINES[id]||null;
