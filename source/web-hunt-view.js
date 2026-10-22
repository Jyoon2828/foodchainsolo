import {HUNT_WIDTH,HUNT_HEIGHT} from './web-hunt.js';
import {webName} from './food-web.js';
import {drawWebPicture,webMealCard} from './web-art.js';
import {drawForestProp} from './render.js';

export class WebHuntGame{
  constructor(canvas,activity,{audio,onAdvance,onUpdate}={}){
    this.canvas=canvas;this.c=canvas.getContext('2d');this.activity=activity;this.audio=audio;
    this.onAdvance=onAdvance;this.onUpdate=onUpdate;this.keys=new Set();this.joy={x:0,y:0};
    this.target=null;this.action=0;this.accumulator=0;this.lastSound=activity.hunt.serial;this.lastHUD=0;this.lastPhase=activity.hunt.phase;
    this.camera={x:0,y:0};this.facing=new Map();this.bookResume=false;
    const get=id=>document.getElementById(id);this.get=get;
    this.observer=new ResizeObserver(()=>this.fit());this.observer.observe(canvas);this.fit();
    this.onKey=e=>{
      if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||get('helpDialog').open||get('soundDialog').open||!get('huntNotebook').hidden)return;
      const key=e.key.startsWith('Arrow')?e.key:e.key.toLowerCase();
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(key)){
        if(key===' '&&document.activeElement?.tagName==='BUTTON')return;
        e.preventDefault();if(key===' '&&!e.repeat)this.action++;else this.keys.add(key);
      }else if(['w','a','s','d'].includes(key))this.keys.add(key);
    };
    this.onKeyUp=e=>this.keys.delete(e.key.startsWith('Arrow')?e.key:e.key.toLowerCase());
    document.addEventListener('keydown',this.onKey);document.addEventListener('keyup',this.onKeyUp);
    canvas.onpointerdown=e=>{
      if(activity.hunt.phase!=='playing')return;e.preventDefault();const r=canvas.getBoundingClientRect();
      this.target={x:this.camera.x+(e.clientX-r.left)/this.scale,y:this.camera.y+(e.clientY-r.top)/this.scale};
    };
    const joystick=get('huntJoystick');
    const move=e=>{
      const r=joystick.getBoundingClientRect(),max=r.width*.3,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.max(max,Math.hypot(dx,dy));
      this.joy.x=dx/len;this.joy.y=dy/len;this.target=null;get('huntStick').style.transform=`translate(${this.joy.x*max}px,${this.joy.y*max}px)`;
    };
    joystick.onpointerdown=e=>{if(activity.hunt.phase!=='playing')return;e.preventDefault();this.pointer=e.pointerId;joystick.setPointerCapture(this.pointer);move(e);};
    joystick.onpointermove=e=>{if(e.pointerId===this.pointer)move(e);};
    joystick.onpointerup=joystick.onpointercancel=joystick.onlostpointercapture=()=>this.clearInput();
    get('huntDash').onpointerdown=e=>{e.preventDefault();this.action++;};
    get('huntDash').onclick=e=>{if(e.detail===0)this.action++;};
    get('huntPause').onclick=()=>{if(!activity.pause()){audio?.unlock();activity.resume();}this.clearInput();this.onUpdate?.();};
    get('huntResume').onclick=()=>{audio?.unlock();activity.resume();this.clearInput();this.onUpdate?.();};
    get('huntAdvance').onclick=()=>{audio?.unlock();if(activity.advanceHunt())this.onAdvance?.();};
    get('huntBook').onclick=()=>{
      this.bookResume=activity.pause();this.clearInput();get('huntNotebookMeals').innerHTML=activity.edges.map(([food,eater])=>webMealCard(eater,food)).join('');get('huntNotebook').hidden=false;this.onUpdate?.();
    };
    get('closeHuntBook').onclick=()=>{get('huntNotebook').hidden=true;if(this.bookResume)activity.resume();this.bookResume=false;this.onUpdate?.();};
  }
  clearInput(){this.keys.clear();this.joy.x=this.joy.y=0;this.pointer=null;this.target=null;if(this.get('huntStick'))this.get('huntStick').style.transform='';}
  backgroundPause(){this.activity.pause();this.bookResume=false;this.clearInput();}
  dispose(){
    this.observer.disconnect();document.removeEventListener('keydown',this.onKey);document.removeEventListener('keyup',this.onKeyUp);this.clearInput();this.canvas.onpointerdown=null;
  }
  fit(){
    const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);this.dpr=Math.min(globalThis.devicePixelRatio||1,1.6);
    this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);this.scale=Math.max(this.width/HUNT_WIDTH,this.height/HUNT_HEIGHT);
    this.c.imageSmoothingEnabled=false;
    const me=this.activity.hunt.me;this.camera.x=Math.max(0,Math.min(HUNT_WIDTH-this.width/this.scale,me.x-this.width/this.scale/2));this.camera.y=Math.max(0,Math.min(HUNT_HEIGHT-this.height/this.scale,me.y-this.height/this.scale/2));
  }
  input(){
    let x=this.joy.x+(this.keys.has('ArrowRight')||this.keys.has('d')?1:0)-(this.keys.has('ArrowLeft')||this.keys.has('a')?1:0);
    let y=this.joy.y+(this.keys.has('ArrowDown')||this.keys.has('s')?1:0)-(this.keys.has('ArrowUp')||this.keys.has('w')?1:0);
    if(Math.hypot(x,y)>.05)this.target=null;
    else if(this.target){const me=this.activity.hunt.me,dx=this.target.x-me.x,dy=this.target.y-me.y,d=Math.hypot(dx,dy);if(d>11){x=dx/d;y=dy/d;}else this.target=null;}
    const d=Math.max(1,Math.hypot(x,y));return {x:x/d,y:y/d,action:this.action};
  }
  frame(elapsed,now){
    const hunt=this.activity.hunt;
    if(hunt.phase==='playing'){
      this.accumulator+=Math.min(.1,elapsed);
      while(this.accumulator>=1/60&&hunt.phase==='playing'){this.activity.tick(this.input(),1/60);this.accumulator-=1/60;}
    }else this.accumulator=0;
    if(hunt.phase!==this.lastPhase){this.lastPhase=hunt.phase;this.onUpdate?.();}
    for(const event of hunt.events)if(event.id>this.lastSound){
      if(event.type==='eat')this.audio?.effect('eat');if(event.type==='caught')this.audio?.effect('caught');if(event.type==='dash')this.audio?.effect('dive');if(event.type==='roundDone')this.audio?.effect('mission');
      if(event.type==='eat'||event.type==='caught')this.meal=event;
    }
    this.lastSound=hunt.serial;this.draw(hunt.phase==='playing'?this.accumulator*60:1,elapsed);
    if(now-this.lastHUD>80){this.lastHUD=now;this.updateHUD();}
  }
  updateHUD(){
    const h=this.activity.hunt,g=this.get;
    for(const id of h.foods){g('huntGoal-'+id).classList.toggle('found',h.found.has(id));g('huntFound-'+id).textContent=h.found.has(id)?'✓ 먹었어요':'찾아 먹기';}
    g('huntLearned').textContent=`발견한 관계 ${this.activity.edges.length} / 10`;
    g('huntCooldown').textContent=h.cool>0?`${h.cool.toFixed(1)}초 뒤`:'준비 완료';
    g('huntRespawn').hidden=h.me.respawn<=0;if(h.me.respawn>0)g('huntRespawn').textContent=`다시 출발해요! ${h.me.respawn.toFixed(1)}초 뒤`;
    g('huntPaused').hidden=h.phase!=='paused'||!g('huntNotebook').hidden||g('helpDialog').open||g('soundDialog').open;
    g('huntPause').textContent=h.phase==='paused'?'계속하기':'잠깐 멈춤';
    g('huntRoundDone').hidden=h.phase!=='roundEnd';
    if(h.phase==='roundEnd'&&!this.resultPainted){g('huntRoundMeals').innerHTML=h.foods.map(food=>webMealCard(h.role,food)).join('');this.resultPainted=true;}
    if(this.meal&&h.t-this.meal.at<1.8){
      if(this.shownMeal!==this.meal.id){g('huntMealToast').innerHTML=webMealCard(this.meal.eater,this.meal.food);this.shownMeal=this.meal.id;}g('huntMealToast').hidden=false;
    }else g('huntMealToast').hidden=true;
  }
  draw(alpha,elapsed){
    const h=this.activity.hunt,c=this.c,me=h.me,lerp=a=>({x:a.px+(a.x-a.px)*alpha,y:a.py+(a.y-a.py)*alpha});
    const p=lerp(me),vw=this.width/this.scale,vh=this.height/this.scale,blend=1-Math.exp(-Math.min(elapsed,.1)*10);
    this.camera.x+=(Math.max(0,Math.min(HUNT_WIDTH-vw,p.x-vw/2))-this.camera.x)*blend;
    this.camera.y+=(Math.max(0,Math.min(HUNT_HEIGHT-vh,p.y-vh/2))-this.camera.y)*blend;
    const pixel=this.scale*this.dpr,camX=Math.round(this.camera.x*pixel)/pixel,camY=Math.round(this.camera.y*pixel)/pixel;
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#b4d58e';c.fillRect(0,0,this.width,this.height);
    c.save();c.scale(this.scale,this.scale);c.translate(-camX,-camY);
    c.fillStyle='#a6ca7b';for(let x=20;x<HUNT_WIDTH;x+=48)for(let y=25;y<HUNT_HEIGHT;y+=46){c.fillRect(x,y,3,6);c.fillRect(x+4,y+2,3,4);}
    for(let x=35;x<HUNT_WIDTH;x+=105){drawForestProp(c,0,x,7,105);drawForestProp(c,0,x,HUNT_HEIGHT-6,105);}
    for(let y=115;y<HUNT_HEIGHT-70;y+=110){drawForestProp(c,0,0,y,105);drawForestProp(c,0,HUNT_WIDTH,y,105);}
    for(const actor of [...h.actors,me].filter(a=>a.respawn<=0).sort((a,b)=>a.y-b.y)){
      const pos=lerp(actor),x=Math.round(pos.x*pixel)/pixel,y=Math.round(pos.y*pixel)/pixel,isMe=actor===me,food=h.canEat(actor.kind,h.role),enemy=h.canEat(h.role,actor.kind);
      c.fillStyle='#527a3a30';c.beginPath();c.ellipse(x,y+17,actor.kind==='rice'?18:23,7,0,0,7);c.fill();
      if(isMe||food||enemy){c.strokeStyle=isMe?'#fffef2':food?'#ffe59b':'#c9957a';c.lineWidth=isMe?3:2;c.beginPath();c.ellipse(x,y+15,isMe?29:26,10,0,0,7);c.stroke();}
      if(isMe&&me.protect>0){c.strokeStyle='#fff0a1';c.lineWidth=2;c.setLineDash([5,5]);c.beginPath();c.ellipse(x,y-3,34,39,0,0,7);c.stroke();c.setLineDash([]);}
      const vx=actor.vx||0;let facing=this.facing.get(actor.uid)||1;if(Math.abs(vx)>20)facing=vx<0?-1:1;this.facing.set(actor.uid,facing);
      const moving=Math.min(1,Math.hypot(actor.vx||0,actor.vy||0)/130),bob=actor.kind==='snake'?0:Math.sin(h.t*5+actor.uid)*.7*moving;
      c.save();c.translate(x,y-8-bob);if((actor.kind==='sparrow'&&facing>0)||(actor.kind==='mouse'&&facing<0))c.scale(-1,1);
      drawWebPicture(c,actor.kind,0,0,isMe?64:actor.kind==='rice'?44:55);c.restore();
      c.textAlign='center';c.font=`${isMe?'bold ':''}12px system-ui, sans-serif`;c.fillStyle=isMe?'#2d6242':'#46643a';c.fillText((isMe?'나 · ':'')+webName(actor.kind),x,y+36);
    }
    c.restore();
    const mx=this.width-112,my=this.width<600?this.height-192:16,mw=96,mh=59;c.fillStyle='#fffdf1dc';c.fillRect(mx-5,my-5,mw+10,mh+10);
    for(const a of h.actors)if(a.respawn<=0){c.fillStyle=h.canEat(a.kind,h.role)?'#dca83c':'#aa7b67';c.fillRect(mx+a.x/HUNT_WIDTH*mw-1,my+a.y/HUNT_HEIGHT*mh-1,3,3);}
    c.fillStyle='#326b4c';c.beginPath();c.arc(mx+me.x/HUNT_WIDTH*mw,my+me.y/HUNT_HEIGHT*mh,3.5,0,7);c.fill();
  }
}
