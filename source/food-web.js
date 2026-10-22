import {WebHunt} from './web-hunt.js';
import {WEB_ANIMALS,WEB_BASE_EDGES,WEB_EDGES,WEB_ORGANISMS,WEB_PATHS,webEdgeKey,webName,isWebEdge} from './web-ecosystem.js';

export class FoodWebActivity{
  constructor(){
    this.stage='intro';this.selected=null;this.duration=90;this.hunt=null;this.lastHuntEvent=0;
    this.edges=WEB_BASE_EDGES.map(edge=>[...edge]);this.encountered=new Set();this.records=[];
    this.inspected=null;this.highlightPath=null;this.removed=null;this.observed=false;this.alternatives=new Set();this.reflection='';this.feedback='';
  }
  get complete(){return WEB_EDGES.every(([food,eater])=>this.hasEdge(food,eater));}
  get remaining(){return WEB_EDGES.length-this.edges.length;}
  hasEdge(food,eater){return this.edges.some(([a,b])=>a===food&&b===eater);}
  selectAnimal(id){if(this.stage!=='intro'||!WEB_ANIMALS.includes(id))return false;this.selected=id;return true;}
  begin(duration=this.duration,density=3){
    if(this.stage!=='intro'||!WEB_ANIMALS.includes(this.selected))return false;
    this.duration=[60,90,120].includes(Number(duration))?Number(duration):90;
    this.hunt=new WebHunt(this.selected,{duration:this.duration,density});this.lastHuntEvent=0;this.stage='play';return true;
  }
  learn(food,eater){
    if(!isWebEdge(food,eater))return false;
    const key=webEdgeKey(food,eater),fresh=!this.encountered.has(key);this.encountered.add(key);
    if(!this.hasEdge(food,eater))this.edges.push([food,eater]);return fresh;
  }
  tick(input,dt){
    if(this.stage!=='play')return;this.hunt.step(input,dt);
    for(const event of this.hunt.events)if(event.id>this.lastHuntEvent&&event.food&&(event.hunter==='me'||event.prey==='me'))this.learn(event.food,event.eater);
    this.lastHuntEvent=this.hunt.serial;
  }
  pause(){return this.stage==='play'&&this.hunt.pause();}
  resume(){return this.stage==='play'&&this.hunt.resume();}
  endTrial(){if(this.stage!=='play'||!['playing','paused'].includes(this.hunt.phase))return false;return this.hunt.finish();}
  answerQuiz(id){
    if(this.stage!=='play'||this.hunt.phase!=='between')return false;
    const correct=this.hunt.quiz.choose(id);
    if(correct&&!this.hunt.record.saved){this.hunt.record.saved=true;this.records.push(this.hunt.record);}
    return correct;
  }
  chooseAgain(){
    if(this.stage==='play'&&!this.hunt?.quiz?.solved)return false;
    this.stage='intro';this.hunt=null;this.inspected=null;this.removed=null;this.highlightPath=null;return true;
  }
  review(){
    if(!this.records.length||this.stage==='play'&&!this.hunt?.quiz?.solved)return false;
    this.stage='observe';this.removed=null;this.inspected=null;this.highlightPath=null;
    this.feedback='그림은 숲의 대표 먹이관계예요. 내가 직접 만난 관계는 진한 금색으로 보여요.';return true;
  }
  toggleFrog(){
    if(this.stage!=='observe')return false;
    this.removed=this.removed?null:'frog';this.inspected='snake';this.highlightPath=null;if(this.removed)this.observed=true;
    this.feedback=this.removed?'개구리와 이어진 관계만 흐리게 표시했어요. 뱀에게 남은 먹이 두 가지를 찾아요.':'개구리가 다시 보여요. 가리기 전과 후를 비교해 보세요.';return true;
  }
  answerAlternative(id){
    if(this.stage!=='observe'||!this.observed||this.removed!=='frog')return false;
    if(isWebEdge(id,'snake')&&id!=='frog'){
      this.alternatives.add(id);this.feedback=`뱀은 ${webName(id)}도 먹을 수 있어요. ${this.alternatives.size===2?'두 가지 먹이를 모두 찾았어요!':'또 다른 먹이도 찾아볼까요?'}`;return true;
    }
    this.feedback='그림에서 뱀 쪽으로 오는 먹이관계를 다시 살펴봐요.';return false;
  }
  inspect(id){if(!WEB_ORGANISMS[id])return false;this.inspected=this.inspected===id?null:id;this.highlightPath=null;return true;}
  showPath(index){if(!Number.isInteger(index)||!WEB_PATHS[index])return false;this.highlightPath=this.highlightPath===index?null:index;this.inspected=null;return true;}
  setReflection(text){this.reflection=String(text).slice(0,180);}
  next(){
    if(this.stage==='observe'&&this.observed&&this.alternatives.size===2){this.stage='reflect';this.removed=null;this.inspected=null;this.highlightPath=null;this.feedback='';}
    else if(this.stage==='reflect'&&this.reflection.trim()){this.stage='complete';this.reflection=this.reflection.trim();this.feedback='';}
    else return false;return true;
  }
  neighbors(id){
    const active=WEB_EDGES.filter(([a,b])=>a!==this.removed&&b!==this.removed);
    return {food:active.filter(([,eater])=>eater===id).map(([food])=>food),eaters:active.filter(([food])=>food===id).map(([,eater])=>eater)};
  }
}
