import {rsi,bollinger,adx} from '../indicators/core.js';
import {metrics} from '../validation/metrics.js';

export function score(candles, i){
  const h=candles.slice(0,i+1), closes=h.map(x=>x.close), last=closes.at(-1);
  const R=rsi(closes), B=bollinger(closes), A=adx(h);
  if(R===null||!B||A===null) return {score:0,rsi:R,adx:A,bb:B,regime:'INSUFFICIENT'};
  const width=B.width, breakout=last>B.upper||last<B.lower;
  let s=50;
  if(R>=40&&R<=60)s+=8; else if(R<30||R>70)s-=8;
  if(A>=25)s+=12; else if(A<15)s-=8;
  if(width<0.025)s-=10;
  if(breakout)s-=15;
  const regime=A>=25?(last>B.mid?'TREND_UP':'TREND_DOWN'):(width<0.035?'COMPRESSION':'RANGE');
  return {score:Math.max(0,Math.min(100,s)),rsi:R,adx:A,bb:B,breakoutRisk:breakout?'HIGH':'NORMAL',regime};
}

export function runBacktest(candles, cfg){
  if(!cfg.dryRun) throw new Error('V8.2 validation engine refuses DRY_RUN=false');
  let cash=cfg.initialQuote, asset=0, entry=0; const trades=[], equity=[];
  for(let i=50;i<candles.length;i++){
    const c=candles[i], q=score(candles,i); const price=c.close;
    if(asset===0 && q.score>=cfg.minScore && q.breakoutRisk!=='HIGH'){
      const buyPx=price*(1+cfg.slippageBps/10000+cfg.spreadBps/20000), spend=cash*0.25;
      const fee=spend*cfg.feeRate; asset=(spend-fee)/buyPx; cash-=spend; entry=buyPx;
    } else if(asset>0){
      const ret=(price-entry)/entry*100;
      if(ret>=cfg.gridTargetPct || ret<=-2.0 || q.breakoutRisk==='HIGH'){
        const sellPx=price*(1-cfg.slippageBps/10000-cfg.spreadBps/20000), gross=asset*sellPx, fee=gross*cfg.feeRate, net=gross-fee;
        const netPct=(net/(asset*entry)-1)*100; trades.push({index:i,entry,exit:sellPx,netPct,reason:ret>=cfg.gridTargetPct?'TARGET':ret<=-2?'STOP':'BREAKOUT'}); cash+=net; asset=0; entry=0;
      }
    }
    equity.push(cash+asset*price);
  }
  if(asset>0){const price=candles.at(-1).close; cash+=asset*price*(1-cfg.feeRate); asset=0; equity.push(cash);}
  return {metrics:metrics(trades,equity),trades,equity};
}
