# Data Persistence — why admin content must never be lost

## Short answer

The application code **never deletes content added from the admin panel**.
Courses, curriculum (modules/lessons/quizzes), jobs, blog posts, settings and
uploaded records are only removed when the **database itself is replaced**.

That happens when the server runs on the temporary in-memory MongoDB engine
instead of a real database.

## How to verify (30 seconds)

Open:

```
https://<your-api-host>/api/health
```

Look at the `database` block:

| Response | Meaning |
| --- | --- |
| `"mode": "external"`, `"ephemeral": false` | Real database. Admin content is permanent. ✅ |
| `"mode": "in-memory"`, `"ephemeral": true` | Temporary database. **Every restart/redeploy wipes everything.** ❌ |

On server startup the same state is printed in the logs. An ephemeral database
prints a large `WARNING: RUNNING ON AN IN-MEMORY (TEMPORARY) DATABASE` banner.

## Why content disappears

`server/config/db.js` connects in this order:

1. `MONGODB_URI` if it is set → real, persistent database.
2. Otherwise (or if that connection fails) → `mongodb-memory-server`, an
   in-memory MongoDB that lives entirely in RAM.

The in-memory engine is a zero-config convenience for demos. Because it lives in
RAM:

- restarting the service (including **every code deploy**) empties it,
- the auto-seeder then re-creates the demo dataset (`server/utils/seeder.js`),
- so it *looks* like "the website reset itself".

The seeder itself is safe: it runs **only when the database has zero courses**
and it never overwrites or deletes anything.

## Fix: attach a persistent database (one-time, ~5 minutes)

1. Create a free **MongoDB Atlas** cluster (M0 tier is enough).
2. Create a database user (username + password).
3. Network Access → allow `0.0.0.0/0` (or Render's outbound IPs).
4. Copy the connection string and add the database name:

   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/american_futuretech?retryWrites=true&w=majority
   ```

5. **Render** → your API service → *Environment* → add

   ```
   MONGODB_URI = mongodb+srv://...
   ```

   Save (this triggers a redeploy).
6. Re-open `/api/health` and confirm `"mode": "external"`.

From then on every admin edit is stored permanently, across restarts, redeploys
and new Git pushes.

### Optional hardening

Set `SEED_ON_BOOT=false` in the environment once the database holds real
content, so the demo dataset is never re-created if the database is ever
replaced with an empty one.

## Uploaded images

Uploads are written to disk (`server/uploads`, mirrored into
`client/public/uploads`). Render's filesystem is **ephemeral**, so an image
uploaded through the admin panel survives only until the next restart.

- Locally, uploads persist (they are normal files on your machine).
- In production, use an external image host/CDN (e.g. Cloudinary) and paste the
  resulting URL into the admin panel, or attach a persistent disk to the host.

## Summary for the client

- Adding courses/curriculum from the admin panel is safe — nothing in the code
  erases it.
- Content was only lost because the live server was running on a temporary
  database that resets on every deploy.
- Attaching a permanent database (MongoDB Atlas) fixes it once and for all.
