import test from 'node:test';
import assert from 'node:assert/strict';
import {WebHunt} from '../source/web-hunt.js';
import {WEB_ANIMALS,WEB_ORGANISMS,WEB_EDGES,isWebEdge,webFoods} from '../source/web-ecosystem.js';
import {W,H,OBSTACLES,REEDS,advanceMotion,dist,findPath,hideProtected} from '../source/engine.js';
function seeded(){let seed=25;return ()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);}
function scene(id){return new WebHunt(id,{random:seeded()});}
function offer(h,kind){
  const food=h.world.plants.find(p=>p.kind===kind)||h.actors.find(p=>p.kind===kind);
  Object.assign(h.me,{x:700,y:450,effect:0,eatWait:0,protect:100});
  for(const other of h.actors)if(other!==food)Object.assign(other,{x:1600,y:1000});
  Object.assign(food,{x:700,y:450,ready:0,protect:0,respawn:0,effect:0,hidden:false,bot:false});
  h.step({},1/60);return food;
}
test('all eight animals are selectable while the two producers are not player roles',()=>{
  for(const id of WEB_ANIMALS){const h=scene(id);assert.equal(h.me.kind,id);assert.equal(h.me.role,WEB_ORGANISMS[id].role);assert.deepEqual(h.foods,webFoods(id));assert.equal(h.world.duration,90);}
  for(const id of ['rice','clover','unknown'])assert.throws(()=>scene(id));
});
test('the food web uses the exact original forest dimensions, obstacles, paths and movement',()=>{
  const h=scene('rabbit');assert.equal(W,1800);assert.equal(H,1100);assert.equal(OBSTACLES.length,10);assert.equal(REEDS.length,4);
  h.world.players={me:h.me};h.world.plants=[];Object.assign(h.me,{x:700,y:450,angle:0});
  const expected={...h.me};advanceMotion(expected,{x:1},1/60);h.step({x:1},1/60);assert.equal(h.me.x,expected.x);assert.equal(h.me.y,expected.y);
  Object.assign(h.me,{x:600,y:190,effect:0,cool:0,angle:Math.PI/2});
  for(let i=0;i<45;i++)h.step({y:1,action:1},1/60);assert.ok(h.me.y>400,'rabbit should jump across the same tree');
});
test('every food has several examples and nearby starting targets',()=>{
  for(const id of WEB_ANIMALS){const h=scene(id);
    assert.equal(h.world.plants.filter(p=>p.kind==='rice').length,24);assert.equal(h.world.plants.filter(p=>p.kind==='clover').length,24);
    for(const kind of h.foods){const food=[...h.actors,...h.world.plants].filter(p=>p.kind===kind);assert.ok(food.length>=6);assert.ok(food.some(p=>dist(p,h.me)<450),id+' lacks reachable '+kind);}
  }
});
test('one diet table controls eating including prey with non-adjacent legacy motion roles',()=>{
  for(const id of WEB_ANIMALS)for(const food of webFoods(id)){const h=scene(id);offer(h,food);assert.equal(h.me.fed,1,id+' should eat '+food);assert.equal(h.found.has(food),true);assert.ok(h.events.some(e=>e.food===food&&e.eater===id));}
  for(const [id,food] of [['rabbit','rice'],['mouse','frog'],['spider','frog'],['hawk','spider']]){const h=scene(id);offer(h,food);assert.equal(h.me.fed,0,id+' must not eat '+food);}
});
test('being caught keeps mission food and grants the original protected respawn',()=>{
  const h=scene('rabbit');offer(h,'clover');const enemy=h.actors.find(p=>p.kind==='hawk');
  h.me.protect=0;Object.assign(enemy,{x:h.me.x,y:h.me.y,protect:0,eatWait:0,effect:0});h.step({},1/60);assert.equal(h.me.caught,1);assert.ok(h.me.respawn>2.4);assert.equal(h.me.fed,1);
  h.world.players={me:h.me};for(let i=0;i<160;i++)h.step({},1/60);assert.equal(h.me.respawn,0);assert.ok(h.me.protect>2.5);assert.equal(h.found.has('clover'),true);
});
test('new ground animals receive the same three-second cover and it expires in place',()=>{
  for(const kind of ['mouse','spider','rabbit']){const h=scene(kind);h.world.players={me:h.me};h.world.plants=[];Object.assign(h.me,{x:320,y:250,protect:0});
    h.step({},.05);assert.equal(hideProtected(h.me),true);for(let i=0;i<62;i++)h.step({},.05);assert.equal(hideProtected(h.me),false);assert.equal(h.me.hidden,true);
  }
});
test('pause freezes movement, mission time, protection, food regrowth and cooldown',()=>{
  const h=scene('sparrow');h.step({x:1,action:1},1/60);h.pause();const before=JSON.stringify(h.world);
  for(let i=0;i<60;i++)h.step({x:1},1/60);assert.equal(JSON.stringify(h.world),before);h.resume();h.step({x:1},1/60);assert.ok(h.me.cool<5);
});
test('the timer ends in a picture quiz with exactly one valid food choice for every animal',()=>{
  for(const kind of WEB_ANIMALS){const h=scene(kind);h.world.remaining=.01;h.step({},1/60);assert.equal(h.phase,'between');assert.ok(h.record);const q=h.quiz.quiz;
    assert.equal(q.choices.filter(id=>isWebEdge(id,kind)).length,1);assert.equal(q.subject,kind);assert.equal(h.quiz.choose(q.answer),true);assert.equal(h.finish(),false);
  }
});
test('missions count total foods and two different kinds when more than one exists',()=>{
  const h=scene('frog');for(let i=0;i<3;i++)offer(h,'grasshopper');assert.equal(h.mission.complete,false);assert.equal(h.mission.found,1);offer(h,'spider');assert.equal(h.mission.complete,true);
  const rabbit=scene('rabbit');for(let i=0;i<5;i++)offer(rabbit,'clover');assert.equal(rabbit.mission.types,1);assert.equal(rabbit.mission.complete,true);
});
test('new sessions keep independent progress and reject invalid time steps',()=>{
  const a=scene('mouse'),b=scene('mouse');offer(a,'rice');assert.equal(b.me.fed,0);const before=JSON.stringify(b.world);for(const dt of [NaN,0,-1,Infinity])b.step({x:1},dt);assert.equal(JSON.stringify(b.world),before);
});
test('ordinary movement with pathfinding can finish each selected animal mission within 90 seconds',()=>{
  for(const kind of WEB_ANIMALS){const h=scene(kind);let route=[],target=null,refresh=0;
    for(let tick=0;tick<5400&&h.phase==='playing'&&!h.mission.complete;tick++){
      if(tick>=refresh||!target||target.respawn>0||target.ready>0){
        const missing=h.found.size<h.mission.types?h.remainingFoods:h.foods;
        const candidates=[...h.world.plants,...h.actors].filter(p=>missing.includes(p.kind)&&!(p.ready>0)&&!(p.respawn>0)&&!(p.protect>0)&&!hideProtected(p));
        target=candidates.sort((a,b)=>dist(a,h.me)-dist(b,h.me))[0];route=target?findPath(h.me,target,h.me.role):[];refresh=tick+30;
      }
      while(route.length&&dist(h.me,route[0])<20)route.shift();const goal=route[0]||target;
      const dx=goal?goal.x-h.me.x:0,dy=goal?goal.y-h.me.y:0,d=Math.max(1,Math.hypot(dx,dy));h.step({x:dx/d,y:dy/d},1/60);
    }
    assert.equal(h.mission.complete,true,kind+' mission was not reachable');
  }
});
