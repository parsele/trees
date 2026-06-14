Amboseli Trees Map

A small Node/Express + Leaflet app to visualize trees planted by Amboseli Green Ambassadors.

Quick start

1. Install dependencies:

```bash
npm install
```

2. Run the server:

```bash
npm start
```

3. Open http://localhost:3000 in your browser.

Features

- Interactive map centered on Amboseli National Park.
- Add trees manually via the side panel form.
- Upload CSV files (headers: species,lat,lng,date,planted_by,notes).
- Auto-import from a public CSV/JSON URL.
- Data persisted to `data/trees.json`.

Sample prompt (for volunteers or quick paste into the textarea in the UI):

"Add a tree: species=Acacia, date=2026-06-01, lat=-2.648, lng=37.253, planted_by=Green Ambassadors, notes=Community planting"

Notes and next steps

- This uses a simple JSON file for storage. For production, switch to a proper database (Postgres, SQLite).
- You can extend the backend to validate and normalize species names, reverse-geocode locations, or add photos.

API additions

- `GET /api/stats` — returns `{ total, bySpecies }`.
- `DELETE /api/trees/:id` — deletes a tree by numeric id.

-- `POST /api/trees` — adding via API is disabled.
- `POST /api/trees` — (admin only) add a tree record. Requires admin login (cookie or `x-admin-token`).
-- `DELETE /api/trees/:id` — (admin only) deletes a tree by numeric id.

Admin access

- The admin password defaults to `lekaoo12`. To change it, set the `ADMIN_PASSWORD` environment variable before starting the server.
- Visit `/admin-login.html` to sign in, or try `/admin.html` which will redirect to the login when not signed in.

Files

- [server.js](server.js)
- [public/index.html](public/index.html)
- [public/app.js](public/app.js)
- [data/trees.json](data/trees.json)

