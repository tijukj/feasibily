import { npv } from './src/engine/engine.js';

const flows = [-1730600, 300000, 300000, 300000, 300000, 300000];
let low = -0.05;
let high = 0;
let npv1 = npv(low, flows);

for (let i = 0; i < 50; i++) {
  let mid = (low + high) / 2;
  let midNpv = npv(mid, flows);
  console.log(`i=${i}, low=${low.toFixed(6)}, high=${high.toFixed(6)}, mid=${mid.toFixed(6)}, npv1=${npv1.toExponential(4)}, midNpv=${midNpv.toExponential(4)}`);
  
  if ((npv1 > 0 && midNpv > 0) || (npv1 < 0 && midNpv < 0)) {
    low = mid;
    npv1 = midNpv; // update the sign reference
  } else {
    high = mid;
  }
}
