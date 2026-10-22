import {organismPicture} from './quiz-view.js';
import {drawOrganismImage} from './render.js';
import {WEB_ASSET_FRAMES} from './web-asset-frames.js';
import {webName} from './web-ecosystem.js';

const webAnimalSheet=new Image();webAnimalSheet.src='./assets/web-animals-pixel.png';
const webCloverImage=new Image();webCloverImage.src='./assets/clover-pixel.png';
export function installWebArtwork(){
  document.documentElement.style.setProperty('--web-animal-sheet',`url("${webAnimalSheet.src}")`);
  document.documentElement.style.setProperty('--web-clover-image',`url("${webCloverImage.src}")`);
}
function webPictureStyle(id){
  const data=WEB_ASSET_FRAMES[id],f=data.frames[0],[w,h]=id==='clover'?WEB_ASSET_FRAMES.plantSize:WEB_ASSET_FRAMES.sheetSize,max=Math.max(f.w,f.h);
  return `--sprite-width:${f.w/max*100}%;--sprite-height:${f.h/max*100}%;--sprite-left:${(1-f.w/max)*50}%;--sprite-top:${(1-f.h/max)*50}%;--sprite-size:${w/f.w*100}% ${h/f.h*100}%;--sprite-position:${f.x/(w-f.w)*100}% ${f.y/(h-f.h)*100}%;`;
}
export function webPicture(id){
  return WEB_ASSET_FRAMES[id]?`<i class="web-new-animal web-image-${id}" style="${webPictureStyle(id)}" aria-hidden="true"></i><b>${webName(id)}</b>`:organismPicture(id);
}
export function drawWebPicture(c,id,x,y,size){
  const data=WEB_ASSET_FRAMES[id];if(!data)return drawOrganismImage(c,id,x,y,size);
  const img=id==='clover'?webCloverImage:webAnimalSheet;if(!img.complete||!img.naturalWidth)return false;
  const f=data.frames[0],scale=size/Math.max(f.w,f.h);
  c.drawImage(img,f.x,f.y,f.w,f.h,x-f.w*scale/2,y-f.h*scale/2,f.w*scale,f.h*scale);return true;
}
function drawWebPawn(c,p,facing,size){
  const data=WEB_ASSET_FRAMES[p.kind];if(!data||p.kind==='clover')return false;
  if(webAnimalSheet.complete&&webAnimalSheet.naturalWidth){const f=data.frames[facing]||data.frames[0],scale=size/data.size;c.drawImage(webAnimalSheet,f.x,f.y,f.w,f.h,-f.w*scale/2,-f.h*scale,f.w*scale,f.h*scale);}
  return true;
}
export const webRendererArtwork={
  drawAnimal:drawWebPawn,nameFor:p=>webName(p.kind),
  drawPlant:(c,p,x,y,size)=>p.kind==='clover'&&drawWebPicture(c,'clover',x,y-size/2,size),
  eventText:event=>`${webName(event.food)} → ${webName(event.eater)}`
};
export function webMealCard(eater,food){
  return `<div class="web-meal-card"><div><small>먹는 생물</small>${webPicture(eater)}</div><b class="meal-word">먹어요</b><div><small>먹이</small>${webPicture(food)}</div></div>`;
}
