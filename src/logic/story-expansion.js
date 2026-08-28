import{CAREER_STORY_EVENTS,RELATIONSHIP_STORY_EVENTS}from"../data/story-expansion.js";
import{state}from"../core/state.js";
import{eligibleEvents,enqueueVisibleEvent}from"./event-engine.js";
import{chance,randomInt}from"../core/rng.js";

function pickUnseen(pool,history){const eligible=eligibleEvents(pool).filter(e=>!history.includes(e.id));return eligible.length?eligible[randomInt(0,eligible.length-1)]:null}
export function maybeQueueCareerStory(){state.storyExpansionHistory??=[];if(!chance(18))return null;const event=pickUnseen(CAREER_STORY_EVENTS,state.storyExpansionHistory);if(!event)return null;state.storyExpansionHistory.push(event.id);enqueueVisibleEvent(event,"星途片段");return event}
export function maybeQueueRelationshipStory(){state.relationshipStoryHistory??=[];const candidates=Object.entries(state.relationships||{}).filter(([id,r])=>state.knownPeople.includes(id)&&(r.closeness||0)>=55&&(r.trust||0)>=35);if(!candidates.length||!chance(14))return null;const event=pickUnseen(RELATIONSHIP_STORY_EVENTS,state.relationshipStoryHistory);if(!event)return null;state.relationshipStoryHistory.push(event.id);enqueueVisibleEvent(event,"關係片段");return event}
