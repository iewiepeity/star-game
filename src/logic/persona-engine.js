import{state}from"../core/state.js";

const PERSONAS=[
 {id:"national",label:"國民系藝人",test:s=>(s.rep.國民度||0)>=650&&(s.rep.路人緣||0)>=650,tags:["廣告","電視劇"]},
 {id:"artist",label:"實力派創作者",test:s=>(s.rep.業界評價||0)>=650&&(s.creativeProjects?.filter(p=>p.status==="released").length||0)>=2,tags:["歌曲","電影"]},
 {id:"variety",label:"綜藝感明星",test:s=>(s.careerProgress?.綜藝||0)>=Math.max(250,(s.careerProgress?.電影||0)),tags:["綜藝"]},
 {id:"fashion",label:"精品寵兒",test:s=>(s.rep.時尚影響力||0)>=600&&(s.rep.商業價值||0)>=550,tags:["廣告"]},
 {id:"controversy",label:"話題風暴體質",test:s=>(s.rep.爭議度||0)>=500&&(s.rep.話題度||0)>=550,tags:["綜藝","歌曲"]},
 {id:"actor",label:"戲劇實力派",test:s=>(s.careerProgress?.電影||0)+(s.careerProgress?.電視劇||0)>=700,tags:["電影","電視劇"]},
 {id:"commercial",label:"商業巨星",test:s=>(s.rep.商業價值||0)>=700&&(s.fame||0)>=350,tags:["廣告","綜藝"]}
];

export function currentPersona(){state.publicPersona??={id:"rookie",label:"仍在形成中的公眾形象",sinceWeek:1,history:[]};return state.publicPersona}
export function evaluatePersona(){const current=currentPersona(),next=PERSONAS.find(p=>p.test(state))||{id:"rookie",label:"仍在形成中的公眾形象",tags:[]};if(next.id!==current.id){current.history.push({week:state.week,from:current.id,to:next.id,label:next.label});current.id=next.id;current.label=next.label;current.sinceWeek=state.week;state.flags.push({week:state.week,label:`公眾形象形成：${next.label}`,note:"媒體與市場開始用更固定的方式描述你。"})}return current}
export function personaJobModifier(category){const p=PERSONAS.find(x=>x.id===currentPersona().id);return p?.tags?.includes(category)?7:0}
