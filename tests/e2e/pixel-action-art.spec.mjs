import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { AVATARS, OUTFITS } from "../../src/data/wardrobe.js";
import { actionMeta } from "../../src/pixel/action-sprites.js";
test.use({ serviceWorkers: "block" });
const read = p => p.evaluate(() => window.__pixelRead());
async function start(page, avatar, outfit, scene='home', activity=null) {
  const s=initialPixelState();s.flags.intro=true;s.life.speed=1;
  s.avatarId=avatar;s.outfitId=outfit;s.sceneId=scene;
  s.identity={gender:AVATARS[avatar].gender,locked:true,changes:[]};
  s.life.game.avatarId=avatar;s.life.game.gender=AVATARS[avatar].gender;s.life.game.outfitId=outfit;
  for(const a of Object.keys(AVATARS))s.life.game.ownedOutfits[a]=Object.keys(OUTFITS);
  s.activity=activity;
  await page.addInitScript(s=>localStorage.setItem('star-game-pixel-phase-one-v1',JSON.stringify({state:s})),s);
  await page.goto('/');await expect(page.locator('#loading')).toBeHidden({timeout:30000});
}
for(const [avatar,outfit,scene,item,kind] of [
  ['raven','newcomer','rehearsal','practice','dance'],
  ['sunny','practice','cafe','window','coffee'],
  ['noir','premium','recording','service','sing'],
  ['sage','icon','cafe','chair','coffee'],
])test(`${avatar} ${outfit}: authored ${kind} survives restore and returns to walking`,async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await start(page,avatar,outfit,scene,{itemId:item,kind,elapsed:0});
  const expected=actionMeta(`${avatar}-${outfit}`).sheet;
  await expect.poll(async()=>(await read(page)).player.texture).toBe(expected);
  await page.screenshot({path:info.outputPath(`${avatar}-${kind}.png`)});
  const before=await read(page);
  await expect.poll(async()=>(await read(page)).player.frame).not.toBe(before.player.frame);
  await page.locator('[data-ui="stop-activity"]').click();
  await expect.poll(async()=>(await read(page)).player.pose).toBe('standing');
  expect((await read(page)).player.texture).not.toBe(expected);
  expect((await read(page)).state.life.day).toBe(0);
  expect((await read(page)).playerCount).toBe(1);
  expect(errors).toEqual([]);
});
test('failed action-sheet load rolls back wardrobe; retry succeeds',async({page})=>{
  await page.route('**/actions-sunny-1.webp',r=>r.abort());
  await start(page,'sunny','newcomer');
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="profile"]').click();
  await page.locator('[data-ui="closet"]').click();
  await page.locator('[data-fitting="casual"]').click();
  await page.locator('[data-outfit="casual"]').click();
  await expect(page.locator('#toast')).toHaveText('服裝載入失敗，請再試一次');
  await expect(page.locator('[data-outfit="casual"]')).toBeEnabled();
  await expect.poll(async()=>(await read(page)).player.outfit).toBe('sunny-newcomer');
  await page.unroute('**/actions-sunny-1.webp');
  await page.locator('[data-outfit="casual"]').click();
  await expect.poll(async()=>(await read(page)).player.outfit).toBe('sunny-casual');
  expect((await read(page)).retainedAssets.heroes).toBeLessThanOrEqual(2);
});
