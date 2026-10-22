import test from 'node:test';
import assert from 'node:assert/strict';
import {WebBuilder} from '../source/web-builder.js';
import {WEB_EDGES} from '../source/web-ecosystem.js';
const connect=(b,a,c)=>{b.select(a);return b.select(c)};
test('students start with no answer lines and connect food to eater, without self or duplicate lines',()=>{
 const b=new WebBuilder();assert.deepEqual(b.edges,[]);assert.equal(b.select('missing'),false);b.select('rice');b.select('rice');assert.equal(b.pending,null);assert.deepEqual(b.edges,[]);assert.equal(connect(b,'rice','grasshopper'),true);assert.equal(connect(b,'rice','grasshopper'),false);assert.deepEqual(b.edges,[['rice','grasshopper']]);
});
test('checking identifies reversed and unrelated links while preserving student work',()=>{
 const b=new WebBuilder();for(const [a,c]of WEB_EDGES)connect(b,a,c);connect(b,'hawk','snake');connect(b,'clover','hawk');assert.deepEqual(b.check(),{correct:17,review:2,remaining:0});assert.equal(b.edges.length,19);assert.equal(b.checked,true);
});
test('remove, clear and undo restore exact links; edits clear previous feedback',()=>{
 const b=new WebBuilder();connect(b,'rice','mouse');connect(b,'mouse','snake');b.check();assert.equal(b.remove(99),false);b.remove(0);assert.equal(b.checked,false);assert.deepEqual(b.edges,[['mouse','snake']]);b.undo();assert.deepEqual(b.edges,[['rice','mouse'],['mouse','snake']]);b.clear();assert.deepEqual(b.edges,[]);b.undo();assert.equal(b.edges.length,2);b.undo();assert.equal(b.edges.length,1);b.undo();assert.equal(b.edges.length,0);assert.equal(b.undo(),false);
});
test('erase mode cannot accidentally add links and sessions have independent work',()=>{
 const a=new WebBuilder(),b=new WebBuilder();connect(a,'clover','rabbit');a.erase=true;a.select('rice');assert.equal(a.pending,null);assert.equal(a.edges.length,1);assert.deepEqual(b.edges,[]);assert.equal(b.name,'');
});
