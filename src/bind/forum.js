import{state}from"../core/state.js";
import{render,renderUi}from"../render.js";
import{forumReaction}from"../logic/community-interactions.js";

export function bindForum(){
 document.querySelectorAll("[data-forum-category]").forEach(x=>x.onclick=()=>{state.forumCategory=x.dataset.forumCategory;renderUi()});
 document.querySelectorAll("[data-forum-thread]").forEach(x=>x.onclick=()=>{state.forumThread=x.dataset.forumThread;renderUi()});
 document.querySelector("[data-forum-back]")?.addEventListener("click",()=>{state.forumThread=null;renderUi()});
 document.querySelector("[data-forum-refresh]")?.addEventListener("click",()=>{state.forumRefresh++;renderUi()});
 document.querySelectorAll("[data-forum-react]").forEach(button=>button.onclick=()=>{const result=forumReaction(state.forumThread,button.dataset.forumReact);state.notice=result.message;render()});
}
