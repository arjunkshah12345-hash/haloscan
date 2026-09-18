# Haloscan — Production Deployment

**Status: LIVE** — primary URL `https://haloscan-cac.vercel.app` (ideatr.dev domain expired Aug 31 2026; renew to restore haloscan.ideatr.dev)

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
render deploys create srv-da4tc1jm8hqs73anthk0 --wait --confirm
```

---

## Vercel frontend

Custom domain: **haloscan-cac.vercel.app** (Vercel DNS on ideatr.dev)

```bash
cd website
vercel env ls                    # HALOSCAN_API_URL → haloscan.onrender.com
vercel --prod --yes
```

---

## Verify

```bash
curl https://haloscan.onrender.com/api/health
curl https://haloscan-cac.vercel.app/api/health
curl https://haloscan-cac.vercel.app/api/demo/battery
open https://haloscan-cac.vercel.app/scan
```

---

## Local dev (no cloud)

```bash
./scripts/run.sh          # http://localhost:7860
cd website && npm run dev # http://localhost:3000
```

For temporary Vercel ↔ local API testing: `./scripts/tunnel_api.sh`
