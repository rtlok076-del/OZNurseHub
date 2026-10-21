export function createWardRenderer(ctx, state, active) {
const roomX=[65,540,65,540],roomY=[55,55,402,402];
// Original procedural artwork: all ward fixtures and characters are drawn locally.
function rect(x,y,w,h,c,r=0){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function text(t,x,y,size=12,c='#526d63',weight=600){ctx.fillStyle=c;ctx.font=`${weight} ${size}px "DM Sans", sans-serif`;ctx.fillText(t,x,y);}
function plant(x,y){rect(x-9,y+7,20,17,'#b89471',4);ctx.fillStyle='#70946d';for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(x+Math.cos(i*1.3)*9,y+Math.sin(i*1.3)*6,6,12,i*.8,0,7);ctx.fill();}}
function person(x,y,skin='#bf9271',scrubs='#478e85',nurse=false){
 ctx.fillStyle='#526b6125';ctx.beginPath();ctx.ellipse(x,y+20,18,7,0,0,7);ctx.fill();
 rect(x-11,y+1,22,22,scrubs,7);rect(x-9,y+20,7,10,'#28454d',2);rect(x+3,y+20,7,10,'#28454d',2);
 rect(x-13,y-16,26,23,'#54443a',10);rect(x-10,y-10,20,21,skin,8);rect(x-12,y-17,24,8,'#54443a',5);
 rect(x-6,y-3,2,2,'#3b3934');rect(x+5,y-3,2,2,'#3b3934');
 if(nurse){rect(x+4,y+6,5,7,'#ecf1d9',1);text('+',x+4,y+12,6,'#458f83');}
}
function bed(x,y,skin,done){
 rect(x+5,y+7,93,142,'#91a494',8);rect(x,y,91,138,'#f7f6e8',8);
 rect(x+5,y+3,81,9,'#b5c6b4',3);rect(x+13,y+17,65,32,'#fffdf3',8);
 rect(x+35,y+20,24,26,skin,9);rect(x+35,y+18,24,8,'#7e7567',5);
 rect(x+9,y+51,73,70,done?'#a6bca0':'#92b9b1',5);
 rect(x+9,y+58,73,4,'#ffffff35');rect(x+9,y+112,73,8,'#ffffff35');
 rect(x-3,y+50,5,65,'#d1d9cc',2);rect(x+88,y+50,5,65,'#d1d9cc',2);
 rect(x+3,y+132,85,8,'#c3cdbd',3);
}
function draw(now){
 ctx.clearRect(0,0,1000,660);rect(0,0,1000,660,'#d5e1d0');
 // Subtle tiled corridor.
 for(let x=0;x<1000;x+=44)for(let y=0;y<660;y+=44){ctx.strokeStyle='#becfba50';ctx.strokeRect(x,y,44,44);}
 rect(35,30,930,591,'#9eb29c',12);rect(42,37,916,577,'#edf0df',9);
 rect(43,280,914,117,'#dce5d5');
 for(let x=66;x<950;x+=70){rect(x,334,24,3,'#b9cbb2',2);}
 for(const p of state.patients){
  const x=roomX[p.id],y=roomY[p.id],urgent=active(p)&&state.started;
  rect(x+3,y+5,395,215,'#c1cebc',6);rect(x,y,395,211,'#f5f3e5',5);
  rect(x,y,395,8,'#a8bba3');rect(x,y,8,211,'#bdcbb5');rect(x+387,y,8,211,'#bdcbb5');
  const wallY=p.id<2?y+204:y;rect(x,wallY,160,8,'#acbea4');rect(x+239,wallY,156,8,'#acbea4');
  rect(x+163,wallY-2,72,13,'#dce5d5');
  // Window and curtains.
  rect(x+141,y+14,125,21,'#bfd9d8',3);rect(x+149,y+16,109,3,'#e5f1e5');rect(x+199,y+14,4,21,'#f8f6eb');
  rect(x+129,y+13,10,53,'#b7c8a2',2);rect(x+270,y+13,10,53,'#b7c8a2',2);
  bed(x+90,y+48,p.colour,p.done);
  rect(x+205,y+52,47,43,'#c9b89b',4);rect(x+209,y+48,40,40,'#e3d4b8',4);
  rect(x+219,y+57,10,17,'#92b9b2',3);rect(x+232,y+57,9,9,'#fff9ea',2);
  // Monitor.
  rect(x+38,y+65,35,29,'#526d68',3);rect(x+42,y+69,27,20,'#274945',2);
  ctx.strokeStyle=urgent?'#e5c181':'#9ccbb1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+44,y+80);ctx.lineTo(x+50,y+80);ctx.lineTo(x+53,y+73);ctx.lineTo(x+57,y+85);ctx.lineTo(x+61,y+78);ctx.lineTo(x+67,y+78);ctx.stroke();
  rect(x+53,y+94,5,32,'#9caaa0');rect(x+40,y+123,32,4,'#9caaa0',2);
  rect(x+299,y+76,43,41,'#bac7a5',6);rect(x+304,y+82,33,31,'#d4dbc1',5);
  text(p.bed,x+18,y+29,17,'#60775f',800);text(p.short,x+205,y+145,15,'#425e53',700);
  text(p.done?'PLAN REVIEWED':urgent?'CALL BELL':'RESTING',x+205,y+165,9,p.done?'#5c8161':urgent?'#a77539':'#8d9b87');
  if(urgent){const pulse=(Math.sin(now/450)+1)/2;ctx.fillStyle=p.late?`rgba(190,80,70,${.2+pulse*.15})`:`rgba(207,160,74,${.15+pulse*.15})`;ctx.beginPath();ctx.arc(x+339,y+154,17,0,7);ctx.fill();rect(x+334,y+147,10,12,p.late?'#ba5e50':'#bc9551',4);rect(x+332,y+157,14,3,p.late?'#ba5e50':'#bc9551',2);}
  if(p.done)text('✓',x+330,y+159,20,'#76976b');
 }
 // Nurse station in the central passage.
 rect(433,289,132,27,'#93a893',4);rect(438,285,122,23,'#b7c8a8',4);
 rect(464,276,28,22,'#526c63',3);rect(467,279,22,14,'#a9c4b1',2);
 rect(515,288,21,12,'#f8f3dd',2);text('NURSES’ STATION',446,383,9,'#71866d');
 person(500,306,'#ad7e5a','#748caa',true);
 plant(475,71);plant(502,571);plant(915,340);
 // Player marker.
 ctx.fillStyle='#2d7b6e20';ctx.beginPath();ctx.ellipse(state.player.x,state.player.y+25,24,11,0,0,7);ctx.fill();
 person(state.player.x,state.player.y,'#cb9c7b','#287e70',true);
 rect(state.player.x-18,state.player.y-38,36,15,'#276e64',4);text('YOU',state.player.x-12,state.player.y-27,9,'#fffdf1',700);
 if(state.paused){rect(0,0,1000,660,'#183d4660');rect(403,302,194,52,'#173b42',10);text('SHIFT PAUSED',432,335,18,'#eef3df',700);}
}

return draw;
}

