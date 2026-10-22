import {ROLES,HIDE_DURATION,HIDE_RESET_TIME} from './engine.js';
import {WEB_ORGANISMS,WEB_ANIMALS,webName} from './web-ecosystem.js';
import {webPicture} from './web-art.js';

const WEB_SKILL_TIPS={
 grasshopper:'바라보는 방향으로 멀리 뛰어요. 나무와 바위를 뛰어넘을 수 있어요.',
 frog:'바라보는 방향으로 혀를 뻗어, 조금 떨어진 먹이를 잡아요.',
 spider:'3초 동안 몸을 숨겨요. 나무나 풀숲 밖에서도 쓸 수 있고, 이동은 느려져요.',
 mouse:'3초 동안 몸을 숨겨요. 나무나 풀숲 밖에서도 쓸 수 있고, 이동은 느려져요.',
 sparrow:'이동하면서 쓰면 잠깐 더 빨라져요. 평소에도 날아서 나무와 바위를 지나가요.',
 rabbit:'바라보는 방향으로 멀리 뛰어요. 나무와 바위를 뛰어넘을 수 있어요.',
 snake:'3초 동안 몸을 숨겨요. 나무나 풀숲 밖에서도 쓸 수 있고, 이동은 느려져요.',
 hawk:'이동하면서 쓰면 잠깐 빠르게 내려오며 움직여요. 평소에도 나무와 바위를 지나가요.'
};
export function webHelpMarkup(activity){
 const id=activity?.stage==='play'?activity.hunt.role:activity?.stage==='intro'?activity.selected:null;
 const actionName=x=>WEB_ORGANISMS[x].skill||ROLES[WEB_ORGANISMS[x].role].skill;
 const cooldown=x=>ROLES[WEB_ORGANISMS[x].role].cd;
 return `<span class="eyebrow">먹이그물 · 놀이 방법</span><h2 id="helpTitle">내가 고른 동물로 탐험해요</h2>
 ${id?`<div class="help-current"><div class="help-picture">${webPicture(id)}</div><div><b>${webName(id)} · ${actionName(id)}</b><p>${WEB_SKILL_TIPS[id]}</p><small>스페이스 또는 오른쪽 아래 행동 버튼 · 다시 사용: ${cooldown(id)}초 뒤</small></div></div>`:''}
 <ol><li><b>이동:</b> 조작판이나 방향키·WASD로 움직여요. 숲의 빈 곳을 눌러 이동할 수도 있어요.</li><li><b>먹이 미션:</b> 먹이에 가까이 가면 자동으로 먹어요. 왼쪽에 표시된 먹이 횟수와 종류 수에 도전해요. 잡혀도 2.5초 뒤 다시 출발하며, 먹은 기록은 유지돼요.</li><li><b>특수기능:</b> 스페이스 또는 행동 버튼을 눌러요. 버튼에 ‘준비 완료’가 뜨면 다시 쓸 수 있어요.</li><li><b>체험 정리:</b> 시간이 끝나거나 위쪽 ‘체험 정리’를 누르면 그림 퀴즈가 나와요. 퀴즈를 푼 뒤 다른 동물을 고르거나 나의 먹이그물을 살펴봐요. 직접 먹이그물을 만들 수도 있어요. 모든 동물을 순서대로 할 필요는 없어요.</li></ol>
 <p class="help-key-tip">‘전체 맵·내 시점’ 같은 메뉴를 누른 뒤에는 숲의 빈 곳을 한 번 누르고 스페이스를 사용해요.</p>
 <details class="help-skills" ${id?'':'open'}><summary>8종 동물의 특수기능 살펴보기</summary><div class="help-skill-list">${WEB_ANIMALS.map(x=>`<div class="help-skill-row ${x===id?'selected':''}"><div><b>${webName(x)}</b><span>${actionName(x)} · 다시 사용 ${cooldown(x)}초</span></div><p>${WEB_SKILL_TIPS[x]}</p></div>`).join('')}</div></details>
 <details class="help-hiding"><summary>숨기 보호는 어떻게 되나요?</summary><p><b>메뚜기·개구리·거미·생쥐·토끼·뱀</b>은 나무 가까이나 풀숲에서 멈추면 숨을 수 있어요. <b>참새·매</b>는 숨지 않아요.</p><p>숨기 보호는 처음 <b>${HIDE_DURATION}초</b>예요. 생쥐·거미·뱀의 특수기능도 이 보호 시간을 함께 써요. 이미 보호가 끝났다면 특수기능을 눌러도 보호 시간이 바로 새로 생기지는 않아요.</p><p>다시 보호받으려면 <b>숨기 특수기능이 끝난 뒤 나무·풀숲 밖에서 ${HIDE_RESET_TIME}초 이상</b> 있어야 해요. 화면의 ‘숨기 보호 중·보호 끝’ 안내를 확인해요.</p></details>
 <details class="help-web-map"><summary>먹이그물 그림과 기록 살펴보기</summary><p><b>먹이 기록:</b> 내가 먹거나 잡히며 직접 만난 관계가 쌓여요. 전체 맵과 내 시점은 숲을 보는 방법만 바꿔요.</p><p><b>나의 먹이그물:</b> 직접 만난 관계는 금색이에요. 개구리를 가려 뱀에게 남은 먹이 두 가지를 찾아요. 두 먹이를 찾으면 ‘관찰한 내용 쓰기’를 눌러 생각을 쓰고 그림과 함께 저장해요.</p><p>화살표는 <b>먹히는 생물 → 먹는 생물</b> 방향이에요. 이 숲은 대표 먹이관계를 단순화한 놀이예요.</p></details>`;
}
