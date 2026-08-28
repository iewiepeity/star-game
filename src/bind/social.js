import{SOCIAL_POST_TEMPLATES}from"../data/social.js";
import{state}from"../core/state.js";
import{scheduleActivity}from"../logic/scheduled-activities.js";
import{render}from"../render.js";
export function bindSocial(){document.querySelectorAll("[data-social-post]").forEach(x=>x.onclick=()=>{const type=x.dataset.socialPost,t=SOCIAL_POST_TEMPLATES[type];const already=Object.values(state.scheduledActivities||{}).some(a=>a.week===state.week&&a.status==="scheduled"&&a.kind==="social_post");if(already){state.socialNotice="這週已經安排一篇正式社群更新了。";render();return}const r=scheduleActivity("social_post",{type},`社群更新：${t.label}`,{fatigue:2,stamina:2});state.socialNotice=r.message;render()});document.querySelectorAll("[data-social-like]").forEach(x=>x.onclick=()=>{const id=x.dataset.socialLike,index=state.likedSocialPosts.indexOf(id);if(index>=0)state.likedSocialPosts.splice(index,1);else state.likedSocialPosts.push(id);render()})}
