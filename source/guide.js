import {webPicture} from './web-art.js';
import {WEB_BASE_EDGES,WEB_EDGES,webName} from './web-ecosystem.js';
export const GUIDE_ORDER=['rice','clover','grasshopper','frog','spider','mouse','sparrow','rabbit','snake','hawk'];
export const GUIDE_FACTS={
 rice:'논에서 자라는 식물이에요. 우리가 먹는 쌀은 벼의 열매에서 얻어요.',
 clover:'작은 잎이 보통 세 장씩 모여 나요. 둥근 모양으로 꽃이 모여 피어요.',
 grasshopper:'뒷다리가 길고 튼튼해서 멀리 뛸 수 있어요. 풀 사이에서 살아요.',
 frog:'물가와 풀숲에서 살아요. 긴 혀로 작은 동물을 잡아먹어요.',
 spider:'다리가 여덟 개인 동물이에요. 작은 동물을 잡아먹어요.',
 mouse:'몸집이 작고 앞니가 발달했어요. 씨앗 같은 먹이를 갉아 먹어요.',
 sparrow:'작은 새예요. 부리로 낟알이나 작은 동물을 먹어요.',
 rabbit:'긴 귀와 튼튼한 뒷다리가 있어요. 풀을 먹고 뛰어다녀요.',
 snake:'다리가 없고 몸이 길어요. 몸을 움직여 기어 다니며 먹이를 찾아요.',
 hawk:'날카로운 발톱과 굽은 부리가 있어요. 다른 동물을 사냥해요.'
};
export const GUIDE_CHAIN_ORDER=['rice','grasshopper','frog','snake','hawk'];
export function guideModel(mode){
 const chain=mode==='chain',edges=chain?WEB_BASE_EDGES:WEB_EDGES;
 return {order:chain?GUIDE_CHAIN_ORDER:GUIDE_ORDER,title:chain?'먹이사슬':'먹이그물',
 foods:id=>edges.filter(([,eater])=>eater===id).map(([food])=>food),
 predators:id=>edges.filter(([food])=>food===id).map(([,eater])=>eater)};
}
export function installGuide({startChain,startWeb,onOpen,onClose,onHome}){
 const panel=document.getElementById('guidePanel'),root=document.getElementById('guideContent');
 let current=0,preferred='chain',restoreHome=true;const visited={chain:new Set(),web:new Set()};
 function close(){panel.hidden=true;document.getElementById('home').hidden=!restoreHome;onClose?.();}
 const pictures=ids=>ids.map(id=>`<div class="guide-picture">${webPicture(id)}</div>`).join('');
 function paint(){
  const model=guideModel(preferred),order=model.order,seen=visited[preferred],id=order[current],plant=['rice','clover'].includes(id);seen.add(id);
  root.innerHTML=`<header class="guide-header"><div><span class="eyebrow">${model.title} 체험 전 · 숲 친구 ${order.length}종</span><h2 tabindex="-1" id="guideTitle">${model.title} 생물 알아보기</h2></div><button id="guideClose">처음 화면</button></header>
  <nav class="guide-tabs" aria-label="살펴볼 생물">${order.map((x,i)=>`<button data-guide-index="${i}" aria-pressed="${i===current}">${webName(x)}${seen.has(x)?' ✓':''}</button>`).join('')}</nav>
  <article class="guide-organism"><div class="guide-hero">${webPicture(id)}<span>${plant?'생산자':'소비자'}</span><p>${GUIDE_FACTS[id]}</p></div><div class="guide-relations"><section><h3>${plant?'양분을 어떻게 얻을까요?':'무엇을 먹을까요?'}</h3>${plant?'<p class="guide-plant">햇빛을 이용하여 스스로 양분을 만들어요.</p>':`<div class="guide-pictures">${pictures(model.foods(id))}</div>`}</section><section><h3>누구에게 먹힐까요?</h3><div class="guide-pictures">${pictures(model.predators(id))||'<p>이 체험에 나오는 생물 중에는 없어요.</p>'}</div></section></div></article>
  <p class="guide-note">이 그림은 체험에서 사용하는 대표 먹이관계예요. 실제 먹이는 생물의 종류·크기·계절에 따라 달라요.<br>${preferred==='chain'?'벼 → 메뚜기 → 개구리 → 뱀 → 매의 관계를 체험해요.':'여덟 동물 중 하나를 골라 여러 먹이관계를 체험해요.'}</p>
  <footer class="guide-footer"><button id="guidePrev" ${current===0?'disabled':''}>← 이전</button><span role="status">${current+1} / ${order.length} · ${seen.size}종 살펴봄</span><button id="guideNext" ${current===order.length-1?'disabled':''}>다음 생물 →</button></footer>
  <div class="guide-launch"><p>${seen.size===order.length?'숲 친구들을 모두 살펴봤어요. 이제 출발해요!':`${order.length}종의 설명과 먹이 그림을 살펴보면 체험을 시작할 수 있어요.`}</p><div><button id="guideBegin" class="primary" ${seen.size<order.length?'disabled':''}>${preferred==='chain'?'먹이사슬 체험 시작하기':'먹이그물 체험할 동물 고르기'} →</button></div></div>`;
  root.querySelectorAll('[data-guide-index]').forEach(b=>b.onclick=()=>{current=+b.dataset.guideIndex;paint();});
  document.getElementById('guidePrev').onclick=()=>{current--;paint();};document.getElementById('guideNext').onclick=()=>{current++;paint();};
  document.getElementById('guideClose').onclick=()=>{if(onHome){onHome();return;}close();document.getElementById(restoreHome?(preferred==='chain'?'startButton':'openWebDirect'):'continueToWeb')?.focus();};
  document.getElementById('guideBegin').onclick=()=>{close();(preferred==='chain'?startChain:startWeb)();};
  panel.scrollTop=0;document.getElementById('guideTitle').focus({preventScroll:true});
 }
 return mode=>{preferred=mode;current=0;restoreHome=!document.getElementById('home').hidden;document.getElementById('home').hidden=true;panel.hidden=false;onOpen?.(mode);paint();};
}
