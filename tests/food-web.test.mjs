import test from 'node:test';
import assert from 'node:assert/strict';
import {FoodWebActivity} from '../source/food-web.js';
import {WEB_ORGANISMS,WEB_EDGES,WEB_ANIMALS,WEB_BASE_EDGES,WEB_PATHS,WEB_POSITIONS,webEdgeGeometry,webEdgeKey} from '../source/web-ecosystem.js';
function trial(a,kind){a.selectAnimal(kind);a.begin();a.endTrial();assert.equal(a.answerQuiz(a.hunt.quiz.quiz.answer),true);return a;}
function review(){const a=trial(new FoodWebActivity(),'rabbit');a.review();return a;}
test('the expanded web has ten organisms and seventeen distinct supported relations',()=>{
  assert.equal(Object.keys(WEB_ORGANISMS).length,10);assert.equal(WEB_ANIMALS.length,8);assert.equal(WEB_EDGES.length,17);assert.equal(new Set(WEB_EDGES.map(e=>webEdgeKey(...e))).size,17);
  for(const path of WEB_PATHS)for(let i=0;i<path.length-1;i++)assert.ok(WEB_EDGES.some(([food,eater])=>food===path[i]&&eater===path[i+1]));
});
test('the learner must select an animal and may choose freely instead of following a fixed sequence',()=>{
  const a=new FoodWebActivity();assert.deepEqual(a.edges,WEB_BASE_EDGES);assert.equal(a.begin(),false);assert.equal(a.selectAnimal('clover'),false);
  for(const kind of ['hawk','spider','rabbit','hawk']){trial(a,kind);assert.equal(a.chooseAgain(),true);}
  assert.deepEqual(a.records.map(record=>record.kind),['hawk','spider','rabbit','hawk']);
});
test('the result quiz gates both another animal and the web review without requiring every role',()=>{
  const a=new FoodWebActivity();a.selectAnimal('mouse');a.begin();assert.equal(a.chooseAgain(),false);assert.equal(a.review(),false);a.endTrial();
  const q=a.hunt.quiz.quiz;assert.equal(a.answerQuiz(q.choices.find(id=>id!==q.answer)),false);assert.equal(a.review(),false);assert.equal(a.chooseAgain(),false);
  a.answerQuiz(q.answer);assert.equal(a.records.length,1);assert.equal(a.answerQuiz(q.answer),false);assert.equal(a.records.length,1);assert.equal(a.review(),true);assert.equal(a.stage,'observe');
});
test('only learner eating/caught events mark a directly experienced relation',()=>{
  const a=new FoodWebActivity();a.selectAnimal('frog');a.begin();assert.equal(a.encountered.size,0);a.tick({},1/60);assert.equal(a.encountered.size,0);
  const food=a.hunt.actors.find(p=>p.kind==='spider');Object.assign(a.hunt.me,{x:700,y:450,protect:100,eatWait:0});Object.assign(food,{x:700,y:450,protect:0,respawn:0,hidden:false,effect:0,bot:false});a.tick({},1/60);
  assert.equal(a.encountered.has('spider>frog'),true);assert.equal(a.learn('spider','frog'),false);assert.equal(a.learn('rabbit','rice'),false);
});
test('hiding the frog removes exactly its three direct relations and keeps two other snake foods',()=>{
  const a=review(),before=JSON.stringify(a.edges);a.toggleFrog();assert.deepEqual(a.neighbors('snake').food.sort(),['mouse','sparrow']);assert.equal(JSON.stringify(a.edges),before);a.toggleFrog();assert.deepEqual(a.neighbors('snake').food.sort(),['frog','mouse','sparrow']);
});
test('both image alternatives must be found even when the learner chose another animal',()=>{
  const a=review();assert.equal(a.answerAlternative('mouse'),false);a.toggleFrog();assert.equal(a.answerAlternative('grasshopper'),false);a.answerAlternative('mouse');a.answerAlternative('mouse');assert.equal(a.next(),false);a.answerAlternative('sparrow');assert.equal(a.next(),true);assert.equal(a.stage,'reflect');
});
test('reflection remains bounded and independent and completed learners can select another animal',()=>{
  const a=review();a.toggleFrog();a.answerAlternative('mouse');a.answerAlternative('sparrow');a.next();a.setReflection('  ');assert.equal(a.next(),false);a.setReflection('가'.repeat(200));assert.equal(a.reflection.length,180);a.setReflection('토끼는 토끼풀을 먹고 매에게 먹힐 수 있어요.');assert.equal(a.next(),true);assert.equal(a.stage,'complete');assert.equal(a.chooseAgain(),true);assert.equal(a.records.length,1);assert.equal(new FoodWebActivity().reflection,'');
});
test('curve arrows stay outside cards and do not pass through an unrelated organism',()=>{
  for(const [food,eater] of WEB_EDGES){const {start,end,c1,c2}=webEdgeGeometry(food,eater),[x,y]=WEB_POSITIONS[eater];assert.ok(Math.abs(end[0]-x)>=57.9||Math.abs(end[1]-y)>=69.9);
    for(let i=0;i<=100;i++){const t=i/100,u=1-t,px=u*u*u*start[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*end[0],py=u*u*u*start[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*end[1];
      for(const [id,[cx,cy]] of Object.entries(WEB_POSITIONS))if(id!==food&&id!==eater)assert.ok(Math.abs(px-cx)>54||Math.abs(py-cy)>66,`${food}>${eater} crosses ${id}`);
    }
  }
});
