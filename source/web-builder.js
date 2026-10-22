import {WEB_ORGANISMS,WEB_EDGES,isWebEdge,webName} from './web-ecosystem.js';

export class WebBuilder{
 constructor(){this.edges=[];this.pending=null;this.history=[];this.checked=false;this.erase=false;this.name='';this.note='';this.message='먹히는 생물을 먼저 누르고, 먹는 생물을 눌러요.';}
 get result(){const correct=this.edges.filter(([a,b])=>isWebEdge(a,b)).length;return {correct,review:this.edges.length-correct,remaining:WEB_EDGES.length-correct};}
 remember(){this.history.push(this.edges.map(e=>[...e]));this.checked=false;}
 select(id){
  if(!WEB_ORGANISMS[id])return false;
  if(this.erase){this.message='지울 화살표를 누르거나, 연결 목록에서 골라 지워요.';return false;}
  if(!this.pending){this.pending=id;this.message=`선택한 먹이: ${webName(id)}. 이것을 먹는 생물을 눌러요.`;return false;}
  if(this.pending===id){this.pending=null;this.message='선택을 취소했어요. 먹히는 생물을 다시 골라요.';return false;}
  const food=this.pending;this.pending=null;
  if(this.edges.some(([a,b])=>a===food&&b===id)){this.message='이미 연결한 관계예요. 다른 관계를 찾아요.';return false;}
  this.remember();this.edges.push([food,id]);this.message=`${webName(food)} → ${webName(id)} 연결! 다음 먹히는 생물을 골라요.`;return true;
 }
 remove(index){if(!Number.isInteger(index)||!this.edges[index])return false;this.remember();this.edges.splice(index,1);this.pending=null;this.message='화살표를 지웠어요. 되돌리기로 복원할 수 있어요.';return true;}
 undo(){if(!this.history.length)return false;this.edges=this.history.pop();this.pending=null;this.checked=false;this.message='마지막 연결 변경을 되돌렸어요.';return true;}
 clear(){if(!this.edges.length)return;this.remember();this.edges=[];this.pending=null;this.message='연결을 모두 지웠어요. 새 먹이그물을 만들어 보세요.';}
 check(){this.pending=null;this.checked=true;const r=this.result;this.message=this.edges.length?`모형에 맞는 연결 ${r.correct}개 · 다시 살펴볼 연결 ${r.review}개. ${r.remaining?`더 찾을 수 있는 관계 ${r.remaining}개!`:'17개 관계를 모두 찾았어요!'}`:'아직 연결한 화살표가 없어요. 두 생물을 차례로 눌러요.';return r;}
}
