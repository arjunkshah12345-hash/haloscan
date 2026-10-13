# Haloscan — Production Deployment

**Frontend: LIVE** on https://haloscan-cac.vercel.app (Engineered Dark redesign + Case A–C demo).

**API:** https://haloscan.onrender.com — repo `api/main.py` is **2.5.0** (metrics serve published eval only; dual-view collapse guard). Confirm `/api/health` reports `2.5.0` after Render finishes rebuilding from `main`.

| Layer | URL | Host |
|-------|-----|------|
| **Frontend** | https://haloscan-cac.vercel.app/scan | Vercel |
| **API** | https://haloscan.onrender.com | Render (Docker, free tier) |
| **Source** | https://github.com/arjunkshah12345-hash/haloscan | GitHub |

Vercel proxies `/api/*` → Render via `HALOSCAN_API_URL`.

---

## Architecture

```
haloscan-cac.vercel.app/scan
        │
        ▼  (HALOSCAN_API_URL)
https://haloscan.onrender.com/api/*
        │
        ▼
FastAPI + PyTorch + OpenCV (weights/haloscan.pt)
```

---

## Render service

- **Dashboard:** https://dashboard.render.com/web/srv-da4tc1jm8hqs73anthk0
- **Service ID:** `srv-da4tc1jm8hqs73anthk0`
- **Auto-deploy:** pushes to `main` trigger rebuild
- **Keepalive:** GitHub Actions pings `/api/health` every 14 min (`.github/workflows/render-keepalive.yml`)

### Redeploy API

```bash
render login
render deploys create srv-da4tc1jm8hqs73anthk0 --wait --confirm
```

Or push an empty commit to `main` to nudge auto-deploy:

```bash
git commit --allow-empty -m "chore: trigger Render auto-deploy for API 2.5.0"
git push origin main
```

---

## Vercel frontend

Custom domain: **haloscan-cac.vercel.app**

```bash
cd website
vercel env ls                    # HALOSCAN_API_URL → haloscan.onrender.com
vercel --prod --yes
vercel alias set <deployment> haloscan-cac.vercel.app
```

---

## Verify

```bash
curl https://haloscan.onrender.com/api/health   # expect version 2.5.0
curl -o /dev/null -w "%{http_code}\n" https://haloscan.onrender.com/api/metrics
curl https://haloscan-cac.vercel.app/api/health
curl https://haloscan-cac.vercel.app/api/demo/coin
cd website && node scripts/e2e-smoke.mjs https://haloscan-cac.vercel.app
open https://haloscan-cac.vercel.app/scan
```

---

## Local dev (no cloud)

```bash
./scripts/run.sh          # http://localhost:7860
cd website && npm run dev # http://localhost:3000
```

For temporary Vercel ↔ local API testing: `./scripts/tunnel_api.sh`
