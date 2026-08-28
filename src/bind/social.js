import{SOCIAL_POST_TEMPLATES}from"../data/social.js";
import{state}from"../core/state.js";
import{render}from"../render.js";

const COMMENTS=["第一天追蹤！","慢慢來，我們會看著你成長。","今天也辛苦了。","期待看到作品！","這種真誠的更新很加分。"];

export function bindSocial(){
 document.querySelectorAll("[data-social-post]").forEach(x=>x.onclick=()=>{const type=x.dataset.socialPost,t=SOCIAL_POST_TEMPLATES[type],base=Math.max(4,state.fans+state.fame*3),id=`own-${state.week}-${Date.now()}`;state.socialPosts.unshift({id,text:t.text,week:state.week,likes:base,comments:Array.from({length:Math.min(3,1+Math.floor(state.fame/80))},(_,i)=>({name:["小星星","路過觀眾","新人守望者"][i],text:COMMENTS[(state.week+i+type.length)%COMMENTS.length]}))});state.socialNotice=`「${t.label}」已發布；回應會隨知名度與粉絲增加。`;render()});
 document.querySelectorAll("[data-social-like]").forEach(x=>x.onclick=()=>{const id=x.dataset.socialLike,index=state.likedSocialPosts.indexOf(id);if(index>=0)state.likedSocialPosts.splice(index,1);else state.likedSocialPosts.push(id);render()});
}
