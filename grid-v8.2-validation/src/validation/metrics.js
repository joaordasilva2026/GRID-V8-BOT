export function maxDrawdown(equity){let peak=-Infinity,dd=0; for(const x of equity){peak=Math.max(peak,x); if(peak>0) dd=Math.max(dd,(peak-x)/peak);} return dd*100;}
export function metrics(trades, equity){
  const rets=trades.map(t=>t.netPct/100); const wins=rets.filter(x=>x>0), losses=rets.filter(x=>x<0);
  const grossWin=wins.reduce((a,b)=>a+b,0), grossLoss=Math.abs(losses.reduce((a,b)=>a+b,0));
  const total=(equity.at(-1)/equity[0]-1)*100;
  const avg=rets.length?rets.reduce((a,b)=>a+b,0)/rets.length:0;
  const variance=rets.length?rets.reduce((a,b)=>a+(b-avg)**2,0)/rets.length:0;
  return {trades:rets.length,totalReturnPct:total,winRatePct:rets.length?wins.length/rets.length*100:0,profitFactor:grossLoss?grossWin/grossLoss:null,avgTradePct:avg*100,maxDrawdownPct:maxDrawdown(equity),volatilityPct:Math.sqrt(variance)*100};
}
