import {QUIZZES,QUIZ_ORGANISMS} from './quiz.js';
import {WebHunt} from './web-hunt.js';

export const WEB_ORGANISMS={...QUIZ_ORGANISMS,mouse:{name:'생쥐'},sparrow:{name:'참새'}};
export const WEB_POSITIONS={rice:[80,280],grasshopper:[300,125],mouse:[300,435],frog:[520,125],sparrow:[520,435],snake:[740,125],hawk:[900,280]};
export const WEB_STAGES=['intro','play','observe','reflect','complete'];
const chainToEdges=chain=>chain.slice(0,-1).map((food,i)=>[food,chain[i+1]]);
export const WEB_BASE_EDGES=chainToEdges(QUIZZES[3].chain);
// A small set of example relations, rather than a list of every possible diet.
export const WEB_EXTRA_EDGES=[['rice','mouse'],['mouse','snake'],['rice','sparrow'],['grasshopper','sparrow'],['sparrow','snake'],['sparrow','hawk']];
export const WEB_EDGES=[...WEB_BASE_EDGES,...WEB_EXTRA_EDGES];
export const WEB_PATHS=[QUIZZES[3].chain,['rice','mouse','snake','hawk'],['rice','grasshopper','sparrow','hawk'],['rice','sparrow','snake','hawk']];
export const webEdgeKey=(food,eater)=>food+'>'+eater;
export const webName=id=>WEB_ORGANISMS[id]?.name||'';
export const isWebEdge=(food,eater)=>WEB_EDGES.some(([a,b])=>a===food&&b===eater);
export const isBaseEdge=(food,eater)=>WEB_BASE_EDGES.some(([a,b])=>a===food&&b===eater);

export function webEdgeGeometry(food,eater){
  const [x1,y1]=WEB_POSITIONS[food],[x2,y2]=WEB_POSITIONS[eater],dx=x2-x1,dy=y2-y1;
  const offset=Math.min(58/Math.abs(dx||.001),70/Math.abs(dy||.001));
  const start=[x1+dx*offset,y1+dy*offset],end=[x2-dx*offset,y2-dy*offset];
  const c1=[start[0]+(end[0]-start[0])/3,start[1]+(end[1]-start[1])/3];
  const c2=[start[0]+(end[0]-start[0])*2/3,start[1]+(end[1]-start[1])*2/3];
  return {start,end,c1,c2,path:`M${start} C${c1} ${c2} ${end}`};
}
export class FoodWebActivity{
  constructor(){
    this.stage='intro';this.edges=WEB_BASE_EDGES.map(edge=>[...edge]);this.hunt=null;this.lastHuntEvent=0;
    this.selected=null;this.inspected=null;this.highlightPath=null;this.buildChecked=false;
    this.removed=null;this.observed=false;this.alternatives=new Set();this.reflection='';this.feedback='';
  }
  get complete(){return WEB_EDGES.every(([food,eater])=>this.hasEdge(food,eater));}
  get remaining(){return WEB_EDGES.length-this.edges.length;}
  hasEdge(food,eater){return this.edges.some(([a,b])=>a===food&&b===eater);}
  begin(){if(this.stage!=='intro')return false;this.stage='play';this.hunt=new WebHunt(WEB_EDGES);return true;}
  learn(food,eater){
    if(!isWebEdge(food,eater)||this.hasEdge(food,eater))return false;
    this.edges.push([food,eater]);return true;
  }
  tick(input,dt){
    if(this.stage!=='play')return;
    this.hunt.step(input,dt);
    for(const event of this.hunt.events)if(event.id>this.lastHuntEvent&&(event.type==='eat'||event.type==='caught'))this.learn(event.food,event.eater);
    this.lastHuntEvent=this.hunt.serial;
  }
  pause(){return this.stage==='play'&&this.hunt.pause();}
  resume(){return this.stage==='play'&&this.hunt.resume();}
  advanceHunt(){
    if(this.stage!=='play'||!this.hunt.next())return false;
    if(this.hunt.phase==='done'){
      if(!this.complete)throw new Error('먹이관계 기록을 확인해 주세요.');
      this.stage='observe';this.buildChecked=true;this.feedback='게임에서 만난 관계가 먹이그물에 모였어요. 개구리를 가려 다른 먹이도 찾아봐요.';
    }
    return true;
  }
  toggleFrog(){
    if(this.stage!=='observe')return false;
    this.removed=this.removed?null:'frog';this.inspected='snake';this.highlightPath=null;
    if(this.removed)this.observed=true;
    this.feedback=this.removed?'개구리와 이어진 관계만 흐리게 표시했어요. 뱀에게 남은 먹이 두 가지를 아래에서 찾아요.':'개구리가 다시 보여요. 가리기 전과 후를 비교해 보세요.';
    return true;
  }
  answerAlternative(id){
    if(this.stage!=='observe'||!this.observed||this.removed!=='frog')return false;
    if(this.hasEdge(id,'snake')&&id!=='frog'){
      this.alternatives.add(id);this.feedback=`뱀이 ${webName(id)}도 먹을 수 있어요. ${this.alternatives.size===2?'두 가지 먹이를 모두 찾았어요!':'또 다른 먹이도 찾아볼까요?'}`;return true;
    }
    this.feedback='지금 보이는 먹이그물에서 뱀 쪽으로 오는 화살표를 따라가 보세요.';return false;
  }
  inspect(id){if(!WEB_ORGANISMS[id])return false;this.inspected=this.inspected===id?null:id;this.highlightPath=null;return true;}
  showPath(index){if(!this.complete||!Number.isInteger(index)||!WEB_PATHS[index])return false;this.highlightPath=this.highlightPath===index?null:index;this.inspected=null;return true;}
  setReflection(text){this.reflection=String(text).slice(0,180);}
  next(){
    if(this.stage==='observe'&&this.observed&&this.alternatives.size===2){this.stage='reflect';this.removed=null;this.inspected=null;this.highlightPath=null;this.feedback='';}
    else if(this.stage==='reflect'&&this.reflection.trim()){this.stage='complete';this.reflection=this.reflection.trim();this.feedback='';}
    else return false;
    return true;
  }
  neighbors(id){
    const active=this.edges.filter(([a,b])=>a!==this.removed&&b!==this.removed);
    return {food:active.filter(([,eater])=>eater===id).map(([food])=>food),eaters:active.filter(([food])=>food===id).map(([,eater])=>eater)};
  }
}
