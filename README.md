# 🛡️ Sentinel — Operational Observability & Continuous Monitoring Platform

Plataforma moderna de observabilidade operacional, monitoramento contínuo de serviços web e análise de disponibilidade em tempo real.

O Sentinel foi projetado para funcionar como uma solução inspirada em plataformas como:
- Datadog
- Better Stack
- Uptime Kuma

com foco em:
- monitoramento contínuo;
- uptime tracking;
- response time analytics;
- incident timeline;
- visualização operacional;
- realtime observability.

---

# ✨ Funcionalidades

## ✅ Monitoramento contínuo em tempo real

O sistema monitora continuamente URLs e endpoints durante todo o período de atividade da aplicação.

Cada monitor:
- executa verificações automáticas;
- coleta métricas reais;
- armazena histórico;
- detecta incidentes;
- atualiza dashboards em tempo real.

---

# 📊 Dashboard Operacional

Painel principal moderno com:

- Status online/offline/degraded
- HTTP Status Code
- Tempo de resposta atual
- Último check
- Uptime 24h / 7d / 30d
- Sparkline das últimas 24 horas
- Quantidade de incidentes
- Severidade visual
- Atualização em tempo real via WebSocket

---

# 🔍 Página Detalhada por Monitor

Cada monitor possui uma página dedicada contendo:

## Cards operacionais
- Status atual
- Última verificação
- Tempo relativo
- Tempo de resposta
- Ambiente (produção/staging/homologação)
- Uptime consolidado

---

## 📈 Gráficos avançados

- Response time timeline
- Picos de latência
- Timeout detection
- HTTP errors
- Períodos offline
- Zoom temporal
- Hover tooltip
- Timeline histórica

---

## 🟥 Heatmap Operacional

Visualização de disponibilidade por hora:

🟩 Saudável  
🟨 Degradado  
🟥 Falha  
⬜ Timeout

---

## 🚨 Timeline de Incidentes

Registro completo de:
- quedas;
- recuperação;
- timeout;
- erros HTTP;
- degradação.

Com:
- duração;
- impacto;
- horário;
- resolução automática.

---

# 📐 Métricas Avançadas

O Sentinel calcula automaticamente:

- Média de resposta
- Melhor resposta
- Pior resposta
- p95 response time
- Tempo total offline
- Quantidade de incidentes
- MTTR
- MTBF
- Disponibilidade percentual

---

# ⚡ Realtime

Atualização em tempo real usando:
- WebSocket
- Socket.IO

Sem necessidade de refresh manual.

---

# 🧠 Casos de Uso

## Infraestrutura
- APIs
- Sistemas internos
- Portais corporativos
- Landing pages
- Ambientes staging

---

## Operação de redes
- Validação de captive portal
- Monitoramento de hotspot
- Verificação operacional Mikrotik
- Ambientes Wi-Fi corporativos

---

## Observabilidade operacional
- SRE
- DevOps
- NOC
- Suporte
- Operações técnicas

---

# 🏗️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 + React |
| Backend | NestJS |
| Database | PostgreSQL 16 |
| Queue | Redis + BullMQ |
| Realtime | Socket.IO |
| Charts | Recharts |
| ORM | TypeORM |
| Auth | JWT |
| Styling | Tailwind + shadcn/ui |
| Containers | Docker + Docker Compose |

---

# 🐳 Quickstart com Docker

## 1. Entrar no projeto

```bash
cd sentinel
```

---

## 2. Subir containers

```bash
docker compose up --build
```

---

## 3. Acessar sistema

Frontend:
```text
http://localhost:3000
```

Backend:
```text
http://localhost:3001
```

---

# 🔐 Credenciais padrão

| Campo | Valor |
|---|---|
| Username | admin |
| Password | sentinel@2024 |

---

# ⚠️ Segurança

O sistema NÃO possui registro público.

Usuários são criados:
- diretamente no banco;
ou
- via script administrativo.

---

# 👤 Criar usuários manualmente

## SQL

```sql
INSERT INTO users (username, password, role)
VALUES ('operador1', '$2b$12$<hash>', 'operator');
```

---

## Gerar hash bcrypt

```javascript
const bcrypt = require('bcrypt');

async function generate() {
  const hash = await bcrypt.hash('minha_senha', 12);
  console.log(hash);
}

generate();
```

---

# 🧩 Arquitetura

```text
sentinel/
├── backend/
│   ├── auth/
│   ├── monitors/
│   ├── checks/
│   ├── incidents/
│   ├── metrics/
│   ├── websocket/
│   ├── queue/
│   └── scheduler/
│
├── frontend/
│   ├── dashboard/
│   ├── monitors/
│   ├── charts/
│   ├── components/
│   ├── hooks/
│   └── ui/
│
├── docker/
│   └── init.sql
│
└── docker-compose.yml
```

---

# 🔄 Fluxo de Monitoramento

```text
Scheduler
   ↓
BullMQ Queue
   ↓
Worker
   ↓
HTTP Probe
   ↓
Database Save
   ↓
Incident Analysis
   ↓
Realtime WebSocket Update
```

---

# 📡 Monitoramento Contínuo

O sistema executa verificações automáticas contínuas:

1. Busca monitores ativos
2. Valida intervalo de checagem
3. Adiciona jobs na fila Redis
4. Workers executam probes HTTP
5. Salva histórico
6. Atualiza métricas
7. Emite eventos realtime

---

# 🚦 Classificação Operacional

| Status | Critério |
|---|---|
| healthy | HTTP < 400 e resposta < 1s |
| warning | Resposta entre 1s e 2s |
| degraded | HTTP 4xx ou resposta lenta |
| critical | HTTP 5xx ou timeout |
| offline | DNS failure / connection refused |

---

# 🛡️ Proteções Implementadas

## SSRF Protection

Bloqueio de:
- localhost
- loopback
- redes privadas
- IPv6 local

---

# 🌐 Variáveis de Ambiente

## Backend `.env`

```env
DATABASE_URL=postgresql://sentinel:sentinel_secret@localhost:5432/sentinel_db
REDIS_URL=redis://:sentinel_redis_secret@localhost:6379
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=24h
CORS_ORIGINS=http://localhost:3000
```

---

## Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

# 🚀 Roadmap

## Monitoring
- [ ] Multi-region monitoring
- [ ] TCP monitoring
- [ ] DNS monitoring
- [ ] SSL expiration monitoring
- [ ] Synthetic monitoring

---

## Captive Portal / Mikrotik
- [ ] Captive portal validation
- [ ] Mikrotik hotspot simulation
- [ ] Playwright validation engine
- [ ] Screenshot automation
- [ ] Redirect validation

---

## Alerting
- [ ] Slack integration
- [ ] Discord integration
- [ ] Email alerts
- [ ] Webhook alerts
- [ ] Telegram alerts

---

## Observability
- [ ] Logs explorer
- [ ] Tracing
- [ ] SLA reports
- [ ] PDF export
- [ ] Advanced analytics

---

# 🎯 Objetivo do Projeto

O Sentinel foi desenvolvido para servir como:
- plataforma funcional real;
- laboratório de observabilidade;
- projeto de portfólio DevOps/SRE;
- ambiente de aprendizado de backend moderno;
- sistema escalável de monitoramento operacional.

---

# 📌 Status do Projeto

🚧 Em evolução contínua  
🧪 Ambiente de laboratório e portfólio profissional  
⚙️ Arquitetura preparada para expansão futura
