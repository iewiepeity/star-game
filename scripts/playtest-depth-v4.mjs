import{resetState,state}from"../src/core/state.js";
import{meetNpc}from"../src/logic/npc-engine.js";
import{applyEffects,resolveEvent}from"../src/logic/event-engine.js";
import{applyCareerDoctrineTick}from"../src/logic/career-phases.js";
import{tickNpcInvitation,tickEnsembleScene}from"../src/logic/lived-story-engine.js";
import{evaluateEnding}from"../src/logic/career.js";
import{validateGameState}from"../src/core/save-schema.js";

const PEOPLE=["jiqing","shenyao","tangtang","guchengxi","linxiafan","lujingran","xiayutong","sufei","chengyian","hanzhiyuan"];
const ROUTES=[
 {name:"商業衝刺",doctrines:[[105,"compete","正面競爭"],[157,"commerce","商業換權"],[209,"masterpiece","代表作優先"]],choice:"side-a",invite:"accept"},
 {name:"作者自主",doctrines:[[105,"niche","獨特定位"],[157,"autonomy","創作自主"],[209,"masterpiece","代表作優先"]],choice:"mediate",invite:"reschedule"},
 {name:"可持續羈絆",doctrines:[[105,"alliance","合作聯盟"],[157,"sustainable","可持續職涯"],[209,"people","重要關係優先"]],choice:"mediate",invite:"accept"},
 {name:"產業傳承",doctrines:[[105,"alliance","合作聯盟"],[157,"commerce","商業換權"],[209,"legacy","產業傳承"]],choice:"side-b",invite:"decline"},
];
function play(route){resetState();state.name=route.name;state.knownPeople=[];for(const id of PEOPLE)meetNpc(id);state.eventQueue=[];let invitations=0,ensembles=0,triads=0,doctrineEvents=0,choices=0;
 for(let week=1;week<=260;week++){state.week=week;const d=route.doctrines.find(x=>x[0]===week);if(d){const key=week===105?"year3":week===157?"year4":"year5";applyEffects({doctrineKey:key,doctrineValue:d[1],doctrineLabel:d[2]},"路線實玩");choices++}applyCareerDoctrineTick();const invitation=tickNpcInvitation();if(invitation)invitations++;const ensemble=tickEnsembleScene();if(ensemble){ensembles++;const queued=state.eventQueue.find(x=>x.event.id===ensemble);if(queued?.event.cast.length===3)triads++}while(state.eventQueue.length){const wrapper=state.eventQueue.shift(),event=wrapper.event||wrapper,choice=event.choices?.find(x=>x.id===(event.id?.startsWith("invitation:")?route.invite:event.id?.startsWith("ensemble:")?route.choice:"accept"))||event.choices?.[0];if(choice){resolveEvent(event,choice.id);choices++}}if(week%13===0)state.completedWorks.push({id:`${route.name}-${week}`,title:`${route.name}作品 ${week/13}`,category:week%26?"電影":"歌曲",quality:65+(week%30),completedWeek:week,original:route.name==="作者自主"});if(week%17===0)doctrineEvents=state.doctrineEventHistory.length;const valid=validateGameState(state);if(!valid.ok)throw new Error(`${route.name} week ${week}: ${valid.errors.join("、")}`)}
 state.fame=route.name==="商業衝刺"?900:route.name==="作者自主"?620:500;state.fans=route.name==="商業衝刺"?800000:240000;state.money=route.name==="可持續羈絆"?600000:1300000;state.rep.業界評價=route.name==="作者自主"?900:700;state.rep.可信度=route.name==="產業傳承"?900:700;state.endingSnapshot=null;const ending=evaluateEnding("fiveyear");return{name:route.name,decisions:route.doctrines.map(x=>x[2]),invitations,ensembles,triads,doctrineEvents,choices,works:state.completedWorks.length,originalWorks:state.completedWorks.filter(x=>x.original).length,ending:ending.title,rank:ending.rank,score:ending.score,money:state.money,fame:state.fame,industry:state.rep.業界評價,trust:state.rep.可信度,health:state.health,fatigue:state.fatigue}}
const results=ROUTES.map(play),signatures=new Set(results.map(x=>[x.ending,x.score,x.money,x.fame,x.industry,x.trust,x.originalWorks].join(":")));if(signatures.size!==results.length)throw new Error("職涯策略沒有形成四條可辨識的資源與結局軌跡");console.log(JSON.stringify(results,null,2));
