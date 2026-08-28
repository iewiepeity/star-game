import{state}from"../core/state.js";

function eventExists(event){
 const id=event?.id;
 if(!id)return false;
 return state.activeEvent?.event?.id===id
  ||state.eventQueue.some(x=>x.event?.id===id)
  ||state.queuedEvents.some(x=>x.event?.id===id)
  ||state.eventHistory.some(x=>x.id===id);
}

export function queueEvent(event,{source="系統",dueWeek=state.week}={}){
 if(!event||eventExists(event))return false;
 state.queuedEvents.push({dueWeek,event,source});
 return true;
}

export function enqueueVisibleEvent(event,source="系統"){
 if(!event||eventExists(event))return false;
 if(state.activeEvent||state.eventPresentedWeek===state.week||state.eventQueue.length){
  state.queuedEvents.push({dueWeek:state.week+1,event,source});
  return"deferred";
 }
 state.eventQueue.push({event,source});
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
