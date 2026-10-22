import {Renderer} from './render.js';
import {LearnerSound} from './audio.js';
import {SIMULATION_STEP} from './motion-view.js';
import {findPath,dist,hideProtected,HIDE_DURATION} from './engine.js';
import {webName,WEB_EDGES,WEB_ANIMALS} from './web-ecosystem.js';
import {webPicture,webMealCard,webRendererArtwork} from './web-art.js';
import {pictureQuizMarkup} from './quiz-view.js';

export class WebHuntGame{
  constructor(canvas,activity,{audio,onAdvance,onUpdate}={}){
    this.canvas=canvas;this.activity=activity;this.audio=audio;this.onAdvance=onAdvance;this.onUpdate=onUpdate;
    this.fullMap=false;this.keys=new Set();this.joy={x:0,y:0};this.target=null;this.route=[];this.action=0;this.accumulator=0;this.lastHUD=0;
    this.lastPhase=activity.hunt.phase;this.lastSound=activity.hunt.serial;this.bookResume=false;this.get=id=>document.getElementById(id);
    const h=activity.hunt,g=this.get;
    this.renderer=new Renderer(canvas,(x,y)=>{if(h.phase!=='playing')return;this.route=findPath(h.me,{x,y},h.me.role);this.target=this.route.shift()||null;},webRendererArtwork);
    this.sound=new LearnerSound(audio);this.sound.lastEvent=h.serial;
    this.onKey=e=>{
      if(h.phase!=='playing'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||g('helpDialog').open||g('soundDialog').open||!g('huntNotebook').hidden)return;
      const key=e.key.startsWith('Arrow')?e.key:e.key.toLowerCase();
      if(key===' '&&document.activeElement?.tagName==='BUTTON')return;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(key))e.preventDefault();
      if(key===' '&&!e.repeat)this.skill();else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'].includes(key))this.keys.add(key);
    };
    this.onKeyUp=e=>this.keys.delete(e.key.startsWith('Arrow')?e.key:e.key.toLowerCase());
    document.addEventListener('keydown',this.onKey);document.addEventListener('keyup',this.onKeyUp);
    const joystick=g('huntJoystick');
    const move=e=>{
      const r=joystick.getBoundingClientRect(),max=r.width*.3,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.max(max,Math.hypot(dx,dy));
      this.joy.x=dx/len;this.joy.y=dy/len;this.target=null;this.route=[];g('huntStick').style.transform=`translate(${this.joy.x*max}px,${this.joy.y*max}px)`;
    };
    joystick.onpointerdown=e=>{if(h.phase!=='playing')return;e.preventDefault();this.pointer=e.pointerId;joystick.setPointerCapture(this.pointer);move(e);};
    joystick.onpointermove=e=>{if(e.pointerId===this.pointer)move(e);};
    joystick.onpointerup=joystick.onpointercancel=joystick.onlostpointercapture=()=>this.clearInput();
    g('huntAction').onpointerdown=e=>{e.preventDefault();this.skill();};g('huntAction').onclick=e=>{if(e.detail===0)this.skill();};
    g('huntResume').onclick=()=>{audio.unlock();activity.resume();this.clearInput();onUpdate?.();};
    g('huntEnd').onclick=()=>{if(!g('huntNotebook').hidden)return;this.clearInput();activity.endTrial();onUpdate?.();};
    g('huntBook').onclick=()=>{
      if(!g('huntNotebook').hidden)return;
      this.bookResume=activity.pause();this.clearInput();
      const meals=WEB_EDGES.filter(([food,eater])=>activity.encountered.has(food+'>'+eater));
      g('huntNotebookMeals').innerHTML=meals.length?meals.map(([food,eater])=>webMealCard(eater,food)).join(''):'<p>먹이를 먹거나 잡히면 그 관계가 그림으로 쌓여요.</p>';
      g('huntNotebook').hidden=false;onUpdate?.();
    };
    g('closeHuntBook').onclick=()=>{g('huntNotebook').hidden=true;if(this.bookResume)activity.resume();this.bookResume=false;onUpdate?.();};
    this.updateHUD();
  }
  togglePause(){if(!this.get('huntNotebook').hidden)return;if(!this.activity.pause()){this.audio.unlock();this.activity.resume();}this.clearInput();this.onUpdate?.();}
  skill(){const h=this.activity.hunt;if(h.phase!=='playing')return;if(h.me.role===0){this.target=null;this.route=[];}this.action++;navigator.vibrate?.(15);}
  clearInput(){this.keys.clear();this.joy.x=this.joy.y=0;this.pointer=null;this.target=null;this.route=[];if(this.get('huntStick'))this.get('huntStick').style.transform='';}
  backgroundPause(){this.activity.pause();this.bookResume=false;this.clearInput();}
  dispose(){this.renderer.resize.disconnect();document.removeEventListener('keydown',this.onKey);document.removeEventListener('keyup',this.onKeyUp);this.clearInput();this.canvas.onpointerdown=null;}
  input(){
    let x=this.joy.x+(this.keys.has('ArrowRight')||this.keys.has('d')?1:0)-(this.keys.has('ArrowLeft')||this.keys.has('a')?1:0);
    let y=this.joy.y+(this.keys.has('ArrowDown')||this.keys.has('s')?1:0)-(this.keys.has('ArrowUp')||this.keys.has('w')?1:0);
    if(Math.hypot(x,y)>.05){this.target=null;this.route=[];}
    else if(this.target){const d=dist(this.activity.hunt.me,this.target);if(d>16){x=(this.target.x-this.activity.hunt.me.x)/d;y=(this.target.y-this.activity.hunt.me.y)/d;}else this.target=this.route.shift()||null;}
    const d=Math.max(1,Math.hypot(x,y));return {x:x/d,y:y/d,action:this.action};
  }
  frame(elapsed,now){
    const h=this.activity.hunt;
    if(h.phase==='playing'){
      this.accumulator+=Math.min(.1,elapsed);
      while(this.accumulator>=SIMULATION_STEP&&h.phase==='playing'){this.renderer.motion.capture(h.world);this.activity.tick(this.input(),SIMULATION_STEP);this.accumulator-=SIMULATION_STEP;}
    }else this.accumulator=0;
    if(h.phase!==this.lastPhase){this.lastPhase=h.phase;this.clearInput();this.onUpdate?.();}
    this.sound.observe(h.world,h.mission);
    for(const event of h.events)if(event.id>this.lastSound&&event.food&&(event.hunter==='me'||event.prey==='me'))this.meal=event;
    this.lastSound=h.serial;
    this.renderer.draw(h.world,'me',this.fullMap,{alpha:h.phase==='playing'?this.accumulator/SIMULATION_STEP:1});
    if(now-this.lastHUD>80){this.lastHUD=now;this.updateHUD();}
  }
  paintResult(){
    const h=this.activity.hunt,root=this.get('huntRoundContent'),m=h.mission,p=h.quiz;
    root.innerHTML=`<span class="eyebrow">${webName(h.role)} 체험 정리</span><h3>누가 무엇을 먹었나요?</h3><div class="mission-result ${m.complete?'complete':''}"><b>${m.complete?'✓ 먹이 미션 성공!':'이번 체험의 먹이 기록'}</b><span>먹이 먹기 ${m.count}번 / 목표 ${m.goal}번 · ${m.found}종류 / 목표 ${m.types}종류</span></div><div class="web-round-quiz"><h4>${p.quiz.question}</h4>${pictureQuizMarkup(p,{pictureFor:webPicture,nameFor:webName,idPrefix:'web-'})}</div><div class="web-round-actions"><button id="webChooseAgain" class="secondary wide" ${p.solved?'':'disabled'}>다른 동물 고르기</button><button id="webReview" class="primary wide" ${p.solved?'':'disabled'}>나의 먹이그물 살펴보기</button></div>`;
    for(const button of root.querySelectorAll('[data-picture-choice]'))button.onclick=()=>{
      if(p.solved)return;this.audio.unlock();const correct=this.activity.answerQuiz(button.dataset.pictureChoice);this.audio.effect(correct?'correct':'retry');this.paintResult();
      if(correct)this.get('webChooseAgain').focus();else this.get('web-pictureChoice-'+button.dataset.pictureChoice)?.focus();
    };
    this.get('webChooseAgain').onclick=()=>{if(this.activity.chooseAgain())this.onAdvance?.();};
    this.get('webReview').onclick=()=>{if(this.activity.review())this.onAdvance?.();};
  }
  updateHUD(){
    const h=this.activity.hunt,g=this.get,m=h.mission,p=h.me,seconds=Math.ceil(h.world.remaining);
    g('timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    g('huntMissionTitle').textContent=m.complete?'✓ 미션 성공!':'이번 동물 먹이 미션';g('huntMissionCount').textContent=`${m.count} / ${m.goal}`;
    g('huntMissionText').textContent=`먹이 ${m.goal}번 먹기 · 종류 ${m.found} / ${m.types}`;
    g('huntMissionProgress').max=m.goal;g('huntMissionProgress').value=Math.min(m.count,m.goal);
    g('huntHud').classList.toggle('complete',m.complete);
    g('huntLearned').textContent=`직접 만난 먹이관계 ${this.activity.encountered.size}개`;
    g('huntCooldown').textContent=p.cool>0?`${p.cool.toFixed(1)}초 뒤`:'준비 완료';g('huntAction').style.opacity=p.cool>0?'.65':'1';
    g('huntCoverHint').textContent=p.role===3?'날아서 나무·바위를 통과해요':p.hidden?(hideProtected(p)?`🛡 숨기 보호 ${(HIDE_DURATION-p.hideTime).toFixed(1)}초`:'보호 끝! 숨어 있어도 잡힐 수 있어요.'):'나무·풀숲에서 멈추면 3초 보호돼요';
    g('huntCoverHint').classList.toggle('exposed',p.hidden&&!hideProtected(p));
    g('huntRespawn').hidden=p.respawn<=0||h.phase!=='playing';if(p.respawn>0)g('huntRespawn').textContent=`다시 출발해요! ${p.respawn.toFixed(1)}초 뒤`;
    g('huntPaused').hidden=h.phase!=='paused'||!g('huntNotebook').hidden||g('helpDialog').open||g('soundDialog').open;
    g('pauseButton').textContent=h.phase==='paused'?'계속하기':'잠깐 멈춤';g('huntRoundDone').hidden=h.phase!=='between';
    g('huntControls').hidden=h.phase!=='playing';g('huntBook').disabled=!g('huntNotebook').hidden;g('pauseButton').disabled=g('huntEnd').disabled=!g('huntNotebook').hidden||h.phase==='between';
    if(h.phase==='between'&&!this.resultPainted){this.paintResult();this.resultPainted=true;}
    if(this.meal&&h.t-this.meal.at<1.8){if(this.shownMeal!==this.meal.id){g('huntMealToast').innerHTML=webMealCard(this.meal.eater,this.meal.food);this.shownMeal=this.meal.id;}g('huntMealToast').hidden=false;}else g('huntMealToast').hidden=true;
  }
}
