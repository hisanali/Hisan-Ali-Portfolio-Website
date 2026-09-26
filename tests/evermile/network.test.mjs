import test from 'node:test';
import assert from 'node:assert/strict';
import {Network} from '../../evermile/network.js';
import {DESTINATIONS} from '../../evermile/destinations.js';
const base={seed:'the-long-way',location:'hills',roadWidth:10.6,roadStyle:'normal',autoLane:'left'};
for(const [destination,place] of Object.entries(DESTINATIONS))test(`${destination}: stable road, finite terrain, deterministic rebuild`,()=>{const settings={...base,destination};const a=new Network(settings),b=new Network(settings);assert.equal(a.typeAt(35),place.type);for(let z=0;z<3200;z+=10){assert.equal(a.x(z),b.x(z));assert.ok(Math.abs(a.y(z+1)-a.y(z))<.15);for(const dx of [-150,-20,0,20,150])assert.ok(Number.isFinite(a.terrain(a.x(z)+dx,z)));}if(destination!=='journey'){for(let z=0;z<900;z+=80){assert.ok(Math.abs(a.terrain(a.x(z)+20,z)-a.y(z))<1);}}});
for(const destination of Object.keys(DESTINATIONS).filter(x=>x!=='journey'))test(`${destination}: authored district excludes hidden roadside services`,()=>{const n=new Network({...base,destination});for(let z=-120;z<1080;z+=20){assert.equal(n.stopAt(z,60),null);assert.equal(n.townAt(z),null);assert.equal(n.tunnelAt(z),null);assert.equal(n.railAt(z),null);}});
