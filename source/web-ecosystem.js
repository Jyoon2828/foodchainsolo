import {QUIZ_ORGANISMS,QUIZZES} from './quiz.js';

export const WEB_ORGANISMS={
  ...QUIZ_ORGANISMS,
  clover:{name:'토끼풀',role:-1},mouse:{name:'생쥐',role:2,skill:'잠시 숨기'},
  sparrow:{name:'참새',role:3,skill:'빠르게 날기'},spider:{name:'거미',role:2,skill:'잠시 숨기'},
  rabbit:{name:'토끼',role:0,skill:'멀리 뛰기'}
};
export const WEB_ANIMALS=['grasshopper','frog','spider','mouse','sparrow','rabbit','snake','hawk'];
export const WEB_POSITIONS={rice:[80,180],clover:[80,520],grasshopper:[285,105],mouse:[285,330],rabbit:[285,555],sparrow:[490,230],spider:[490,460],frog:[695,95],snake:[695,365],hawk:[920,475]};
export const WEB_BOARD_HEIGHT=660;
export const WEB_STAGES=['intro','play','observe','reflect','complete'];
export const WEB_BASE_EDGES=QUIZZES[3].chain.slice(0,-1).map((food,i)=>[food,QUIZZES[3].chain[i+1]]);
// Examples for a classroom model; real diets vary with species, size and season.
export const WEB_EXTRA_EDGES=[['rice','mouse'],['mouse','snake'],['rice','sparrow'],['grasshopper','sparrow'],['sparrow','snake'],['sparrow','hawk'],['clover','grasshopper'],['clover','rabbit'],['grasshopper','spider'],['spider','frog'],['spider','sparrow'],['mouse','hawk'],['rabbit','hawk']];
export const WEB_EDGES=[...WEB_BASE_EDGES,...WEB_EXTRA_EDGES];
export const WEB_PATHS=[QUIZZES[3].chain,['clover','grasshopper','spider','frog','snake','hawk'],['clover','rabbit','hawk'],['rice','mouse','snake','hawk'],['rice','grasshopper','sparrow','hawk']];
export const webEdgeKey=(food,eater)=>food+'>'+eater;
export const webName=id=>WEB_ORGANISMS[id]?.name||'';
export const isWebEdge=(food,eater)=>WEB_EDGES.some(([a,b])=>a===food&&b===eater);
export const isBaseEdge=(food,eater)=>WEB_BASE_EDGES.some(([a,b])=>a===food&&b===eater);
export const webFoods=eater=>WEB_EDGES.filter(([,id])=>id===eater).map(([food])=>food);
export const webPredators=food=>WEB_EDGES.filter(([id])=>id===food).map(([,eater])=>eater);
export function webEdgeGeometry(food,eater){
  const startCenter=WEB_POSITIONS[food],endCenter=WEB_POSITIONS[eater];
  let c1=[startCenter[0]+(endCenter[0]-startCenter[0])/3,startCenter[1]+(endCenter[1]-startCenter[1])/3];
  let c2=[startCenter[0]+(endCenter[0]-startCenter[0])*2/3,startCenter[1]+(endCenter[1]-startCenter[1])*2/3];
  if(food==='sparrow'&&eater==='hawk'){c1=[650,190];c2=[885,240];}
  if(food==='mouse'&&eater==='hawk'){c1=[400,700];c2=[810,650];}
  if(food==='rabbit'&&eater==='hawk'){c1=[440,610];c2=[790,610];}
  const edge=(center,toward)=>{const dx=toward[0]-center[0],dy=toward[1]-center[1],t=Math.min(58/Math.abs(dx||.001),70/Math.abs(dy||.001));return [center[0]+dx*t,center[1]+dy*t];};
  const start=edge(startCenter,c1),end=edge(endCenter,c2);
  return {start,end,c1,c2,path:`M${start} C${c1} ${c2} ${end}`};
}

export function webAsAnimal(id){const name=webName(id),tail=(name.charCodeAt(name.length-1)-0xac00)%28;return name+(tail>0&&tail!==8?"으로":"로");}
