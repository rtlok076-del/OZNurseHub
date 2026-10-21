// Numeric plotting bands adapted from SA Health adult RDR MR59A (Nov 2020).
// This six-measurement exercise is not a complete clinical chart or escalation system.
const band=(label,min,max,zone='plain')=>({label,min,max,zone});
const rr=[band('≥36',36,Infinity,'mer'),band('31–35',31,35,'mer'),band('26–30',26,30,'mdt'),band('21–25',21,25,'review'),band('16–20',16,20),band('11–15',11,15),band('8–10',8,10,'review'),band('≤7',0,7,'mer')];
const spo=[band('≥98',98,100),band('95–97',95,97),band('92–94',92,94,'review'),band('89–91',89,91,'mdt'),band('≤88',0,88,'mer')];
const bp=[band('≥200',200,Infinity,'mer'),...Array.from({length:15},(_,i)=>{const n=190-i*10;return band(`${n}s`,n,n+9,n>=180?'mdt':n===170?'review':n===90?'mdt':n<90?'mer':'plain');}),band('≤49',0,49,'mer')];
const hr=[band('≥140',140,Infinity,'mer'),...Array.from({length:10},(_,i)=>{const n=130-i*10;return band(`${n}s`,n,n+9,n>=120?'mdt':n>=100||n===50?'review':n===40?'mdt':'plain');}),band('≤39',0,39,'mer')];
const temp=[band('≥39.1',39.05,Infinity,'mdt'),...Array.from({length:8},(_,i)=>{const lo=38.6-i*.5,hi=39-i*.5;return band(`${lo.toFixed(1)}–${hi.toFixed(1)}`,lo-.049,hi+.049,i===0?'mdt':i===1||i===7?'review':'plain');}),band('≤35',0,35.049,'mdt')];
export const plotMeasures=[{name:'Respiratory rate',short:'RR',bands:rr},{name:'Oxygen saturation',short:'SpO₂',bands:spo},{name:'Heart rate',short:'HR',bands:hr},{name:'Systolic pressure',short:'SBP',bands:bp,mark:'∨'},{name:'Diastolic pressure',short:'DBP',bands:bp.map(b=>({...b,zone:'plain'})),mark:'∧'},{name:'Temperature',short:'Temp',bands:temp}];
export const bandIndex=(i,value)=>plotMeasures[i].bands.findIndex(b=>value>=b.min&&value<=b.max);
export const correctPlots=(values,rows)=>Array.isArray(rows)&&rows.length===6&&rows.every((row,i)=>Number.isInteger(row)&&row===bandIndex(i,values[i]));
export function wirePlotChart(host,{values,at,previous,onSave,onBack}){
 const chosen=Array(6).fill(null);let active=0;
 function render(){const m=plotMeasures[active],mark=m.mark||'●',prior=previous?.values&&bandIndex(active,previous.values[active]);
 host.innerHTML=`<div class="plot-tabs" role="group" aria-label="Choose a measurement">${plotMeasures.map((m,i)=>`<button data-metric="${i}" class="${i===active?'selected':''}" aria-pressed="${i===active}">${m.short}${chosen[i]!==null?' ✓':''}</button>`).join('')}</div><div class="plot-title"><b>${m.name}</b><span>${chosen.filter(v=>v!==null).length}/6 plotted</span></div><p class="small">Tap the current-time column in the band containing the reading. Tap another band to move your mark.${active===4?' Diastolic bands are uncoloured; the source chart uses systolic pressure for BP response triggers.':''}</p><div class="plot-scroll"><table class="plot-table"><thead><tr><th>Band</th><th>${previous?previous.label:'Previous'}</th><th>${at} · plot here</th></tr></thead><tbody>${m.bands.map((b,i)=>`<tr class="zone-${b.zone}"><th scope="row">${b.label}</th><td class="prior-mark">${previous&&prior===i?mark:'·'}</td><td><button class="plot-cell ${chosen[active]===i?'plotted':''}" data-band="${i}" aria-label="Plot ${m.name} in ${b.label} at ${at}" aria-pressed="${chosen[active]===i}">${chosen[active]===i?mark:'<span aria-hidden="true">＋</span>'}</button></td></tr>`).join('')}</tbody></table></div><p id="plot-error" role="alert"></p><div class="plot-actions"><button id="plot-next" class="secondary">${active<5?'Next measurement →':'Back to RR'}</button><button id="plot-save" class="primary" ${chosen.some(v=>v===null)?'disabled':''}>Sign plotted observations</button></div><button id="plot-back" class="quiet full">Return to patient</button>`;
 host.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{active=Number(b.dataset.metric);render();});
 host.querySelectorAll('[data-band]').forEach(b=>b.onclick=()=>{chosen[active]=Number(b.dataset.band);const scroll=host.querySelector('.plot-scroll').scrollTop;render();host.querySelector('.plot-scroll').scrollTop=scroll;host.querySelector(`[data-band="${chosen[active]}"]`).focus({preventScroll:true});});
 host.querySelector('#plot-next').onclick=()=>{active=(active+1)%6;render();};
 host.querySelector('#plot-save').onclick=()=>{if(!correctPlots(values,chosen)){const wrong=plotMeasures.filter((_,i)=>chosen[i]!==bandIndex(i,values[i])).map(m=>m.short);host.querySelector('#plot-error').textContent=`Recheck the monitor and band positions for ${wrong.join(', ')}. No chart entry has been signed.`;return;}onSave([...chosen]);};
 host.querySelector('#plot-back').onclick=onBack;
 }
 render();
}
