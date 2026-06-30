const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { bearer } = require('better-auth/plugins');
const { client } = require('./db');

// Better Auth talks to the same MongoDB database the rest of the app uses.
// We point its user model at the existing `users` collection so the role model
// (buyer / seller / admin), verified-seller badge, status, etc. live in one place
// and all the existing admin routes keep working unchanged.
const db = client.db('resellHub');

const isProd = process.env.NODE_ENV === 'production';

const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 5000}`,
  secret: process.env.BETTER_AUTH_SECRET,

  // Origins allowed to start auth flows / receive cookies.
  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL,
  ].filter(Boolean),

  database: mongodbAdapter(db, { client }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // sign-in works immediately after register
    minPasswordLength: 6,            // matches the client-side password rule
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  user: {
    modelName: 'users', // map Better Auth's user model onto the existing collection
    additionalFields: {
      // Chosen at registration (buyer/seller). `input: true` lets the client send it;
      // the create hook below still enforces that admin can't be self-assigned.
      role:     { type: 'string',  required: false, defaultValue: 'buyer',  input: true },
      status:   { type: 'string',  required: false, defaultValue: 'active', input: false },
      verified: { type: 'boolean', required: false, defaultValue: false,    input: false },
      phone:    { type: 'string',  required: false, input: false },
      location: { type: 'string',  required: false, input: false },
      // The app reads `photo` everywhere; Google fills Better Auth's built-in `image`.
      photo:    { type: 'string',  required: false, input: true },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Only buyer/seller may be chosen at self-registration; admin is granted manually.
          const safeRole = user.role === 'seller' ? 'seller' : 'buyer';
          return {
            data: {
              ...user,
              role: safeRole,
              status: 'active',
              verified: false,
            },
          };
        },
      },
    },
  },

  // Allows clients to also authenticate via `Authorization: Bearer <token>`
  // (token returned in the `set-auth-token` response header). Cookies remain the default.
  plugins: [bearer()],

  // In production the client and API live on different domains, so the session
  // cookie must be cross-site. Locally (same-site localhost) the defaults are fine.
  advanced: isProd
    ? { defaultCookieAttributes: { sameSite: 'none', secure: true } }
    : undefined,
});

module.exports = { auth };
