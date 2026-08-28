import{state}from"../core/state.js";

const AWARD_NAMES={歌曲:"星音年度音樂獎",電影:"金幕電影獎",電視劇:"星河電視獎",綜藝:"金笑綜藝獎",廣告:"年度品牌影響力獎"};

export function workQuality(job){
 const values=job.requirements.map(([name,min])=>Math.min(120,((state.stats[name]||0)/Math.max(1,min))*100));
 const ability=values.reduce((sum,n)=>sum+n,0)/Math.max(1,values.length);
 const condition=Math.max(50,100-state.fatigue*.45)+(state.mood-50)*.15;
 return Math.max(1,Math.min(100,Math.round(ability*.72+condition*.28)));
}

export function addCompletedWork(job,{quality=workQuality(job),completedWeek=state.week}={}){
 if(state.completedWorks.some(work=>work.jobId===job.id))return state.completedWorks.find(work=>work.jobId===job.id);
 const work={id:`work-${job.id}-${completedWeek}`,jobId:job.id,title:job.title,category:job.category,stars:job.stars,role:job.tagline,client:job.client,quality,completedWeek,fame:job.rewards.fame,fans:job.rewards.fans,awards:[]};
 state.completedWorks.push(work);state.careerProgress[job.category]=(state.careerProgress[job.category]||0)+job.stars*quality;
 evaluateAwardsForWork(work);
 return work;
}

export function evaluateAwardsForWork(work){
 if(work.stars<3||work.quality<72)return[];
 const level=work.stars===5&&work.quality>=90?"年度大獎":work.quality>=84?"得獎":"入圍";
 const award={id:`award-${work.jobId}`,week:state.week,workId:work.id,name:AWARD_NAMES[work.category],category:work.category,result:level};
 if(!state.awards.some(item=>item.id===award.id)){state.awards.push(award);work.awards.push(award.id);state.flags.push({week:state.week,label:`${award.name}・${level}`,note:`作品《${work.title}》獲得肯定。`})}
 return[award];
}

export function portfolioSummary(){return{works:state.completedWorks.length,awards:state.awards.length,bestWork:[...state.completedWorks].sort((a,b)=>b.quality-a.quality)[0]||null}}

