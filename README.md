# 🔄 ReSell Hub — Server

Backend REST API for **ReSell Hub**, an online marketplace for pre-owned products. Built with Express + MongoDB, secured with JWT and role-based authorization, and integrated with Stripe for payments.

## 🌐 Live URL

- **API Base:** _add your deployed server URL here_
- **Client Repo:** _add your client repo URL here_

## 🎯 Purpose

Provides all data and business logic for the marketplace: users, products, orders, wishlist, reviews, reports, payments, and dashboard statistics — with secure, role-aware endpoints.

## 🔐 Security

- **JWT authentication** — token issued at login, verified on every private route via `verifyToken`.
- **Role-based authorization** — `verifyRole('admin'|'seller'|'buyer')` middleware protects sensitive endpoints.
- **Environment variables** — MongoDB credentials, JWT secret, and Stripe key are all kept in `.env` (never committed).

## 📚 Collections

`users` · `products` · `orders` · `reviews` · `payments` · `wishlist` · `reports`

## 🛣️ Key API Endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/jwt` | public | Issue JWT for a logged-in email |
| POST/GET | `/api/users` | public/admin | Register user / list all users |
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
| `jsonwebtoken` | JWT auth |
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
ACCESS_TOKEN_SECRET=
STRIPE_SECRET_KEY=
CLIENT_URL=http://localhost:5173
```

## 📁 Tech Stack
Node.js · Express 5 · MongoDB · JWT · Stripe
