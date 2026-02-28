# Mission Control Roadmap

## v1.0 (Current) ✅

- [x] Dashboard with system status grid
- [x] Ollama/local LLM monitoring
- [x] Kanban tasks from TASKS.md
- [x] Gateway logs viewer
- [x] Sticky notes
- [x] amtoc01bot + amtoc02bot in systems grid
- [x] Network-based access control
- [x] Time-based auth for external access
- [x] robots.txt + noindex

---

## v1.1 — Status API ✅

- [x] `/api/status` endpoint for bots to POST their status
- [x] Store status in memory
- [x] Live status updates in dashboard
- [x] Heartbeat tracking (last seen timestamp)
- [x] Cron job for amtoc02bot heartbeats every 2 minutes

---

## v1.2 — Real-time Updates ✅

- [x] SSE endpoint for live updates (`/api/events`)
- [x] Shared event bus for broadcasting
- [x] Activity feed in left panel
- [x] Real-time status updates via SSE
- [x] Activity log endpoint (`/api/activity`)

---

## v1.3 — Multi-tenant

- [ ] User accounts for collaborators
- [ ] Role-based access (viewer, editor, admin)
- [ ] Per-user dashboard customization
- [ ] Audit log

---

## v1.4 — Intelligence Integration

- [ ] Connect to Daily Intelligence Analyst data
- [ ] News feed panel
- [ ] Trend visualization
- [ ] Sentiment indicators

---

## v1.5 — Task Management ✅

- [x] Create/edit tasks directly in dashboard
- [x] Assign tasks to bots or humans
- [x] Move tasks between statuses
- [x] Delete tasks
- [x] Priority and assignee fields
- [x] Persistent storage (TASKS.json)

---

## v1.6 — Analytics

- [ ] Bot activity charts
- [ ] Model usage stats
- [ ] Cost tracking (API calls)
- [ ] Performance metrics

---

## Ideas for Later

- Mobile app / PWA
- Slack/Discord integration
- Custom widgets
- Plugin system
- Dark/light themes
- Export reports

---

## Priority Order

1. Status API (v1.1) — enables live bot coordination
2. Real-time updates (v1.2) — better UX
3. Task management (v1.5) — operational value
4. Intelligence integration (v1.4) — connects to your morning brief
5. Multi-tenant (v1.3) — when adding collaborators
6. Analytics (v1.6) — insights over time
