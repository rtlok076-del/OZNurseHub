export function wirePlannerDrag(list,onChange){
 const tiles=()=>[...list.querySelectorAll(':scope > .routine-tile')];
 const ids=()=>tiles().map(el=>el.dataset.group);
 const animateMove=change=>{const before=new Map(tiles().map(el=>[el,el.getBoundingClientRect().top]));change();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(const el of tiles()){const dy=before.get(el)-el.getBoundingClientRect().top;if(dy)el.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:160,easing:'ease-out'});}};
 for(const handle of list.querySelectorAll('.drag-handle')){
  const tile=handle.closest('.routine-tile');
  handle.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();animateMove(()=>{
   if(e.key==='ArrowUp'&&tile.previousElementSibling)list.insertBefore(tile,tile.previousElementSibling);
   if(e.key==='ArrowDown'&&tile.nextElementSibling)list.insertBefore(tile.nextElementSibling,tile);
   if(e.key==='Home')list.prepend(tile);if(e.key==='End')list.append(tile);
  });handle.focus({preventScroll:true});tile.scrollIntoView({block:'nearest'});onChange(ids(),tile.dataset.group);});
  handle.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;e.preventDefault();list.setPointerCapture(e.pointerId);
   const original=tiles(),r=tile.getBoundingClientRect(),ghost=tile.cloneNode(true),offsetX=e.clientX-r.left,offsetY=e.clientY-r.top;
   ghost.removeAttribute('data-group');ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));ghost.className='routine-tile drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.inert=true;
   Object.assign(ghost.style,{position:'fixed',width:`${r.width}px`,height:`${r.height}px`,left:'0',top:'0',margin:'0',zIndex:'50',pointerEvents:'none'});
   (list.closest('dialog')||document.body).append(ghost);tile.classList.add('drag-placeholder');handle.setAttribute('aria-pressed','true');
   let x=e.clientX,y=e.clientY,active=true;
   function position(){ghost.style.transform=`translate(${x-offsetX}px,${y-offsetY}px) rotate(-2deg) scale(1.035)`;}
   function reorder(){const next=tiles().filter(el=>el!==tile).find(el=>{const r=el.getBoundingClientRect();return y<r.top+r.height/2;});if(tile.nextElementSibling!==(next||null))animateMove(()=>list.insertBefore(tile,next||null));}
   function frame(){if(!active)return;const r=list.getBoundingClientRect();if(y<r.top+40)list.scrollTop-=7;else if(y>r.bottom-40)list.scrollTop+=7;position();reorder();requestAnimationFrame(frame);}
   function move(e){if(e.pointerId!==startId)return;x=e.clientX;y=e.clientY;position();reorder();}
   const startId=e.pointerId;
   function finish(e){if(!active||e.pointerId!==startId)return;active=false;ghost.remove();tile.classList.remove('drag-placeholder');handle.removeAttribute('aria-pressed');
    document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',finish);document.removeEventListener('pointercancel',finish);
    if(e.type==='pointercancel')for(const el of original)list.append(el);
    if(list.hasPointerCapture(e.pointerId))list.releasePointerCapture(e.pointerId);handle.focus({preventScroll:true});onChange(ids(),tile.dataset.group);
   }
   document.addEventListener('pointermove',move);document.addEventListener('pointerup',finish);document.addEventListener('pointercancel',finish);position();requestAnimationFrame(frame);
  });
 }
}
