// 事件層：衣櫃的人物切換、購買與穿著。購買成功後會立刻穿上，並由 render() 寫入存檔。
import{AVATARS,OUTFITS}from"../data/wardrobe.js";
import{state}from"../core/state.js";
import{render}from"../render.js";

export function bindWardrobe(){
 document.querySelectorAll("[data-wardrobe-avatar]").forEach(x=>x.onclick=()=>{const id=x.dataset.wardrobeAvatar;if(!AVATARS[id])return;state.avatarId=id;state.wardrobeNotice=`已切換為「${AVATARS[id].name}」立繪`;render()});
 document.querySelectorAll("[data-outfit]").forEach(x=>x.onclick=()=>{const id=x.dataset.outfit,outfit=OUTFITS[id];if(!outfit)return;if(!state.ownedOutfits.includes(id)){if(state.money<outfit.price){state.wardrobeNotice=`金額不足，購買「${outfit.name}」需要 $${outfit.price.toLocaleString("zh-TW")}`;render();return}state.money-=outfit.price;state.ownedOutfits.push(id);state.wardrobeNotice=`購買成功，已穿上「${outfit.name}」`}else state.wardrobeNotice=`已穿上「${outfit.name}」`;state.outfitId=id;render()})
}
