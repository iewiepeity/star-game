const CATEGORY_TAGS={歌曲:["流行","音樂"],電影:["電影","戲劇"],電視劇:["影集","戲劇"],綜藝:["綜藝","娛樂"],廣告:["商業","品牌"]};
const TITLE_RULES=[["愛", "愛情"],["夜","懸疑"],["青春","青春"],["城","都會"],["星","奇幻"],["笑","喜劇"],["罪","犯罪"],["風","文藝"]];
export function workTags(job){const tags=[...(CATEGORY_TAGS[job?.category]||[])];for(const[k,t]of TITLE_RULES)if(job?.title?.includes(k)&&!tags.includes(t))tags.push(t);if((job?.stars||0)>=4)tags.push("高規格製作");return tags}
export function roleOptions(job){if(!job)return[];if(!["電影","電視劇"].includes(job.category))return[{id:"featured",label:job.tagline||"主要參與",fame:1,award:1}];const out=[{id:"lead",label:"主要角色",fame:1.2,award:1.2},{id:"support",label:"重要配角",fame:.85,award:1.05}];if(job.stars<=3)out.push({id:"guest",label:"特別演出／客串",fame:.55,award:.55});return out}
