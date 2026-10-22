import {WebBuilder} from './web-builder.js';
import {WEB_ORGANISMS,WEB_POSITIONS,webName,webEdgeGeometry,isWebEdge} from './web-ecosystem.js';
import {webPicture} from './web-art.js';
import {webEscape} from './web-view.js';
import {downloadBuilderReport} from './builder-export.js';

export const builderHelpMarkup=()=>`<span class="eyebrow">먹이그물 만들기 · 사용 방법</span><h2 id="helpTitle">내 손으로 연결해요</h2><ol><li><b>먹히는 생물</b>을 먼저 누른 뒤, 그 생물을 <b>먹는 생물</b>을 눌러요. 화살표는 먹히는 생물 → 먹는 생물 방향이에요.</li><li>여러 먹이사슬이 이어지도록 계속 연결해요. 같은 생물도 여러 번 연결할 수 있어요.</li><li><b>연결 확인</b>을 누르면 이 체험의 모형에 맞는 선은 초록색, 다시 살펴볼 선은 붉은 점선으로 보여요.</li><li><b>선 지우기</b>를 켜고 화살표를 누르거나, 연결 목록에서 골라 지워요. <b>되돌리기</b>로 마지막 변경을 취소할 수 있어요.</li><li>이름과 설명은 원하면 적어요. <b>그림 저장</b>을 누르면 내가 연결한 먹이그물이 한 장의 PNG로 저장돼요.</li></ol><p>17개를 모두 연결하지 않아도 저장할 수 있어요. 새로고침하면 만들던 내용이 초기화돼요.</p>`;

export class BuilderView{
 constructor(root,{onClose}={}){this.root=root;this.state=new WebBuilder();this.onClose=onClose;this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(root);}
 show(){this.paint();}
 fit(){const wrap=this.root.querySelector('.builder-board-wrap'),board=this.root.querySelector('.builder-board');if(!wrap||!board)return;const r=wrap.getBoundingClientRect(),scale=Math.min(r.width/1000,r.height/660);board.style.transform=`translate(-50%,-50%) scale(${scale})`;}
 paint(){
  const s=this.state,paths=s.edges.map(([a,b],i)=>{const d=webEdgeGeometry(a,b).path,wrong=s.checked&&!isWebEdge(a,b),color=wrong?'#b8483f':s.checked?'#477956':'#bd8434';return `<g data-builder-edge="${i}" class="builder-edge ${s.erase?'erasable':''}" aria-label="${webName(a)} → ${webName(b)}"><path d="${d}" stroke="transparent" stroke-width="24" fill="none"/><path d="${d}" stroke="${color}" stroke-width="5" ${wrong?'stroke-dasharray="10 6"':''} fill="none" marker-end="url(#builderArrow-${wrong?'review':s.checked?'correct':'draft'})"/></g>`;}).join('');
  this.root.innerHTML=`<header class="builder-header"><div><span class="eyebrow">게임에서 만난 관계를 떠올려요</span><h2>먹이그물 만들기</h2></div><div class="builder-tools"><button id="builderUndo" ${s.history.length?'':'disabled'}>되돌리기</button><button id="builderErase" aria-pressed="${s.erase}">${s.erase?'선 지우는 중':'선 지우기'}</button><button id="builderCheck">연결 확인</button><button id="builderSave" class="primary" ${s.edges.length?'':'disabled'}>그림 저장</button></div></header>
  <p class="builder-direction"><b>① 먹히는 생물</b><span> → </span><b>② 먹는 생물</b><span> 순서로 눌러 연결해요.</span></p>
  <div class="builder-body"><div class="builder-board-wrap"><div class="builder-board"><svg viewBox="0 0 1000 660" aria-label="내가 연결한 화살표"><defs>${[['draft','#bd8434'],['correct','#477956'],['review','#b8483f']].map(([key,color])=>`<marker id="builderArrow-${key}" markerUnits="userSpaceOnUse" markerWidth="18" markerHeight="18" refX="14" refY="9" orient="auto"><path d="M2 2 L16 9 L2 16 Z" fill="${color}"/></marker>`).join('')}</defs>${paths}</svg>${Object.keys(WEB_ORGANISMS).map(id=>{const [x,y]=WEB_POSITIONS[id];return `<button class="builder-node ${s.pending===id?'selected':''}" data-builder-node="${id}" style="left:${x}px;top:${y}px" aria-pressed="${s.pending===id}" aria-label="${webName(id)}">${webPicture(id)}</button>`;}).join('')}</div></div>
  <aside class="builder-side"><div class="builder-feedback"><b>내가 연결한 관계 ${s.edges.length}개</b><p id="builderMessage" role="status">${webEscape(s.message)}</p><small>${s.checked?'초록 실선: 확인한 관계 · 붉은 점선: 다시 살펴볼 관계':'연결한 뒤 ‘연결 확인’으로 살펴봐요.'}</small></div><div class="builder-fields"><label>이름 <span>(선택)</span><input id="builderName" maxlength="24" value="${webEscape(s.name)}" placeholder="이름을 적어요"></label><label>내 먹이그물 설명 <span>(선택)</span><textarea id="builderNote" maxlength="120" rows="3" placeholder="여러 생물이 어떻게 이어져 있나요?">${webEscape(s.note)}</textarea></label></div><div class="builder-edit"><label for="builderEdgeSelect">연결 목록에서 지우기</label><div><select id="builderEdgeSelect"><option value="">연결 고르기 (${s.edges.length})</option>${s.edges.map(([a,b],i)=>`<option value="${i}">${webName(a)} → ${webName(b)}</option>`).join('')}</select><button id="builderRemove" disabled>지우기</button></div></div></aside></div>
  <footer class="builder-footer"><button id="builderBack">활동 화면으로</button><small>이 체험의 대표 먹이관계로 연결해요. 새로고침하면 초기화돼요.</small><button id="builderClear" ${s.edges.length?'':'disabled'}>모두 지우기</button></footer>`;
  const get=id=>this.root.querySelector('#'+id),paint=()=>this.paint();
  this.root.querySelectorAll('[data-builder-node]').forEach(b=>b.onclick=()=>{s.select(b.dataset.builderNode);paint();});
  this.root.querySelectorAll('[data-builder-edge]').forEach(b=>b.onclick=()=>{if(s.erase){s.remove(+b.dataset.builderEdge);paint();}});
  get('builderUndo').onclick=()=>{s.undo();paint();};get('builderErase').onclick=()=>{s.erase=!s.erase;s.pending=null;s.message=s.erase?'지울 화살표를 누르거나 연결 목록에서 골라요.':'먹히는 생물부터 다시 연결해요.';paint();};
  get('builderCheck').onclick=()=>{s.check();paint();};get('builderClear').onclick=()=>{if(confirm('내가 연결한 화살표를 모두 지울까요?')){s.clear();paint();}};
  get('builderName').oninput=e=>s.name=e.target.value;get('builderNote').oninput=e=>s.note=e.target.value;
  get('builderEdgeSelect').onchange=e=>get('builderRemove').disabled=e.target.value==='';get('builderRemove').onclick=()=>{const v=get('builderEdgeSelect').value;if(v!==''){s.remove(+v);paint();}};
  get('builderSave').onclick=()=>{try{downloadBuilderReport(s);get('builderMessage').textContent='내가 만든 먹이그물을 그림으로 저장했어요.';}catch(e){get('builderMessage').textContent=e.message;}};
  get('builderBack').onclick=()=>this.onClose?.();this.fit();
 }
}
