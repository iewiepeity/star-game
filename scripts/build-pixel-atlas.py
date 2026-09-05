# Read-only pixel analysis: exports frame rectangles. Source artwork is untouched.
from pathlib import Path
from PIL import Image
import numpy as np, json
base=Path('assets/pixel')
def runs(values,gap=4):
 idx=np.flatnonzero(values)
 if not len(idx):return []
 out=[]; start=last=int(idx[0])
 for i in idx[1:]:
  i=int(i)
  if i-last>gap:out.append((start,last+1));start=i
  last=i
 out.append((start,last+1));return out

def bounds(path,rows):
 a=np.asarray(Image.open(path).convert('RGBA')).astype(int)
 mask=(a[:,:,3]>128)&~((a[:,:,0]>a[:,:,1]+45)&(a[:,:,2]>a[:,:,1]+40)&(a[:,:,0]>100)&(a[:,:,2]>100))
 if path.stem.startswith('poses-'):
  sums=mask.sum(axis=1); cuts=[0]
  for i in range(1,rows):
   mid=round(mask.shape[0]*i/rows); start=max(cuts[-1]+25,mid-36); end=min(mask.shape[0],mid+36)
   candidates=np.flatnonzero(sums[start:end]==sums[start:end].min())+start
   cuts.append(int(min(candidates,key=lambda y:abs(y-mid))))
  cuts.append(mask.shape[0]); rr=list(zip(cuts,cuts[1:]))
 else: rr=[(t,b) for t,b in runs(mask.sum(axis=1)>10,8) if b-t>25]
 if len(rr)!=rows:raise Exception((path.name,'rows',rr))
 out=[]
 for t,b in rr:
  xs=[(l,r) for l,r in runs(mask[t:b].sum(axis=0)>2,8) if r-l>20]
  row=[]
  for l,r in xs:
   yy,xx=np.where(mask[t:b,l:r]);row.append([int(l+xx.min()),int(t+yy.min()),int(xx.max()-xx.min()+1),int(yy.max()-yy.min()+1)])
  out.append(row)
 return out

manifest={'frames':{},'flips':{},'seats':{},'sourceRows':{}}
for path in sorted((base/'cast').glob('*.webp')):
 rows=bounds(path,3);key=path.stem;frames={};flips=[]
 for row,rects in enumerate(rows):
  assert len(rects)==8,(key,row,len(rects))
  # Cast0/Cast2 have right,left profiles. Cast1's two idle profiles both face left.
  for moving in [False,True]:
   left,right=(2,1) if key!='cast-1' or moving else (1,1)
   if moving:left,right=6,5
   for direction,col in enumerate([4 if moving else 0,left,right,7 if moving else 3]):
    name=f'{row}-{"walk" if moving else "idle"}-{direction}';frames[name]=rects[col]
    if key=='cast-1' and not moving and direction==2:flips.append(name)
 manifest['frames'][key]=frames;manifest['flips'][key]=flips;manifest['sourceRows'][key]=rows
for path in sorted((base/'wardrobe').glob('wardrobe-*.webp')):
 rows=bounds(path,5);key=path.stem;frames={};flips=[]
 for row,rects in enumerate(rows):
  assert len(rects) in [11,12],(key,row,len(rects))
  for moving in [False,True]:
   if moving:
    left=6 if key=='wardrobe-noir-0' else 5
    facingRight=key in ['wardrobe-raven-1','wardrobe-sunny-1','wardrobe-noir-1','wardrobe-noir-2','wardrobe-sage-0','wardrobe-sage-1','wardrobe-sage-2']
    if key=='wardrobe-sunny-0':right=6
    elif key=='wardrobe-noir-0':right=5
    else:right=left
    front,back=4,3 if key=='wardrobe-sage-0' else 7
   else:front,left,right,back=0,1,1,3;facingRight=False
   for direction,col in enumerate([front,left,right,back]):
    name=f'{row}-{"walk" if moving else "idle"}-{direction}';frames[name]=rects[col]
    if direction==1 and facingRight or direction==2 and not facingRight and key not in ['wardrobe-sunny-0','wardrobe-noir-0']:flips.append(name)
    if not moving and direction==2 and name not in flips:flips.append(name)
 manifest['frames'][key]=frames;manifest['flips'][key]=flips;manifest['sourceRows'][key]=rows
for path in sorted((base/'wardrobe').glob('poses-*.webp')):
 rows=bounds(path,5);key=path.stem;frames={};flips=[]
 for row,rects in enumerate(rows):
  assert len(rects)==4,(key,row,len(rects))
  for col,pose in enumerate(['seat-front','seat-back','rest','read']):frames[f'{row}-{pose}']=rects[col]
 manifest['frames'][key]=frames;manifest['flips'][key]=flips;manifest['sourceRows'][key]=rows
 manifest['seats'][key]=[[[.67,.78],[.62,.83]] for _ in range(5)]
(base/'atlas-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
print('Exported atlases:',len(manifest['frames']),'frames:',sum(len(x) for x in manifest['frames'].values()))
