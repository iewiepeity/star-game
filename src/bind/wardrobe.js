// 事件層：衣櫃的人物切換、購買、穿著與變性。購買服裝需本週已去過服裝店（星光購物商場），
// 變性需本週已去過整形醫院（星望整形外科）；成功後立刻套用，並由 render() 寫入存檔。
import{AVATARS,OUTFITS,portraitAsset,isAvatarLocked,defaultAvatarForGender,GENDER_CHANGE_COST}from"../data/wardrobe.js";
import{state,visitedLocationThisWeek}from"../core/state.js";
import{preloadImage}from"../core/images.js";
import{render}from"../render.js";

const shoppingUnlocked=()=>visitedLocationThisWeek("shop");
const surgeryUnlocked=()=>visitedLocationThisWeek("clinic");

export function bindWardrobe(){
 document.querySelectorAll("[data-wardrobe-avatar]").forEach(x=>x.onclick=async()=>{const id=x.dataset.wardrobeAvatar,avatar=AVATARS[id];if(!avatar||isAvatarLocked(avatar,state.gender))return;const owned=state.ownedOutfits[id]||["newcomer"],nextOutfit=owned.includes(state.outfitId)?state.outfitId:"newcomer";await preloadImage(portraitAsset(id,nextOutfit));state.avatarId=id;state.outfitId=nextOutfit;state.wardrobeNotice="已切換人物立繪";render()});
 document.querySelectorAll("[data-outfit]").forEach(x=>x.onclick=async()=>{const id=x.dataset.outfit,outfit=OUTFITS[id];if(!outfit)return;const owned=state.ownedOutfits[state.avatarId];if(!owned.includes(id)){if(!shoppingUnlocked()){state.wardrobeNotice="這件服裝還沒買喔，要先去地圖上的星光購物商場逛過，本週才能在這裡購買。";render();return}if(state.money<outfit.price){state.wardrobeNotice=`金額不足，購買「${outfit.name}」需要 $${outfit.price.toLocaleString("zh-TW")}`;render();return}state.money-=outfit.price;owned.push(id);state.wardrobeNotice=`購買成功，已穿上「${outfit.name}」`}else state.wardrobeNotice=`已穿上「${outfit.name}」`;await preloadImage(portraitAsset(state.avatarId,id));state.outfitId=id;render()});
 document.querySelectorAll("[data-change-gender]").forEach(x=>x.onclick=()=>{const target=x.dataset.changeGender;if(!target||target===state.gender)return;if(!surgeryUnlocked()){state.wardrobeNotice="要先去地圖上的星望整形外科看過診，本週才能在這裡辦理變性手術。";render();return}if(state.money<GENDER_CHANGE_COST){state.wardrobeNotice=`金額不足，變性手術需要 $${GENDER_CHANGE_COST.toLocaleString("zh-TW")}`;render();return}state.money-=GENDER_CHANGE_COST;state.gender=target;const avatar=defaultAvatarForGender(target);state.avatarId=avatar.id;const owned=state.ownedOutfits[avatar.id];state.outfitId=owned.includes(state.outfitId)?state.outfitId:"newcomer";state.wardrobeNotice=`變性手術完成，現在的性別是「${target}」`;render()});
}
