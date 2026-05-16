# Backend Setup — Data-OS Portfolio (Firebase)

## ✅ What's already done
| Item | Status |
|------|--------|
| Firestore database | ✅ Created in `asia-south1 (Mumbai)` |
| Service account key | ✅ Downloaded to your Downloads folder |
| All backend routes → Firestore | ✅ |
| Frontend Firebase client (`lib/firebase.js`) | ✅ |
| GA4 analytics (`lib/analytics.js`) | ✅ |
| Auth: `Nigamjyoti` / `Nigam@ai` | ✅ |
| Vite proxy (`/api → :4000`) | ✅ |

---

## Step 1 — Move the service account key

Firebase downloaded a JSON file to your **Downloads** folder named:
```
my-portfollio-23e3c-firebase-adminsdk-fbsvc-XXXXXXXX.json
```
**Rename it** to `serviceAccount.json` and move it into the `backend/` folder:
```
Data-OS-Portfolio/backend/serviceAccount.json
```
This file is in `.gitignore` — it will never be committed.

## Step 2 — Install backend dependencies

```bash
cd backend
npm install
```

## Step 3 — (Optional) Gmail App Password for contact form

- Go to https://myaccount.google.com/apppasswords
- Create an app password → copy it
- Open `backend/.env` and set `SMTP_PASS=<your-app-password>`

## Step 4 — Start the backend

```bash
npm run dev
```
Server starts at **http://localhost:4000**  
Health check: **http://localhost:4000/health**

## Step 5 — Start the frontend (separate terminal)

```bash
# In the root Data-OS-Portfolio/ folder
npm run dev
```
Frontend: **http://localhost:3000**

---

## Firestore collections (auto-created on first write)

```
users/
  admin/
    savedJobs/{jobId}    — saved job listings
    notes/{noteId}       — workspace notes
    state/tracker        — job pipeline state

pageVisits/{id}          — page view analytics
uiEvents/{id}            — UI event analytics
contactSubmissions/{id}  — contact form submissions
```

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | ✗ | Login, get JWT |
| POST | /api/auth/logout | ✗ | Clear session |
| GET | /api/auth/me | ✓ | Current user |
| GET | /api/jobs/search | ✓ | Search remote jobs |
| GET | /api/jobs/saved | ✓ | Get saved jobs |
| POST | /api/jobs/saved | ✓ | Save a job |
| DELETE | /api/jobs/saved/:id | ✓ | Remove saved job |
| GET | /api/jobs/tracker | ✓ | Get pipeline tracker |
| PUT | /api/jobs/tracker | ✓ | Update tracker |
| GET | /api/notes | ✓ | List notes |
| POST | /api/notes | ✓ | Create note |
| PUT | /api/notes/:id | ✓ | Update note |
| DELETE | /api/notes/:id | ✓ | Delete note |
| POST | /api/contact | ✗ | Submit contact form |
| POST | /api/analytics/visit | ✗ | Track page visit |
| POST | /api/analytics/event | ✗ | Track UI event |
| GET | /api/analytics/stats | ✓ | View stats |

✓ = requires JWT (Authorization: Bearer token or dos_token cookie)

---

## Production Deployment

**Recommended: Railway (free tier, 500 hours/month)**

1. Push `backend/` to a GitHub repo (or your existing repo)
2. Create new Railway project → Deploy from GitHub
3. Set environment variables in Railway dashboard
4. Railway gives you a URL like `https://data-os-api.railway.app`
5. Update `VITE_API_URL` in your frontend `.env` to that URL
6. Rebuild frontend: `npm run build`

**Alternative: Render (free tier, spins down after inactivity)**

Same process — connect GitHub, set env vars, deploy.
