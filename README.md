# 🔄 ReSell Hub — Server

Backend REST API for **ReSell Hub**, an online marketplace for pre-owned products. Built with Express + MongoDB, authenticated with [Better Auth](https://www.better-auth.com) (email/password + Google) and role-based authorization, and integrated with Stripe for payments.

## 🌐 Live URL & Links

- **API Base:** https://hasanalmahmud-b13-a10-server.vercel.app
- **Live Site:** https://hasanalmahmud-b13-a10.vercel.app
- **Client Repo:** https://github.com/hamsakib/hasanalmahmud-b13-a10
- **Server Repo:** https://github.com/hamsakib/hasanalmahmud-b13-a10-server

## 🎯 Purpose

Provides all data and business logic for the marketplace: users, products, orders, wishlist, reviews, reports, payments, and dashboard statistics — with secure, role-aware endpoints.

## 🔐 Security

- **Better Auth sessions** — email/password and Google sign-in handled at `/api/auth/*`; every private route resolves the session via `verifyToken` (`auth.api.getSession`). Cookie-based, with bearer-token support.
- **Role-based authorization** — `verifyRole('admin'|'seller'|'buyer')` middleware protects sensitive endpoints. Roles (buyer/seller chosen at registration; admin granted manually) live on the user document.
- **Environment variables** — MongoDB credentials, Better Auth secret, Google OAuth keys, and Stripe key are all kept in `.env` (never committed).

## 📚 Collections

`users` · `products` · `orders` · `reviews` · `payments` · `wishlist` · `reports`

Better Auth also manages its own `session`, `account`, and `verification` collections; the `user` model is mapped onto the existing `users` collection so roles stay in one place.

## 🛣️ Key API Endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/sign-up/email` | public | Register (email/password + role) — Better Auth |
| POST | `/api/auth/sign-in/email` | public | Login — Better Auth |
| GET | `/api/auth/sign-in/social` | public | Google sign-in — Better Auth |
| GET | `/api/auth/get-session` | public | Current session/user |
| GET | `/api/users` | admin | List all users |
| PATCH | `/api/users/:id/role\|status\|verify` | admin | Manage users |
| GET | `/api/products` | public | List with search/filter/sort/pagination |
| POST/PATCH/DELETE | `/api/products/...` | seller | Product CRUD |
| PATCH | `/api/products/:id/approval` | admin | Approve/reject products |
| POST/GET | `/api/orders/...` | private | Create & manage orders |
| POST | `/api/payments/create-payment-intent` | private | Stripe payment intent |
| POST/GET | `/api/payments` | private | Save & view payments |
| GET | `/api/stats/marketplace\|buyer\|seller\|admin` | mixed | Dashboard statistics |
| POST | `/api/reports` | private | Report a product |

## 🧰 NPM Packages Used

| Package | Purpose |
|---|---|
| `express` | Web framework |
| `mongodb` | Database driver |
| `cors` | Cross-origin requests |
| `dotenv` | Environment variables |
| `better-auth` | Authentication & session management (email/password + Google) |
| `stripe` | Payment processing |

## 🚀 Getting Started

```bash
npm install
# create .env (see .env.example) and fill in your credentials
npm run dev   # node --watch
# or
npm start
```

### Environment Variables (`.env`)
```
PORT=5000
DB_USER=
DB_PASS=
DB_CLUSTER=cluster0.xxxxx.mongodb.net
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:5000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
CLIENT_URL=http://localhost:5173
```

## 📁 Tech Stack
Node.js · Express 5 · MongoDB · Better Auth · Stripe
