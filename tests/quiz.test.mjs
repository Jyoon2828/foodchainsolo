import test from 'node:test';
import assert from 'node:assert/strict';
import {QUIZZES,PictureQuiz,isCorrect} from '../source/quiz.js';
import {pictureQuizMarkup,chainSequenceMarkup} from '../source/quiz-view.js';
import {SoloSession} from '../source/solo-state.js';

test('each question is a picture of a meal with one missing organism',()=>{
  for(let role=0;role<4;role++){
    const puzzle=new PictureQuiz(role),html=pictureQuizMarkup(puzzle);
    assert.ok(html.includes('feeding-scene'));assert.ok(html.includes('meal-question'));
    assert.equal((html.match(/data-picture-choice=/g)||[]).length,3);
    assert.equal(/[→↔]/.test(html),false);
    assert.equal(puzzle.quiz.choices.filter(id=>isCorrect(role,id)).length,1);
  }
});
test('incorrect pictures can be retried and never form an incorrect eating scene',()=>{
  for(let role=0;role<4;role++){
    const p=new PictureQuiz(role),wrong=p.quiz.choices.find(id=>id!==p.quiz.answer);
    assert.equal(p.choose(wrong),false);assert.equal(p.solved,false);
    const html=pictureQuizMarkup(p);assert.ok(html.includes('meal-question'));assert.ok(html.includes('answer-retry'));
    assert.equal(p.choose(p.quiz.answer),true);assert.equal(p.solved,true);
    assert.equal(pictureQuizMarkup(p).includes('meal-question'),false);
  }
});
test('correct answers reveal both actual pictures and a plain eating sentence',()=>{
  for(let role=0;role<4;role++){
    const p=new PictureQuiz(role);p.choose(p.quiz.answer);const html=pictureQuizMarkup(p);
    assert.ok(html.includes(p.quiz.explanation));assert.ok(html.includes('revealed-scene'));assert.ok(html.includes('정답'));
    assert.equal(/[→↔]/.test(html),false);assert.equal(p.choose(p.quiz.choices.find(id=>id!==p.quiz.answer)),false);
    assert.equal(p.solved,true);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  }
});
test('unknown IDs, numeric choices and old ordered-array answers are rejected',()=>{
  for(let role=0;role<4;role++)for(const answer of [null,0,1,{},QUIZZES[role].chain,'unknown'])assert.equal(isCorrect(role,answer),false);
  const p=new PictureQuiz(0);assert.equal(p.choose('unknown'),false);assert.equal(p.choice,null);
});
test('the complete chain is still available as a picture summary',()=>{
  const html=chainSequenceMarkup(QUIZZES[3].chain,5,{solved:true});
  assert.equal((html.match(/class="chain-node"/g)||[]).length,5);
  assert.ok(html.includes('rice-picture'));for(let i=0;i<4;i++)assert.ok(html.includes('animal a'+i));
});
test('the session advances only after a correct picture and keeps the chosen answer',()=>{
  const s=new SoloSession();s.start(30,0);assert.equal(s.answer(QUIZZES[0].answer),false);
  for(let role=0;role<4;role++){
    while(s.world.phase==='playing')s.tick({},.1);
    assert.equal(s.next(),false);assert.equal(s.answer(QUIZZES[role].chain),false);
    const wrong=QUIZZES[role].choices.find(id=>id!==QUIZZES[role].answer);assert.equal(s.answer(wrong),false);
    assert.equal(s.answer(QUIZZES[role].answer),true);assert.equal(s.records[role].quizChoice,QUIZZES[role].answer);
    assert.equal(s.next(),true);
  }
  assert.equal(s.finished,true);s.start();assert.equal(s.records.length,0);
});
