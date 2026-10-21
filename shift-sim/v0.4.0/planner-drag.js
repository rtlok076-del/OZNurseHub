// Pointer events support mouse, pen and touch; arrow keys offer the same ordering.
export function wirePlannerDrag(list,onChange){
 const ids=()=>[...list.children].map(el=>el.dataset.group);
 for(const handle of list.querySelectorAll('.drag-handle')){
  const tile=handle.closest('.routine-tile');
  handle.addEventListener('keydown',e=>{
   if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();
   if(e.key==='ArrowUp'&&tile.previousElementSibling)list.insertBefore(tile,tile.previousElementSibling);
   if(e.key==='ArrowDown'&&tile.nextElementSibling)list.insertBefore(tile.nextElementSibling,tile);
   if(e.key==='Home')list.prepend(tile);if(e.key==='End')list.append(tile);
   handle.focus({preventScroll:true});tile.scrollIntoView({block:'nearest'});onChange(ids(),tile.dataset.group);
  });
  handle.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;e.preventDefault();list.setPointerCapture(e.pointerId);
   const original=[...list.children];let y=e.clientY,active=true;tile.classList.add('dragging');handle.setAttribute('aria-pressed','true');
   function reorder(){
    const others=[...list.children].filter(el=>el!==tile);
    const next=others.find(el=>{const r=el.getBoundingClientRect();return y<r.top+r.height/2;});
    list.insertBefore(tile,next||null);
   }
   const frame=()=>{if(!active)return;const r=list.getBoundingClientRect();if(y<r.top+44)list.scrollTop-=8;else if(y>r.bottom-44)list.scrollTop+=8;reorder();requestAnimationFrame(frame);};
   function move(e){y=e.clientY;reorder();}
   function finish(e){if(!active)return;active=false;tile.classList.remove('dragging');handle.removeAttribute('aria-pressed');
    document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',finish);document.removeEventListener('pointercancel',finish);
    if(e.type==='pointercancel')for(const el of original)list.append(el);
    
    if(list.hasPointerCapture(e.pointerId))list.releasePointerCapture(e.pointerId);handle.focus({preventScroll:true});onChange(ids(),tile.dataset.group);
   }
   document.addEventListener('pointermove',move);document.addEventListener('pointerup',finish);document.addEventListener('pointercancel',finish);requestAnimationFrame(frame);
  });
 }
}
