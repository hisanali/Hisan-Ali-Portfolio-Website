import Cube from './vendor/cube.js';
import './vendor/solve.js';
import {validate} from './cube-core.js';
let initialized=false;
self.onmessage=({data})=>{try{const error=validate(data.state,Cube);if(error)throw Error(error);if(!initialized){self.postMessage({status:'Preparing the solver for its first run…'});Cube.initSolver();initialized=true;}const cube=Cube.fromString(data.state);const algorithm=cube.isSolved()?'':cube.solve();const check=Cube.fromString(data.state).move(algorithm);if(!check.isSolved())throw Error('Could not verify this solution. Please review the cube and try again.');self.postMessage({algorithm});}catch(e){self.postMessage({error:e.message||'Unable to solve this cube. Please check your colours.'});}};
