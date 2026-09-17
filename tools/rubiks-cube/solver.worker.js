import Cube from './vendor/cube.js';
import './vendor/solve.js';
import {correctOrientation} from './cube-core.js';
let initialized=false;
self.onmessage=({data})=>{try{self.postMessage({status:'Checking colours and automatically aligning your faces…'});const aligned=correctOrientation(data.state,Cube);if(aligned.error)throw Error(aligned.error);const state=aligned.state;if(!initialized){self.postMessage({status:'Preparing the solver for its first run…'});Cube.initSolver();initialized=true;}const cube=Cube.fromString(state);const algorithm=cube.isSolved()?'':cube.solve();const check=Cube.fromString(state).move(algorithm);if(!check.isSolved())throw Error('Could not verify this solution. Please review the cube and try again.');self.postMessage({algorithm,state,corrected:aligned.corrected});}catch(e){self.postMessage({error:e.message||'Unable to solve this cube. Please check your colours.'});}};
