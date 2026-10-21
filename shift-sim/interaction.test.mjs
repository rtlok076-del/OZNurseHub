import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bandIndex,correctPlots} from './v0.5.0/observation-chart.js';
import {mapTarget,walkRoute,stepWalk,bedsidePoint,trolleyPoint} from './v0.5.0/navigation.js';
import {people} from './v0.5.0/shift-data.js';
import * as E from './v0.5.0/engine.js';
test('Every authored observation has a plotting band; incorrect placements cannot sign a chart',()=>{
 for(const p of people)for(const readings of [p.baseline,p.readings,p.repeat]){const rows=readings.map((v,i)=>bandIndex(i,v));assert.ok(rows.every(i=>i>=0));assert.equal(correctPlots(readings,rows),true);rows[0]=(rows[0]+1)%8;assert.equal(correctPlots(readings,rows),false);}
 const s=E.fresh(123);s.started=true;E.commit(s,'0-obs');const values=s.observed[0].values,rows=values.map((v,i)=>bandIndex(i,v));
 assert.equal(E.savePlottedChart(s,'0-chart',[0,0,0,0,0,0]).ok,false);assert.equal(s.entries.length,0);
 assert.equal(E.savePlottedChart(s,'0-chart',rows).ok,true);assert.deepEqual(s.entries[0].plotRows,rows);assert.deepEqual(s.entries[0].values,values);
 assert.equal(E.savePlottedChart(s,'0-chart',rows).ok,false);
});
test('Dot boundaries separate normal, review and response ranges',()=>{
 assert.notEqual(bandIndex(0,20),bandIndex(0,21));assert.notEqual(bandIndex(1,94),bandIndex(1,95));
 assert.notEqual(bandIndex(5,37),bandIndex(5,37.1));assert.notEqual(bandIndex(5,38),bandIndex(5,38.1));
});
test('Map floor, patient, team leader and trolley each have actionable targets',()=>{
 assert.equal(mapTarget(700,350).kind,'walk');assert.equal(mapTarget(200,130).kind,'patient');
 assert.equal(mapTarget(500,306).kind,'jess');assert.equal(mapTarget(trolleyPoint.x,trolleyPoint.y).kind,'trolley');assert.equal(mapTarget(-1,-1),null);
});
test('Walking visits corridor waypoints and arrives at the selected bedside',()=>{
 const p=bedsidePoint(0),destination=bedsidePoint(3),path=walkRoute(p,destination);
 assert.ok(path.some(pt=>pt.y===345));let frames=0;while(!stepWalk(p,path,20)&&frames++<200){}
 assert.deepEqual(p,destination);assert.ok(frames<200);assert.equal(path.length,0);
});
