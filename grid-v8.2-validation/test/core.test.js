import test from 'node:test'; import assert from 'node:assert/strict'; import {bollinger,rsi} from '../src/indicators/core.js';
test('RSI returns bounded value',()=>{const v=rsi(Array.from({length:30},(_,i)=>100+i)); assert.ok(v>=0&&v<=100);});
test('Bollinger bands contain midpoint',()=>{const b=bollinger(Array.from({length:30},(_,i)=>100+i)); assert.ok(b.lower<b.mid&&b.mid<b.upper);});
