const BASE='https://data-api.binance.vision/api/v3/klines';

export async function fetchKlines(symbol, interval, startTime, endTime, limit=1000){
  const u=new URL(BASE);
  u.searchParams.set('symbol',symbol);
  u.searchParams.set('interval',interval);
  u.searchParams.set('limit',String(Math.min(limit,1000)));
  if(startTime!=null)u.searchParams.set('startTime',String(startTime));
  if(endTime!=null)u.searchParams.set('endTime',String(endTime));
  const res=await fetch(u);
  if(!res.ok)throw new Error(`Binance market data HTTP ${res.status}`);
  const rows=await res.json();
  return rows.map(r=>({time:r[0],open:+r[1],high:+r[2],low:+r[3],close:+r[4],volume:+r[5]}));
}

export async function fetchKlinesPaginated(symbol, interval, startTime, endTime){
  const out=[];
  let cursor=startTime;
  while(cursor < endTime){
    const batch=await fetchKlines(symbol,interval,cursor,endTime,1000);
    if(batch.length===0)break;
    out.push(...batch);
    const next=batch.at(-1).time + 1;
    if(next<=cursor)break;
    cursor=next;
    if(batch.length<1000)break;
  }
  const seen=new Set();
  return out.filter(c=>{if(seen.has(c.time))return false;seen.add(c.time);return true;});
}
