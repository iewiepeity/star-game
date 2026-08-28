import{CALENDAR_EVENTS}from"../data/calendar-events.js";
import{state}from"../core/state.js";
import{weekInYear,yearOf}from"../core/utils.js";
import{enqueueVisibleEvent,matchesConditions}from"./event-engine.js";

export function enqueueCalendarEvents(){const week=weekInYear(),year=yearOf(),queued=[];state.calendarEventHistory??=[];for(const event of CALENDAR_EVENTS){if(event.weekInYear!==week||!matchesConditions(event.requires||{}))continue;const key=`${event.id}:${year}`;if(state.calendarEventHistory.includes(key))continue;state.calendarEventHistory.push(key);enqueueVisibleEvent({...event,id:`${event.id}-${year}`},"年度行事曆");queued.push(event.id)}return queued}
