import test from "node:test";
import assert from "node:assert/strict";
import { recolorCushions } from "../src/pixel/fabric-colors.js";
const light = ([r,g,b]) => r * .2126 + g * .7152 + b * .0722;
const room = { rect: { x: 0, y: 0, width: 1536, height: 1024 } };
function fixture() {
  const image = { width: 230, height: 140, data: new Uint8ClampedArray(230 * 140 * 4) };
  const pixel = (x,y) => ((y-380)*image.width+x-1100)*4;
  const set = (x,y,rgba) => image.data.set(rgba,pixel(x,y));
  const get = (x,y) => [...image.data.slice(pixel(x,y),pixel(x,y)+4)];
  for (let y=380;y<520;y++) for (let x=1100;x<1330;x++) set(x,y,[213,189,148,255]);
  for (let y=392;y<=457;y++) for (let x=1115;x<=1170;x++) set(x,y,[130-y%8*4,126-y%8*4,82-y%8*3,255]);
  for (let y=450;y<=499;y++) for (let x=1250;x<=1305;x++) set(x,y,[176-y%9*4,115-y%9*3,91-y%9*2,255]);
  set(1309,512,[155,104,83,255]); // Similar pigment on the armrest, outside the fabric.
  set(1118,400,[0,0,0,255]); // Dark stitch.
  set(1140,408,[130,120,78,0]); // Transparent cutout.
  return { image,get };
}
test("fabric palettes cover both cushions while preserving folds and luminance", () => {
  for (const tone of ["blue","rose"]) {
    const { image,get } = fixture();
    const before = [get(1120,392),get(1120,399),get(1290,450),get(1290,457)];
    recolorCushions(image,room,{x:1100,y:380},tone);
    const after = [get(1120,392),get(1120,399),get(1290,450),get(1290,457)];
    after.forEach((p,i) => {
      assert.notDeepEqual(p,before[i]);
      assert.ok(Math.abs(light(p)-light(before[i])) < 1);
      assert.equal(p[3],255);
      assert.ok(tone === "blue" ? p[2]>p[0] : p[0]>p[2]);
    });
    assert.notDeepEqual(after[0],after[1]);
    assert.notDeepEqual(after[2],after[3]);
  }
});
test("recoloring leaves the sofa, isolated armrest pigment, dark seams and alpha intact", () => {
  const {image,get}=fixture();
  const positions=[[1105,390],[1309,512],[1118,400],[1140,408],[1200,440]];
  const before=positions.map(p=>get(...p));
  recolorCushions(image,room,{x:1100,y:380},"blue");
  assert.deepEqual(positions.map(p=>get(...p)),before);
});
test("original and unknown fabric styles preserve the entire source", () => {
  for (const tone of ["original","unknown"]) {
    const {image}=fixture(),before=image.data.slice();
    recolorCushions(image,room,{x:1100,y:380},tone);
    assert.deepEqual(image.data,before);
  }
});
