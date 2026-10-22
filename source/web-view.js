import {QUIZZES} from './quiz.js';
import {chainSequenceMarkup} from './quiz-view.js';
import {WEB_ORGANISMS,WEB_POSITIONS,WEB_STAGES,WEB_PATHS,webName,isBaseEdge,webEdgeGeometry} from './food-web.js';
import {webPicture,webMealCard} from './web-art.js';

export const webEscape=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function webEdgeAppearance(activity,food,eater){
  const absent=food===activity.removed||eater===activity.removed;
  const path=activity.highlightPath===null?null:WEB_PATHS[activity.highlightPath];
  const highlighted=path?path.some((id,i)=>id===food&&path[i+1]===eater):activity.inspected?food===activity.inspected||eater===activity.inspected:true;
  return {absent,opacity:absent?.13:highlighted?1:.16,color:isBaseEdge(food,eater)?'#5e8858':'#be8437'};
}
export function webBoardMarkup(activity){
  const paths=activity.edges.map(([food,eater])=>{
    const {path}=webEdgeGeometry(food,eater),style=webEdgeAppearance(activity,food,eater),kind=isBaseEdge(food,eater)?'base':'new';
    return `<path d="${path}" fill="none" stroke="${style.color}" stroke-width="4" opacity="${style.opacity}" ${style.absent?'stroke-dasharray="8 7"':''} marker-end="url(#webArrow-${kind})"><title>${webName(food)} → ${webName(eater)}</title></path>`;
  }).join('');
  const nodes=Object.keys(WEB_ORGANISMS).map(id=>{
    const [x,y]=WEB_POSITIONS[id],absent=activity.removed===id,selected=activity.selected===id||activity.inspected===id;
    return `<button id="webNode-${id}" class="web-node ${selected?'selected':''} ${absent?'absent':''}" style="left:${x/10}%;top:${y/5.6}%" data-web-node="${id}" aria-pressed="${selected}" aria-label="${webName(id)}${absent?', 지금은 가려져 있어요':''}${selected?', 선택됨':''}">${webPicture(id)}${absent?'<small>잠시 가림</small>':''}</button>`;
  }).join('');
  return `<p class="web-small-screen">작은 화면에서는 그림을 옆으로 밀어 살펴봐요.</p><div id="webBoardScroll" class="web-board-scroll" tabindex="0" role="region" aria-label="먹이그물 그림, 작은 화면에서는 가로로 이동"><div class="web-board"><svg viewBox="0 0 1000 560" aria-hidden="true" focusable="false"><defs><marker id="webArrow-base" markerUnits="userSpaceOnUse" markerWidth="15" markerHeight="14" refX="12" refY="7" orient="auto"><path d="M1 1 L13 7 L1 13 Z" fill="#5e8858"/></marker><marker id="webArrow-new" markerUnits="userSpaceOnUse" markerWidth="15" markerHeight="14" refX="12" refY="7" orient="auto"><path d="M1 1 L13 7 L1 13 Z" fill="#be8437"/></marker></defs>${paths}</svg>${nodes}</div></div>`;
}
function webInspector(activity){
  if(!activity.inspected)return '';
  const {food,eaters}=activity.neighbors(activity.inspected),name=webName(activity.inspected);
  return `<div class="web-inspector"><b>${name}의 남아 있는 관계</b><span>먹이: ${food.length?food.map(webName).join(', '):'이 그림에 표시된 먹이가 없어요.'}</span><span>이 생물을 먹는 생물: ${eaters.length?eaters.map(webName).join(', '):'이 그림에 표시된 생물이 없어요.'}</span></div>`;
}
function webPathChoices(activity){
  if(!activity.complete)return '';
  return `<details id="webPaths" class="web-paths"><summary>이 먹이그물 안에서 다른 먹이사슬 찾기</summary><div>${WEB_PATHS.map((path,i)=>`<button data-web-path="${i}" aria-pressed="${activity.highlightPath===i}">${path.map(id=>'<span class="path-picture">'+webPicture(id)+'</span>').join('<span class="path-join" aria-hidden="true">›</span>')}</button>`).join('')}</div></details>`;
}
export function foodWebMarkup(activity,hasGameRecords){
  const stage=activity.stage,step=WEB_STAGES.indexOf(stage),feedback=`<p id="webFeedback" class="web-feedback" role="status" aria-live="polite">${activity.feedback}</p>`;
  const title={intro:'먹이사슬들이 만나면?',play:'여러 먹이를 찾아 먹이그물 완성!' ,observe:'개구리가 없다면, 뱀의 먹이는?',reflect:'연결한 그림을 근거로 말해요',complete:'여러 먹이사슬이 얽힌 먹이그물!'}[stage];
  let body='';
  if(stage==='intro'){
    body=`<p class="web-intro-copy">먹이사슬 탐험에서 만난 한 줄 먹이사슬을 가져왔어요.<br>자연에서는 한 생물이 여러 먹이를 먹거나 여러 생물에게 먹히기도 해요.</p>${chainSequenceMarkup(QUIZZES[3].chain,5,{solved:true})}<div class="web-new-friends"><div>${webPicture('mouse')}</div><div>${webPicture('sparrow')}</div><p>생쥐와 참새도 함께 살아요.<br>동물을 직접 움직여 여러 먹이를 찾아봐요.</p></div><button id="beginWeb" class="primary wide">먹이그물 숲 게임 시작하기!</button>`;
  }else{
    const board=webBoardMarkup(activity);
    if(stage==='play')body=webHuntMarkup(activity);
    if(stage==='observe')body=`<p class="web-instruction">개구리를 잠시 가리고, 뱀에게 오는 다른 화살표를 찾아요. 생물 그림을 누르면 그 생물과 연결된 관계가 강조돼요.</p><div class="web-observe-toggle"><button id="toggleFrog" class="secondary" aria-pressed="${activity.removed==='frog'}">${activity.removed?'개구리 다시 보이기':'개구리 가려보기'}</button><span>가려지는 생물과 직접 이어진 화살표만 흐려져요.</span></div>${board}${webInspector(activity)}${feedback}${activity.observed?`<div class="web-alternative"><h3>개구리 대신, 뱀에게 남은 먹이 두 가지를 골라요.</h3><div>${['mouse','sparrow','grasshopper','rice'].map(id=>`<button class="organism-card ${activity.alternatives.has(id)?'found':''}" data-web-alternative="${id}" ${activity.alternatives.has(id)||!activity.removed?'disabled':''} aria-label="${webName(id)}${activity.alternatives.has(id)?', 찾았어요':''}">${webPicture(id)}${activity.alternatives.has(id)?'<small>✓ 찾았어요</small>':''}</button>`).join('')}</div><p>${activity.alternatives.size} / 2가지 찾음</p></div>`:''}${webPathChoices(activity)}<button id="webNext" class="primary wide" ${activity.observed&&activity.alternatives.size===2?'':'disabled'}>내 생각 정리하기 →</button>`;
    if(stage==='reflect')body=`${board}<div class="web-evidence"><b>우리가 그림에서 찾은 근거</b><p>게임에서 뱀이 먹었던 다른 먹이도 남아 있어요.</p><div class="evidence-meals">${webMealCard('snake','mouse')}${webMealCard('snake','sparrow')}</div></div><label class="web-reflection-label" for="webReflection">먹이사슬과 먹이그물은 어떻게 다른가요?<small>찾아본 먹이관계 한 가지를 근거로 내 생각을 적어 보세요.</small></label><textarea id="webReflection" maxlength="180" rows="3" placeholder="먹이그물에서는 한 동물이 여러 먹이를 먹었어요. 예를 들어 개구리가 없을 때도 뱀은 ___를 먹을 수 있었어요.">${webEscape(activity.reflection)}</textarea><p id="webWritingCount" class="web-writing-note">${activity.reflection.length} / 180자 · 쓴 내용은 이 기기 안에만 남아요.</p><button id="webNext" class="primary wide" ${activity.reflection.trim()?'':'disabled'}>먹이그물 탐험 마치기</button>`;
    if(stage==='complete')body=`<p class="web-intro-copy">숲 게임으로 7종류 생물의 먹이관계 10개를 모으고, 다른 먹이 두 가지도 찾았어요.</p>${board}${webInspector(activity)}<div class="web-definition"><b>먹이그물</b><p>여러 개의 먹이사슬이 서로 얽혀 그물처럼 연결된 관계예요.<br>한 종류의 먹이가 없어도 다른 먹이를 먹을 수 있지만, 변화의 영향이 사라지는 것은 아니에요.</p></div><div class="web-my-thought"><b>나의 생각</b><p>${webEscape(activity.reflection)}</p></div>${webPathChoices(activity)}<button id="saveWeb" class="primary wide">내 먹이그물과 생각을 그림으로 저장</button><p id="webSaveStatus" class="web-save-status" role="status"></p>`;
  }
  if(stage==='play')return body;
  return `<div class="web-page-header"><span class="eyebrow">먹이사슬에서 먹이그물로</span><h2>${title}</h2><ol class="web-steps" aria-label="활동 순서">${['사슬 가져오기','숲 게임','변화 살피기','내 생각','완료'].map((name,i)=>`<li class="${i===step?'current':i<step?'done':''}" ${i===step?'aria-current="step"':''}>${i+1} ${name}</li>`).join('')}</ol></div>${body}<p class="web-model-note">학습을 위해 대표 먹이관계를 단순화한 그림이에요. 이 그림에 없는 관계도 있고, 종류와 계절에 따라 먹이는 달라질 수 있어요.</p><button id="webBack" class="secondary wide">${hasGameRecords?'먹이사슬 탐험 기록으로 돌아가기':'처음 화면으로 돌아가기'}</button>`;
}

export function webHuntMarkup(activity){
  const hunt=activity.hunt;
  return `<div class="hunt-topbar"><div><b>먹이그물 숲 게임</b><span id="huntRoleLabel">${webName(hunt.role)} · ${hunt.level+1} / 4</span></div><div><button id="huntBook">먹이 그림 기록</button><button id="huntPause">잠깐 멈춤</button><button id="webBack">나가기</button></div></div><div class="hunt-arena"><canvas id="webHuntField" aria-label="먹이그물 숲. 빈 곳을 누르거나 조작판으로 동물을 움직여 먹이를 찾아요."></canvas><aside class="hunt-goals"><div class="hunt-role-picture">${webPicture(hunt.role)}<span>내가 맡은 동물</span></div><div><b>서로 다른 먹이를 모두 찾아요</b><div class="hunt-food-pictures">${hunt.foods.map(id=>`<div id="huntGoal-${id}" class="hunt-goal">${webPicture(id)}<small id="huntFound-${id}">찾아 먹기</small></div>`).join('')}</div></div></aside><div id="huntLearned" class="hunt-learned">발견한 관계 ${activity.edges.length} / 10</div><div class="hunt-mobile-controls"><div id="huntJoystick" class="joystick" aria-label="먹이그물 게임 이동 조작판"><span id="huntStick"></span><small>이동</small></div><button id="huntDash" class="hunt-dash">빠르게 이동<small id="huntCooldown">준비 완료</small></button></div><div id="huntMealToast" class="hunt-meal-toast" hidden></div><div id="huntRespawn" class="hunt-respawn" hidden></div><section id="huntPaused" class="hunt-modal" hidden><div><h3>잠깐 쉬어 가요</h3><p>먹이 그림을 보고 다시 찾아볼까요?</p><button id="huntResume" class="primary wide">계속 탐험하기</button></div></section><section id="huntRoundDone" class="hunt-modal" hidden><div><span class="eyebrow">여러 먹이 찾기 성공!</span><h3>${webName(hunt.role)}의 먹이를 모두 만났어요</h3><div id="huntRoundMeals"></div><button id="huntAdvance" class="primary wide">${hunt.level===3?'완성한 먹이그물 살펴보기':'다음 동물로 탐험하기'}</button></div></section><section id="huntNotebook" class="hunt-modal" hidden><div class="hunt-notebook-card"><h3>내가 만난 먹이관계</h3><div id="huntNotebookMeals"></div><button id="closeHuntBook" class="primary wide">게임으로 돌아가기</button></div></section></div><p class="hunt-control-note">방향키·WASD / 이동 조작판 / 빈 곳 누르기 · 먹이에 가까이 가면 자동으로 먹어요. 잡혀도 찾은 먹이는 유지돼요.</p>`;
}
