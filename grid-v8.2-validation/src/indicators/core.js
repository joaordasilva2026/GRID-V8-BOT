export function sma(values, period) {
  if (values.length < period) return null;
  let s=0; for (let i=values.length-period;i<values.length;i++) s+=values[i];
  return s/period;
}
export function stddev(values, period) {
  if (values.length < period) return null;
  const m=sma(values,period); let s=0;
  for(let i=values.length-period;i<values.length;i++) s+=(values[i]-m)**2;
  return Math.sqrt(s/period);
}
export function rsi(closes, period=14) {
  if(closes.length<=period) return null;
  let gain=0, loss=0;
  for(let i=closes.length-period;i<closes.length;i++){const d=closes[i]-closes[i-1]; if(d>=0) gain+=d; else loss-=d;}
  if(loss===0) return 100;
  const rs=(gain/period)/(loss/period); return 100-100/(1+rs);
}
export function bollinger(closes, period=20, mult=2) {
  const mid=sma(closes,period), sd=stddev(closes,period); if(mid===null||sd===null) return null;
  return {mid, upper:mid+mult*sd, lower:mid-mult*sd, width:(2*mult*sd)/mid};
}
export function atr(candles, period=14) {
  if(candles.length<=period) return null; const trs=[];
  for(let i=1;i<candles.length;i++) trs.push(Math.max(candles[i].high-candles[i].low,Math.abs(candles[i].high-candles[i-1].close),Math.abs(candles[i].low-candles[i-1].close)));
  return trs.slice(-period).reduce((a,b)=>a+b,0)/period;
}
export function adx(candles, period=14) {
  if(candles.length<period*2+1) return null;
  const trs=[], plus=[], minus=[];
  for(let i=1;i<candles.length;i++){
    const c=candles[i], p=candles[i-1]; trs.push(Math.max(c.high-c.low,Math.abs(c.high-p.close),Math.abs(c.low-p.close)));
    const up=c.high-p.high, dn=p.low-c.low; plus.push(up>dn&&up>0?up:0); minus.push(dn>up&&dn>0?dn:0);
  }
  const n=trs.length, t=trs.slice(-period).reduce((a,b)=>a+b,0)/period;
  const p=plus.slice(-period).reduce((a,b)=>a+b,0)/period, m=minus.slice(-period).reduce((a,b)=>a+b,0)/period;
  if(t===0) return 0; const pdi=100*p/t, mdi=100*m/t, dx=(pdi+mdi===0?0:100*Math.abs(pdi-mdi)/(pdi+mdi));
  return dx;
}
