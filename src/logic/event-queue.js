import{state}from"../core/state.js";

function eventExists(event){
 const id=event?.id;
 if(!id)return false;
 return state.activeEvent?.event?.id===id
  ||state.eventQueue.some(x=>x.event?.id===id)
  ||state.queuedEvents.some(x=>x.event?.id===id)
  ||state.eventHistory.some(x=>x.id===id);
}

function eventPriority(event,source="系統"){
 if(Number.isFinite(event?.priority))return event.priority;
 if(/戀愛|人物主線/.test(source)||event?.kind==="戀愛事件")return 100;
 if(/人物|關係/.test(source)||event?.kind==="人物事件")return 85;
 if(/獎項|職涯|合約/.test(source)||event?.kind==="職涯事件")return 75;
 if(/年度|節點/.test(source))return 60;
 if(/輿論|媒體|醜聞/.test(source)||event?.kind==="輿論事件")return 55;
 return 40;
}

function eventPersists(event,source){return event?.persistent||eventPriority(event,source)>=80}

export function queueEvent(event,{source="系統",dueWeek=state.week}={}){
 if(!event||eventExists(event))return false;
 const queuedWeek=state.week,expiresWeek=eventPersists(event,source)?null:dueWeek+(event.maxDelayWeeks??10);
 state.queuedEvents.push({dueWeek,event,source,queuedWeek,expiresWeek,priority:eventPriority(event,source)});
 return true;
}

export function enqueueVisibleEvent(event,source="系統",meta={}){
 if(!event||eventExists(event))return false;
 if(state.activeEvent||state.eventPresentedWeek===state.week||state.eventQueue.length){
  const queuedWeek=meta.queuedWeek??state.week,expiresWeek=meta.expiresWeek??(eventPersists(event,source)?null:queuedWeek+(event.maxDelayWeeks??10));
  if(expiresWeek&&expiresWeek<state.week)return"expired";
  state.queuedEvents.push({dueWeek:state.week+1,event,source,queuedWeek,expiresWeek,priority:meta.priority??eventPriority(event,source)});
  return"deferred";
 }
 state.eventQueue.push({event,source,priority:meta.priority??eventPriority(event,source)});
 state.eventQueue.sort((a,b)=>(b.priority||0)-(a.priority||0));
 return true;
}

export function activateNextEvent(){
 if(state.activeEvent||!state.eventQueue.length||state.eventPresentedWeek===state.week)return state.activeEvent;
 state.activeEvent=state.eventQueue.shift();
 state.eventPresentedWeek=state.week;
 state.screen="event";
 return state.activeEvent;
}

export function dismissActiveEvent(){
 state.activeEvent=null;
 return null;
}
