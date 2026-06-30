# Deployment (Server) — Better Auth

The client proxies `/api/*` to this server, so to the browser everything is first-party
on the **client** domain. Better Auth's `baseURL` must therefore be the **client** public
URL (the host users actually hit), even though the code runs on the server domain.

## Vercel env vars (server project)

| Var | Value |
|---|---|
| `DB_USER`, `DB_PASS`, `DB_CLUSTER` | MongoDB Atlas credentials |
| `BETTER_AUTH_SECRET` | long random secret (same one everywhere) |
| `JWT_SECRET` | long random secret for signing private-API JWTs |
| `BETTER_AUTH_URL` | **the CLIENT public URL**, e.g. `https://hasanalmahmud-b13-a10.vercel.app` |
| `CLIENT_URL` | same as above — the client origin (CORS + trusted origin) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `STRIPE_SECRET_KEY` | Stripe secret |

`NODE_ENV=production` is set by Vercel automatically (enables `SameSite=None; Secure`
cookies as a fallback).

## Google OAuth — Authorized redirect URIs

Register **both** in Google Cloud Console → Credentials → your OAuth client:

```
http://localhost:5000/api/auth/callback/google                         (local dev)
https://hasanalmahmud-b13-a10.vercel.app/api/auth/callback/google      (production — CLIENT domain, via proxy)
```

The production callback is on the **client** domain because `BETTER_AUTH_URL` points there
and the request is proxied to this server.

## Local dev

Locally there is no proxy; `BETTER_AUTH_URL=http://localhost:5000` and the client calls
`http://localhost:5000` directly (same-site, cookies work).
