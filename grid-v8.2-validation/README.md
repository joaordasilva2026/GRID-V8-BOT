# GRID V8.2 — Validation Engine

Camada de validação da família GRID V8. **Sem execução real e sem API Key/Secret.**

## Objetivo
Testar uma estratégia antes de qualquer negociação real, incluindo:
- backtest com custos;
- out-of-sample;
- Walk-Forward;
- sensitivity analysis;
- stress tests;
- Monte Carlo sobre a sequência de retornos;
- métricas de risco e relatório auditável.

## Regra de segurança
`DRY_RUN=true` é obrigatório nesta etapa. Este projeto não contém módulo de envio de ordens.

## Dados
O downloader usa somente endpoints públicos de market data da Binance. O projeto não precisa de API Key para baixar klines públicas.

## Instalação
```bash
npm install
npm test
```

## Fluxo
```bash
npm run download
npm run backtest
npm run validate
```

> A meta de 1% é apenas uma meta de pesquisa; o motor não força trades para atingir 1%.

## Supabase integration

The engine can write audit records to the Supabase `bot_runs` table when both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present in the runtime environment. The database tables use RLS, so the public/publishable key is intentionally not used for server-side writes. Never commit the service-role key.

## Safety

`DRY_RUN` is mandatory and the current engine contains no real Binance order module. Historical validation must pass independent robustness checks before any separate execution component is considered.
