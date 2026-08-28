import{TUTORIALS}from"./tutorial.js";

export const PROLOGUE_LAST_STEP=3;

export function startPrologue(game){
 game.screen="prologue";
 game.prologueStep=0;
 game.prologueCompleted=false;
 game.appOpen=null;
}

export function advancePrologue(game){
 const step=Math.max(0,Number(game.prologueStep)||0);
 if(step>=PROLOGUE_LAST_STEP){completePrologue(game);return false}
 game.prologueStep=step+1;
 return true;
}

export function completePrologue(game,{skipTutorial=false}={}){
 game.screen="game";
 game.prologueStep=PROLOGUE_LAST_STEP;
 game.prologueCompleted=true;
 game.appOpen=null;
 if(skipTutorial)game.tutorialSeen=TUTORIALS.map(item=>item.id);
}
