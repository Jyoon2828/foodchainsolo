import test from 'node:test';
import assert from 'node:assert/strict';
import {WebHunt,HUNT_WIDTH,HUNT_HEIGHT,HUNT_ROLES} from '../source/web-hunt.js';
import {FoodWebActivity,WEB_EDGES} from '../source/food-web.js';
function seeded(){let seed=25;return ()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);}
function eat(hunt,kind){const target=hunt.actors.find(p=>p.kind===kind&&p.respawn===0);target.x=hunt.me.x;target.y=hunt.me.y;hunt.step({},1/60);}
test('missions supply several reachable examples of every required food',()=>{
  const h=new WebHunt(WEB_EDGES,seeded());
  for(const role of HUNT_ROLES){
    assert.equal(h.role,role);
    for(const food of h.foods){
      const prey=h.actors.filter(p=>p.kind===food);assert.ok(prey.length>=5);
      assert.ok(prey.some(p=>Math.hypot(p.x-h.me.x,p.y-h.me.y)<220));
    }
    for(const food of h.foods)eat(h,food);assert.equal(h.phase,'roundEnd');h.next();
  }
  assert.equal(h.phase,'done');assert.equal(h.records.length,4);
});
test('normal controls move the learner and normalize diagonal movement',()=>{
  const a=new WebHunt(WEB_EDGES,seeded()),b=new WebHunt(WEB_EDGES,seeded());a.actors=[];b.actors=[];
  for(let i=0;i<60;i++){a.step({x:1},1/60);b.step({x:1,y:1},1/60);}
  assert.ok(a.me.x>700);assert.ok(Math.abs(Math.hypot(a.me.x-550,a.me.y-340)-Math.hypot(b.me.x-550,b.me.y-340))<.01);
  assert.ok(a.me.px<a.me.x);assert.equal(a.found.size,0);
});
test('contact with a food records an eating encounter and repeated kinds count once',()=>{
  const h=new WebHunt(WEB_EDGES,seeded());eat(h,'rice');assert.equal(h.found.size,1);
  const event=h.events.find(e=>e.type==='eat');assert.equal(event.food,'rice');assert.equal(event.eater,'sparrow');
  eat(h,'rice');assert.equal(h.found.size,1);assert.equal(h.phase,'playing');eat(h,'grasshopper');assert.equal(h.phase,'roundEnd');
});
test('being caught keeps found foods and gives a protected restart',()=>{
  const h=new WebHunt(WEB_EDGES,seeded());eat(h,'rice');h.me.protect=0;
  const enemy=h.actors.find(a=>h.canEat(h.role,a.kind));enemy.x=h.me.x;enemy.y=h.me.y;
  h.step({},1/60);assert.ok(h.me.respawn>0);assert.equal(h.found.has('rice'),true);assert.ok(h.events.some(e=>e.type==='caught'));
  for(let i=0;i<125;i++)h.step({},1/60);assert.equal(h.me.respawn,0);assert.ok(h.me.protect>2);assert.equal(h.found.has('rice'),true);
});
test('pause freezes the timer, movement, respawn and cooldown until explicit resume',()=>{
  const h=new WebHunt(WEB_EDGES,seeded());h.step({x:1,action:1},1/60);h.pause();const before=JSON.stringify(h);
  for(let i=0;i<60;i++)h.step({x:1},1/60);assert.equal(JSON.stringify(h),before);h.resume();h.step({x:1},1/60);assert.ok(h.cool<3.5);
});
test('the movement skill has a cooldown and actors stay in bounds',()=>{
  const h=new WebHunt(WEB_EDGES,seeded());h.actors=[];
  h.step({x:1,action:1},1/60);assert.ok(h.dash>0);const first=h.events.filter(e=>e.type==='dash').length;
  h.step({x:1,action:2},1/60);assert.equal(h.events.filter(e=>e.type==='dash').length,first);
  for(let i=0;i<400;i++)h.step({x:1,y:1},1/60);
  assert.ok(h.me.x<=HUNT_WIDTH-35);assert.ok(h.me.y<=HUNT_HEIGHT-42);assert.equal(h.cool,0);
  h.step({x:-1,action:3},1/60);assert.equal(h.events.filter(e=>e.type==='dash').length,2);
});
test('ordinary pursuit completes every food mission within 90 simulated seconds per role',()=>{
  const a=new FoodWebActivity();a.begin();a.hunt.random=seeded();
  for(let role=0;role<4;role++){
    const start=a.hunt.t;
    while(a.hunt.phase==='playing'&&a.hunt.t-start<90){
      const h=a.hunt,prey=h.actors.filter(p=>h.remainingFoods.includes(p.kind)&&p.respawn===0).sort((p,q)=>Math.hypot(p.x-h.me.x,p.y-h.me.y)-Math.hypot(q.x-h.me.x,q.y-h.me.y))[0];
      const dx=prey?prey.x-h.me.x:0,dy=prey?prey.y-h.me.y:0,d=Math.max(1,Math.hypot(dx,dy));a.tick({x:dx/d,y:dy/d},1/60);
    }
    assert.equal(a.hunt.phase,'roundEnd',`role ${role} took too long`);a.advanceHunt();
  }
  assert.equal(a.stage,'observe');assert.equal(a.edges.length,10);
});
test('instances and new levels keep separate progress and invalid time does not poison positions',()=>{
  const a=new WebHunt(WEB_EDGES,seeded()),b=new WebHunt(WEB_EDGES,seeded());eat(a,'rice');assert.equal(b.found.size,0);
  const t=b.t;for(const dt of [NaN,-1,0,Infinity])b.step({x:1},dt);assert.equal(b.t,t);assert.ok(Number.isFinite(b.me.x));
  for(const food of a.remainingFoods)eat(a,food);a.next();assert.equal(a.found.size,0);assert.equal(a.records.length,1);assert.equal(a.lastAction,0);
});
