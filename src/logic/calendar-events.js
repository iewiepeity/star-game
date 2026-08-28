import{CALENDAR_EVENTS}from"../data/calendar-events.js";
import{state}from"../core/state.js";
import{weekInYear,yearOf}from"../core/utils.js";
import{enqueueVisibleEvent,matchesConditions}from"./event-engine.js";
const MONTH_DAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
export function playerBirthdayWeek(){const month=Math.max(1,Math.min(12,state.birthMonth||8)),max=MONTH_DAYS[month-1],day=Math.max(1,Math.min(max,state.birthDay||1)),dayOfYear=MONTH_DAYS.slice(0,month-1).reduce((s,n)=>s+n,0)+day;return Math.min(52,Math.max(1,Math.ceil(dayOfYear/7)))}
function eventWeek(event){return event.dynamic==="birthday"?playerBirthdayWeek():event.weekInYear}
export function enqueueCalendarEvents(){const week=weekInYear(),year=yearOf(),queued=[];state.calendarEventHistory??=[];for(const event of CALENDAR_EVENTS){if(eventWeek(event)!==week||!matchesConditions(event.requires||{}))continue;const key=`${event.id}:${year}`;if(state.calendarEventHistory.includes(key))continue;state.calendarEventHistory.push(key);const dynamicText=event.id==="birthday"?`${state.birthMonth} 月 ${state.birthDay} 日的生日週到了。${event.text}`:event.text;enqueueVisibleEvent({...event,text:dynamicText,id:`${event.id}-${year}`},"年度行事曆");queued.push(event.id)}return queued}
