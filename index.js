import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { connectDB } from './db.js';
import { auth } from './auth.js';
import jwtRoutes from './routes/jwt.routes.js';
import usersRoutes from './routes/users.routes.js';
import productsRoutes from './routes/products.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import statsRoutes from './routes/stats.routes.js';

const app = express();
const port = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));

// Better Auth owns all /api/auth/* routes (sign-up, sign-in, Google, session…).
// It MUST be mounted before express.json() so it can read the raw request body.
// Note the Express 5 splat syntax (`*splat`).
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

// Ensure the database is connected before any route runs.
// In serverless (Vercel) this runs per cold start and is memoized in db.js.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(503).send({ message: 'Database unavailable' });
  }
});

// ---------- Routes ----------
app.use('/api/jwt', jwtRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
  res.send('🔄 ReSell Hub API is running');
});

// Centralized error handler — log details server-side, return a generic message.
app.use((err, req, res, next) => {
  console.error('Unhandled route error:', err);
  res.status(500).send({ message: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// ---------- Start (local only; Vercel imports the app as a handler) ----------
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 ReSell Hub server listening on port ${port}`);
  });
}

export default app;
