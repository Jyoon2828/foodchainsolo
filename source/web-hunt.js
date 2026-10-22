import {W,H,createWorld,addPlayer,startRound,step,resolvePosition,dist,ROLES,findPath} from './engine.js';
import {PictureQuiz} from './quiz.js';
import {WEB_ORGANISMS,WEB_ANIMALS,WEB_EDGES,webFoods,webName,isWebEdge} from './web-ecosystem.js';

export const HUNT_WIDTH=W,HUNT_HEIGHT=H;
export const HUNT_ROLES=WEB_ANIMALS;
const webGoals={grasshopper:5,frog:3,spider:3,mouse:4,sparrow:4,rabbit:5,snake:3,hawk:3};
export class WebHunt{
  constructor(kind,{duration=90,density=3,random=Math.random}={}){
    if(!WEB_ANIMALS.includes(kind))throw new Error('체험할 동물을 골라 주세요.');
    this.role=kind;this.random=random;this.found=new Set();this.foodCounts={};this.lastEvent=0;this.quiz=null;this.record=null;
    const seconds=[60,90,120].includes(Number(duration))?Number(duration):90;
    this.world=createWorld(seconds,0);this.world.foodWeb=true;this.world.diet=WEB_EDGES.map(edge=>[...edge]);
    this.me=addPlayer(this.world,'me',{label:'나'});this.me.base=WEB_ORGANISMS[kind].role;this.me.kind=kind;
    const scale=Math.max(1,Math.min(4,Number(density)||3))/3;
    for(const id of WEB_ANIMALS){
      const count=Math.max(1,Math.round((this.foods.includes(id)?6:2)*scale));
      for(let i=0;i<count;i++){
        const actor=addPlayer(this.world,`web_${id}_${i}`,{base:WEB_ORGANISMS[id].role+4*i,label:webName(id)},true);
        actor.kind=id;actor.speedFactor=[.64,.72,.74,.76][actor.role];
      }
    }
    startRound(this.world,0);
    for(const actor of this.actors){
      const point=resolvePosition(70+random()*(W-140),80+random()*(H-160));actor.x=point.x;actor.y=point.y;
      if(dist(actor,this.me)<170){const far=resolvePosition(Math.max(70,Math.min(W-70,this.me.x+400)),Math.max(80,Math.min(H-80,this.me.y+260)));actor.x=far.x;actor.y=far.y;}
    }
    for(const [index,id] of this.foods.filter(id=>WEB_ANIMALS.includes(id)).entries()){
      this.actors.filter(actor=>actor.kind===id).slice(0,3).forEach((actor,j)=>{
        const angle=index*1.3+j*2.1;
        const x=Math.max(70,Math.min(W-70,this.me.x+Math.cos(angle)*(240+j*40)));
        const y=Math.max(80,Math.min(H-80,this.me.y+Math.sin(angle)*(240+j*40)));
        const point=resolvePosition(x,y);
        actor.x=point.x;actor.y=point.y;
      });
    }
    this.world.plants.forEach(plant=>plant.kind='rice');
    const clover=Array.from({length:24},(_,i)=>{
      const point=resolvePosition(260+(i%8)*190,250+Math.floor(i/8)*330);
      return {id:24+i,kind:'clover',x:point.x,y:point.y,ready:0};
    });
    this.world.plants.push(...clover);
  }
  get phase(){return this.world.phase;}
  get t(){return this.world.t;}
  get serial(){return this.world.serial;}
  get events(){return this.world.events;}
  get actors(){return Object.values(this.world.players).filter(p=>p.bot);}
  get foods(){return webFoods(this.role);}
  get remainingFoods(){return this.foods.filter(id=>!this.found.has(id));}
  get mission(){
    const goal=Math.max(1,Math.ceil(webGoals[this.role]*this.world.duration/90)),types=Math.min(2,this.foods.length);
    return {goal,count:this.me.fed,types,found:this.found.size,complete:this.me.fed>=goal&&this.found.size>=types};
  }
  get skill(){return WEB_ORGANISMS[this.role].skill||ROLES[this.me.role].skill;}
  canEat(food,eater){return isWebEdge(food,eater);}
  step(input={},dt=1/60){
    if(this.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;
    step(this.world,{me:input},Math.min(dt,.12));
    for(const event of this.events)if(event.id>this.lastEvent&&event.hunter==='me'&&event.food){this.found.add(event.food);this.foodCounts[event.food]=(this.foodCounts[event.food]||0)+1;}
    this.lastEvent=this.serial;if(this.phase==='between')this.finish();
  }
  finish(){
    if(this.record)return false;
    this.world.phase='between';
    const foods=this.foods,answer=[...this.found][0]||foods[0],falseChoices=Object.keys(WEB_ORGANISMS).filter(id=>id!==this.role&&!foods.includes(id));
    const choices=[falseChoices[0],answer,falseChoices.at(-1)];
    const name=webName(this.role),subject=(name.charCodeAt(name.length-1)-44032)%28===0?'는':'은',food=webName(answer),last=food.charCodeAt(food.length-1),object=(last-44032)%28===0?'를':'을';
    this.quiz=new PictureQuiz(this.me.role,{mode:'food',subject:this.role,choices,answer,question:`이 놀이에서 ${name}의 먹이를 그림에서 골라요.`,explanation:`${name}${subject} ${food}${object} 먹어요.`});
    this.record={kind:this.role,count:this.me.fed,caught:this.me.caught,foods:[...this.found],foodCounts:{...this.foodCounts},elapsed:this.t,duration:this.world.duration,mission:{...this.mission}};
    return true;
  }
  pause(){if(this.phase!=='playing')return false;this.world.phase='paused';return true;}
  resume(){if(this.phase!=='paused')return false;this.world.phase='playing';return true;}
}
