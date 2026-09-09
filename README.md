# Eshani Somwanshi — Portfolio

Personal portfolio for Eshani Somwanshi (product / UX designer).
Live at <https://www.eshanisomwanshi.com>.

- **`frontend/`** — single-page React app (CRA + craco). See `frontend/` and `CLAUDE.md`.
- **`backend/`** — small FastAPI service for the contact form.

## Develop

```bash
cd frontend
npm install          # needs legacy-peer-deps (set in .npmrc)
npm start            # http://localhost:3000
npm run build        # production build -> frontend/build
```

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload   # needs backend/.env
```

## Deploy

Push `dev` → Vercel preview. Promote to production by merging `dev` → `main`
(Vercel's production branch). Full workflow in `CLAUDE.md`.
