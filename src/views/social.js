import{OFFICIAL_SOCIAL_POSTS,NPC_SOCIAL_COPY,SOCIAL_POST_TEMPLATES}from"../data/social.js";
import{NPCS}from"../data/npcs.js";
import{state}from"../core/state.js";
import{esc}from"../core/utils.js";

function postCard(post){
 const liked=state.likedSocialPosts.includes(post.id),comments=post.comments||[];
 return `<article class="social-post"><header><i>${post.image?`<img src="${post.image}" alt="" loading="lazy">`:esc(post.avatar)}</i><div><b>${esc(post.name)}</b><small>${post.badge}・第 ${post.week||state.week} 週</small></div></header><p>${esc(post.text)}</p><footer><button class="${liked?"liked":""}" data-social-like="${post.id}">♡ ${post.likes+(liked?1:0)}</button><span>回覆 ${comments.length}</span></footer>${comments.length?`<div class="social-comments">${comments.slice(0,3).map(c=>`<p><b>${esc(typeof c==="string"?"網友":c.name)}</b> ${esc(typeof c==="string"?c:c.text)}</p>`).join("")}</div>`:""}</article>`;
}
function feed(){
 const own=state.socialPosts.map(p=>({...p,name:state.name,badge:"本人",avatar:state.name.slice(0,1)}));
 const npc=state.knownPeople.filter(id=>NPCS[id]&&NPC_SOCIAL_COPY[id]).map((id,i)=>{const n=NPCS[id];return{id:`npc-${id}`,name:n.name,badge:n.job,avatar:n.avatar,image:n.thumb,text:NPC_SOCIAL_COPY[id],likes:86+i*37+state.week*3,comments:["工作辛苦了！","期待下次更新。"]}});
 return[...own,...npc,...OFFICIAL_SOCIAL_POSTS];
}
export function socialApp(){const estimated=Math.max(12,state.fans+state.fame*4);return `<div class="social-page"><header class="social-profile"><i>${esc(state.name.slice(0,1))}</i><div><span>@star_${esc(state.name.toLowerCase().replace(/\s/g,""))||"newcomer"}</span><h2>${esc(state.name)}</h2><p>新人藝人・正在星望市努力累積作品</p></div><dl><div><b>${state.socialPosts.length}</b><small>貼文</small></div><div><b>${estimated}</b><small>追蹤者</small></div><div><b>${state.knownPeople.length}</b><small>圈內互動</small></div></dl></header><section class="social-compose"><b>分享近況</b><div>${Object.entries(SOCIAL_POST_TEMPLATES).map(([id,t])=>`<button data-social-post="${id}"><i>${t.icon}</i><span><b>${t.label}</b><small>${t.text}</small></span></button>`).join("")}</div>${state.socialNotice?`<p>${esc(state.socialNotice)}</p>`:""}</section><div class="social-feed">${feed().map(postCard).join("")}</div></div>`}
