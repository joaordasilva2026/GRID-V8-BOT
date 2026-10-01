import fs from 'node:fs/promises';
import {CONFIG} from './config/defaults.js';
import {fetchKlinesPaginated} from './data/binance.js';
import {runBacktest} from './backtest/engine.js';
import {windows} from './validation/walkforward.js';
import {monteCarlo} from './validation/montecarlo.js';
import {shock,spreadStress} from './validation/stress.js';
import {insertSupabase,supabaseEnabled} from './integrations/supabase.js';

const cmd=process.argv[2]||'validate';
if(CONFIG.dryRun!==true) throw new Error('DRY_RUN must remain true');
const file='data/klines.json', symbol=process.env.SYMBOL||'SOLUSDT', interval=process.env.INTERVAL||'1h';
if(cmd==='download'){
 const now=Date.now(), start=now-365*24*3600*1000;
 const data=await fetchKlinesPaginated(symbol,interval,start,now);
 await fs.writeFile(file,JSON.stringify(data)); console.log(`Downloaded ${data.length} candles to ${file}`); process.exit(0);
}
const candles=JSON.parse(await fs.readFile(file,'utf8'));
if(!Array.isArray(candles)||candles.length<100) throw new Error('Insufficient candle data. Run npm run download first.');
const startedAt=new Date().toISOString();
const full=runBacktest(candles,CONFIG);
const wf=windows(candles).map(w=>({range:[w.start,w.end],train:runBacktest(w.train,CONFIG).metrics,test:runBacktest(w.test,CONFIG).metrics}));
const mc=monteCarlo(full.trades,1000);
const stress=runBacktest(shock(candles,-0.10),CONFIG).metrics;
const spread=runBacktest(candles,spreadStress(CONFIG,10)).metrics;
const report={version:'V8.2',timestamp:new Date().toISOString(),safety:{dryRun:true,realOrders:false},symbol,interval,baseline:full.metrics,walkForward:wf,monteCarlo:mc,stress:{shock10Pct:stress,spreadPlus10Bps:spread}};
await fs.mkdir('reports',{recursive:true}); await fs.writeFile('reports/v8.2-validation.json',JSON.stringify(report,null,2));
if(supabaseEnabled()) await insertSupabase('bot_runs',{run_type:cmd,symbol,interval,dry_run:true,started_at:startedAt,finished_at:new Date().toISOString(),status:'completed',metadata:{version:'V8.2',trades:full.trades.length}});
console.log(JSON.stringify(report,null,2));