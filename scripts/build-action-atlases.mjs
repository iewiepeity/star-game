// Lossless packing only: artwork is generated with image_gen; no drawn substitutes.
// Requires sharp (resolve from the primary runtime or a local installation).
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd(), process.cwd()] }));
const root = new URL("../", import.meta.url);
const sources = new URL("docs/art/2026-09-09/sources/", root);
const output = new URL("assets/pixel/actions/", root);
await mkdir(output, { recursive: true });
const names = ["dance-0", "dance-1", "sing-0", "sing-1", "coffee-front-0", "coffee-front-1", "coffee-back-0", "coffee-back-1"];
const npcNames = ["dance-0", "dance-1", "read-0", "read-1", "phone-0", "phone-1", "drink-0", "drink-1"];
// Native rear views vary across generated sheets. These are reviewed, explicit
// direction corrections, never a front view masquerading as a back view.
const backLeft = {
  "raven-0": [[false,true],[false,true],[false,true],[false,true],[false,true]],
  "raven-1": [[true,false],[true,false],[true,false],[true,false],[true,false]],
  "raven-2": [[false,true],[false,true],[false,true],[false,true],[false,true]],
  "sunny-0": Array(5).fill([false,false]), "sunny-1": Array(5).fill([false,false]),
  "sunny-2": Array(5).fill([true,true]), "noir-0": Array(5).fill([true,true]),
  "noir-1": Array(5).fill([false,false]), "noir-2": Array(5).fill([true,false]),
  "sage-0": Array(5).fill([true,true]), "sage-1": Array(5).fill([true,true]),
  "sage-2": Array(5).fill([true,true]),
};
const manifest = { version: 1, sheets: {} };
const keyPixel = (r,g,b) => r > g+45 && b > g+40 && r > 100 && b > 100;
async function decode(id) {
  const file = await readFile(new URL(`${id}.png`, sources));
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const occupied = new Uint8Array(info.width*info.height);
  for(let p=0;p<occupied.length;p++)occupied[p]=data[p*4+3]>128&&!keyPixel(data[p*4],data[p*4+1],data[p*4+2])?1:0;
  return {file,data,...info,occupied,sha256:createHash('sha256').update(file).digest('hex')};
}
function boundaries(count,length,projection) {
  const cuts=[0];
  for(let i=1;i<count;i++) {
    const ideal=length*i/count, radius=length/count*.28;
    let best=Math.round(ideal), score=Infinity;
    for(let p=Math.floor(ideal-radius);p<ideal+radius;p++) {
      const value=projection[p]*100000+(projection[p-1]+projection[p+1])*1000+Math.abs(p-ideal);
      if(value<score){score=value;best=p;}
    }
    cuts.push(best);
  }
  cuts.push(length);return cuts;
}
function cells(source,rows) {
  const {width,height,occupied}=source;
  const xp=new Uint32Array(width),yp=new Uint32Array(height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(occupied[y*width+x]){xp[x]++;yp[y]++;}
  const xs=boundaries(8,width,xp), result=[];
  const columnYs=Array.from({length:8},(_,col)=>{
    const projection=new Uint32Array(height);
    for(let y=0;y<height;y++)for(let x=xs[col];x<xs[col+1];x++)projection[y]+=occupied[y*width+x];
    return boundaries(rows,height,projection);
  });
  for(let row=0;row<rows;row++)for(let col=0;col<8;col++) {
    const ys=columnYs[col];
    let l=width,t=height,r=-1,b=-1,n=0;
    for(let y=ys[row];y<ys[row+1];y++)for(let x=xs[col];x<xs[col+1];x++)if(occupied[y*width+x]){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);n++;}
    if(n<800||l<=xs[col]||t<=ys[row])throw new Error(`${source.id} clipped/empty row ${row} col ${col}: ${[l,t,r,b]}`);
    result.push({left:l,top:t,width:r-l+1,height:b-t+1});
  }
  return result;
}
for(const id of [...['raven','sunny','noir','sage'].flatMap(a=>[0,1,2].map(g=>`${a}-${g}`)),...['cast-0','cast-1','cast-2']]) {
  const npc=id.startsWith('cast-'), rows=npc?3:5;
  const source=await decode(id);source.id=id;
  const rects=cells(source,rows);
  const patch=id==='sunny-0'?await decode('sunny-0-patch'):null;
  const patchRects=patch?cells(patch,5):null;
  const cw=256,ch=352,composites=[],frames={},origins={},flips=[],sourceRects={};
  for(let row=0;row<rows;row++)for(let col=0;col<8;col++) {
    const i=row*8+col, usePatch=patch&&row===1;
    const src=usePatch?patch:source,rect=usePatch?patchRects[i]:rects[i];
    const frame=`${row}-${(npc?npcNames:names)[col]}`;
    const left=col*cw+Math.floor((cw-rect.width)/2),top=row*ch+ch-12-rect.height;
    composites.push({input:await sharp(src.file).extract(rect).png().toBuffer(),left,top});
    frames[frame]=[left,top,rect.width,rect.height];
    sourceRects[frame]={source:usePatch?'sunny-0-patch':id,rect:[rect.left,rect.top,rect.width,rect.height]};
    if(!npc&&col>=4) {
      const nativeLeft=col<6||backLeft[id][row][col-6];
      if(!nativeLeft)flips.push(frame);
      origins[frame]=[nativeLeft?0.68:0.32,0.77];
    }
  }
  const filename=`actions-${id}.webp`;
  const buffer=await sharp({create:{width:cw*8,height:ch*rows,channels:4,background:{r:255,g:0,b:255,alpha:1}}}).composite(composites).webp({lossless:true}).toBuffer();
  await writeFile(new URL(filename,output),buffer);
  manifest.sheets[`actions-${id}`]={url:`assets/pixel/actions/${filename}`,width:cw*8,height:ch*rows,frames,origins,flips,sourceRects,sourceSha256:source.sha256,patchSha256:patch?.sha256,bytes:buffer.length};
  console.log(`${filename}: ${Object.keys(frames).length} frames, ${buffer.length} bytes`);
}
await writeFile(new URL('manifest.json',output),JSON.stringify(manifest,null,2)+'\n');
