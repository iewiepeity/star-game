const isObj=v=>v&&typeof v==="object"&&!Array.isArray(v);
const romanceStages=new Set(["none","interested","ambiguous","dating","committed","engaged","married","rejected","broken"]);
const timelineFilters=new Set(["all","unread","people","works","decisions"]);
export function validateGameState(s){
 const errors=[];if(!isObj(s))return{ok:false,errors:["state 必須是物件"]};
 if(typeof s.week!=="number"||s.week<1)errors.push("week 無效");
 for(const key of ["schedule","scheduledJobIds","scheduledActivityIds"])if(!Array.isArray(s[key])||s[key].length!==7)errors.push(`${key} 必須有七天`);
 for(const key of ["scheduledActivities","stats","rep","publicOpinion","brandRelations","relationships","activeJobs","npcSchedules","npcInteractionEventHistory","careerDoctrine","doctrineTickWeeks"])if(!isObj(s[key]))errors.push(`${key} 無效`);
 for(const key of ["publicOpinionHistory","scandals","knownPeople","npcInteractionMemories","completedWorks","creativeProjects","industryNews","npcStoryHistory","awards","eventHistory","queuedEvents","agencyJobOffers","majorDecisionHistory","npcInvitations","npcInvitationHistory","ensembleEventHistory","doctrineEventHistory","unlockedAchievements","achievementNotifications","endingHistory","managerAdviceHistory"])if(!Array.isArray(s[key]))errors.push(`${key} 無效`);
 if(s.managerState!=null&&!isObj(s.managerState))errors.push("managerState 無效");if(s.partnerId!=null&&typeof s.partnerId!=="string")errors.push("partnerId 無效");
 if(isObj(s.relationships))for(const[id,rel]of Object.entries(s.relationships)){if(!isObj(rel))errors.push(`relationship 無效：${id}`);else{if(!Number.isFinite(rel.affection)||rel.affection<0||rel.affection>100)errors.push(`affection 無效：${id}`);if(!Number.isFinite(rel.hostility)||rel.hostility<0||rel.hostility>100)errors.push(`hostility 無效：${id}`);if(!romanceStages.has(rel.romance))errors.push(`romance 無效：${id}`)}}
 if(Array.isArray(s.creativeProjects))for(const p of s.creativeProjects){if(!Array.isArray(p.team))errors.push(`creative team 無效：${p.id||"unknown"}`);if(!isObj(p.roleAssignments||{}))errors.push(`creative roles 無效：${p.id||"unknown"}`)}
 if(!Number.isInteger(s.rngCursor??0)||Number(s.rngCursor)<0)errors.push("rngCursor 無效");if(!timelineFilters.has(s.timelineFilter))errors.push("timelineFilter 無效");if(typeof s.timelineQuery!=="string")errors.push("timelineQuery 無效");
 return{ok:errors.length===0,errors};
}
export function assertGameState(s){const result=validateGameState(s);if(!result.ok)throw new Error(`存檔結構驗證失敗：${result.errors.join("、")}`);return s}
