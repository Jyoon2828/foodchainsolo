import test from 'node:test';
import assert from 'node:assert/strict';
import {FoodWebActivity,WEB_ORGANISMS,WEB_EDGES,WEB_BASE_EDGES,WEB_PATHS,WEB_POSITIONS,webEdgeGeometry,webEdgeKey} from '../source/food-web.js';
function completeGames(){
  const a=new FoodWebActivity();a.begin();
  for(let level=0;level<4;level++){
    for(const food of a.hunt.foods){const target=a.hunt.actors.find(p=>p.kind===food&&p.respawn===0);target.x=a.hunt.me.x;target.y=a.hunt.me.y;a.tick({},1/60);}
    assert.equal(a.hunt.phase,'roundEnd');assert.equal(a.advanceHunt(),true);
  }
  return a;
}
test('the activity brings in the original chain and starts a movable multi-food game',()=>{
  const a=new FoodWebActivity();assert.deepEqual(a.edges,WEB_BASE_EDGES);assert.equal(a.next(),false);
  assert.equal(Object.keys(WEB_ORGANISMS).length,7);assert.equal(new Set(WEB_EDGES.map(e=>webEdgeKey(...e))).size,10);
  a.begin();assert.equal(a.stage,'play');assert.equal(a.hunt.role,'sparrow');assert.deepEqual(a.hunt.foods,['rice','grasshopper']);
});
test('only actual valid eating encounters add relations and repeated foods do not duplicate them',()=>{
  const a=new FoodWebActivity();a.begin();assert.equal(a.edges.length,4);a.tick({},1/60);assert.equal(a.edges.length,4);
  const rice=a.hunt.actors.find(p=>p.kind==='rice');rice.x=a.hunt.me.x;rice.y=a.hunt.me.y;a.tick({},1/60);
  assert.equal(a.hasEdge('rice','sparrow'),true);assert.equal(a.edges.length,5);
  assert.equal(a.learn('rice','sparrow'),false);assert.equal(a.learn('hawk','rice'),false);assert.equal(a.edges.length,5);
  assert.equal(a.advanceHunt(),false);assert.equal(a.next(),false);
});
test('four game missions earn all ten web relations before the observation stage',()=>{
  const a=completeGames();assert.equal(a.complete,true);assert.equal(a.stage,'observe');assert.equal(a.edges.length,10);
  assert.equal(a.hunt.records.length,4);assert.deepEqual(a.hunt.records.map(r=>r.role),['sparrow','mouse','snake','hawk']);
  for(const path of WEB_PATHS)for(let i=0;i<path.length-1;i++)assert.equal(a.hasEdge(path[i],path[i+1]),true);
});
test('hiding the frog dims only its direct links while keeping two other snake foods',()=>{
  const a=completeGames(),before=JSON.stringify(a.edges);a.toggleFrog();
  assert.deepEqual(a.neighbors('snake').food.sort(),['mouse','sparrow']);assert.equal(JSON.stringify(a.edges),before);
  a.toggleFrog();assert.deepEqual(a.neighbors('snake').food.sort(),['frog','mouse','sparrow']);
});
test('both alternatives must be found after hiding the frog to continue',()=>{
  const a=completeGames();assert.equal(a.answerAlternative('mouse'),false);a.toggleFrog();
  assert.equal(a.answerAlternative('grasshopper'),false);a.answerAlternative('mouse');a.answerAlternative('mouse');assert.equal(a.alternatives.size,1);assert.equal(a.next(),false);
  a.answerAlternative('sparrow');assert.equal(a.next(),true);assert.equal(a.stage,'reflect');assert.equal(a.removed,null);
});
test('reflection is limited, requires nonblank text and stays independent for each instance',()=>{
  const a=completeGames();a.toggleFrog();a.answerAlternative('mouse');a.answerAlternative('sparrow');a.next();
  a.setReflection('  ');assert.equal(a.next(),false);a.setReflection('가'.repeat(200));assert.equal(a.reflection.length,180);
  a.setReflection('뱀이 개구리뿐 아니라 생쥐와 참새도 먹었어요.');assert.equal(a.next(),true);assert.equal(a.stage,'complete');
  assert.equal(new FoodWebActivity().reflection,'');
});
test('result arrows end outside eater cards, and highlighting never changes the learned graph',()=>{
  const a=completeGames(),before=JSON.stringify(a.edges);
  for(const [food,eater] of WEB_EDGES){const g=webEdgeGeometry(food,eater),[x,y]=WEB_POSITIONS[eater];assert.ok(Math.hypot(g.end[0]-x,g.end[1]-y)>57);assert.ok(g.end[0]<x);}
  a.showPath(1);assert.equal(a.highlightPath,1);a.inspect('snake');assert.equal(a.highlightPath,null);assert.equal(JSON.stringify(a.edges),before);
});
