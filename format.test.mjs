import test from 'node:test';
import assert from 'node:assert';
import { formatINR, formatPct, formatPayback, formatNumber } from './src/utils/format.js';

test('Format Helpers', () => {
  // formatINR
  assert.strictEqual(formatINR(null), 'Not applicable');
  assert.strictEqual(formatINR(NaN), 'Not applicable');
  assert.strictEqual(formatINR(Infinity), 'Not applicable');
  assert.strictEqual(formatINR(undefined), 'Not applicable');
  
  assert.strictEqual(formatINR(1500000, true), '₹15.00 L');
  assert.strictEqual(formatINR(-25000000, true), '₹-2.50 Cr');
  assert.strictEqual(formatINR(1234), '₹1,234');
  
  // formatPct
  assert.strictEqual(formatPct(null), 'Not applicable');
  assert.strictEqual(formatPct(0.1234), '12.3%');
  assert.strictEqual(formatPct(-0.05), '-5.0%');
  
  // formatPayback
  assert.strictEqual(formatPayback(null), 'Not within project life');
  assert.strictEqual(formatPayback(2.5), '2 years 6 months');
  assert.strictEqual(formatPayback(0.5), '6 months');
  assert.strictEqual(formatPayback(3), '3 years');
  
  // formatNumber
  assert.strictEqual(formatNumber(Infinity), 'Not applicable');
  assert.strictEqual(formatNumber(1.234), '1.2');
});
