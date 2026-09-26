import test from 'node:test';
import assert from 'node:assert/strict';
import {boomFraction} from '../../evermile/camera-clearance.js';
test('Chase camera retracts before a following bus, but ignores traffic in another lane',()=>{
 const target={x:0,y:1.35,z:0},eye={x:0,y:5.5,z:-14},bus={x:0,y:0,z:-10,width:2.6,length:10,height:3.9,yaw:0};
 const t=boomFraction(target,eye,[bus]);assert.ok(t>.15&&t<.4);assert.equal(boomFraction(target,eye,[{...bus,x:8}]),1);
 assert.equal(boomFraction(target,eye,[]),1);assert.equal(boomFraction(target,eye,[{...bus,z:15}]),1);
});
