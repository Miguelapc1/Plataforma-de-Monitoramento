# 🛡️ Sentinel — Operational Observability Platform

Plataforma de monitoramento contínuo e observabilidade operacional para serviços web.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | NestJS, Node.js |
| Banco | PostgreSQL 16 |
| Queue | Redis + BullMQ |
| Realtime | Socket.IO (WebSocket) |
| Gráficos | Recharts |

## Quickstart com Docker

```bash
# 1. Clone e entre no projeto
cd sentinel

# 2. Suba todos os serviços
docker-compose up -d

# 3. Aguarde ~30s para os serviços iniciarem
# 4. Acesse http://localhost:3000
```

**Credenciais padrão:**
- Username: `admin`
- Password: `sentinel@2024`

> ⚠️ Troque a senha do admin direto no banco após o primeiro login:
> ```sql
> UPDATE users SET password = '$2b$12$<novo_hash>' WHERE username = 'admin';
> ```

## Desenvolvimento local

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## Criar usuários manualmente

O sistema **não possui cadastro público**. Usuários são criados diretamente no banco:

```sql
-- Gere um hash bcrypt antes (ex: usando https://bcrypt-generator.com)
INSERT INTO users (username, password, role)
VALUES ('operador1', '$2b$12$<hash>', 'operator');
```

Ou via script Node.js:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('minha_senha', 12);
console.log(hash);
```

## Arquitetura

```
sentinel/
├── backend/                 # NestJS API
│   └── src/
│       ├── auth/            # JWT auth, login
│       ├── monitors/        # CRUD monitores + métricas
│       ├── checks/          # Resultados de cada probe
│       ├── incidents/       # Gestão de incidentes
│       ├── queue/           # BullMQ scheduler + processor
│       │   ├── probe.worker.ts      # Motor de monitoramento
│       │   ├── monitor.scheduler.ts # Agendador (cron)
│       │   └── monitor.processor.ts # Consumidor da fila
│       ├── websocket/       # Socket.IO gateway
│       └── metrics/         # Agregações
├── frontend/                # Next.js 14
│   └── src/
│       ├── app/
│       │   ├── login/       # Página de login
│       │   ├── dashboard/   # Dashboard principal
│       │   └── monitors/[id]/ # Detalhes do monitor
│       ├── components/
│       │   ├── charts/      # Recharts (sparkline, RT, heatmap)
│       │   ├── monitors/    # MonitorCard, AddMonitorModal
│       │   ├── ui/          # StatusBadge, MetricCard, Skeleton
│       │   └── layout/      # Navbar
│       ├── hooks/           # useAuth, useWebSocket
│       ├── lib/             # api.ts, utils.ts
│       └── types/           # Interfaces TypeScript
├── docker/
│   └── init.sql             # Schema PostgreSQL completo
└── docker-compose.yml
```

## Monitoramento contínuo

O scheduler roda um **cron job a cada minuto** que:
1. Busca todos os monitores ativos
2. Verifica quais estão no intervalo de checagem
3. Adiciona jobs na fila BullMQ (Redis)
4. Workers processam cada probe de forma assíncrona

Fluxo de cada probe:
```
Scheduler → BullMQ Queue → Worker → Probe HTTP → Save Check → Update Status → WebSocket emit
                                                       ↓
                                               Open/Resolve Incident
```

## Classificação de status

| Status | Critério |
|--------|---------|
| healthy | HTTP < 400, resposta < 1s |
| warning | Resposta 1-2s, ou leve degradação |
| degraded | HTTP 4xx, resposta 2-5s |
| critical | HTTP 5xx, timeout |
| offline | DNS failure, connection refused |

## Segurança (SSRF Protection)

Bloqueia monitoramento de endereços privados:
- `localhost`, `127.x.x.x`
- `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`
- `::1`, `fc00::/7`
- `0.0.0.0`

## Variáveis de ambiente

### Backend (.env)
```
DATABASE_URL=postgresql://sentinel:sentinel_secret@localhost:5432/sentinel_db
REDIS_URL=redis://:sentinel_redis_secret@localhost:6379
JWT_SECRET=sua_chave_secreta_minimo_32_chars
JWT_EXPIRES_IN=24h
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Roadmap (arquitetura preparada)

- [ ] Captive portal monitoring (Playwright/Puppeteer)
- [ ] Hotspot / Mikrotik validation
- [ ] Screenshot automático de portais
- [ ] Multi-region monitoring
- [ ] Alert channels (Slack, email, webhook)
- [ ] SLA reports PDF
- [ ] Synthetic monitoring (fluxo de login)
# Plataforma-de-Monitoramento
# Plataforma-de-Monitoramento
