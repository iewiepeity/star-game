const CATEGORY_TAGS={歌曲:["流行","音樂"],電影:["電影","戲劇"],電視劇:["影集","戲劇"],綜藝:["綜藝","娛樂"],廣告:["商業","品牌"]};
const TITLE_RULES=[["愛","愛情"],["夜","懸疑"],["青春","青春"],["城","都會"],["星","奇幻"],["笑","喜劇"],["罪","犯罪"],["風","文藝"]];
export const ROLE_PROFILES=Object.freeze({
 featured:Object.freeze({id:"featured",label:"主要參與",requirementScale:1,trainingScale:1,auditionModifier:0,fame:1,award:1}),
 lead:Object.freeze({id:"lead",label:"主角／主要角色",requirementScale:1.18,trainingScale:1.25,auditionModifier:-10,fame:1.25,award:1.25}),
 support:Object.freeze({id:"support",label:"重要配角",requirementScale:1,trainingScale:1,auditionModifier:0,fame:.9,award:1.08}),
 guest:Object.freeze({id:"guest",label:"客串／特別演出",requirementScale:.82,trainingScale:.75,auditionModifier:10,fame:.55,award:.6})
});
const LEAD_CUES=["主角","主演","第一主角","第二主角","男主","女主"];
const SUPPORT_CUES=["重要配角","配角","男二","女二","手足","室友","夥伴","搭檔"];
const GUEST_CUES=["客串","特別演出","單集","小角色","店員","同學","常客","路人","助理"];
export function workTags(job){const tags=[...(CATEGORY_TAGS[job?.category]||[])];for(const[k,t]of TITLE_RULES)if(job?.title?.includes(k)&&!tags.includes(t))tags.push(t);if((job?.stars||0)>=4)tags.push("高規格製作");return tags}
export function inferRoleId(job){if(!job||!["電影","電視劇"].includes(job.category))return"featured";if(job.roleId&&ROLE_PROFILES[job.roleId])return job.roleId;const text=`${job.title||""} ${job.tagline||""} ${job.synopsis||""}`;if(LEAD_CUES.some(x=>text.includes(x)))return"lead";if(SUPPORT_CUES.some(x=>text.includes(x)))return"support";if(GUEST_CUES.some(x=>text.includes(x)))return"guest";if((job.stars||1)<=1)return"guest";if((job.stars||1)>=4)return"lead";return"support"}
export function roleProfile(job){const base=ROLE_PROFILES[inferRoleId(job)]||ROLE_PROFILES.featured;return base.id==="featured"?Object.freeze({...base,label:job?.tagline||base.label}):base}
export function roleRequirements(job){const role=roleProfile(job);return(job?.requirements||[]).map(([name,min])=>[name,Math.max(1,Math.ceil(min*role.requirementScale/5)*5)])}
export function roleTrainingRequirement(job){const role=roleProfile(job);return Math.max(0,Math.ceil((job?.minTrainingSessions||0)*role.trainingScale))}
export function roleOptions(job){return[roleProfile(job)]}
