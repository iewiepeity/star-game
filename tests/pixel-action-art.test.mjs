import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { AVATARS, OUTFITS } from "../src/data/wardrobe.js";
import { CHOICES } from "../src/pixel/life.js";
import { ACTIVITY_TYPES, activityAllowed } from "../src/pixel/data.js";
import { actionMeta, actionAssets, authoredActivityFrame } from "../src/pixel/action-sprites.js";
import { expandedAssets } from "../src/pixel/expanded-sprites.js";
const manifest = JSON.parse(readFileSync(new URL("../assets/pixel/actions/manifest.json", import.meta.url)));
function mock(key) {
  const sprite = { scene: { textures: { exists: () => true }, cache: { json: { get: () => manifest } }, cameras: { main: { zoom: 1 } } } };
  for (const name of ["setTexture", "setFlipX", "setRotation", "setAlpha", "setScale", "setOrigin", "setPosition", "setDepth"])
    sprite[name] = (...args) => { sprite[name.slice(3)] = args; return sprite; };
  const shadow = {};
  for (const name of ["setVisible", "setPosition", "setDepth"])shadow[name] = (...args) => { shadow[name.slice(3)] = args; return shadow; };
  return { key, sprite, shadow, x: 321, y: 444 };
}
test("15 lossless action atlases contain 552 separate, in-bounds source frames", () => {
  assert.equal(Object.keys(manifest.sheets).length, 15);
  let count = 0;
  for (const data of Object.values(manifest.sheets)) {
    assert.equal(statSync(new URL(`../${data.url}`,import.meta.url)).size,data.bytes);
    const rects=Object.values(data.frames);count+=rects.length;
    assert.equal(new Set(rects.map(JSON.stringify)).size,rects.length);
    for(const [x,y,w,h] of rects){assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.width&&y+h<=data.height);}
    assert.match(data.sourceSha256,/^[a-f0-9]{64}$/);
  }
  assert.equal(count,552);
});
test("all 60 outfits load their own action sheet, including the three legacy Raven outfits", () => {
  for (const a of Object.keys(AVATARS))for(const o of Object.keys(OUTFITS)) {
    const key=`${a}-${o}`,meta=actionMeta(key);
    assert.ok(manifest.sheets[meta.sheet]);
    assert.ok(expandedAssets(key).some(asset=>asset.key===meta.sheet));
    assert.equal(actionAssets(key).length,1);
    for(const pose of ['dance','sing','coffee']) {
      const actor=mock(key);
      assert.equal(authoredActivityFrame(actor,pose,0,{},false),true,key+pose);
      const first=actor.sprite.Texture[1],scale=actor.sprite.Scale[0];
      assert.equal(authoredActivityFrame(actor,pose,pose === "dance" ? 0.5 : ["coffee", "drink"].includes(pose) ? 1.5 : 1,{},false),true);
      assert.notEqual(actor.sprite.Texture[1],first);
      assert.equal(actor.sprite.Scale[0],scale,'scale must not pulse');
      assert.equal(actor.key,key);
      assert.deepEqual([actor.x,actor.y],[321,444]);
      for(const facing of ['sw','se','nw','ne']) {
        authoredActivityFrame(actor,'coffee',0,{x:100,y:200,seat:{facing,height:68}},false);
        assert.deepEqual(actor.sprite.Position,[100,200]);
        assert.ok(actor.sprite.Origin.every(n=>n>0&&n<1));
        assert.deepEqual(actor.shadow.Visible,[false]);
      }
    }
  }
});
test("nine expanded NPCs use real reading, phone, drink and dance frames", () => {
  for(const id of ['shenyao','tangtang','guchengxi','linxiafan','lujingran','xiayutong','hanzhiyuan','chengyian','silver_pc'])for(const pose of ['read','phone','drink','dance']) {
    const actor=mock(id);
    assert.ok(authoredActivityFrame(actor,pose,0,{},false));
    const before=actor.sprite.Texture[1];
    authoredActivityFrame(actor,pose,pose === "dance" ? 0.5 : ["coffee", "drink"].includes(pose) ? 1.5 : 1,{},false);
    assert.notEqual(actor.sprite.Texture[1],before);
    assert.deepEqual(actor.shadow.Visible,[true]);
  }
});
test("reduced motion freezes poses, missing sheets retain the established fallback", () => {
  const actor=mock('sunny-practice');
  authoredActivityFrame(actor,'dance',0,{},true);const first=actor.sprite.Texture;
  authoredActivityFrame(actor,'dance',10,{},true);assert.deepEqual(actor.sprite.Texture,first);
  assert.equal(authoredActivityFrame(actor,'rest',0,{},true),false);
  actor.sprite.scene.textures.exists=()=>false;
  assert.equal(authoredActivityFrame(actor,'dance',0,{},false),false);
  assert.equal(actionMeta('unknown-outfit'),null);
});
test("vocal lesson can start and restore its own singing animation in the recording room", () => {
  assert.equal(CHOICES.vocal.pose,'sing');
  assert.equal(CHOICES.vocal.room,'recording');
  assert.ok(activityAllowed('recording','service','sing'));
  assert.equal(ACTIVITY_TYPES.sing.duration,ACTIVITY_TYPES.read.duration);
  assert.equal(activityAllowed('home','bed','sing'),false);
});
