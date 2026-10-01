import fs from 'node:fs/promises';
import {CONFIG} from './config/defaults.js';
import {fetchKlinesPaginated} from './data/binance.js';
import {runBacktest} from './backtest/engine.js';
import {windows} from './validation/walkforward.js';
import {monteCarlo} from './validation/montecarlo.js';
import {shock,spreadStress} from './validation/stress.js';
import {insertSupabase,supabaseEnabled} from './integrations/supabase.js';

const cmd=process.argv[2]||'validate';
const cfg={...CONFIG};
if(cfg.dryRun!==true)throw new Error('DRY_RUN must remain true');
const file='data/klines.json';
const symbol=process.env.SYMBOL||'SOLUSDT';
const interval=process.env.INTERVAL||'1h';

if(cmd==='download'){
  const now=Date.now(), year=now-365*24*3600*1000;
  const data=await fetchKlinesPaginated(symbol,interval,year,now);
  if(data.length===0)throw new Error('No market data downloaded');
  await fs.writeFile(file,JSON.stringify(data));
  console.log(`Downloaded ${data.length} candles to ${file}`);
  process.exit(0);
}

const candles=JSON.parse(await fs.readFile(file,'utf8'));
if(!Array.isArray(candles)||candles.length<100)throw new Error('Insufficient candle data. Run npm run download first.');

const startedAt=new Date().toISOString();
const full=runBacktest(candles,cfg);
const wf=windows(candles).map(w=>({range:[w.start,w.end],train:runBacktest(w.train,cfg).metrics,test:runBacktest(w.test,cfg).metrics}));
const mc=monteCarlo(full.trades,1000);
const stress=runBacktest(shock(candles,-0.10),cfg).metrics;
const spread=runBacktest(candles,spreadStress(cfg,10)).metrics;
const sensitivityGrid=[];
for(const minScore of [60,70,80]) for(const gridTargetPct of [0.5,1.0,1.5]) for(const slippageBps of [5,10]){
  const testCfg={...cfg,minScore,gridTargetPct,slippageBps};
  sensitivityGrid.push({minScore,gridTargetPct,slippageBps,metrics:runBacktest(candles,testCfg).metrics});
}
const report={
  version:'V8.2',timestamp:new Date().toISOString(),
  safety:{dryRun:cfg.dryRun,realOrders:false},
  data:{symbol,interval,candles:candles.length,start:candles[0].time,end:candles.at(-1).time},
  baseline:full.metrics,walkForward:wf,monteCarlo:mc,
  stress:{minus10pctShock:stress,extra10bpsCosts:spread},
  sensitivity:sensitivityGrid,
  integration:{supabase:supabaseEnabled()}
};
await fs.writeFile('reports/v8.2-validation.json',JSON.stringify(report,null,2));

if(supabaseEnabled()){
  const run=await insertSupabase('bot_runs',{run_type:cmd,symbol,interval,dry_run:true,started_at:startedAt,finished_at:new Date().toISOString(),status:'completed',metadata:{candles:candles.length,version:'V8.2'}});
  if(run.enabled) console.log('Supabase audit record written.');
}
console.log(JSON.stringify(report,null,2));
