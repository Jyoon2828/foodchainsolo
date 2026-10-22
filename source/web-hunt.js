export const HUNT_WIDTH=1100,HUNT_HEIGHT=680;
export const HUNT_ROLES=['sparrow','mouse','snake','hawk'];
const huntClamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const huntDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const huntTurn=(angle,target,max)=>angle+huntClamp(Math.atan2(Math.sin(target-angle),Math.cos(target-angle)),-max,max);

export class WebHunt{
  constructor(diet,random=Math.random){
    this.diet=diet.map(edge=>[...edge]);this.random=random;this.level=0;this.t=0;this.serial=0;this.events=[];this.records=[];this.actorSerial=0;this.lastAction=0;
    this.loadLevel();
  }
  get role(){return HUNT_ROLES[this.level];}
  get foods(){return this.diet.filter(([,eater])=>eater===this.role).map(([food])=>food);}
  get remainingFoods(){return this.foods.filter(id=>!this.found.has(id));}
  canEat(food,eater){return this.diet.some(([a,b])=>a===food&&b===eater);}
  emit(type,extra={}){this.events.push({id:++this.serial,type,at:this.t,...extra});this.events=this.events.slice(-30);}
  makeActor(kind,x,y){
    return {uid:++this.actorSerial,kind,x,y,px:x,py:y,angle:this.random()*Math.PI*2,wander:this.random()*2,respawn:0,protect:0,vx:0,vy:0};
  }
  loadLevel(){
    this.phase='playing';this.lastAction=0;this.found=new Set();this.me=this.makeActor(this.role,550,340);this.me.protect=4;
    this.me.angle=0;this.cool=0;this.dash=0;this.actors=[];this.levelStarted=this.t;
    const foods=this.foods;
    foods.forEach((kind,index)=>{
      const count=kind==='rice'?5:6;
      for(let i=0;i<count;i++){
        const near=i===0,angle=-1.1+index*1.1;
        const x=near?550+Math.cos(angle)*(135+index*30):65+this.random()*(HUNT_WIDTH-130);
        const y=near?340+Math.sin(angle)*(135+index*30):75+this.random()*(HUNT_HEIGHT-150);
        this.actors.push(this.makeActor(kind,x,y));
      }
    });
    const enemies=this.diet.filter(([food])=>food===this.role).map(([,eater])=>eater);
    for(const [i,kind] of [...new Set(enemies)].entries())this.actors.push(this.makeActor(kind,i%2?1000:85,i%2?580:95));
  }
  next(){
    if(this.phase!=='roundEnd')return false;
    if(this.level===HUNT_ROLES.length-1){this.phase='done';return true;}
    this.level++;this.loadLevel();return true;
  }
  pause(){if(this.phase!=='playing')return false;this.phase='paused';return true;}
  resume(){if(this.phase!=='paused')return false;this.phase='playing';return true;}
  _move(actor,vx,vy,dt){
    actor.x=huntClamp(actor.x+vx*dt,35,HUNT_WIDTH-35);actor.y=huntClamp(actor.y+vy*dt,42,HUNT_HEIGHT-42);
  }
  _respawn(actor){
    // Keep new targets away from the learner and reset interpolation together.
    let x,y;
    for(let i=0;i<20;i++){x=60+this.random()*(HUNT_WIDTH-120);y=65+this.random()*(HUNT_HEIGHT-130);if(Math.hypot(x-this.me.x,y-this.me.y)>220)break;}
    actor.x=actor.px=x;actor.y=actor.py=y;actor.respawn=0;actor.protect=1;
  }
  step(input={},dt=1/60){
    if(this.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(dt,.05);this.t+=dt;const me=this.me;
    for(const actor of [me,...this.actors]){actor.px=actor.x;actor.py=actor.y;actor.protect=Math.max(0,actor.protect-dt);}
    this.cool=Math.max(0,this.cool-dt);this.dash=Math.max(0,this.dash-dt);
    if(me.respawn>0){
      me.respawn=Math.max(0,me.respawn-dt);
      if(me.respawn===0){me.x=me.px=550;me.y=me.py=340;me.protect=3;me.vx=me.vy=0;this.emit('respawn');}
    }else{
      let x=Number.isFinite(input.x)?input.x:0,y=Number.isFinite(input.y)?input.y:0;
      const length=Math.max(1,Math.hypot(x,y));x/=length;y/=length;
      if(Number.isInteger(input.action)&&input.action>this.lastAction){
        this.lastAction=input.action;
        if(this.cool===0){this.dash=.45;this.cool=3.5;this.emit('dash');}
      }
      if(Math.hypot(x,y)>.05)me.angle=Math.atan2(y,x);
      if(this.dash>0&&Math.hypot(x,y)<.05){x=Math.cos(me.angle);y=Math.sin(me.angle);}
      const speed=this.dash>0?360:218,blend=1-Math.exp(-dt*17);
      me.vx+=(x*speed-me.vx)*blend;me.vy+=(y*speed-me.vy)*blend;
      this._move(me,me.vx,me.vy,dt);
    }
    for(const actor of this.actors){
      if(actor.respawn>0){actor.respawn=Math.max(0,actor.respawn-dt);if(actor.respawn===0)this._respawn(actor);continue;}
      if(actor.kind==='rice')continue;
      actor.wander-=dt;const distance=huntDistance(actor,me),isFood=this.canEat(actor.kind,this.role),isEnemy=this.canEat(this.role,actor.kind);
      if(isFood&&distance<165&&me.respawn<=0)actor.targetAngle=Math.atan2(actor.y-me.y,actor.x-me.x);
      else if(isEnemy&&distance<200&&me.respawn<=0&&me.protect===0)actor.targetAngle=Math.atan2(me.y-actor.y,me.x-actor.x);
      else if(actor.wander<=0||actor.targetAngle===undefined){actor.targetAngle=actor.angle+(this.random()-.5)*1.6;actor.wander=1.3+this.random()*1.7;}
      if(actor.x<60)actor.targetAngle=0;if(actor.x>HUNT_WIDTH-60)actor.targetAngle=Math.PI;
      if(actor.y<65)actor.targetAngle=Math.PI/2;if(actor.y>HUNT_HEIGHT-65)actor.targetAngle=-Math.PI/2;
      actor.angle=huntTurn(actor.angle,actor.targetAngle,2.7*dt);
      const speed=isEnemy?98:actor.kind==='sparrow'?116:actor.kind==='mouse'?110:98;
      actor.vx=Math.cos(actor.angle)*speed;actor.vy=Math.sin(actor.angle)*speed;this._move(actor,actor.vx,actor.vy,dt);
    }
    if(me.respawn>0)return;
    for(const actor of this.actors){
      if(actor.respawn>0||huntDistance(me,actor)>35)continue;
      if(this.canEat(actor.kind,this.role)){
        actor.respawn=2.3;this.found.add(actor.kind);this.emit('eat',{food:actor.kind,eater:this.role});
        if(this.remainingFoods.length===0){
          this.phase='roundEnd';this.records.push({role:this.role,foods:[...this.found],elapsed:this.t-this.levelStarted});this.emit('roundDone');break;
        }
      }else if(me.protect===0&&actor.protect===0&&this.canEat(this.role,actor.kind)){
        me.respawn=2;me.vx=me.vy=0;this.dash=0;this.emit('caught',{food:this.role,eater:actor.kind});break;
      }
    }
  }
}
