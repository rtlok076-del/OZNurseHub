export const trolleyPoint={x:835,y:345};
export const bedsidePoint=id=>({x:(id%2?540:65)+205,y:id<2?225:455});
const roomOf=p=>p.y<280?(p.x<500?0:1):p.y>397?(p.x<500?2:3):null;
const door=id=>({x:(id%2?540:65)+200,y:345});
export function walkRoute(from,to){
 const route=[],a=roomOf(from),b=roomOf(to);
 if(a!==null){const d=door(a);route.push({x:d.x,y:from.y},d);}
 if(b!==null){const d=door(b);route.push(d,{x:d.x,y:to.y});}
 else route.push({x:to.x,y:345});
 route.push({...to});return route.filter((p,i)=>i===0||p.x!==route[i-1].x||p.y!==route[i-1].y);
}
export function mapTarget(x,y){
 if(x<43||x>957||y<37||y>614)return null;
 if(x>=810&&x<=868&&y>=312&&y<=380)return {kind:'trolley',point:trolleyPoint};
 if(x>=430&&x<=565&&y>=270&&y<=330)return {kind:'jess',point:{x:500,y:345}};
 for(let id=0;id<4;id++){const rx=id%2?540:65,ry=id<2?55:402;
  if(x>=rx&&x<=rx+395&&y>=ry&&y<=ry+215){
   if(x>=rx+75&&x<=rx+195&&y>=ry+35&&y<=ry+195)return {kind:'patient',id,point:bedsidePoint(id)};
   return {kind:'walk',point:{x:Math.max(rx+20,Math.min(rx+375,x)),y:Math.max(ry+25,Math.min(ry+190,y))}};
  }
 }
 return {kind:'walk',point:{x:Math.max(65,Math.min(930,x)),y:Math.max(300,Math.min(375,y))}};
}
export function stepWalk(player,path,distance){
 while(path.length&&distance>0){const target=path[0],dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy);
  if(d<=distance){player.x=target.x;player.y=target.y;distance-=d;path.shift();}
  else {player.x+=dx/d*distance;player.y+=dy/d*distance;distance=0;}
 }
 return path.length===0;
}
