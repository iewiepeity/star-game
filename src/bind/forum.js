import{state}from"../core/state.js";
import{render}from"../render.js";
import{forumReaction}from"../logic/community-interactions.js";

export function bindForum(){
 document.querySelectorAll("[data-forum-category]").forEach(x=>x.onclick=()=>{state.forumCategory=x.dataset.forumCategory;render()});
 document.querySelectorAll("[data-forum-thread]").forEach(x=>x.onclick=()=>{state.forumThread=x.dataset.forumThread;render()});
 document.querySelector("[data-forum-back]")?.addEventListener("click",()=>{state.forumThread=null;render()});
 document.querySelector("[data-forum-refresh]")?.addEventListener("click",()=>{state.forumRefresh++;render()});
 document.querySelectorAll("[data-forum-react]").forEach(button=>button.onclick=()=>{const result=forumReaction(state.forumThread,button.dataset.forumReact);state.notice=result.message;render()});
}
